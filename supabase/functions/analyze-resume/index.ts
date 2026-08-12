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
  AnthropicProviderError,
  buildProviderDiagnosticBody,
  resolveProvider,
  runAnalysis,
  runBasicSmokeTest,
  runCompactAnalysisDiagnostic,
  runDimensionAnalysisDiagnostic,
  runFirstCallDiagnostic,
  runToolSmokeTest,
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

  // ── Command 05D §2–§6: temporary admin-only diagnostic paths ────────────
  // Isolate "does the API key/billing/model access even work" and "does
  // our tool_choice mechanism work" from the full Career pipeline. Both
  // still require the same x-admin-key check above — nothing new is
  // exposed to public traffic. Remove alongside smokeTest.ts once the
  // real-provider path is validated end to end.
  if (bodyRecord.mode === "smoke_test_basic" || bodyRecord.mode === "smoke_test_tool") {
    const aiProviderKeyPresent = Boolean(Deno.env.get("AI_PROVIDER_API_KEY"));
    safeLog({ event: "analyze_resume_smoke_test_requested", request_id: requestId });
    if (!aiProviderKeyPresent) {
      return jsonResponse(
        { error: "AI_PROVIDER_NOT_CONFIGURED", aiProviderKeyPresent: false },
        503,
        headers,
      );
    }
    const apiKey = Deno.env.get("AI_PROVIDER_API_KEY")!;
    const result = bodyRecord.mode === "smoke_test_basic"
      ? await runBasicSmokeTest(apiKey)
      : await runToolSmokeTest(apiKey);
    safeLog({
      event: bodyRecord.mode === "smoke_test_basic" ? "analyze_resume_smoke_test_basic_result" : "analyze_resume_smoke_test_tool_result",
      request_id: requestId,
      status: result.success ? 200 : (result.providerHttpStatus ?? 500),
      duration_ms: result.latencyMs,
      error_code: result.diagnosticCode,
    });
    return jsonResponse({ aiProviderKeyPresent: true, ...result }, result.success ? 200 : 502, headers);
  }

  // ── Command 05D §1–§6: temporary dimension-analysis-only diagnostic ─────
  // Runs validation → preprocessing → structure → retrieval → prompt
  // composition → ONE real dimension_analysis call → schema validation
  // (+ the existing single repair retry), then stops — no rewrite call, no
  // scoring, no findings. Diagnostic-only timeouts (60s/75s) apply ONLY to
  // this path; production DEFAULT_TIMEOUTS in pipeline.ts are untouched.
  // Remove alongside dimensionDiagnostic.ts once real-provider latency is
  // characterized and the production architecture decision is made.
  if (bodyRecord.mode === "diagnostic_dimension_only") {
    const aiProviderKeyPresent = Boolean(Deno.env.get("AI_PROVIDER_API_KEY"));
    if (!aiProviderKeyPresent) {
      return jsonResponse({ error: "AI_PROVIDER_NOT_CONFIGURED", aiProviderKeyPresent: false }, 503, headers);
    }
    const validationStart = Date.now();
    const validated = validateAnalyzeResumeRequest(bodyRecord.request ?? bodyRecord);
    const requestValidationMs = Date.now() - validationStart;
    if (!validated.ok) {
      safeLog({ event: "analyze_resume_diagnostic_validation_failed", request_id: requestId, status: 400 });
      return jsonResponse({ error: "INVALID_REQUEST", message: "The request was invalid.", details: validated.errors }, 400, headers);
    }
    const { provider: diagProvider } = resolveProvider((name) => Deno.env.get(name));
    const diagResult = await runDimensionAnalysisDiagnostic(validated.request, diagProvider, "fixture", requestValidationMs);
    safeLog({
      event: "analyze_resume_diagnostic_dimension_only_result",
      request_id: requestId,
      status: diagResult.success ? 200 : (diagResult.dimension.providerHttpStatus ?? 500),
      duration_ms: diagResult.dimension.totalDiagnosticLatencyMs,
      error_code: diagResult.dimension.timedOut ? "ANALYSIS_TIMEOUT" : undefined,
    });
    return jsonResponse({ aiProviderKeyPresent: true, ...diagResult }, diagResult.success ? 200 : 502, headers);
  }

  // ── Command 05D.1: first-real-call-only diagnostic (no repair retry) ────
  // Runs exactly ONE Anthropic call and stops at schema validation — the
  // repair retry is deliberately excluded here (that's what made the §1
  // diagnostic exceed its own 75s budget). Context/token sizing is
  // computed BEFORE the call and captured by reference, so it survives
  // even a timeout. Remove alongside firstCallDiagnostic.ts once the
  // root cause is found.
  if (bodyRecord.mode === "diagnostic_first_dimension_call_only") {
    const aiProviderKeyPresent = Boolean(Deno.env.get("AI_PROVIDER_API_KEY"));
    if (!aiProviderKeyPresent) {
      return jsonResponse({ error: "AI_PROVIDER_NOT_CONFIGURED", aiProviderKeyPresent: false }, 503, headers);
    }
    const validated = validateAnalyzeResumeRequest(bodyRecord.request ?? bodyRecord);
    if (!validated.ok) {
      safeLog({ event: "analyze_resume_first_call_diagnostic_validation_failed", request_id: requestId, status: 400 });
      return jsonResponse({ error: "INVALID_REQUEST", message: "The request was invalid.", details: validated.errors }, 400, headers);
    }
    const apiKey = Deno.env.get("AI_PROVIDER_API_KEY")!;
    const diagResult = await runFirstCallDiagnostic(validated.request, apiKey, "fixture");
    safeLog({
      event: "analyze_resume_first_call_diagnostic_result",
      request_id: requestId,
      status: diagResult.success ? 200 : (diagResult.provider.providerHttpStatus ?? 500),
      duration_ms: diagResult.totalDiagnosticLatencyMs,
      error_code: diagResult.timedOut ? "ANALYSIS_TIMEOUT" : undefined,
    });
    return jsonResponse({ aiProviderKeyPresent: true, ...diagResult }, diagResult.success ? 200 : 502, headers);
  }

  // ── Command 05D.2 §23: full compact free-path diagnostic ────────────────
  // Runs the ACTUAL optimized pipeline stages through free projection —
  // validation → preprocessing → structure → compact runtime methodology
  // → retrieval → ONE real compact dimension call → schema validation →
  // evidence validation → scoring.ts → deterministic findings → free
  // projection. No rewrite, no paid report, no repair retry (a first-pass
  // failure is reported, not silently retried). Remove alongside
  // compactAnalysisDiagnostic.ts once the compact pipeline is validated
  // against the full real-AI fixture suite.
  if (bodyRecord.mode === "diagnostic_compact_analysis") {
    const aiProviderKeyPresent = Boolean(Deno.env.get("AI_PROVIDER_API_KEY"));
    if (!aiProviderKeyPresent) {
      return jsonResponse({ error: "AI_PROVIDER_NOT_CONFIGURED", aiProviderKeyPresent: false }, 503, headers);
    }
    const validated = validateAnalyzeResumeRequest(bodyRecord.request ?? bodyRecord);
    if (!validated.ok) {
      safeLog({ event: "analyze_resume_compact_diagnostic_validation_failed", request_id: requestId, status: 400 });
      return jsonResponse({ error: "INVALID_REQUEST", message: "The request was invalid.", details: validated.errors }, 400, headers);
    }
    const apiKey = Deno.env.get("AI_PROVIDER_API_KEY")!;
    const diagResult = await runCompactAnalysisDiagnostic(validated.request, apiKey, "fixture");
    safeLog({
      event: "analyze_resume_compact_diagnostic_result",
      request_id: requestId,
      status: diagResult.success ? 200 : (diagResult.providerHttpStatus ?? 500),
      duration_ms: diagResult.timeToFreeResultMs,
      error_code: diagResult.timedOut ? "ANALYSIS_TIMEOUT" : undefined,
    });
    return jsonResponse({ aiProviderKeyPresent: true, ...diagResult }, diagResult.success ? 200 : 502, headers);
  }

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
    // Command 05D §1: a failed real-provider call carries its own safe
    // diagnostics (status/type/requestId/sanitized message) — surface them
    // instead of collapsing into the generic ANALYSIS_FAILED/502 this
    // whole endpoint was returning before, which made the Command 05C→05D
    // 502 undiagnosable. This endpoint is admin-key-gated and fixture-only
    // by construction (see the mode check above and releaseGates.ts), so
    // exposing these diagnostics here matches "fixture/admin mode only".
    if (err instanceof AnthropicProviderError) {
      const diag = buildProviderDiagnosticBody(err);
      safeLogError({
        event: "analyze_resume_provider_error",
        request_id: requestId,
        error_code: diag.diagnosticCode,
        status: diag.providerHttpStatus,
        duration_ms,
      });
      return jsonResponse(diag, 502, headers);
    }
    if (err instanceof AnalysisPipelineError) {
      safeLogError({ event: "analyze_resume_pipeline_error", request_id: requestId, error_code: err.code, duration_ms });
      return respondError(err.code, headers);
    }
    safeLogError({ event: "analyze_resume_unexpected_error", request_id: requestId, error_code: "INTERNAL_ERROR", duration_ms });
    return respondError("INTERNAL_ERROR", headers);
  }
});
