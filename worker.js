/**
 * Cloudflare Worker for ShaktiQ (shaktiq.com)
 *
 * Intercepts /questions.json to enforce:
 * 1. Session token authentication (stored in SHAKTIQ_KV)
 * 2. Hourly rate limiting per token (max 15 requests / hour)
 * 3. Secure KV storage for questions data (never exposed publicly on GitHub)
 *
 * For all other requests, it passes through to GitHub Pages.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Session Registration Route: POST /api/register-token
    // Generates a random session token, saves it to KV, and returns it to the client.
    if (url.pathname === '/api/register-token' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || '').trim();

        if (!email || !email.includes('@')) {
          return jsonResponse({ error: 'Valid email is required to issue session token' }, 400);
        }

        // Generate cryptographically secure session token
        const token = 'sq_' + crypto.randomUUID().replace(/-/g, '');

        // Store token in KV with 90-day expiry (7,776,000 seconds)
        if (env.SHAKTIQ_KV) {
          const sessionData = JSON.stringify({
            email,
            name,
            createdAt: Date.now(),
            ip: request.headers.get('cf-connecting-ip') || '',
          });
          await env.SHAKTIQ_KV.put('session:' + token, sessionData, { expirationTtl: 7776000 });
        }

        return jsonResponse({
          status: 'ok',
          token,
          expiresInDays: 90,
        });
      } catch (err) {
        return jsonResponse({ error: 'Internal registration error', details: err.message }, 500);
      }
    }

    // 3. Question Bank Route: /questions.json
    // Only accessible with valid session token and within rate limit
    if (url.pathname === '/questions.json') {
      // Extract token from 'Authorization: Bearer <token>' header or '?token=<token>' query
      const authHeader = request.headers.get('Authorization') || '';
      let token = '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (url.searchParams.has('token')) {
        token = url.searchParams.get('token').trim();
      }

      // If no token is provided, return 401 Unauthorized
      if (!token) {
        return jsonResponse(
          {
            error: 'Unauthorized',
            message: 'Sign in at shaktiq.com with your name and email to access the question bank.',
          },
          401
        );
      }

      // Verify token in KV (or check master token if configured)
      let session = null;
      if (env.SHAKTIQ_KV) {
        session = await env.SHAKTIQ_KV.get('session:' + token);
      }

      const isMaster = env.MASTER_TOKEN && token === env.MASTER_TOKEN;
      if (!session && !isMaster) {
        return jsonResponse(
          {
            error: 'Unauthorized',
            message: 'Invalid or expired session token. Please sign in again at shaktiq.com.',
          },
          401
        );
      }

      // 4. Rate Limiting: Max 15 fetches per token per hour
      if (env.SHAKTIQ_KV && !isMaster) {
        const hourBucket = Math.floor(Date.now() / 3600000);
        const rateKey = `ratelimit:${token}:${hourBucket}`;
        const currentCountStr = await env.SHAKTIQ_KV.get(rateKey);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

        if (currentCount >= 15) {
          return jsonResponse(
            {
              error: 'Rate limit exceeded',
              message: 'Hourly question bank fetch limit (15 requests/hour) reached. Please study your loaded questions and retry next hour.',
            },
            429,
            { 'Retry-After': '3600' }
          );
        }

        // Increment count with 1-hour TTL
        await env.SHAKTIQ_KV.put(rateKey, (currentCount + 1).toString(), { expirationTtl: 3600 });
      }

      // 5. Fetch questions data from KV
      let questionsJson = null;
      if (env.SHAKTIQ_KV) {
        questionsJson = await env.SHAKTIQ_KV.get('QUESTIONS_DATA');
      }

      if (!questionsJson) {
        return jsonResponse(
          {
            error: 'Not Found',
            message: 'Question bank data is being initialized in Cloudflare KV. Please check back shortly.',
          },
          503
        );
      }

      // Return raw questions JSON with strict private caching
      return new Response(questionsJson, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          ...CORS_HEADERS,
        },
      });
    }

    // 6. Ask AI Route: POST /api/ask-ai
    if (url.pathname === '/api/ask-ai' && request.method === 'POST') {
      const geminiApiKey = env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return jsonResponse(
          {
            error: 'Server-side AI key not configured on Cloudflare.',
            fallbackToClient: true,
          },
          503
        );
      }

      try {
        const body = await request.json().catch(() => ({}));
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        if (!message) {
          return jsonResponse({ error: 'Please enter a study question or topic.' }, 400);
        }

        const language = ['en', 'hinglish', 'hi'].includes(body.language) ? body.language : 'en';
        const context = body.context && typeof body.context === 'object' ? body.context : null;
        const history = Array.isArray(body.history) ? body.history : [];

        const systemInstruction = buildWorkerSystemInstruction(language);
        const prompt = buildWorkerPrompt(message, context, history);

        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        let lastError = null;

        for (const model of models) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemInstruction }] },
                  contents: [{ role: 'user', parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.35,
                    maxOutputTokens: 800,
                  },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (answer && answer.trim()) {
                return jsonResponse({
                  answer: answer.trim(),
                  language,
                  model,
                });
              }
            } else {
              const errBody = await geminiRes.text().catch(() => '');
              lastError = new Error(`Gemini API returned ${geminiRes.status}: ${errBody}`);
            }
          } catch (e) {
            lastError = e;
          }
        }

        return jsonResponse(
          {
            error: 'Could not get an answer from Gemini API right now.',
            details: lastError ? lastError.message : undefined,
            fallbackToClient: true,
          },
          502
        );
      } catch (err) {
        return jsonResponse(
          {
            error: err.message || 'Internal AI processing error',
            fallbackToClient: true,
          },
          500
        );
      }
    }

    // 7. Pass through all other requests to GitHub Pages
    return fetch(request);
  },
};

function buildWorkerSystemInstruction(language) {
  const langRule = language === 'hi'
    ? 'Respond ONLY in clear, scholarly, natural Hindi (Devanagari script). Keep official English exam terms, Acts, Articles, and option letters (A, B, C, D, E) in brackets where helpful.'
    : language === 'hinglish'
      ? 'Respond in authentic, conversational Hinglish — write the explanation sentences primarily in natural Roman-script Hindi (e.g., "23 April 1858 ko Veer Kunwar Singh ne Captain Le Grand ko haraya tha, isliye Bihar mein Vijayotsav manaya jata hai") while keeping official exam terms, Acts, and option letters in English. Use strictly Latin/Roman alphabet only (never mix Devanagari letters inside Roman words).'
      : 'Respond in clear, calm, scholarly English suitable for serious Bihar competitive exam aspirants.';

  return [
    'You are Shakti AI, the calm, focused study companion on ShaktiQ (shaktiq.com) for Bihar competitive exams (BPSC CCE, BSSC CGL 4, AEDO, TRE, and Bihar Special GS).',
    langRule,
    'Keep every explanation accurate to NCERT, standard reference texts, and published BPSC/BSSC answer keys. Never invent facts; if a date or provision is uncertain, state that honestly.',
    'Keep tone humble, encouraging, scholarly, and free of filler, hype, or emojis.',
    'Structure your reply cleanly using these exact markdown headings when answering a question or concept:',
    '**Core Concept:** One crisp line summarizing the exact fact or principle.',
    '**Option Breakdown / Why Others Fail:** Concise bullet points explaining the correct choice and why distractors or common exam traps fail (or key dimensions if it is a general topic).',
    '**Quick Exam Memory Hook:** One memorable, high-yield recall line or mnemonic for the exam hall.',
    'Keep total length concise (around 120–220 words) so students can revise effortlessly on mobile.'
  ].join('\n');
}

function buildWorkerPrompt(message, context, history) {
  const parts = [];
  if (context && typeof context === 'object') {
    const ctxLines = [];
    if (context.exam) ctxLines.push(`Exam: ${String(context.exam).slice(0, 140)}`);
    if (context.subject) ctxLines.push(`Subject: ${String(context.subject).slice(0, 100)}`);
    if (context.question) ctxLines.push(`Question:\n${String(context.question).slice(0, 2000)}`);
    if (Array.isArray(context.options) && context.options.length > 0) {
      ctxLines.push(`Options:\n${context.options.slice(0, 6).map(o => String(o).slice(0, 300)).join('\n')}`);
    }
    if (context.correctAnswer) ctxLines.push(`Official Answer: ${String(context.correctAnswer).slice(0, 240)}`);
    if (context.explanation) ctxLines.push(`Official Explanation: ${String(context.explanation).slice(0, 1500)}`);
    if (ctxLines.length > 0) {
      parts.push('--- ACTIVE QUESTION CONTEXT ---\n' + ctxLines.join('\n') + '\n--- END CONTEXT ---');
    }
  }

  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6).map(turn => {
      const role = turn && turn.role === 'assistant' ? 'Tutor' : 'Student';
      const text = turn && turn.text ? String(turn.text).slice(0, 700) : '';
      return text ? `${role}: ${text}` : '';
    }).filter(Boolean);
    if (recent.length > 0) {
      parts.push('Recent conversation:\n' + recent.join('\n'));
    }
  }

  parts.push(`Student question: ${String(message).trim().slice(0, 1200)}`);
  return parts.join('\n\n');
}
