/**
 * get-full-review — the ONLY place the paid Full Review content is ever
 * served. No second AI call happens here: the full analysis (every
 * dimension's recommendations, all issues, the action plan, ATS
 * indicators, target-role analysis, all rewrite examples) was already
 * computed and stored in `resume_analyses.result_json` at scan time
 * (`analyze-resume`) — this function's entire job is checking who is
 * allowed to see it and projecting it into the client shape
 * (`projectFullReviewForClient`).
 *
 * Two independent checks, both required, in this order:
 *   1. OWNERSHIP — the analysis belongs to the caller. Enforced by reading
 *      through the caller's own RLS-scoped client (resume_analyses_select_own),
 *      not a service-role client with a manual filter — a cross-user id
 *      selects zero rows structurally, the same double-enforcement pattern
 *      analyze-resume already uses for `resumes`.
 *   2. ENTITLEMENT — an ACTIVE `career_cv_full_review` entitlement exists
 *      for this user, granted only by `verify_payment()` after a trusted
 *      admin verified a real payment (see verify-payment/index.ts). No
 *      other signal (a purchase existing, a purchase in
 *      verification_requested, a query param, anything client-supplied)
 *      is ever treated as entitlement here.
 *
 * Missing either check returns `{ ok: true, entitled: false }` — never an
 * error, and never the report — so the client can render an honest
 * "still pending" state instead of a scary failure.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { projectFullReviewForClient, type CareerAnalysis } from "../_shared/methodology/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function looksLikeCareerAnalysis(value: unknown): value is CareerAnalysis {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { dimensions?: unknown }).dimensions) &&
    Array.isArray((value as { issues?: unknown }).issues)
  );
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "unauthenticated" }, 401, headers);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "unauthenticated" }, 401, headers);
  }

  let body: { resumeId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, headers);
  }
  if (!body.resumeId || typeof body.resumeId !== "string") {
    return jsonResponse({ error: "missing_resume_id" }, 400, headers);
  }

  // Ownership: RLS-scoped to the caller (resume_analyses_select_own) — a
  // resumeId belonging to another user returns zero rows here, not an error.
  const { data: analysisRow, error: analysisError } = await userClient
    .from("resume_analyses")
    .select("id, resume_id, result_json, status")
    .eq("resume_id", body.resumeId)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    safeLogError({ event: "get_full_review_lookup_failed", user_id: user.id, error_code: "INTERNAL_ERROR" });
    return jsonResponse({ error: "internal_error" }, 500, headers);
  }
  if (!analysisRow) {
    return jsonResponse({ ok: true, entitled: false }, 200, headers);
  }

  // Entitlement: RLS-scoped to the caller (entitlements_select_own).
  const { data: entitlement, error: entitlementError } = await userClient
    .from("entitlements")
    .select("id")
    .eq("product_key", "career_cv_full_review")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (entitlementError) {
    safeLogError({ event: "get_full_review_entitlement_check_failed", user_id: user.id, error_code: "INTERNAL_ERROR" });
    return jsonResponse({ error: "internal_error" }, 500, headers);
  }

  if (!entitlement) {
    safeLog({ event: "get_full_review_not_entitled", user_id: user.id, analysis_id: analysisRow.id });
    return jsonResponse({ ok: true, entitled: false }, 200, headers);
  }

  if (!looksLikeCareerAnalysis(analysisRow.result_json)) {
    safeLogError({ event: "get_full_review_bad_result_json", user_id: user.id, analysis_id: analysisRow.id, error_code: "INTERNAL_ERROR" });
    return jsonResponse({ error: "internal_error" }, 500, headers);
  }

  const report = projectFullReviewForClient(analysisRow.result_json);
  safeLog({ event: "get_full_review_served", user_id: user.id, analysis_id: analysisRow.id });
  return jsonResponse({ ok: true, entitled: true, report }, 200, headers);
});
