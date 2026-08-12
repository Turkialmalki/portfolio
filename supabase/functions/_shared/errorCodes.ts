/**
 * SAFE, PUBLIC ERROR CODES — the only vocabulary a Career Edge Function may
 * hand back to the browser. Command 02 §15: errors must be useful but must
 * never leak storage paths, SQL details, service-role information, provider
 * keys, stack traces, or another user's identifiers.
 *
 * Pattern: catch the real error server-side (log it safely — see
 * `safeLog.ts`), then respond with one of these codes plus a short static
 * message. Never `JSON.stringify(error)` or forward `error.message` from a
 * Postgres/Storage client straight to the response body — Postgres error
 * text can and does include table/column names, and Storage SDK errors can
 * include full paths.
 *
 * The existing `request-payment-verification` and `verify-payment`
 * functions (01C) forward `error.message` from their own `raise exception`
 * calls, which is safe ONLY because every message they raise is a short,
 * deliberately-chosen code (`not_owner`, `purchase_not_found`, …) — not
 * because forwarding `error.message` is safe in general. New functions
 * should prefer the explicit map below so that discipline doesn't rely on
 * every future `raise exception` message happening to be safe.
 */

export type SafeErrorCode =
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE"
  | "UPLOAD_FAILED"
  | "ANALYSIS_FAILED"
  | "ANALYSIS_TIMEOUT"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INVALID_REQUEST"
  | "INTERNAL_ERROR"
  // ── Command 05B: resume file ingestion + PDF/DOCX parser ────────────────
  | "FILE_CORRUPTED"
  | "FILE_ENCRYPTED"
  | "PDF_NO_EXTRACTABLE_TEXT"
  | "SCAN_REQUIRES_TEXT_PDF"
  | "PARSE_FAILED"
  | "PARSE_TIMEOUT";

const SAFE_MESSAGES: Record<SafeErrorCode, string> = {
  INVALID_FILE: "The uploaded file could not be processed.",
  FILE_TOO_LARGE: "The uploaded file is larger than the allowed limit.",
  UNSUPPORTED_FILE: "This file type isn't supported.",
  UPLOAD_FAILED: "The upload could not be completed. Please try again.",
  ANALYSIS_FAILED: "The analysis could not be completed. Please try again.",
  ANALYSIS_TIMEOUT: "The analysis took too long to complete. Please try again.",
  NOT_AUTHORIZED: "You're not authorized to perform this action.",
  NOT_FOUND: "The requested item was not found.",
  METHOD_NOT_ALLOWED: "This request method isn't supported.",
  INVALID_REQUEST: "The request was invalid.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  FILE_CORRUPTED: "This file appears to be corrupted and couldn't be read.",
  FILE_ENCRYPTED: "This file is password-protected. Please upload an unprotected copy.",
  PDF_NO_EXTRACTABLE_TEXT: "No readable text could be found in this PDF.",
  SCAN_REQUIRES_TEXT_PDF: "This looks like a scanned image, not selectable text. Please upload a text-based PDF or DOCX.",
  PARSE_FAILED: "This file could not be parsed. Please try a different file.",
  PARSE_TIMEOUT: "This file took too long to process. Please try a smaller file.",
};

const STATUS_BY_CODE: Record<SafeErrorCode, number> = {
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_FILE: 415,
  UPLOAD_FAILED: 502,
  ANALYSIS_FAILED: 502,
  ANALYSIS_TIMEOUT: 504,
  NOT_AUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INVALID_REQUEST: 400,
  INTERNAL_ERROR: 500,
  FILE_CORRUPTED: 422,
  FILE_ENCRYPTED: 422,
  PDF_NO_EXTRACTABLE_TEXT: 422,
  SCAN_REQUIRES_TEXT_PDF: 422,
  PARSE_FAILED: 422,
  PARSE_TIMEOUT: 504,
};

/** Builds the exact, safe JSON body + status for a given code — no other fields ever added. */
export function safeError(code: SafeErrorCode): { status: number; body: { error: SafeErrorCode; message: string } } {
  return { status: STATUS_BY_CODE[code], body: { error: code, message: SAFE_MESSAGES[code] } };
}

/**
 * Maps a Postgres `raise exception` message from one of THIS command's own
 * RPCs (`delete_resume`, `delete_career_data`) to a safe code. Anything not
 * recognized collapses to INTERNAL_ERROR rather than being forwarded —
 * unrecognized text is exactly the case that could be a raw Postgres/driver
 * error slipping through, not a deliberate application code.
 */
export function classifyRpcError(message: string): SafeErrorCode {
  if (message.includes("resume_not_found")) return "NOT_FOUND";
  if (message.includes("not_owner")) return "NOT_AUTHORIZED";
  return "INTERNAL_ERROR";
}
