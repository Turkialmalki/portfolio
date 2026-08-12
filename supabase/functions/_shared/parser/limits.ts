/**
 * CENTRALIZED PARSER LIMITS (Command 05B §5, §24, §25).
 *
 * Every number that bounds parser behavior lives here — nowhere else in
 * the parser should a magic number for size/time/count appear. This is
 * deliberately SEPARATE from the storage bucket's 20 MiB ceiling
 * (`career-resumes`, `supabase/migrations/20260812000001_career_core.sql`):
 * the bucket limit is what Storage will physically accept; these limits
 * are what the PARSER is willing to spend effort on, and are tighter,
 * because a real resume is never anywhere near 20 MiB.
 */
export const PARSER_LIMITS = {
  /**
   * Hard ceiling on file bytes the parser will attempt to read at all.
   * Below the 20 MiB storage bucket ceiling on purpose — a legitimate
   * resume PDF/DOCX is realistically a few hundred KB to a few MB; a file
   * near the storage ceiling is far more likely to be misuse than a CV.
   */
  maxFileBytes: 8 * 1024 * 1024, // 8 MiB

  /** A file this small cannot be a useful resume — reject before parsing. */
  minFileBytes: 200,

  /** Hard ceiling on pages the parser will walk for a PDF. */
  maxPages: 12,

  /** Hard ceiling on characters the parser will extract, across the whole document. Guards against decompression/content-stream abuse inflating output. */
  maxExtractedChars: 200_000,

  /** Per-entry and total decompressed-size ceilings for the DOCX zip reader (§25: no unbounded "zip bomb" decompression). */
  maxZipEntryDecompressedBytes: 20 * 1024 * 1024, // 20 MiB per entry
  maxZipTotalDecompressedBytes: 40 * 1024 * 1024, // 40 MiB across the archive
  maxZipEntryCount: 2_000,

  /** Wall-clock budget for one parse call, end to end. A malformed file must fail fast, not hang the caller. */
  parseTimeoutMs: 15_000,

  /**
   * Below this many extracted, non-whitespace characters, a PDF is treated
   * as having essentially no usable text (§8–§9: `PDF_NO_EXTRACTABLE_TEXT`
   * / `SCAN_REQUIRES_TEXT_PDF`), not as a very short resume.
   */
  minExtractableChars: 40,

  /** Below this, the analysis engine's own `resumeTextMin` (validateRequest.ts) would reject anyway — used here only to pick extractionQuality, never to block extraction itself. */
  weakButUsableChars: 200,
} as const;
