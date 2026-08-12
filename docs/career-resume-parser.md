# Career Resume Parser (Command 05B)

Status: **fixture-mode only**. `PRIVACY_SECURITY_EXECUTION_VERIFIED` (see
`supabase/functions/_shared/releaseGates.ts`) is still `false`. This
document describes the FILE → NORMALIZED TEXT boundary in front of the
Command 05 Career Analysis Engine (`docs/career-analysis-engine.md`). It
does not make the scanner public, does not add a `/career` UI, and does
not change the release gate.

```
PRIVATE RESUME FILE
  → FILE VALIDATION        (fileValidation.ts)
  → TEXT EXTRACTION         (pdfExtract.ts / docxExtract.ts)
  → NORMALIZATION           (normalize.ts)
  → PARSED RESUME           (types.ts: ParsedResume)
  ───────────────────────────────────────────────────
  → Command 05 preprocessing (preprocessResumeText, redactContactFields)
  → STRUCTURE EXTRACTION     (structure.ts)
  → CAREER ANALYSIS ENGINE   (unchanged, still the sole scoring authority)
```

Everything above the line is this command. Everything below it is
Command 05, unmodified in shape — this command only strengthens two of
its stages (contact redaction, fact-conflict detection) because real
parser output, not just hand-typed fixtures, now feeds them.

## Supported formats

MVP: **PDF** and **DOCX** only. Anything else — images, RTF, Pages,
`.zip`, Google Docs exports — returns `UNSUPPORTED_FILE`. No OCR in v1.

## File validation (`fileValidation.ts`)

Three independent signals must all agree before parsing begins — the
filename extension is never trusted alone, and neither is a
browser-declared MIME type:

1. **Extension** — `.pdf` or `.docx`, nothing else.
2. **Magic bytes** — `%PDF-` for PDF, `PK\x03\x04` for DOCX (a zip
   container).
3. **Declared MIME type** — checked against an allowlist per format, but
   only enforced when present (some upload paths omit it); a *present but
   wrong* MIME is still rejected.

A mismatch anywhere — e.g. `resume.pdf` whose bytes don't start with
`%PDF-`, or real DOCX bytes renamed to a `.pdf` extension — is rejected
outright as `INVALID_FILE`. Size is checked first, against
`PARSER_LIMITS` (`limits.ts`), the single place every parser number
lives:

| Limit | Value | Why |
|---|---|---|
| `maxFileBytes` | 8 MiB | Below the 20 MiB storage bucket ceiling on purpose — a real resume is never near it; a file this large is more likely misuse than a CV. |
| `minFileBytes` | 200 B | Too small to be a useful document. |
| `maxPages` | 12 | PDF page-read cap. |
| `maxExtractedChars` | 200,000 | Ceiling on extracted text, across the whole document. |
| `maxZipEntryDecompressedBytes` / `maxZipTotalDecompressedBytes` | 20 MiB / 40 MiB | Zip-bomb guard (only reachable indirectly now — see PDF/DOCX extraction below). |
| `parseTimeoutMs` | 15 s | Whole-parse wall-clock budget. |
| `minExtractableChars` | 40 | Below this, a PDF is "no usable text," not "a very short resume." |

## PDF extraction (`pdfExtract.ts`)

**A hand-rolled PDF object/xref/content-stream reader was built, tested,
and then thrown away** in favor of
[`pdfjs-dist`](https://github.com/mozilla/pdf.js) (Mozilla PDF.js,
Apache-2.0, pinned at `4.10.38` in `package.json`), per an explicit
correction during this command's build: PDF syntax (cross-reference
tables, incremental updates, object streams, font encodings/cmaps) is too
large a surface for a small bespoke parser to safely support real-world
resumes. This module wraps `pdfjs-dist`'s `legacy/build/pdf.mjs` entry
point (the non-browser build) and uses **only** `getTextContent()` — no
rendering, no canvas, no worker thread, no OCR.

- **Pages read**: capped at `PARSER_LIMITS.maxPages`; excess pages produce
  a `PAGE_LIMIT_TRUNCATED` warning rather than being silently dropped
  with no signal.
