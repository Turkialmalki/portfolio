/**
 * PARSER-STAGE NORMALIZATION (Command 05B §12–§14).
 *
 * Runs BEFORE the Command 05 analysis engine's own `preprocessResumeText`
 * (whitespace/bullet-glyph shape only) and handles the two artifacts that
 * are specific to FILE extraction, not to resume text in general:
 *
 *  1. Header/footer repetition — a name, page number, or footer line that
 *     PDF extraction repeats once per page. Conservative on purpose: a
 *     line is only ever removed if it repeats near-verbatim across
 *     multiple page boundaries (§13 — "if uncertain, preserve it").
 *  2. Hyphenation from PDF line-wrapping — "exam-\nple" → "example".
 *     Only collapsed when the pattern is unambiguous: lowercase letter,
 *     hyphen, newline, lowercase letter, with no surrounding whitespace
 *     that would suggest a real compound word broken across lines on
 *     purpose (§12 — never rewrite actual wording).
 *
 * Never rewrites content — every transformation here is shape-only and
 * reversible in principle (the same words, differently joined).
 */

export interface NormalizeOutcome {
  text: string;
  hyphenationFixCount: number;
  headerFooterLinesRemoved: number;
}

const SOFT_HYPHEN_WRAP_RE = /([a-z])-\n([a-z])/g;

function fixHyphenation(text: string): { text: string; count: number } {
  let count = 0;
  const out = text.replace(SOFT_HYPHEN_WRAP_RE, (_m, before: string, after: string) => {
    count += 1;
    return `${before}${after}`;
  });
  return { text: out, count };
}

const PAGE_BREAK_MARKER = "\n\n"; // pdfExtract.ts joins page text with a blank line between pages

/**
 * De-duplicates a line that repeats verbatim as the first or last
 * non-blank line of at least 3 of the document's page-sized chunks, AND
 * is short (page numbers, running headers/footers are never long
 * paragraphs). The FIRST occurrence is always kept — a repeating header
 * usually carries real information (the candidate's name) once; it's the
 * REPETITION across every page that's noise, not the fact itself.
 * Anything appearing fewer times, or on fewer than 3 chunks, is left
 * alone entirely — §13's "if uncertain, preserve it".
 */
function removeRepeatedHeaderFooterLines(text: string): { text: string; removed: number } {
  const pages = text.split(PAGE_BREAK_MARKER);
  if (pages.length < 3) return { text, removed: 0 };

  const firstLineCounts = new Map<string, number>();
  const lastLineCounts = new Map<string, number>();
  for (const page of pages) {
    const lines = page.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const first = lines[0];
    const last = lines[lines.length - 1];
    if (first.length > 0 && first.length <= 80) firstLineCounts.set(first, (firstLineCounts.get(first) ?? 0) + 1);
    if (last.length > 0 && last.length <= 80) lastLineCounts.set(last, (lastLineCounts.get(last) ?? 0) + 1);
  }

  const removableFirst = new Set([...firstLineCounts.entries()].filter(([, n]) => n >= 3).map(([l]) => l));
  const removableLast = new Set([...lastLineCounts.entries()].filter(([, n]) => n >= 3).map(([l]) => l));
  if (removableFirst.size === 0 && removableLast.size === 0) return { text, removed: 0 };

  let removed = 0;
  const seenFirst = new Set<string>();
  const seenLast = new Set<string>();
  const cleanedPages = pages.map((page) => {
    const lines = page.split("\n");
    // Find first/last non-blank line indices within this page chunk.
    let firstIdx = -1;
    let lastIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0) {
        if (firstIdx === -1) firstIdx = i;
        lastIdx = i;
      }
    }
    if (firstIdx !== -1) {
      const key = lines[firstIdx].trim();
      if (removableFirst.has(key)) {
        if (seenFirst.has(key)) {
          lines[firstIdx] = "";
          removed += 1;
        } else {
          seenFirst.add(key);
        }
      }
    }
    if (lastIdx !== -1 && lastIdx !== firstIdx) {
      const key = lines[lastIdx].trim();
      if (removableLast.has(key)) {
        if (seenLast.has(key)) {
          lines[lastIdx] = "";
          removed += 1;
        } else {
          seenLast.add(key);
        }
      }
    }
    return lines.join("\n");
  });

  return { text: cleanedPages.join(PAGE_BREAK_MARKER), removed };
}

export function normalizeExtractedText(rawExtractedText: string): NormalizeOutcome {
  const { text: dedupedText, removed } = removeRepeatedHeaderFooterLines(rawExtractedText);
  const { text: hyphenFixed, count } = fixHyphenation(dedupedText);
  return { text: hyphenFixed, hyphenationFixCount: count, headerFooterLinesRemoved: removed };
}
