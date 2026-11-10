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

    // 6. Pass through all other requests to GitHub Pages
    return fetch(request);
  },
};
