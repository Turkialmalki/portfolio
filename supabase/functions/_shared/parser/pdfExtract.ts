/**
 * PDF TEXT EXTRACTION (Command 05B §8, §9, §14).
 *
 * A hand-rolled PDF object/xref/content-stream reader was tried first and
 * dropped: PDF syntax (cross-reference tables and streams, incremental
 * updates, object streams, font encodings/cmaps) is too large a surface
 * for a small bespoke parser to safely support real-world resumes. This
 * module instead wraps `pdfjs-dist` (Mozilla's PDF.js,
 * https://github.com/mozilla/pdf.js, Apache-2.0, pinned in package.json)
 * using its `legacy/build/pdf.mjs` entry point — the build meant for
 * non-browser environments — via `getTextContent()` only. No rendering,
 * no canvas, no worker thread, no OCR: exactly the "pages → text items →
 * normalized text" shape this command asks for.
 *
 * Runtime note: verified end-to-end under this repo's Node test harness
 * (`npm run test:parser`) — the same "closest available runtime" caveat
 * already recorded for the privacy/RLS suite in releaseGates.ts applies
 * here too, since this environment has no local Docker/Deno Edge Runtime
 * to run the actual `parse-resume` function against. Deployment wires
 * `pdfjs-dist` via the Deno import map at
 * `supabase/functions/parse-resume/deno.json`
 * (`npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs`) — see
 * docs/career-resume-parser.md for the verification status this leaves
 * open before the first real deploy.
 *
 * Text decoding, font encodings, and glyph-to-Unicode mapping are all
 * PDF.js's problem, not this module's — which is the whole point of not
 * hand-rolling it.
 */
import { PARSER_LIMITS } from "./limits.ts";
import type { ParserErrorCode, ParserWarningCode } from "./types.ts";

export interface PdfExtractionResult {
  ok: true;
  text: string;
  pageCount: number;
  warnings: ParserWarningCode[];
}
export type PdfExtractionOutcome = PdfExtractionResult | { ok: false; code: ParserErrorCode };

interface PdfjsTextItem {
  str: string;
  hasEOL?: boolean;
  transform: number[]; // [a, b, c, d, e, f] — e/f are the x/y of this glyph run
}
interface PdfjsModule {
  getDocument(params: Record<string, unknown>): { promise: Promise<PdfjsDocument> };
  OPS: Record<string, number>;
}
interface PdfjsDocument {
  numPages: number;
  getPage(n: number): Promise<PdfjsPage>;
  destroy(): Promise<void>;
}
interface PdfjsPage {
  getTextContent(): Promise<{ items: PdfjsTextItem[] }>;
  getOperatorList(): Promise<{ fnArray: number[] }>;
}

