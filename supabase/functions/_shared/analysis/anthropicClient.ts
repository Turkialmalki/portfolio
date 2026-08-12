/**
 * LOW-LEVEL ANTHROPIC CALL + SAFE DIAGNOSTICS (Command 05D §1–§3, §7).
 *
 * Everything in this file exists to answer ONE question when a real
 * Anthropic call fails: "which of API key / billing / model access /
 * request shape / rate limit / provider outage was it?" — without ever
 * exposing the API key, the request body (prompt/resume/methodology), or
 * the full provider response.
 *
 * `AnthropicCallDiagnostics` is a closed, explicit allowlist — the same
 * discipline `safeLog.ts`'s `SafeLogFields` already applies to logs, here
 * applied to what an admin-mode Edge Function response may ever contain
 * about a provider failure:
 *
 *   providerHttpStatus, providerErrorType, providerRequestId,
 *   providerErrorMessageSanitized
 *
 * `providerErrorMessageSanitized` is Anthropic's own short error-type
 * message (e.g. "invalid x-api-key"), never anything we sent — but it is
 * still truncated and newline-stripped defensively, on the same
 * never-trust-a-string-you-didn't-fully-construct-yourself principle
 * SafeLogFields already follows. The full parsed response body is used
 * ONLY inside this module to pull these four fields out, then discarded —
 * it is never returned, never logged, never passed to a caller.
 */
import { CAREER_AI_CONFIG } from "./config.ts";
import { DEFAULT_TIMEOUTS } from "./instrumentation.ts";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

/** 529 (overloaded) and 429 (rate limited) are Anthropic-documented
 *  transient conditions, not request problems — every other non-2xx
 *  (400/401/402/403/404/5xx-other) reflects something about our request
 *  or account and retrying it changes nothing. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 529;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AnthropicCallDiagnostics {
  providerHttpStatus: number;
  providerErrorType: string;
  providerRequestId: string | null;
  providerErrorMessageSanitized: string;
}

/**
 * Thrown by `callAnthropicRaw`/`callAnthropicTool` on any non-2xx response.
 * `stage` identifies which pipeline step made the call (e.g.
 * "dimension_analysis", "rewrite_generation", "smoke_test_basic") — never
 * anything about the call's CONTENT.
 */
export class AnthropicProviderError extends Error {
  constructor(
    readonly diagnostics: AnthropicCallDiagnostics,
    readonly stage: string,
  ) {
    super(`anthropic_provider_error stage=${stage} status=${diagnostics.providerHttpStatus} type=${diagnostics.providerErrorType}`);
  }
}

/** Anthropic's own error-type string never contains request content — still bounded and control-char-stripped defensively. */
function sanitizeErrorMessage(message: unknown): string {
  if (typeof message !== "string" || message.length === 0) return "no_message_provided";
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 300);
}

interface RawAnthropicCallResult {
  status: number;
  requestId: string | null;
  /** Parsed JSON body — internal to this module only; never returned to a caller as-is. */
  json: unknown;
}

/**
 * The one place that ever sends `apiKey` over the wire (§11: never logged,
 * never echoed). Every other function in this file/module goes through
 * this, so there is exactly one fetch call to audit for that guarantee.
 */
async function callAnthropicRaw(apiKey: string, body: Record<string, unknown>): Promise<RawAnthropicCallResult> {
  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": CAREER_AI_CONFIG.apiVersion,
    },
    body: JSON.stringify(body),
  });
  const requestId = res.headers.get("request-id");
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (e.g. an upstream gateway's HTML error page) — leave
    // json null; diagnosticsFromResult() below falls back to safe defaults.
  }
  return { status: res.status, requestId, json };
}

function diagnosticsFromResult(result: RawAnthropicCallResult): AnthropicCallDiagnostics {
  const body = result.json && typeof result.json === "object" ? (result.json as Record<string, unknown>) : {};
  const errorObj = body.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : {};
  const errorType = typeof errorObj.type === "string" ? errorObj.type : "unknown_error";
  const bodyRequestId = typeof body.request_id === "string" ? body.request_id : null;
  return {
    providerHttpStatus: result.status,
    providerErrorType: errorType,
    providerRequestId: result.requestId ?? bodyRequestId,
    providerErrorMessageSanitized: sanitizeErrorMessage(errorObj.message),
  };
}

