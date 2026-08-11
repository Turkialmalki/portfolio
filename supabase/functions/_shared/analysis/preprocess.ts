/**
 * DETERMINISTIC PREPROCESSING (Command 05 §5).
 *
 * Normalizes shape only — never rewrites what the user actually wrote.
 * Wording, dates, company names, titles, metrics, and technologies pass
 * through untouched; only line endings, incidental whitespace, and bullet
 * glyph variants are normalized so the structure extractor (structure.ts)
 * has a consistent surface to parse.
 */

const BULLET_GLYPHS = /^[\s]*[•●◦‣▪◆➤➔→·*]\s*/;

export function preprocessResumeText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Collapse runs of horizontal whitespace, but never touch newlines
  // themselves (they carry section/line structure).
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(BULLET_GLYPHS, "- ").trimEnd())
    .join("\n");

  // Collapse 3+ blank lines to a single blank line — real section breaks
  // never need more than one.
  text = text.replace(/\n{3,}/g, "\n\n");

  // Strip leading/trailing blank lines only.
  return text.replace(/^\n+/, "").replace(/\n+$/, "");
}
