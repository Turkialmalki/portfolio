/**
 * career-health — the ONE thing this command needs to prove: the static
 * frontend on GitHub Pages can reach a Supabase Edge Function.
 *
 * No auth check, no DB call, no secret read. It exists to be boring: if this
 * fails, nothing about resumes, entitlements or the AI provider is even in
 * play yet — the problem is network/CORS/deploy, not the Career product.
 *
 * Not linked from any customer-facing UI — see `src/lib/careerHealth.ts` for
 * the dev-only diagnostic that calls it.
 */
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve((req) => {
  const headers = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  return new Response(JSON.stringify({ ok: true, service: "career-api" }), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" },
  });
});