/**
 * Calls Anthropic; throws `AnthropicProviderError` (safe diagnostics only)
 * on any non-2xx response. On success, returns the parsed body as
 * `unknown` — callers are responsible for extracting only what they need
 * from it (never for logging or returning the whole thing).
 *
 * Retries `DEFAULT_TIMEOUTS.maxRetries` times, short fixed backoff, ONLY
 * for the two Anthropic-documented transient statuses (529 overloaded,
 * 429 rate limited) — first observed on the first real production CV
 * (Command 06A.5's live verification), which failed outright on a single
 * 529 with no retry anywhere in the call path. Every other non-2xx status
 * still fails immediately, unchanged — retrying a 400/401/402/403/404 or
 * a non-overload 5xx would just waste the same request budget
 * (pipeline.ts's providerCallMs) on a call that cannot succeed. Backoff is
 * short by design: providerCallMs (45s) already has to cover this PLUS a
 * real ~16-20s call afterward.
 */
export async function callAnthropic(apiKey: string, body: Record<string, unknown>, stage: string): Promise<unknown> {
  const backoffMs = [500, 1500];
  let lastResult: RawAnthropicCallResult | null = null;
  for (let attempt = 0; attempt <= DEFAULT_TIMEOUTS.maxRetries; attempt++) {
    const result = await callAnthropicRaw(apiKey, body);
    if (result.status >= 200 && result.status < 300) return result.json;
    lastResult = result;
    if (!isRetryableStatus(result.status) || attempt === DEFAULT_TIMEOUTS.maxRetries) break;
    await sleep(backoffMs[attempt] ?? backoffMs[backoffMs.length - 1]);
  }
  throw new AnthropicProviderError(diagnosticsFromResult(lastResult!), stage);
}

/**
 * Command 05D §7 — maps a provider HTTP status to an internal diagnostic
 * code. Only ever surfaced in fixture/admin mode (analyze-resume has no
 * other mode today — see releaseGates.ts); ordinary customer-facing
 * responses stay on the generic SafeErrorCode vocabulary.
 */
export type AnthropicDiagnosticCode =
  | "ANTHROPIC_INVALID_REQUEST"
  | "ANTHROPIC_AUTH_FAILED"
  | "ANTHROPIC_BILLING"
  | "ANTHROPIC_PERMISSION_DENIED"
  | "ANTHROPIC_MODEL_OR_RESOURCE_NOT_FOUND"
  | "ANTHROPIC_RATE_LIMITED"
  | "ANTHROPIC_PROVIDER_ERROR"
  | "ANTHROPIC_UNKNOWN_ERROR";

export function mapAnthropicStatusToDiagnosticCode(status: number): AnthropicDiagnosticCode {
  switch (status) {
    case 400:
      return "ANTHROPIC_INVALID_REQUEST";
    case 401:
      return "ANTHROPIC_AUTH_FAILED";
    case 402:
      return "ANTHROPIC_BILLING";
    case 403:
      return "ANTHROPIC_PERMISSION_DENIED";
    case 404:
      return "ANTHROPIC_MODEL_OR_RESOURCE_NOT_FOUND";
    case 429:
      return "ANTHROPIC_RATE_LIMITED";
    default:
      return status >= 500 ? "ANTHROPIC_PROVIDER_ERROR" : "ANTHROPIC_UNKNOWN_ERROR";
  }
}

/** The exact, safe diagnostic body shape for an admin/fixture-mode provider failure response (§1). */
export function buildProviderDiagnosticBody(err: AnthropicProviderError) {
  return {
    error: "ANALYSIS_FAILED" as const,
    provider: "anthropic" as const,
    providerHttpStatus: err.diagnostics.providerHttpStatus,
    providerErrorType: err.diagnostics.providerErrorType,
    providerRequestId: err.diagnostics.providerRequestId,
    providerErrorMessageSanitized: err.diagnostics.providerErrorMessageSanitized,
    model: CAREER_AI_CONFIG.model,
    stage: err.stage,
    diagnosticCode: mapAnthropicStatusToDiagnosticCode(err.diagnostics.providerHttpStatus),
  };
}
