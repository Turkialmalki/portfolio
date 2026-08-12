/**
 * PARSER TYPE SYSTEM (Command 05B §15).
 *
 * Mirrors the discipline of analysis/types.ts: layers stay structurally
 * distinct so the parser can never accidentally start scoring, and the
 * analysis engine can never accidentally start parsing bytes. The parser's
 * only output contract downstream is `ParsedResume.text` — a normalized
 * string ready to hand to `validateAnalyzeResumeRequest` /
 * `preprocessResumeText` (Command 05).
 */

export type SourceFormat = "pdf" | "docx";

export type ExtractionQuality = "high" | "medium" | "low";

/**
 * Every non-fatal condition the parser can flag. Distinct from the fatal
 * `SafeErrorCode`s in errorCodes.ts — a warning means "here is text, but
 * treat it with some suspicion"; an error means "there is no usable text
 * to return at all."
 */
export type ParserWarningCode =
  | "MULTI_COLUMN_ORDER_UNCERTAIN"
  | "STRUCTURE_UNCERTAIN_TABLE_LAYOUT"
  | "HEADER_FOOTER_REPETITION_DETECTED"
  | "SHORT_DOCUMENT"
  | "PAGE_LIMIT_TRUNCATED"
  | "CHAR_LIMIT_TRUNCATED"
  | "PAGE_EXTRACTION_FAILED";

export interface ParsedResumeMetadata {
  /** Never a filesystem/storage path, never PII — only counts and flags relevant to reproducing the parse. */
  paragraphCount?: number;
  tableCount?: number;
  hyphenationFixCount?: number;
  headerFooterLinesRemoved?: number;
}

/**
 * The normalized document model (§15). This is the ONLY shape a parser
 * backend returns to a caller on success — never raw bytes, never a
 * storage path, never platform-specific extraction internals.
 */
export interface ParsedResume {
  parserVersion: string;
  sourceFormat: SourceFormat;
  /** Present only in fixture/dev contexts for traceability — never persisted alongside customer data, never logged (safeLog.ts has no field for it). */
  sourceFilename?: string;

  text: string;

  characterCount: number;
  pageCount?: number;

  extractionQuality: ExtractionQuality;
  warnings: ParserWarningCode[];

  detectedLanguage?: "ar" | "en" | "bilingual" | "uncertain";

  /** True when section/table structure could not be confidently read — the analysis engine's structure.ts already knows how to handle this (§11). */
  structureUncertain: boolean;

  metadata: ParsedResumeMetadata;
}

export type ParserErrorCode =
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE"
  | "FILE_CORRUPTED"
  | "FILE_ENCRYPTED"
  | "PDF_NO_EXTRACTABLE_TEXT"
  | "SCAN_REQUIRES_TEXT_PDF"
  | "PARSE_FAILED"
  | "PARSE_TIMEOUT";

export type ParseResult = { ok: true; resume: ParsedResume } | { ok: false; code: ParserErrorCode };

/**
 * The parser's actual input. Deliberately just bytes + what the caller
 * *claims* the file is — §4 requires validating those claims against the
 * real content, never trusting them. There is no `url` field anywhere in
 * this type, and there must never be one (§6, §25: no SSRF surface).
 */
export interface ParseFileInput {
  bytes: Uint8Array;
  declaredFilename: string;
  declaredMimeType: string;
}