async function loadPdfjs(): Promise<PdfjsModule> {
  // Bare specifier — see the module doc comment for how each runtime resolves it.
  return (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfjsModule;
}

const Y_LINE_BREAK_TOLERANCE = 2; // pdf user-space units; below this, treat as "same line"

// Arabic (+ Arabic Presentation Forms) code point ranges.
const ARABIC_RUN_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g;

/**
 * PDF content streams place RTL glyphs in VISUAL order, and this parser
 * (like most text-layer extractors, PDF.js included — confirmed against
 * this project's own hand-built Arabic fixture during development) reads
 * runs back out character-by-character, which comes out
 * character-reversed within each contiguous Arabic run relative to
 * logical reading order (word order along the line is unaffected — only
 * the letters *within* each run are reversed). Reversing each maximal
 * Arabic-script run recovers logical order for the common case. This is
 * a best-effort heuristic, not a full Unicode Bidi Algorithm
 * implementation: a line that interleaves Arabic and embedded
 * Latin/digit runs in unusual ways may still extract imperfectly — a
 * documented limitation (docs/career-resume-parser.md), not a silent
 * guess. DOCX does not need this — `word/document.xml` stores paragraph
 * runs in logical order already (verified with an Arabic DOCX fixture),
 * so `docxExtract.ts` never calls this.
 */
function reverseArabicRuns(text: string): string {
  return text.replace(ARABIC_RUN_RE, (run) => Array.from(run).reverse().join(""));
}

export async function extractPdf(bytes: Uint8Array): Promise<PdfExtractionOutcome> {
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 5));
  if (header !== "%PDF-") return { ok: false, code: "FILE_CORRUPTED" };

  // §8: detect an encryption dictionary before spending any parse effort —
  // a cheap, reliable signal for the common case (open-password-protected
  // PDFs) without needing this module to implement PDF decryption.
  const wholeFileLatin1 = new TextDecoder("latin1").decode(bytes);
  if (/\/Encrypt\b/.test(wholeFileLatin1)) return { ok: false, code: "FILE_ENCRYPTED" };

  const pdfjs = await loadPdfjs();

  let doc: PdfjsDocument;
  try {
    doc = await pdfjs.getDocument({
      data: bytes,
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: false,
      verbosity: 0,
    }).promise;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    const message = err instanceof Error ? err.message : String(err);
    if (name === "PasswordException" || /password/i.test(message)) return { ok: false, code: "FILE_ENCRYPTED" };
    return { ok: false, code: "FILE_CORRUPTED" };
  }

  try {
    const warnings: ParserWarningCode[] = [];
    const truePageCount = doc.numPages;
    if (truePageCount === 0) return { ok: false, code: "FILE_CORRUPTED" };
    const pagesToRead = Math.min(truePageCount, PARSER_LIMITS.maxPages);
    if (truePageCount > PARSER_LIMITS.maxPages) warnings.push("PAGE_LIMIT_TRUNCATED");

    let combinedText = "";
    let anyImageOnlyPage = false;
    let columnUncertain = false;
    let truncated = false;

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      let pageText = "";
      let lastY: number | null = null;
      for (const item of content.items) {
        const y = item.transform[5];
        if (lastY !== null) {
          const dy = lastY - y; // positive = moved down the page (normal top-to-bottom flow)
          if (dy > Y_LINE_BREAK_TOLERANCE) {
            pageText += "\n";
          } else if (dy < -Y_LINE_BREAK_TOLERANCE) {
            // Jumped UP the page mid-stream — not normal reading order for
            // a single column; a strong signal of multi-column text
            // interleaved by PDF.js's stream order (§14).
            columnUncertain = true;
            pageText += "\n";
          }
        }
        pageText += item.str;
        if (item.hasEOL) pageText += "\n";
        lastY = y;
      }
      pageText = pageText.trim();

      if (pageText.length === 0) {
        const ops = await page.getOperatorList();
        const imageOps = [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintInlineImageXObject];
        if (ops.fnArray.some((fn) => imageOps.includes(fn))) anyImageOnlyPage = true;
      }

      combinedText += (combinedText.length > 0 ? "\n\n" : "") + pageText;
      if (combinedText.length > PARSER_LIMITS.maxExtractedChars) {
        combinedText = combinedText.slice(0, PARSER_LIMITS.maxExtractedChars);
        truncated = true;
        break;
      }
    }
    if (truncated) warnings.push("CHAR_LIMIT_TRUNCATED");

    const nonWhitespaceCount = combinedText.replace(/\s/g, "").length;

    if (nonWhitespaceCount === 0 && anyImageOnlyPage) return { ok: false, code: "SCAN_REQUIRES_TEXT_PDF" };
    if (nonWhitespaceCount < PARSER_LIMITS.minExtractableChars) return { ok: false, code: "PDF_NO_EXTRACTABLE_TEXT" };

    if (columnUncertain) warnings.push("MULTI_COLUMN_ORDER_UNCERTAIN");

    return { ok: true, text: reverseArabicRuns(combinedText.trim()), pageCount: pagesToRead, warnings };
  } finally {
    await doc.destroy();
  }
}
