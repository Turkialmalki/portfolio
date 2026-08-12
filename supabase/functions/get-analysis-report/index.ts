/**
 * get-analysis-report — Career V2 Part 19: restore the free report after a
 * refresh, an email link, a return from PayPal, or a fresh tab, via the
 * static-export-compatible deep link `/career?analysis=<analysisId>`.
 *
 * No report content is ever placed in the query string — only the id. This
 * function re-derives the same `UiFreeReport`-shaped object `analyze-resume`
 * already returns at scan time (via the shared `buildUiFreeReport`, so the
 * two entry points can never drift) from the STORED `result_json`. No AI
 * call, ever — this is a pure read.
 *
 * OWNERSHIP, the same double-enforced pattern every other Career function
 * uses: the row is read through the CALLER's own RLS-scoped client
 * (`resume_analyses_select_own`), not a service-role client with a manual
 * filter — a cross-user analysisId selects zero rows here structurally, the
 * same way analyze-resume/get-full-review/delete-resume all behave. A
 * missing/foreign/incomplete analysis returns `{ok:true, found:false}` —
 * never an error that could hint at whether the id exists for someone else.
 *
 * Entitlement/Full-Review restoration is NOT this function's job — the
 * existing `get-full-review` call (already resumeId-driven and refresh-safe
 * in isolation) does that; the client calls it again with the `resumeId`
 * this function returns, exactly as it already does after a fresh analysis.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { safeError } from "../_shared/errorCodes.ts";
import { buildUiFreeReport, looksLikeCareerAnalysis } from "../_shared/analysis/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    const { status, body } = safeError("METHOD_NOT_ALLOWED");
    return jsonResponse(body, status, headers);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    const { status, body } = safeError("NOT_AUTHORIZED");
    return jsonResponse(body, status, headers);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    const { status, body } = safeError("NOT_AUTHORIZED");
    return jsonResponse(body, status, headers);
  }

  let bodyJson: { analysisId?: string };
  try {
    bodyJson = await req.json();
  } catch {
    const { status, body } = safeError("INVALID_REQUEST");
    return jsonResponse(body, status, headers);
  }
  const analysisId = bodyJson.analysisId;
  if (typeof analysisId !== "string" || !UUID_RE.test(analysisId)) {
    const { status, body } = safeError("INVALID_REQUEST");
    return jsonResponse(body, status, headers);
  }

  const { data: row, error: rowError } = await userClient
    .from("resume_analyses")
    .select("id, resume_id, result_json, status")
    .eq("id", analysisId)
    .eq("status", "complete")
    .maybeSingle();

  if (rowError) {
    safeLogError({ event: "get_analysis_report_lookup_failed", user_id: user.id, error_code: "INTERNAL_ERROR" });
    const { status, body } = safeError("INTERNAL_ERROR");
    return jsonResponse(body, status, headers);
  }
  if (!row || !looksLikeCareerAnalysis(row.result_json)) {
    // Deliberately the same shape whether the id doesn't exist, belongs to
    // another user (RLS already made it invisible), or isn't complete yet —
    // never a signal that distinguishes "not yours" from "doesn't exist".
    return jsonResponse({ ok: true, found: false }, 200, headers);
  }

  const outputLanguage: "ar" | "en" =
    row.result_json.context.outputLanguage === "ar" ? "ar" : "en";
  const report = buildUiFreeReport(row.result_json, outputLanguage);

  safeLog({ event: "get_analysis_report_restored", user_id: user.id, analysis_id: row.id, resume_id: row.resume_id });
  return jsonResponse(
    { ok: true, found: true, analysisId: row.id, resumeId: row.resume_id, report },
    200,
    headers,
  );
});
