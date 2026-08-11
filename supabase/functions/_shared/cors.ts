/**
 * CORS for the two production origins this Edge Function set is ever called
 * from, plus local dev. Not a wildcard: these functions can end up handling
 * or gating access to private data (career-health is the harmless exception
 * today, but the pattern is shared with functions that won't be).
 */
const ALLOWED_ORIGINS = new Set([
  "https://www.turkialmalki.com",
  "https://turkialmalki.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    Vary: "Origin",
  };
}
