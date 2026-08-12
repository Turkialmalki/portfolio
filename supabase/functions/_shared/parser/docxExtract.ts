/**
 * DOCX TEXT EXTRACTION (Command 05B §10, §11).
 *
 * DOCX is an Office Open XML package (a zip of XML parts with a real,
 * non-trivial schema). Hand-rolling a zip reader + OOXML walker was tried
 * and dropped in favor of `mammoth` (https://github.com/mwilliamson/mammoth.js,
 * MIT, ~2.5 MB installed, pinned in package.json) — a small, established,
 * dependency-light DOCX→HTML converter that already handles the zip
 * container, namespaces, styles, numbering, and malformed-package edge
 * cases correctly. This module is the SMALL, well-scoped structural layer
 * on top of it (§ "if the selected library cannot preserve enough
 * structure, use the library for safe extraction and add a small layer"):
 * it walks mammoth's clean output HTML — `<h1>`–`<h6>`, `<p>`, `<li>`,
 * `<table>` — into the plain-text-with-`- `-bullets shape
 * `structure.ts` (Command 05) already expects, and never hands raw
 * OOXML or raw HTML downstream (§10).
 *
 * Runtime note: verified end-to-end under this repo's Node test harness
 * (`npm run test:parser`) — the same "closest available runtime" caveat
 * already recorded for the privacy/RLS suite in releaseGates.ts applies
 * here too, since this environment has no local Docker/Deno Edge Runtime
 * to run the actual `parse-resume` function against. Deployment wires
 * `mammoth` via the Deno import map at
 * `supabase/functions/parse-resume/deno.json` (`npm:mammoth@1.12.1`) —
 * see docs/career-resume-parser.md for the verification status this
 * leaves open before the first real deploy.
 */
import { Buffer } from "node:buffer";
import type { ParserErrorCode } from "./types.ts";

export interface DocxExtractionResult {
  ok: true;
  text: string;
  paragraphCount: number;
  tableCount: number;
  structureUncertain: boolean;
}
export type DocxExtractionOutcome = DocxExtractionResult | { ok: false; code: ParserErrorCode };

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent: string) => {
    if (ent[0] === "#") {
      const codePoint = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : m;
      } catch {
        return m;
      }
    }
    return XML_ENTITIES[ent] ?? m;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "));
}

const BLOCK_RE = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;

function blockLines(segmentHtml: string): { lines: string[]; paragraphCount: number } {
  const lines: string[] = [];
  let paragraphCount = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(BLOCK_RE);
  while ((m = re.exec(segmentHtml)) !== null) {
    const tag = m[1].toLowerCase();
    const text = stripTags(m[2]).replace(/\s+/g, " ").trim();
    if (text.length === 0) {
      lines.push(""); // preserves intentional blank-line spacing
      continue;
    }
    paragraphCount += 1;
    lines.push(tag === "li" ? `- ${text}` : text);
  }
  return { lines, paragraphCount };
}

const TABLE_RE = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
const ROW_RE = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;
const CELL_RE = /<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi;

function tableLines(tableHtml: string): string[] {
  const rows = tableHtml.match(ROW_RE) ?? [];
  const lines: string[] = [];
  for (const row of rows) {
    const cells = row.match(CELL_RE) ?? [];
    const cellTexts = cells.map((c) => stripTags(c).replace(/\s+/g, " ").trim()).filter(Boolean);
    if (cellTexts.length > 0) lines.push(cellTexts.join(" | "));
  }
  return lines;
}

/** Walks the HTML left-to-right so tables come out in their real reading-order position, not appended at the end (§11: preserve reading order). */
function htmlToStructuredLines(html: string): { lines: string[]; paragraphCount: number; tableCount: number; tableCharCount: number } {
  const lines: string[] = [];
  let paragraphCount = 0;
  let tableCount = 0;
  let tableCharCount = 0;

  let lastIndex = 0;
  const tblRe = new RegExp(TABLE_RE);
  let m: RegExpExecArray | null;
  while ((m = tblRe.exec(html)) !== null) {
    const before = blockLines(html.slice(lastIndex, m.index));
    lines.push(...before.lines);
    paragraphCount += before.paragraphCount;

    const tLines = tableLines(m[0]);
    tableCount += 1;
    tableCharCount += tLines.join("\n").length;
    lines.push(...tLines);

    lastIndex = tblRe.lastIndex;
  }
  const rest = blockLines(html.slice(lastIndex));
  lines.push(...rest.lines);
  paragraphCount += rest.paragraphCount;

  return { lines, paragraphCount, tableCount, tableCharCount };
}

export async function extractDocx(bytes: Uint8Array): Promise<DocxExtractionOutcome> {
  let html: string;
  try {
    // Bare specifier — resolved to `npm:mammoth@1.12.1` for the Deno Edge
    // Function via the function's import map, and to the installed
    // `node_modules/mammoth` for the Node test harness. Dynamic `import()`
    // (not a static import) so this module keeps compiling cleanly under
    // the harness's CommonJS output regardless of mammoth's own module
    // format.
    const mammoth = (await import("mammoth")) as {
      convertToHtml(input: { buffer: Buffer }): Promise<{ value: string; messages: unknown[] }>;
    };
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    html = result.value;
  } catch {
    return { ok: false, code: "FILE_CORRUPTED" }; // not a valid zip, or not a docx-shaped package
  }

  if (html.trim().length === 0) return { ok: false, code: "FILE_CORRUPTED" };

  const { lines, paragraphCount, tableCount, tableCharCount } = htmlToStructuredLines(html);
  const text = lines.join("\n");

  // Conservative: only flag uncertain structure when tables dominate the
  // document's content — a small contact-info table alongside normal
  // paragraph sections is common and should not trigger this (§11).
  const structureUncertain = tableCount > 0 && text.length > 0 && tableCharCount / text.length > 0.3;

  return { ok: true, text, paragraphCount, tableCount, structureUncertain };
}
