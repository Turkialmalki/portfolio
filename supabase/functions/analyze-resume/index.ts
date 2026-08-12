/**
 * analyze-resume — the trusted server-side entry point for the Career
 * Analysis Engine (Command 05 §2, §40; Command 06A.5 §4–§11).
 *
 * TWO CLASSES OF REQUEST:
 *
 *   1. `mode: "customer"` — the REAL production path (Command 06A.5). A
 *      logged-in user's OWN previously-uploaded resume gets parsed and
 *      analyzed for real. Authenticated by the caller's Supabase session
 *      (`Authorization: Bearer <access_token>`), never by ADMIN_API_KEY —
 *      the browser must never hold that secret. Still hard-blocked by
 *      `PRIVACY_SECURITY_EXECUTION_VERIFIED` (releaseGates.ts): while that
 *      gate is false this branch answers every request with `GATED`
 *      before touching storage, the parser, or the AI provider. See
 *      `handleCustomerAnalysis` below.
 *
 *   2. Every other `mode` (fixture_test / smoke_test_* / diagnostic_*) —
 *      unchanged from Command 05C–05D.3: admin-key-gated, used for
 *      operator testing and CI, never reachable from a real customer
 *      session. `x-admin-key` is checked with a timing-safe comparison
 *      against the `ADMIN_API_KEY` secret.
 *
 * The two auth models are mutually exclusive by construction: the
 * `mode` field is read once, before either auth check runs, and only one
 * of "has a valid user session" / "has ADMIN_API_KEY" is ever required
 * for a given request — neither path can satisfy the other's check.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeError, classifyRpcError, type SafeErrorCode } from "../_shared/errorCodes.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../_shared/releaseGates.ts";
import { parseResumeFile } from "../_shared/parser/index.ts";
import { CAREER_METHODOLOGY_VERSION, SENIORITY_LEVELS } from "../_shared/methodology/index.ts";
import {
  AnalysisPipelineError,
  AnthropicProviderError,
  buildProviderDiagnosticBody,
  buildUiFreeReport,
  computeAnalysisIdentity,
  DEFAULT_TIMEOUTS,
  looksLikeCareerAnalysis,
  resolveProvider,
  runAnalysis,
  runBasicSmokeTest,
  runCompactAnalysisDiagnostic,
  runDimensionAnalysisDiagnostic,
  runFirstCallDiagnostic,
  runToolSmokeTest,
  validateAnalyzeResumeRequest,
  LIMITS,
} from "../_shared/analysis/index.ts";

const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "career-resumes";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respondError("INVALID_REQUEST", headers);
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  // ── Command 06A.5: the real customer path — session-authenticated, no
  // admin key, checked FIRST so a customer request never has to carry
  // (and the browser never has to hold) ADMIN_API_KEY. Every other mode
  // below is unchanged and stays admin-key-gated.
  if (bodyRecord.mode === "customer") {
    return await handleCustomerAnalysis(req, bodyRecord, headers, requestId, start);
  }

  // §31 (unchanged): every non-customer mode is an explicit,
  // credentialed fixture/diagnostic-test invocation — no session, no
  // stolen token, and no forged body field can reach this branch without
  // ADMIN_API_KEY.
  const providedKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || !providedKey || !timingSafeEqual(providedKey, ADMIN_API_KEY)) {
    return respondError("NOT_AUTHORIZED", headers);
  }

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
      // Until now this branch discarded everything on `err` beyond
      // `.code` and fell through to the SAME bare {error,message} a real
      // customer sees — even in admin/fixture mode, whose whole point
      // (per this catch block's own header comment) is surfacing safe
      // diagnostics. Parity with the AnthropicProviderError branch above:
      // build the equivalent safe, closed-allowlist envelope for our own
      // pipeline failures too (see buildPipelineErrorDiagnosticBody).
      const diag = buildPipelineErrorDiagnosticBody(err, duration_ms);
      safeLogError({
        event: "analyze_resume_pipeline_error",
        request_id: requestId,
        error_code: err.code,
        duration_ms,
        pipeline_error_message: err.message.slice(0, 200),
        ...(err.issues && err.issues.length > 0 ? { schema_issue_count: err.issues.length } : {}),
        ...(err.stopReason !== undefined ? { stop_reason: err.stopReason } : {}),
        ...(err.stage ? { stage: err.stage } : {}),
        ...(err.providerAttempts !== undefined ? { provider_attempts: err.providerAttempts } : {}),
        ...(err.schemaRepairCount !== undefined ? { schema_repair_count: err.schemaRepairCount } : {}),
      });
      return jsonResponse(diag, safeError(err.code).status, headers);
    }
    safeLogError({ event: "analyze_resume_unexpected_error", request_id: requestId, error_code: "INTERNAL_ERROR", duration_ms });
    return respondError("INTERNAL_ERROR", headers);
  }
});

/**
 * Command 05D §1's promise ("admin/fixture mode surfaces safe diagnostics
 * instead of collapsing into a generic 502") previously only applied to
 * `AnthropicProviderError` (a raw provider HTTP failure, via
 * `buildProviderDiagnosticBody`) — an `AnalysisPipelineError` (our OWN
 * pipeline's schema-validation/language-gate/timeout logic) fell through
 * to the same bare `{error,message}` a real customer sees, discarding
 * `stage`/`stopReason`/`issues.length`/`providerAttempts`/
 * `schemaRepairCount` that were sitting right there on `err` — the exact
 * gap a real production incident (Career V2 email-test verification) hit:
 * a 502 with no way to tell whether the primary call, the repair retry,
 * or the language gate had failed. Same closed-allowlist discipline as
 * `buildProviderDiagnosticBody`: fixed vocabulary, counts, and timings
 * only — never CV text, a prompt, or AI-generated prose.
 */
