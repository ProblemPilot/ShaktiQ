/**
 * Local development and test server for ShaktiQ
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env if present
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v.replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (_) {}
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_AI_MODEL = process.env.SHAKTIQ_AI_MODEL || 'gemini-2.5-flash';
const AI_MODEL_FALLBACKS = Array.from(new Set([
  DEFAULT_AI_MODEL,
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
]));
const MAX_AI_BODY_BYTES = 32 * 1024;

let cachedGenAIClient = null;
async function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (!cachedGenAIClient) {
    const genaiMod = await import('@google/genai');
    const GoogleGenAI = genaiMod.GoogleGenAI || (genaiMod.default && genaiMod.default.GoogleGenAI);
    if (!GoogleGenAI) {
      throw new Error('GoogleGenAI SDK export unavailable');
    }
    cachedGenAIClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }
  return cachedGenAIClient;
}

function buildTutorSystemInstruction(language) {
  const langRule = language === 'hi'
    ? 'Respond ONLY in clear, scholarly, natural Hindi (Devanagari script). Keep official English exam terms, Acts, Articles, and option letters (A, B, C, D, E) in brackets where helpful.'
    : language === 'hinglish'
      ? 'Respond in authentic, conversational Hinglish — write the explanation sentences primarily in natural Roman-script Hindi (e.g., "23 April 1858 ko Veer Kunwar Singh ne Captain Le Grand ko haraya tha, isliye Bihar mein Vijayotsav manaya jata hai") while keeping official exam terms, Acts, and option letters in English. Use strictly Latin/Roman alphabet only (never mix Devanagari letters inside Roman words).'
      : 'Respond in clear, calm, scholarly English suitable for serious Bihar competitive exam aspirants.';

  return [
    'You are Shakti AI, the calm, focused, 100% free study companion on ShaktiQ (shaktiq.com) for Bihar competitive exams (BPSC CCE, BSSC CGL 4, AEDO, TRE, and Bihar Special GS).',
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

function buildTutorUserPrompt(message, context, history) {
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

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let byteLen = 0;
    let exceeded = false;
    req.on('data', chunk => {
      byteLen += chunk.length;
      if (byteLen > maxBytes) {
        exceeded = true;
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (exceeded) {
        reject(Object.assign(new Error('Request payload too large'), { statusCode: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON request body'), { statusCode: 400 }));
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function handleAskAi(req, res) {
  let body;
  try {
    body = await readJsonBody(req, MAX_AI_BODY_BYTES);
  } catch (err) {
    sendJson(res, err.statusCode || 400, { error: err.message || 'Invalid request' });
    return;
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    sendJson(res, 400, { error: 'Please enter a study question or topic.' });
    return;
  }

  const language = ['en', 'hinglish', 'hi'].includes(body.language) ? body.language : 'en';
  const context = body.context && typeof body.context === 'object' ? body.context : null;
  const history = Array.isArray(body.history) ? body.history : [];

  let ai;
  try {
    ai = await getGenAIClient();
  } catch {
    sendJson(res, 503, { error: 'Shakti AI service could not initialize right now. Please try again shortly.' });
    return;
  }

  if (!ai) {
    sendJson(res, 503, {
      error: 'Shakti AI is temporarily unavailable while the study server finishes configuring.',
      fallbackToClient: true
    });
    return;
  }

  const systemInstruction = buildTutorSystemInstruction(language);
  const prompt = buildTutorUserPrompt(message, context, history);

  let lastError = null;
  for (let mIdx = 0; mIdx < AI_MODEL_FALLBACKS.length; mIdx++) {
    const model = AI_MODEL_FALLBACKS[mIdx];
    const maxAttempts = mIdx === 0 ? 2 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: 700
          }
        });
        const answer = (response && typeof response.text === 'string' ? response.text : '').trim();
        if (!answer) {
          throw new Error('Empty model response');
        }
        sendJson(res, 200, {
          answer,
          language,
          model
        });
        return;
      } catch (err) {
        lastError = err;
        const statusNum = Number(err && (err.status || err.statusCode)) || 0;
        const errMsg = String(err && (err.message || err.status) || '');
        const isAuthOrQuota = statusNum === 401 || statusNum === 403 || statusNum === 429 || errMsg.includes('429');
        const isModelNotFound = statusNum === 404 || errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.toLowerCase().includes('not found');
        console.warn(`[ShaktiAI] model=${model} attempt=${attempt} failed: ${errMsg.slice(0, 180)}`);
        if (isAuthOrQuota) {
          break;
        }
        if (isModelNotFound) {
          break;
        }
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 450));
        }
      }
    }
    const lastStatus = Number(lastError && (lastError.status || lastError.statusCode)) || 0;
    if (lastStatus === 401 || lastStatus === 403 || lastStatus === 429) {
      break;
    }
  }

  const status = (lastError && (lastError.status === 429 || String(lastError.message || '').includes('429'))) ? 429 : 502;
  const safeMsg = status === 429
    ? 'Shakti AI is busy helping other aspirants right now. Please wait a few seconds and try again.'
    : 'Could not reach the study assistant right now. Please try again in a moment.';
  sendJson(res, status, { error: safeMsg });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function createServer() {
  return http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname;
    try {
      pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('400 Bad Request');
      return;
    }

    // Server-side Shakti AI Study Assistant endpoint
    if (pathname === '/api/ask-ai' && req.method === 'POST') {
      handleAskAi(req, res);
      return;
    }

    if (pathname === '/api/ask-ai/health' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())
      });
      return;
    }

    // Cloudflare Worker Mock: POST /api/register-token
    if (pathname === '/api/register-token' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.email || !data.email.includes('@')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid email is required' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            token: 'sq_local_test_token_' + Date.now(),
            expiresInDays: 90
          }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Cloudflare Worker Mock: GET /questions.json
    if (pathname === '/questions.json') {
      const questionsSourcePath = path.join(ROOT, 'questions_bank_source.json');
      if (fs.existsSync(questionsSourcePath)) {
        const content = fs.readFileSync(questionsSourcePath);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(content);
        return;
      }
    }

    // Default static file serving
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT, pathname));
    if (!safePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + pathname);
        return;
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(safePath).pipe(res);
    });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`ShaktiQ local server running at http://${HOST}:${PORT}`);
  });
}

module.exports = { createServer, PORT, HOST, buildTutorSystemInstruction, buildTutorUserPrompt };
