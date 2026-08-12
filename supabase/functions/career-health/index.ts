/**
 * career-health — the ONE thing this command needs to prove: the static
 * frontend on GitHub Pages can reach a Supabase Edge Function.
 *
 * No auth check, no DB call, no secret read. It exists to be boring: if this
 * fails, nothing about resumes, entitlements or the AI provider is even in
 * play yet — the problem is network/CORS/deploy, not the Career product.
 *
 * `privacyGateVerified` (Command 06A.5 follow-up) is the one extra field:
 * a mirror of `PRIVACY_SECURITY_EXECUTION_VERIFIED` (releaseGates.ts) —
 * already returned unauthenticated inside the admin-gated
 * `fixture_test` response body in analyze-resume, so exposing the same
 * boolean here, unauthenticated, reveals nothing new. It exists so the
 * real customer flow (CareerClient's `runRealAnalysis`) can discover a
 * closed gate BEFORE ever uploading a file, instead of finding out only
 * after a real private upload has already happened.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../_shared/releaseGates.ts";

Deno.serve((req) => {
  const headers = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  return new Response(
    JSON.stringify({ ok: true, service: "career-api", privacyGateVerified: PRIVACY_SECURITY_EXECUTION_VERIFIED }),
    {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    },
  );
});
