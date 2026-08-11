/**
 * analyze-resume — the trusted server-side entry point for the Career
 * Analysis Engine (Command 05 §2, §40).
 *
 * REAL CUSTOMER MODE IS BLOCKED. `PRIVACY_SECURITY_EXECUTION_VERIFIED`
 * (releaseGates.ts) is still `false` — the privacy/RLS test suite A–H/K
 * has never been executed. Until a human flips that gate after actually
 * running those tests, this function accepts EXACTLY ONE thing: an
 * explicit, admin-key-gated fixture/test-mode request. There is no
 * "customer" code path here to accidentally leave enabled — it doesn't
 * exist yet. Wiring uploads, entitlements, and real resume storage to
 * this function is future work, gated on the same release gate the rest
 * of the Career backend already respects (see grantEntitlement.ts,
 * retention.ts, and career_privacy_security.sql).
 *
 * Auth model: same pattern as verify-payment — an `x-admin-key` header
 * checked with a timing-safe comparison against the `ADMIN_API_KEY`
 * secret. There is deliberately no browser-reachable auth path (no user
 * session grants access here), because there is no customer-facing UI
 * for this function yet (§42) and none should be built against it while
 * the gate is false.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { safeError, type SafeErrorCode } from "../_shared/errorCodes.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../_shared/releaseGates.ts";
import {
  AnalysisPipelineError,
  resolveProvider,
  runAnalysis,
  validateAnalyzeResumeRequest,
} from "../_shared/analysis/index.ts";

const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY");

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function respondError(code: SafeErrorCode, headers: HeadersInit) {
  const { status, body } = safeError(code);
  return jsonResponse(body, status, headers);
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  const requestId = crypto.randomUUID();
  const start = Date.now();

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respondError("METHOD_NOT_ALLOWED", headers);

  // §31: real customer mode does not exist yet. Every call must be an
  // explicit, credentialed fixture-test invocation — no session, no
  // stolen token, and no forged body field can reach real-customer
  // behavior, because that behavior has not been implemented (§2, §40).
  const providedKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || !providedKey || !timingSafeEqual(providedKey, ADMIN_API_KEY)) {
    return respondError("NOT_AUTHORIZED", headers);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respondError("INVALID_REQUEST", headers);
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (bodyRecord.mode !== "fixture_test") {
    safeLog({ event: "analyze_resume_rejected_non_fixture_mode", request_id: requestId });
    return respondError("INVALID_REQUEST", headers);
  }

  const validated = validateAnalyzeResumeRequest(bodyRecord.request ?? bodyRecord);
  if (!validated.ok) {
    safeLog({ event: "analyze_resume_validation_failed", request_id: requestId, status: 400 });
    return jsonResponse({ error: "INVALID_REQUEST", message: "The request was invalid.", details: validated.errors }, 400, headers);
  }

  const { provider } = resolveProvider((name) => Deno.env.get(name));

  try {
    const result = await runAnalysis(validated.request, {
      provider,
      knowledgeMode: "fixture",
      isFixtureRun: true, // hard requirement while PRIVACY_SECURITY_EXECUTION_VERIFIED is false — see releaseGates.ts
    });

    safeLog({ event: "analyze_resume_completed", request_id: requestId, duration_ms: Date.now() - start, status: 200 });
    return jsonResponse(
      {
        ok: true,
        mode: "fixture_test",
        privacyGateVerified: PRIVACY_SECURITY_EXECUTION_VERIFIED,
        analysis: result.analysis,
        engineMetadata: result.engineMetadata,
        instrumentation: result.instrumentation,
        factConflicts: result.factConflicts,
      },
      200,
      headers,
    );
  } catch (err) {
    const duration_ms = Date.now() - start;
    if (err instanceof AnalysisPipelineError) {
      safeLogError({ event: "analyze_resume_pipeline_error", request_id: requestId, error_code: err.code, duration_ms });
      return respondError(err.code, headers);
    }
    safeLogError({ event: "analyze_resume_unexpected_error", request_id: requestId, error_code: "INTERNAL_ERROR", duration_ms });
    return respondError("INTERNAL_ERROR", headers);
  }
});
