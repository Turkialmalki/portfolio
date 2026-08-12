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
};

export function safeLog(fields: SafeLogFields): void {
  // Deno's structured console output is fine to keep as one JSON line —
  // this is what Supabase's Edge Function log viewer expects.
  console.log(JSON.stringify(fields));
}

export function safeLogError(fields: SafeLogFields & { error_code: string }): void {
  console.error(JSON.stringify(fields));
}
