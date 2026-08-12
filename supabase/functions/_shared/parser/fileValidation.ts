/**
 * FILE VALIDATION (Command 05B §3, §4, §5, §25).
 *
 * Never trusts the filename extension or the browser-declared MIME type
 * alone (§4). Every uploaded file must agree on THREE independent signals
 * before parsing begins:
 *   1. extension  (from `declaredFilename`)
 *   2. declared MIME  (from `declaredMimeType`)
 *   3. magic bytes  (read from the actual file content)
 * A mismatch — e.g. `resume.pdf` whose bytes don't start with `%PDF-` —
 * is rejected outright as INVALID_FILE, never "best-guessed" through.
 */
import { PARSER_LIMITS } from "./limits.ts";
import type { ParserErrorCode, SourceFormat } from "./types.ts";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" — DOCX is a zip archive

const ACCEPTED_MIME_BY_FORMAT: Record<SourceFormat, readonly string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Some browsers/OSes mis-declare docx as generic zip or octet-stream —
    // accepted here ONLY if the magic bytes also agree it's a zip archive
    // and the extension also says .docx; never accepted on MIME alone.
    "application/zip",
    "application/octet-stream",
  ],
};

function bytesStartWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
}

function extensionOf(filename: string): string | null {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename.trim());
  return m ? m[1].toLowerCase() : null;
}

function detectFormatFromMagicBytes(bytes: Uint8Array): SourceFormat | null {
  if (bytesStartWith(bytes, PDF_MAGIC)) return "pdf";
  if (bytesStartWith(bytes, ZIP_MAGIC)) return "docx"; // a zip could be anything; further docx-shape checks happen in docx.ts
  return null;
}

export interface FileValidationResult {
  ok: boolean;
  code?: ParserErrorCode;
  format?: SourceFormat;
}

/** Runs every §4/§5/§25 check. Returns the confirmed format only when all three signals agree. */
export function validateFile(bytes: Uint8Array, declaredFilename: string, declaredMimeType: string): FileValidationResult {
  if (bytes.length < PARSER_LIMITS.minFileBytes) return { ok: false, code: "INVALID_FILE" };
  if (bytes.length > PARSER_LIMITS.maxFileBytes) return { ok: false, code: "FILE_TOO_LARGE" };

  const ext = extensionOf(declaredFilename);
  if (ext !== "pdf" && ext !== "docx") return { ok: false, code: "UNSUPPORTED_FILE" };
  const extFormat: SourceFormat = ext;

  const magicFormat = detectFormatFromMagicBytes(bytes);
  if (magicFormat === null) return { ok: false, code: "INVALID_FILE" }; // e.g. resume.pdf containing unrelated binary content (§4 example)
  if (magicFormat !== extFormat) return { ok: false, code: "INVALID_FILE" };

  const mime = declaredMimeType.trim().toLowerCase();
  const acceptedMimes = ACCEPTED_MIME_BY_FORMAT[extFormat];
  // An empty/absent MIME (some upload paths omit it) is tolerated since
  // extension + magic bytes already agree; a PRESENT-but-wrong MIME is not.
  if (mime.length > 0 && !acceptedMimes.includes(mime)) return { ok: false, code: "INVALID_FILE" };

  return { ok: true, format: extFormat };
}
