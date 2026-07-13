import { createClient } from '@supabase/supabase-js';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_BODY_BYTES = 9 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 12;
const requestBuckets = new Map();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!apiKey || !supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ ok: false, error: 'Le service d’analyse n’est pas configuré.' });
  }

  const accessToken = readBearerToken(req.headers.authorization);
  if (!accessToken) return res.status(401).json({ ok: false, error: 'Authentification requise.' });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !user) return res.status(401).json({ ok: false, error: 'Session invalide ou expirée.' });

  const clientId = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  if (!consumeRateLimit(`${user.id}:${clientId}`)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Trop d’analyses rapprochées. Réessayez dans une minute.' });
  }

  const kind = req.body?.kind;
  const request = req.body?.request;
  if (!['photo', 'receipt'].includes(kind) || !request?.contents || !request?.generationConfig) {
    return res.status(400).json({ ok: false, error: 'Requête d’analyse invalide.' });
  }
  if (!isSafeGeminiRequest(request)) {
    return res.status(400).json({ ok: false, error: 'Contenu d’analyse invalide.' });
  }

  const serialized = JSON.stringify(request);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, error: 'Images trop volumineuses après compression.' });
  }

  const imageCount = request.contents
    .flatMap((content) => content?.parts || [])
    .filter((part) => part?.inline_data?.data).length;
  const imageLimit = kind === 'photo' ? 7 : 8;
  if (imageCount < 1 || imageCount > imageLimit) {
    return res.status(400).json({ ok: false, error: 'Nombre d’images invalide.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('[api/gemini] upstream error', response.status, data?.error?.status || 'unknown');
      return res.status(response.status >= 500 ? 502 : response.status).json({
        ok: false,
        error: response.status === 429
          ? 'Le service d’analyse est temporairement saturé.'
          : 'L’analyse Gemini a échoué.',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    console.error('[api/gemini] request failed', timedOut ? 'timeout' : error?.message);
    return res.status(timedOut ? 504 : 502).json({
      ok: false,
      error: timedOut ? 'L’analyse a dépassé le délai autorisé.' : 'Impossible de joindre Gemini.',
    });
  } finally {
    clearTimeout(timeout);
  }
}

function consumeRateLimit(clientId) {
  const now = Date.now();
  const current = requestBuckets.get(clientId);
  if (!current || now - current.startedAt >= 60_000) {
    requestBuckets.set(clientId, { startedAt: now, count: 1 });
    pruneBuckets(now);
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_MINUTE) return false;
  current.count += 1;
  return true;
}

function pruneBuckets(now) {
  if (requestBuckets.size < 200) return;
  for (const [key, bucket] of requestBuckets) {
    if (now - bucket.startedAt > 120_000) requestBuckets.delete(key);
  }
}

function readBearerToken(value) {
  const match = /^Bearer\s+(.+)$/i.exec(String(value || ''));
  return match?.[1]?.trim() || null;
}

function isSafeGeminiRequest(request) {
  if (!Array.isArray(request.contents) || request.contents.length !== 1) return false;
  if (Object.keys(request).some((key) => !['contents', 'generationConfig'].includes(key))) return false;
  const parts = request.contents[0]?.parts;
  if (!Array.isArray(parts) || parts.length < 2 || parts.length > 24) return false;
  const textLength = parts.reduce((total, part) => total + String(part?.text || '').length, 0);
  if (textLength < 20 || textLength > 30_000) return false;
  for (const part of parts) {
    if (part?.text !== undefined && typeof part.text !== 'string') return false;
    if (part?.inline_data) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(part.inline_data.mime_type)) return false;
      if (typeof part.inline_data.data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(part.inline_data.data)) return false;
    } else if (part?.text === undefined) return false;
  }
  const config = request.generationConfig;
  return Number(config.temperature) >= 0
    && Number(config.temperature) <= 0.3
    && Number(config.maxOutputTokens) > 0
    && Number(config.maxOutputTokens) <= 4096
    && config.responseMimeType === 'application/json'
    && typeof config.responseSchema === 'object'
    && config.responseSchema !== null;
}
