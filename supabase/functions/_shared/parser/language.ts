/**
 * PARSER-STAGE LANGUAGE DETECTION (Command 05B §16).
 *
 * Advisory only — this is a cheap Unicode-range heuristic run on raw
 * extracted text, NOT the methodology engine's language model
 * (`_shared/methodology/language.ts`), which stays authoritative for how
 * a CV is actually evaluated. This just gives the caller (and, later, a
 * default for the user-selected analysis language) a reasonable guess
 * without rejecting bilingual documents (§16: "do not reject bilingual
 * CVs").
 */
import type { ParsedResume } from "./types.ts";

const ARABIC_RE = /[؀-ۿݐ-ݿ]/g;
const LATIN_LETTER_RE = /[A-Za-z]/g;

/** Below this many detected letters (of either script), the sample is too small to call it either way. */
const MIN_LETTERS_FOR_CONFIDENCE = 20;
/** A script under this share of total detected letters is noise, not a real bilingual section. */
const MINOR_SCRIPT_SHARE_THRESHOLD = 0.12;

export function detectLanguage(text: string): NonNullable<ParsedResume["detectedLanguage"]> {
  const arabicCount = text.match(ARABIC_RE)?.length ?? 0;
  const latinCount = text.match(LATIN_LETTER_RE)?.length ?? 0;
  const total = arabicCount + latinCount;

  if (total < MIN_LETTERS_FOR_CONFIDENCE) return "uncertain";

  const arabicShare = arabicCount / total;
  const latinShare = latinCount / total;

  if (arabicShare >= MINOR_SCRIPT_SHARE_THRESHOLD && latinShare >= MINOR_SCRIPT_SHARE_THRESHOLD) return "bilingual";
  if (arabicShare > latinShare) return "ar";
  return "en";
}
