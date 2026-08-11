/**
 * LANGUAGE MODEL (Command 03 §16–17).
 *
 * Arabic and English are evaluated by their OWN professional writing
 * conventions. Arabic is never scored against English norms, different
 * sentence structure is never a deduction (§33), and none of the three
 * real-world cases — Arabic-only, English-only, bilingual — is assumed
 * inherently better. Which is right depends on target market, role, and
 * the user's own preference.
 */
import type { CvLanguage } from "./types.ts";

export interface LanguageGuidance {
  language: "ar" | "en";
  evaluate: string[];
  redFlags: string[];
  /** The register a strong document holds in this language. */
  register: string;
}

export const ENGLISH_GUIDANCE: LanguageGuidance = {
  language: "en",
  evaluate: [
    "clarity",
    "grammar",
    "brevity",
    "verb strength",
    "repetition",
    "buzzwords",
    "sentence structure",
  ],
  redFlags: [
    "buzzword crutches: 'synergy', 'dynamic', 'results-driven', 'passionate'",
    "weak verb + noun constructions ('was responsible for the management of')",
    "every bullet opening with the same verb",
    "sentences that need rereading",
  ],
  register:
    "Plain, confident professional English: verbs carry the sentences, claims are factual, nothing exists to sound impressive.",
};

export const ARABIC_GUIDANCE: LanguageGuidance = {
  language: "ar",
  evaluate: [
    "clarity",
    "professional tone",
    "natural phrasing",
    "unnecessary literal translation",
    "repetition",
    "overly bureaucratic wording",
    "awkward English-to-Arabic structure",
  ],
  redFlags: [
    "English sentence structure transliterated into Arabic (translationese)",
    "government-memo register: 'وذلك بناءً على ما تقدم ذكره أعلاه' and its relatives",
    "excessive slang or casual register in a professional document",
    "English terms forced into Arabic where the Arabic term is standard — or the reverse where the English term IS the industry standard",
  ],
  register:
    "Professional Arabic written by a person: natural, direct, respectful — not a government memo, not slang, and never a sentence-by-sentence translation of an English CV.",
};

export interface CvLanguageCase {
  case: CvLanguage;
  description: string;
  evaluationNote: string;
}

/** §17: three real cases, none inherently better than another. */
export const CV_LANGUAGE_CASES: readonly CvLanguageCase[] = [
  {
    case: "ar",
    description: "Arabic-only CV",
    evaluationNote:
      "Apply ARABIC_GUIDANCE only. Fit depends on target market and role — for many regional employers and public-sector roles this is exactly right.",
  },
  {
    case: "en",
    description: "English-only CV",
    evaluationNote:
      "Apply ENGLISH_GUIDANCE only. Standard for international companies and much of tech — not evidence of a 'better' candidate.",
  },
  {
    case: "bilingual",
    description: "Bilingual CV",
    evaluationNote:
      "Evaluate each language's sections against that language's own guidance. Check the two tell the SAME factual story; divergence in facts between language versions is a finding.",
  },
] as const;

export function guidanceForCase(cvCase: CvLanguage): LanguageGuidance[] {
  if (cvCase === "ar") return [ARABIC_GUIDANCE];
  if (cvCase === "en") return [ENGLISH_GUIDANCE];
  return [ARABIC_GUIDANCE, ENGLISH_GUIDANCE];
}