function buildPipelineErrorDiagnosticBody(err: AnalysisPipelineError, elapsedMs: number) {
  const overallBudgetMs = DEFAULT_TIMEOUTS.overallAnalysisMs;
  return {
    ok: false as const,
    error: err.code,
    message: safeError(err.code).body.message,
    stage: err.stage ?? "unexpected_error",
    stopReason: err.stopReason ?? null,
    schemaIssueCount: err.issues ? err.issues.length : 0,
    providerAttempts: err.providerAttempts ?? null,
    schemaRepairCount: err.schemaRepairCount ?? null,
    overallBudgetMs,
    elapsedMs,
    remainingBudgetMs: Math.max(0, overallBudgetMs - elapsedMs),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOMER MODE (Command 06A.5 §5–§16) — the real production path:

     REAL FILE (already uploaded to storage by the browser, RLS-owned)
       → AUTH (Supabase session, verified here)
       → OWNERSHIP (resumes row loaded through the user's OWN RLS-scoped
         client — a cross-user id can select nothing, never a 403 that
         confirms existence)
       → PRIVACY RELEASE GATE (checked before any storage/parser/AI work)
       → PARSE (existing parser/index.ts, same limits as parse-resume)
       → REAL ANALYSIS (runAnalysis, real Anthropic provider, "approved"
         knowledge mode)
       → resume_analyses ROW (service role — the client can never write
         its own score)
       → FREE REPORT (projectFreeReport — same shape the fixtures use)

   Every write happens under the SERVICE ROLE client, deliberately: the
   `resumes`/`resume_analyses` RLS policies give the browser no INSERT/
   UPDATE path onto analysis results by design (career_privacy_foundation
   migration) — this function is the only place a customer's `resumes.
   status` or `resume_analyses` row is allowed to change.

   ── ORPHANED-UPLOAD AUDIT (production-safety follow-up) ─────────────────
   Every failure branch below that runs AFTER the browser has already
   uploaded the file — download failure, parse failure, request
   validation failure, AI provider not configured, and the pipeline/
   provider errors caught at the bottom — sets `resumes.status = "failed"`
   BEFORE returning. That is a deliberate, inspectable, retry-eligible
   state, not a silent orphan: nothing here ever leaves a real customer's
   `resumes` row sitting at "uploaded" or "processing" forever once a
   terminal outcome is known server-side, and this function places NO
   status check on `resumeId` — the same id can be resubmitted with
   `mode:"customer"` to retry, re-parsing and re-analyzing the SAME
   already-uploaded file rather than requiring a fresh upload. The
   release-gate rejection (§17 below) is the one outcome that happens
   BEFORE any of that — it never touches storage, the parser, or
   `resumes` at all, by construction, so it never marks or orphans
   anything itself; the frontend's own pre-upload gate check
   (career-health's `privacyGateVerified`) is what keeps a real upload
   from happening in the first place while this gate is closed, and the
   frontend cleans up via `delete-resume` on the rare race where a GATED
   response arrives after an upload already landed — see CareerClient.
   tsx's `runRealAnalysisWithSession` for that half of this audit.
   ═══════════════════════════════════════════════════════════════════════ */

async function handleCustomerAnalysis(
  req: Request,
  bodyRecord: Record<string, unknown>,
  headers: HeadersInit,
  requestId: string,
  start: number,
): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return respondError("NOT_AUTHORIZED", headers);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return respondError("NOT_AUTHORIZED", headers);
  }

  // §6, §17: the release gate is checked BEFORE any storage read, parse,
  // or AI call — a customer request never touches the CV or spends a
  // provider call while the gate is closed. There is no way to reach
  // this line and still be blocked below by the pipeline's own gate
  // check (pipeline.ts) except as a defense-in-depth belt-and-suspenders,
  // which is intentional — see that file's header comment.
  if (!PRIVACY_SECURITY_EXECUTION_VERIFIED) {
    safeLog({ event: "analyze_resume_customer_blocked_gate", request_id: requestId, user_id: user.id, status: 503 });
    return respondError("GATED", headers);
  }

  const resumeId = bodyRecord.resumeId;
  if (typeof resumeId !== "string" || !UUID_RE.test(resumeId)) {
    return respondError("INVALID_REQUEST", headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Ownership: read through the CALLER's own RLS-scoped client
  // (resumes_select_own), not the service-role client with a manual
  // user_id filter — a cross-user id selects zero rows here structurally,
  // the same double-enforcement pattern delete-resume already uses.
  const { data: resume, error: resumeError } = await userClient
    .from("resumes")
    .select("id, user_id, storage_path, mime_type, original_filename, deleted_at, language")
    .eq("id", resumeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (resumeError || !resume || resume.user_id !== user.id) {
    safeLog({ event: "analyze_resume_customer_resume_not_found", request_id: requestId, user_id: user.id, status: 404 });
    return respondError("NOT_FOUND", headers);
  }

  // Storage read also goes through the user's own client — the
  // career_resumes_select_own storage policy scopes it to the caller's
  // own folder, so this can never read another user's object even if
  // storage_path were somehow guessed or forged.
  const { data: fileBlob, error: downloadError } = await userClient.storage
    .from(BUCKET)
    .download(resume.storage_path);

  if (downloadError || !fileBlob) {
    safeLogError({ event: "analyze_resume_customer_download_failed", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: "UPLOAD_FAILED", duration_ms: Date.now() - start });
    await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);
    return respondError("UPLOAD_FAILED", headers);
  }

  await admin.from("resumes").update({ status: "processing" }).eq("id", resumeId);

  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  const parseResult = await parseResumeFile({
    bytes,
    declaredFilename: resume.original_filename,
    declaredMimeType: resume.mime_type,
  });

  if (!parseResult.ok) {
    safeLogError({
      event: "analyze_resume_customer_parse_failed",
      request_id: requestId,
      resume_id: resumeId,
      user_id: user.id,
      error_code: parseResult.code,
      duration_ms: Date.now() - start,
      ...(parseResult.debugErrorName ? { debug_error_name: parseResult.debugErrorName } : {}),
    });
    await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);
    return respondError(parseResult.code as SafeErrorCode, headers);
  }

  safeLog({
    event: "analyze_resume_customer_parsed",
    request_id: requestId,
    resume_id: resumeId,
    user_id: user.id,
    parser_version: parseResult.resume.parserVersion,
    format: parseResult.resume.sourceFormat,
    character_count: parseResult.resume.characterCount,
    warning_codes: parseResult.resume.warnings,
  });

  // §9 input-schema limits are shorter than the parser's own extraction
  // ceiling (parser/limits.ts's maxExtractedChars is far larger, sized to
  // guard against decompression abuse, not to describe a normal CV) — a
  // very long real document is truncated rather than hard-rejected, so an
  // unusually long CV still gets a free result instead of an error.
  const resumeText = parseResult.resume.text.slice(0, LIMITS.resumeTextMax);
  const detected = parseResult.resume.detectedLanguage;
  const language = detected === "ar" || detected === "en" || detected === "bilingual" ? detected : "en";

  // No seniority/target-role/JD picker exists in the current /career
  // upload UI (Command 06A.5 explicitly keeps the hero/upload UI
  // untouched) — a caller MAY pass an optional `seniority` override
  // later if that UI grows one; until then every real customer analysis
  // runs at "mid", the same neutral default the operator fixtures use
  // for CVs without an explicit level. This is a known, documented
  // simplification, not a silent guess baked into scoring.ts itself.
  const seniorityInput = bodyRecord.seniority;
  const seniority = typeof seniorityInput === "string" && (SENIORITY_LEVELS as readonly string[]).includes(seniorityInput)
    ? (seniorityInput as (typeof SENIORITY_LEVELS)[number])
    : "mid";

  // The customer's UI language at upload time (`resumes.language` — set
  // by CareerClient from the language toggle, NOT a detected property of
  // the CV text). Drives what language the AI writes customer-facing
  // prose in; `language` above (the CV's OWN detected language) stays
  // reserved for the language_quality rubric. See AnalysisContext.
  const outputLanguage: "ar" | "en" = resume.language === "ar" ? "ar" : "en";

  const validated = validateAnalyzeResumeRequest({
    resumeText,
    language,
    outputLanguage,
    seniority,
    targetRole: typeof bodyRecord.targetRole === "string" ? bodyRecord.targetRole : undefined,
    roleFamily: typeof bodyRecord.roleFamily === "string" ? bodyRecord.roleFamily : undefined,
    industry: typeof bodyRecord.industry === "string" ? bodyRecord.industry : undefined,
    jobDescription: typeof bodyRecord.jobDescription === "string" ? bodyRecord.jobDescription : undefined,
  });
  if (!validated.ok) {
    safeLog({ event: "analyze_resume_customer_validation_failed", request_id: requestId, resume_id: resumeId, user_id: user.id, status: 400 });
    await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);
    return respondError("INVALID_REQUEST", headers);
  }

  // §Career V2 Part 2–3: deterministic analysis identity. Same resume
  // content + same methodology version + same target role + same job
  // description → the SAME stored analysis is reused instead of calling
  // Anthropic again — this is the actual fix for score drift, not a
  // display-layer rounding trick. Computed AFTER validation so the
  // fingerprint always matches exactly what would be sent to the AI.
  const identity = await computeAnalysisIdentity({
    resumeText: validated.request.resumeText,
    methodologyVersion: CAREER_METHODOLOGY_VERSION,
    targetRole: validated.request.targetRole,
    jobDescription: validated.request.jobDescription,
  });

  // Lookup through the CALLER's own RLS-scoped client (resume_analyses_
  // select_own) — same ownership pattern as the `resumes` read above — so
  // this can never surface another user's cached analysis even if a
  // fingerprint collided (it structurally can't select cross-user rows).
  const { data: existing, error: existingError } = await userClient
    .from("resume_analyses")
    .select("id, result_json, status")
    .eq("resume_id", resumeId)
    .eq("analysis_fingerprint", identity.analysisFingerprint)
    .eq("status", "complete")
    .maybeSingle();

  if (existingError) {
    safeLogError({ event: "analyze_resume_customer_reuse_lookup_failed", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: "INTERNAL_ERROR", duration_ms: Date.now() - start });
    // Non-fatal: fall through and analyze fresh rather than failing the
    // whole request over a cache-lookup error.
  }

  if (existing && looksLikeCareerAnalysis(existing.result_json)) {
    await admin.from("resumes").update({ status: "analyzed", content_fingerprint: identity.resumeFingerprint }).eq("id", resumeId);
    const duration_ms = Date.now() - start;
    safeLog({
      event: "analyze_resume_customer_reused",
      request_id: requestId,
      resume_id: resumeId,
      analysis_id: existing.id,
      user_id: user.id,
      status: 200,
      duration_ms,
    });
    return jsonResponse(
      {
        ok: true,
        mode: "customer",
        resumeId,
        analysisId: existing.id,
        report: buildUiReport(existing.result_json, outputLanguage),
        analysisLatencyMs: duration_ms,
        reused: true,
      },
      200,
      headers,
    );
  }

  const { provider, realProviderConfigured } = resolveProvider((name) => Deno.env.get(name));
  if (!realProviderConfigured) {
    // A real customer must never receive a mock-provider result —
    // AI_PROVIDER_API_KEY missing means the product isn't actually wired
    // yet, which is an operator-facing configuration failure, not
    // something to paper over with fixture data (§3, §28).
    safeLogError({ event: "analyze_resume_customer_ai_not_configured", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: "ANALYSIS_FAILED", duration_ms: Date.now() - start });
    await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);
    return respondError("ANALYSIS_FAILED", headers);
  }

  try {
    const result = await runAnalysis(validated.request, {
      provider,
      knowledgeMode: "approved",
      isFixtureRun: false,
    });

    const analysis = result.analysis;

    // §Career V2 Part 2–3: persist the same identity we looked up above,
    // plus the methodology version, so a future resubmission with
    // unchanged inputs can reuse this exact row (resume_analyses_reuse_idx
    // enforces at most one complete row per resume_id+analysis_fingerprint;
    // ON CONFLICT DO NOTHING + a follow-up select handles the rare race
    // where two requests computed the same fingerprint concurrently).
    const { data: inserted, error: insertError } = await admin
      .from("resume_analyses")
      .insert({
        resume_id: resumeId,
        user_id: user.id,
        overall_score: analysis.overallScore,
        analysis_version: result.engineMetadata.analysisPipelineVersion,
        methodology_version: CAREER_METHODOLOGY_VERSION,
        resume_fingerprint: identity.resumeFingerprint,
        target_role_fingerprint: identity.targetRoleFingerprint,
        job_description_fingerprint: identity.jobDescriptionFingerprint,
        analysis_fingerprint: identity.analysisFingerprint,
        result_json: analysis,
        status: "complete",
      })
      .select("id")
      .single();

    let analysisId = inserted?.id as string | undefined;
    if (insertError || !inserted) {
      // Postgres unique_violation (23505) on resume_analyses_reuse_idx
      // means a concurrent request already persisted this exact analysis
      // identity first — reuse THAT row instead of failing, rather than
      // surfacing a spurious 500 for what is actually a successful reuse
      // race between two near-simultaneous requests for the same CV.
      if ((insertError as { code?: string } | null)?.code === "23505") {
        const { data: raced } = await userClient
          .from("resume_analyses")
          .select("id")
          .eq("resume_id", resumeId)
          .eq("analysis_fingerprint", identity.analysisFingerprint)
          .eq("status", "complete")
          .maybeSingle();
        analysisId = raced?.id;
      }
      if (!analysisId) {
        const code = classifyRpcError(insertError?.message ?? "");
        safeLogError({ event: "analyze_resume_customer_persist_failed", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: code, duration_ms: Date.now() - start });
        await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);
        return respondError(code, headers);
      }
    }

    await admin.from("resumes").update({ status: "analyzed", content_fingerprint: identity.resumeFingerprint }).eq("id", resumeId);

    const uiReport = buildUiReport(analysis, outputLanguage);
    const duration_ms = Date.now() - start;
    safeLog({
      event: "analyze_resume_customer_completed",
      request_id: requestId,
      resume_id: resumeId,
      analysis_id: analysisId,
      user_id: user.id,
      status: 200,
      duration_ms,
    });

    return jsonResponse(
      {
        ok: true,
        mode: "customer",
        resumeId,
        analysisId,
        report: uiReport,
        analysisLatencyMs: duration_ms,
      },
      200,
      headers,
    );
  } catch (err) {
    const duration_ms = Date.now() - start;
    await admin.from("resumes").update({ status: "failed" }).eq("id", resumeId);

    if (err instanceof AnthropicProviderError) {
      const diag = buildProviderDiagnosticBody(err);
      safeLogError({ event: "analyze_resume_customer_provider_error", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: diag.diagnosticCode, status: diag.providerHttpStatus, duration_ms });
      // §15/§28: the browser never sees provider diagnostics — those are
      // an admin-diagnostic-only surface (see the fixture/diagnostic
      // branches above). A customer gets the same safe vocabulary as any
      // other failure.
      return respondError(diag.providerHttpStatus === 504 ? "ANALYSIS_TIMEOUT" : "ANALYSIS_FAILED", headers);
    }
    if (err instanceof AnalysisPipelineError) {
      safeLogError({
        event: "analyze_resume_customer_pipeline_error",
        request_id: requestId,
        resume_id: resumeId,
        user_id: user.id,
        error_code: err.code,
        duration_ms,
        // err.message is always a fixed, code-authored string from
        // pipeline.ts (e.g. "AI output failed schema validation after
        // one repair retry") — never AI output or CV content. issues[]
        // (SchemaIssue) are structural violation descriptions
        // (path/field names + a fixed phrase), not logged in full here —
        // only their count, to stay conservative.
        pipeline_error_message: err.message.slice(0, 200),
        ...(err.issues ? { schema_issue_count: err.issues.length } : {}),
        ...(err.stopReason !== undefined ? { stop_reason: err.stopReason } : {}),
        ...(err.stage ? { stage: err.stage } : {}),
        ...(err.providerAttempts !== undefined ? { provider_attempts: err.providerAttempts } : {}),
        ...(err.schemaRepairCount !== undefined ? { schema_repair_count: err.schemaRepairCount } : {}),
        // A capped sample (first 6) of "path: issue" — both are fixed,
        // code-authored vocabulary (see SchemaIssue's own doc + safeLog.ts's
        // schema_issue_sample field for exactly why this is safe to log,
        // never CV/AI content).
        ...(err.issues && err.issues.length > 0
          ? { schema_issue_sample: err.issues.slice(0, 6).map((i) => `${i.path}: ${i.issue}`.slice(0, 160)) }
          : {}),
      });
      return respondError(err.code, headers);
    }
    safeLogError({ event: "analyze_resume_customer_unexpected_error", request_id: requestId, resume_id: resumeId, user_id: user.id, error_code: "INTERNAL_ERROR", duration_ms });
    return respondError("INTERNAL_ERROR", headers);
  }
}

/* buildUiFreeReport (aliased below as buildUiReport)/looksLikeCareerAnalysis
   now live in _shared/analysis/reportFormat.ts — shared with
   get-analysis-report so a deep-link restore (Career V2 Part 19) returns a
   byte-identical shape to a fresh/reused analysis. */
const buildUiReport = buildUiFreeReport;
