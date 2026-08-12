/**
 * SAFE LOGGING — the only way a Career Edge Function should write to
 * `console.*`. Command 02 §14: never intentionally log raw CV content,
 * parsed CV text, full AI prompts/outputs, PayPal customer-submitted
 * fields, phone numbers, or emails. Prefer request/resource ids, an error
 * code, and a duration.
 *
 * This is an ALLOWLIST, not a redaction filter — it does not try to detect
 * and strip PII out of arbitrary strings (that's unreliable by nature).
 * Instead, callers can only pass the specific fields this type permits, so
 * there is no field to accidentally pass a CV body or an AI response into.
 */

export type SafeLogFields = {
  event: string;
  request_id?: string;
  resume_id?: string;
  analysis_id?: string;
  purchase_id?: string;
  /** Only when operationally necessary to trace a request — never alongside PII fields. */
  user_id?: string;
  error_code?: string;
  duration_ms?: number;
  status?: number;
  // ── Command 05B: parser operational fields (never raw content) ──────────
  /** e.g. "resume_parser_v1" — traces which parser build produced a result. */
  parser_version?: string;
  /** "pdf" | "docx" — never the filename (may contain a real name). */
  format?: string;
  /** Length of extracted/normalized text — a count, never the text itself. */
  character_count?: number;
  /** Non-fatal parser warning codes, e.g. ["MULTI_COLUMN_ORDER_UNCERTAIN"] — codes only. */
  warning_codes?: string[];
  /** Only a thrown value's TYPE NAME (e.g. "UnknownErrorException") on an unclassified PARSE_FAILED — never a message, never content. See parser/types.ts's ParseResult.debugErrorName. */
  debug_error_name?: string;
  /** AnalysisPipelineError.message only — always a fixed, code-authored string (e.g. "AI output failed schema validation after one repair retry"), never AI output or CV text. Capped short by the caller. */
  pipeline_error_message?: string;
  /** SchemaIssue count from a failed AI-output validation — a number, not the issues themselves. */
  schema_issue_count?: number;
  /**
   * A CAPPED sample of SchemaIssue `path`/`issue` pairs from a failed
   * AI-output validation (schemaValidation.ts) — e.g.
   * "[2].evidenceQuality: evidenceQuality must be one of none|limited|specific|strong".
   * Safe to log: `path` is a fixed `[index].fieldName` shape (an array
   * index + one of DimensionAIResult's own field names, both closed,
   * code-defined vocabularies) and `issue` is always one of the fixed
   * static strings validateOne() writes in code — NEITHER ever contains
   * CV text, AI prose, or a full AI response. The one field value ever
   * interpolated into an `issue` string is `dimensionId` itself (e.g.
   * "dimensionId foo was not requested"), which is either a real
   * DIMENSION_IDS member or a short model-emitted token — never CV
   * content. Capped short (schemaValidation.ts truncates further) purely
   * to keep log lines small, not for a safety reason beyond the above.
   */
  schema_issue_sample?: string[];
  /** Anthropic's own `stop_reason` from the failing call (e.g. "max_tokens", "tool_use", "end_turn") — a fixed provider enum, never model-generated content. Logged on a schema-validation failure to distinguish "the model truncated" from "the model produced malformed output" without needing the raw response. */
  stop_reason?: string | null;
  /** AnalysisPipelineError.stage — fixed vocabulary (AnalysisFailureStage, types.ts) for WHERE in the pipeline a failure happened, e.g. "repair_schema_validation" — never free text. */
  stage?: string;
  /** instrumentation.aiCallCount at the moment of failure (1 or 2) — how many times the provider was actually called this run. */
  provider_attempts?: number;
  /** instrumentation.retryCount at the moment of failure — 0 or 1. */
  schema_repair_count?: number;
};

export function safeLog(fields: SafeLogFields): void {
  // Deno's structured console output is fine to keep as one JSON line —
  // this is what Supabase's Edge Function log viewer expects.
  console.log(JSON.stringify(fields));
}

export function safeLogError(fields: SafeLogFields & { error_code: string }): void {
  console.error(JSON.stringify(fields));
}