- **Encryption**: detected two ways — a fast pre-parse scan for an
  `/Encrypt` trailer token (catches the common case before any parse
  effort is spent), and a `PasswordException`/`"password"`-message catch
  around `getDocument()` as a fallback. Returns `FILE_ENCRYPTED`. This is
  "where detectable" (§8), not a promise to catch every encrypted PDF
  variant (e.g. an owner-password-only PDF with no open password parses
  fine and is let through, correctly — it isn't actually protected).
- **Corruption**: anything that isn't a valid PDF object graph — a
  missing/garbled header, zero pages, a `getDocument()` rejection with no
  password signal — returns `FILE_CORRUPTED`.
- **No/low text**: if a page has zero text-showing output AND its
  operator list contains an image-paint op (`paintImageXObject` and
  friends), the whole document returns `SCAN_REQUIRES_TEXT_PDF` — never
  silently "succeeds" with empty text. If there's some text but it's
  under `minExtractableChars`, `PDF_NO_EXTRACTABLE_TEXT`. **No OCR is
  triggered either way** — that's intentionally out of scope for v1 and
  documented, not attempted.
- **Reading order / multi-column**: text items are joined using
  `pdfjs`'s per-item `y` transform. A line-break is inserted whenever `y`
  moves down normally; if `y` ever moves *up* mid-stream (not normal
  top-to-bottom flow), that's flagged as `MULTI_COLUMN_ORDER_UNCERTAIN`
  and downgrades `extractionQuality` to `medium` — never silently
  presented as a clean single-column read.
- **Header/footer repetition**: handled one layer up, in `normalize.ts`
  (below) — PDF extraction just hands over the raw per-page text.

### Known limitation: Arabic/RTL text order

PDF content streams place RTL glyphs in **visual** order. During
development, this project's own hand-built Arabic fixture showed PDF.js's
text layer (like most PDF text-layer extractors) reading Arabic runs back
out **character-reversed within each contiguous run** — word order along
a line is preserved, only the letters *within* each run come out
backwards. `pdfExtract.ts` applies a best-effort fix
(`reverseArabicRuns`): every maximal run of Arabic-block characters is
reversed, which recovers correct logical order for the common case. This
is **not a full Unicode Bidi Algorithm implementation** — a line that
interleaves Arabic and embedded Latin/digit runs in unusual ways may
still extract imperfectly. DOCX does not need this fix: `word/document.xml`
stores paragraph runs in logical order already (Word/Office authors it
that way), verified against an Arabic DOCX fixture during development.

### Known limitation: cross-reference compliance

`pdfjs-dist` handles the full PDF spec (xref tables, xref streams,
incremental updates, object streams) — this module does not reimplement
any of that; it delegates entirely. The limitation that remains is
`pdfjs-dist` itself, not this wrapper: a PDF the library can't parse
returns `FILE_CORRUPTED` here, same as a genuinely malformed file.

## DOCX extraction (`docxExtract.ts`)

Same correction as PDF: a hand-rolled zip reader + OOXML walker was tried
and dropped in favor of
[`mammoth`](https://github.com/mwilliamson/mammoth.js) (MIT, pinned at
`1.12.1`), a small, established DOCX→HTML converter that already handles
the zip container, namespaces, styles, numbering, and malformed-package
edge cases correctly. `docxExtract.ts` is the **small, well-scoped
structural layer on top of it** the correction asked for: it walks
mammoth's clean output HTML (`<h1>`–`<h6>`, `<p>`, `<li>`, `<table>`) into
the plain-text-with-`- `-bullet shape `structure.ts` (Command 05) already
expects, processing the HTML left-to-right so **tables land in their real
reading-order position**, not appended at the end. Raw OOXML/HTML is
never exposed downstream — every tag is stripped to text before this
module returns anything.

- **Malformed package**: not a valid zip, or a zip missing a real
  `word/document.xml` (mammoth throws or returns empty) → `FILE_CORRUPTED`.
- **Tables**: extracted as `cell | cell | cell` lines. A small
  contact-info table alongside normal paragraph sections is common and
  does **not** trip anything. `structureUncertain = true` (plus a
  `STRUCTURE_UNCERTAIN_TABLE_LAYOUT` warning) only when table content
  makes up more than 30% of the extracted text — i.e. the layout is
  genuinely table-dominated, the case `structure.ts` needs to know about.
- **Bullets**: mammoth needs a real `numbering.xml` part to know a
  `numPr`-tagged paragraph is a bullet (real Word documents always have
  one; this project's own synthetic fixtures include a minimal one for
  the same reason). Without it, the paragraph still extracts as plain
  text — no content is lost, just the `- ` bullet marker.

## Runtime wiring: Deno vs. Node

Both `pdfExtract.ts` and `docxExtract.ts` import `mammoth` /
`pdfjs-dist/legacy/build/pdf.mjs` as **bare specifiers**, resolved
differently per runtime, on purpose — so the exact same `.ts` source
compiles and runs both places:

- **Node** (this repo's test harness, `npm run test:parser`): resolves to
  this repo's own `node_modules/mammoth` and `node_modules/pdfjs-dist`
  (`package.json`, pinned exact versions).
- **Deno** (the eventual `parse-resume` Edge Function): resolved via
  `supabase/functions/parse-resume/deno.json`'s import map to
  `npm:mammoth@1.12.1` and `npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs` —
  Deno 2's standard per-function import-map mechanism (Supabase's
  documented pattern for using npm packages in Edge Functions).

**Verification status**: end-to-end correctness (all 16 synthetic
fixtures, 80 assertions — §27/§28) was verified under Node, the closest
available runtime in this environment — there is no local Docker/Deno
Edge Runtime here, the same limitation already recorded for the
privacy/RLS suite in `releaseGates.ts`. **The Deno import-map path itself
has not yet been executed against a real Supabase Edge Runtime.** Before
the first real deploy of `parse-resume`, someone with a working
`supabase functions serve` (or hosted dev project) should run a fixture
request against it and confirm the import map resolves and both
libraries behave identically to the Node results recorded here. If it
turns out either library can't run under Deno's Edge Runtime as
configured, the fallback is (A) a smaller compatible parser for the
affected format, or (B) moving PDF/DOCX parsing to a dedicated
long-running service invoked by the Edge Function rather than run inline
— not a silent revert to a hand-rolled parser.

## Normalization (`normalize.ts`)

Runs on raw extracted text, before Command 05's own
`preprocessResumeText` (which only normalizes whitespace/bullet-glyph
shape). Two FILE-extraction-specific artifacts, both conservative:

- **Header/footer de-duplication**: a short line (≤80 chars) that repeats
  verbatim as the first or last non-blank line of at least 3 of the
  document's pages is treated as a running header/footer. The **first**
  occurrence is kept (it usually carries real information — the
  candidate's name); repeats are stripped. A `HEADER_FOOTER_REPETITION_DETECTED`
  warning records that this happened. Anything appearing fewer than 3
  times, or longer than 80 chars, is left completely alone — per §13,
  "if uncertain, preserve it."
- **Hyphenation from PDF line-wrapping**: `exam-\nple` → `example`, only
  when the pattern is unambiguous (lowercase letter, hyphen, newline,
  lowercase letter). Never touches a real compound word that happens to
  end a line without a mid-word break.

Neither transformation rewrites wording — both are shape-only.

## Language handling (`language.ts`)

A cheap Unicode-range heuristic (Arabic-block character share vs.
Latin-letter share) producing `ar` / `en` / `bilingual` / `uncertain`.
**Advisory only** — this is not the methodology engine's language model
(`_shared/methodology/language.ts`), which stays authoritative for how a
CV is actually evaluated. Bilingual documents are never rejected.

## Contact redaction (strengthened: `analysis/redact.ts`)

Command 05's existing redaction now runs on real parser output, so it was
strengthened rather than left as-is:

- **Phone numbers**: the digit-group pattern now goes down to
  single-digit groups (not just 2–4), and accepts a `00` international
  dial prefix alongside `+`, so a Saudi mobile written
  `+966 5 0000 0000` (operator digit isolated) redacts in full instead of
  leaving `+966 5` exposed. Still gated on ≥7 digits total, so short
  numeric tokens (years, percentages, team sizes, page numbers) are never
  touched — this is the same safety property the original design had,
  just applied to a wider phone-shape.
- **P.O. Box lines**: a new, narrow, high-precision addition — a line
  containing "P.O. Box"/"PO Box"/"ص.ب" is redacted in full. This phrase
  essentially never appears in a CV for any reason other than a mailing
  address, so it's safe to redact without the false-positive risk a
  general street-address pattern would carry.
- **Still out of scope**: general street addresses (city names, building
  numbers) remain unredacted — no reliable EN+AR pattern exists that
  wouldn't also catch company/project locations. Documented, not solved
  quietly.

## Fact-conflict detection (broadened: `analysis/factCheck.ts`)

Was percentage-only; now also covers **currency/revenue amounts** and
**user/customer/team counts**, reusing the exact same right-anchored
"same immediately-preceding words = same underlying fact" grouping that
kept the original percentage detector's false-positive rate low. Dates
and durations were deliberately **not** added — a CV legitimately repeats
similar-looking date fragments across many unrelated roles far more often
than it repeats the same metric phrase, so broadening there would trade
away the conservative behavior §18 itself asks for ("if confidence is
insufficient: do nothing").

## Security boundaries

- **No URL ingestion, ever.** `ParseFileInput` has no `url` field. The
  conceptual production interface is `{ resumeId }` (§21) — authenticate,
  load the `resumes` row, verify `user_id = auth.uid()`, read the private
  `career-resumes` Storage object at its `storage_path`. None of that
  exists yet; building it is explicitly out of scope for this command.
- **Zip-bomb / decompression limits**: `PARSER_LIMITS.maxZipEntryDecompressedBytes`
  / `maxZipTotalDecompressedBytes` exist for defense in depth even though
  `mammoth`/`jszip` already guard against unbounded decompression
  themselves — belt and suspenders, not a redundant reimplementation.
- **Timeouts**: `parseResumeFile` wraps the whole parse in
  `PARSER_LIMITS.parseTimeoutMs` — a malformed file that hangs a library
  internally still fails as `PARSE_TIMEOUT`, not an unbounded hang.
- **No AI credentials, no privileged Supabase keys** anywhere in this
  module or in `parse-resume/index.ts` — the function's only secret is
  `ADMIN_API_KEY`, the same one `analyze-resume` and `verify-payment`
  already use.
- **Fixture mode has no bypass surface**: `parse-resume/index.ts` accepts
  exactly `{ mode: "fixture_test", fixtureName }`, where `fixtureName`
  must be a key of a small, code-defined allowlist
  (`BUNDLED_FIXTURES` in `fixtures.ts`) — not a path, not a URL. There is
  no query-parameter or environment-variable bypass to a "real customer"
  code path, because that path does not exist in this file at all.

## Error model

Extends Command 05's `SafeErrorCode` vocabulary (`errorCodes.ts`) with:
`FILE_CORRUPTED`, `FILE_ENCRYPTED`, `PDF_NO_EXTRACTABLE_TEXT`,
`SCAN_REQUIRES_TEXT_PDF`, `PARSE_FAILED`, `PARSE_TIMEOUT` — alongside the
existing `INVALID_FILE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE`,
`NOT_AUTHORIZED`, `NOT_FOUND`. Every code maps to a short, static,
public-safe message; no stack trace, storage path, or library internals
are ever exposed to a caller (`safeError()` is the only way
`parse-resume/index.ts` builds an error body).

## Logging

`safeLog.ts`'s allowlist gained four parser-relevant fields —
`parser_version`, `format`, `character_count`, `warning_codes` — all
counts/codes, never content. There is no field on `SafeLogFields` a
caller could pass raw resume text through even by accident.

## Versioning

`RESUME_PARSER_VERSION = "resume_parser_v1"` (`version.ts`), carried on
every `ParsedResume`. Distinct from `ANALYSIS_PIPELINE_VERSION`,
`CAREER_METHODOLOGY_VERSION`, and `OPERATOR_CV_INGESTION_VERSION` — the
four together let a future persisted analysis record exactly which
parser, pipeline, methodology, and knowledge produced it (§19, §39). By
design (§20 — parser and analysis stay separate modules), this module
does not reach into `AnalysisEngineMetadata` to attach itself; a future
persistence layer combines `ParsedResume.parserVersion` with
`AnalysisRunResult.engineMetadata` when writing a `resume_analyses` row.

## Test coverage

`npm run test:parser` — 16 synthetic fixtures
(`supabase/tests/parser/fixtures/`, regenerated with
`node scripts/generate-parser-fixtures.mjs`), 80 assertions, covering
§27's A–M plus the §28 end-to-end run (parser → Command 05
`validateAnalyzeResumeRequest` → mock-provider `runAnalysis` →
`scoring.ts`). Every fixture describes a fictional person
("Test User Alpha", `alpha@example.test`, `+1 555 010 0100`) — no real
CV, no customer data, no operator CV content, per §7's hard rule.

Fixture list: `pdf_normal_en`, `pdf_normal_ar`, `pdf_bilingual`,
`pdf_multipage`, `docx_normal_en`, `docx_normal_ar`, `docx_table_layout`,
`docx_table_dominant`, `docx_weak_short`, `wrong_extension` (real DOCX
bytes, `.pdf` name), `fake` (plain text disguised as PDF), `corrupted`,
`scanned_image_only`, `pdf_header_footer_repeat`,
`pdf_multicolumn_uncertain`, `encrypted_stub`. The oversized-file case is
generated in-memory by the test harness itself (an 8 MiB+ buffer), not
committed as a binary fixture.

## Release gate

`PRIVACY_SECURITY_EXECUTION_VERIFIED` remains `false`. `parse-resume`
mirrors `analyze-resume` exactly: admin-key-gated, `fixture_test`-mode
only, no code path that reaches real customer storage exists to be
bypassed. Flipping the gate is unchanged from Command 05's own
requirement — the A–H/K privacy/RLS suite must actually execute against a
real stack, and a human must make that call; this command does not touch
`releaseGates.ts`.

## What's ready next

- **Deno-runtime verification** of the `mammoth`/`pdfjs-dist` import-map
  path (see "Runtime wiring" above) — the one open item before
  `parse-resume` could be deployed for real.
- The `{ resumeId } → resumes row → private Storage object → parse` flow
  (§21) — still intentionally unbuilt.
- Wiring `ParsedResume` output into Command 05's `redactContactFields` /
  `extractNormalizedResume` in one real call path (today they're proven
  compatible via the harness, not yet connected in a live function).
- The `/career` upload UI — explicitly out of scope for this command.
