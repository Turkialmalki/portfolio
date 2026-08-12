/**
 * PARSER ORCHESTRATOR (Command 05B §1, §20, §24).
 *
 * The one function everything else in this module exists to support:
 *
 *   PRIVATE RESUME FILE (bytes)
 *     → FILE VALIDATION        (fileValidation.ts)
 *     → TEXT EXTRACTION        (pdfExtract.ts / docxExtract.ts)
 *     → NORMALIZATION          (normalize.ts)
 *     → PARSED RESUME
 *
 * Deliberately bytes-in/ParsedResume-out and nothing else: no filesystem
 * access, no Supabase Storage client, no knowledge of "fixture mode" vs
 * "real customer mode" (§20 — parser and analysis stay separate modules;
 * by the same logic, "where the bytes came from" stays the CALLER's
 * concern, not this one's). `supabase/functions/parse-resume/index.ts` is
 * the only place that decides where bytes are allowed to come from.
 *
 * The analysis engine's OWN preprocessing (`preprocessResumeText`,
 * `redactContactFields`) still runs on the output of this module — the
 * boundary in Command 05B §0's diagram is FILE → this module's
 * `ParsedResume.text` → those Command 05 stages → `NormalizedResume`.
 * This module does not call them itself, so the two commands' pipelines
 * stay swappable independently (§20: reparse without reanalyzing,
 * reanalyze without reparsing).
 */
import { validateFile } from "./fileValidation.ts";
import { extractPdf } from "./pdfExtract.ts";
import { extractDocx } from "./docxExtract.ts";
import { normalizeExtractedText } from "./normalize.ts";
import { detectLanguage } from "./language.ts";
import { PARSER_LIMITS } from "./limits.ts";
import { RESUME_PARSER_VERSION } from "./version.ts";
import type { ExtractionQuality, ParseFileInput, ParseResult, ParsedResume, ParserWarningCode } from "./types.ts";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("PARSE_TIMEOUT")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function pickExtractionQuality(charCount: number, warnings: ParserWarningCode[], structureUncertain: boolean): ExtractionQuality {
  if (charCount < PARSER_LIMITS.weakButUsableChars) return "low";
  const hasUncertaintyWarning =
    warnings.includes("MULTI_COLUMN_ORDER_UNCERTAIN") ||
    warnings.includes("STRUCTURE_UNCERTAIN_TABLE_LAYOUT") ||
    warnings.includes("PAGE_EXTRACTION_FAILED");
  if (hasUncertaintyWarning || structureUncertain) return "medium";
  return "high";
}

export async function parseResumeFile(input: ParseFileInput, timeoutMs: number = PARSER_LIMITS.parseTimeoutMs): Promise<ParseResult> {
  try {
    return await withTimeout(parseResumeFileInner(input), timeoutMs);
  } catch (err) {
    if (err instanceof Error && err.message === "PARSE_TIMEOUT") return { ok: false, code: "PARSE_TIMEOUT" };
    // Type name only (e.g. "UnknownErrorException") — never err.message,
    // which some libraries embed contextual detail into. See ParseResult's
    // debugErrorName doc comment.
    const debugErrorName = err instanceof Error ? err.constructor.name : typeof err;
    return { ok: false, code: "PARSE_FAILED", debugErrorName };
  }
}

async function parseResumeFileInner(input: ParseFileInput): Promise<ParseResult> {
  const validation = validateFile(input.bytes, input.declaredFilename, input.declaredMimeType);
  if (!validation.ok || !validation.format) return { ok: false, code: validation.code ?? "INVALID_FILE" };

  const format = validation.format;

  let rawText: string;
  let warnings: ParserWarningCode[] = [];
  let structureUncertain = false;
  let pageCount: number | undefined;
  let paragraphCount: number | undefined;
  let tableCount: number | undefined;

  if (format === "pdf") {
    const extraction = await extractPdf(input.bytes);
    if (!extraction.ok) return { ok: false, code: extraction.code };
    rawText = extraction.text;
    warnings = [...extraction.warnings];
    pageCount = extraction.pageCount;
  } else {
    const extraction = await extractDocx(input.bytes);
    if (!extraction.ok) return { ok: false, code: extraction.code };
    rawText = extraction.text;
    structureUncertain = extraction.structureUncertain;
    paragraphCount = extraction.paragraphCount;
    tableCount = extraction.tableCount;
    if (structureUncertain) warnings.push("STRUCTURE_UNCERTAIN_TABLE_LAYOUT");
  }

  const normalized = normalizeExtractedText(rawText);
  if (normalized.headerFooterLinesRemoved > 0) warnings.push("HEADER_FOOTER_REPETITION_DETECTED");

  const characterCount = normalized.text.length;
  if (characterCount < PARSER_LIMITS.weakButUsableChars) warnings.push("SHORT_DOCUMENT");

  const detectedLanguage = detectLanguage(normalized.text);
  const extractionQuality = pickExtractionQuality(characterCount, warnings, structureUncertain);

  const resume: ParsedResume = {
    parserVersion: RESUME_PARSER_VERSION,
    sourceFormat: format,
    text: normalized.text,
    characterCount,
    pageCount,
    extractionQuality,
    warnings,
    detectedLanguage,
    structureUncertain,
    metadata: {
      paragraphCount,
      tableCount,
      hyphenationFixCount: normalized.hyphenationFixCount,
      headerFooterLinesRemoved: normalized.headerFooterLinesRemoved,
    },
  };

  return { ok: true, resume };
}
