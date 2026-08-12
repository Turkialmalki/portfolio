/**
 * EVIDENCE VERIFICATION (Command 05 §11; compact contract per Command
 * 05D.2 §5).
 *
 * Any quoted evidence an AI provider returns must be checkable against the
 * normalized resume text it was given. Hallucinated evidence must never
 * influence scoring or reach a report. Matching is normalized/fuzzy
 * (case-insensitive, punctuation-insensitive, whitespace-collapsed) so
 * that trivial formatting differences — smart quotes, double spaces, a
 * trailing period the model dropped — don't cause a false rejection of
 * real evidence, while still refusing anything not actually present.
 *
 * The compact contract carries at most ONE evidence item per dimension
 * (`{section, excerpt} | null`), not an array — verification is the same
 * check, just against zero-or-one item instead of filtering a list.
 */
import type { DimensionAIResult } from "./types.ts";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function evidenceIsVerifiable(evidenceText: string, sourceText: string): boolean {
  const quote = normalize(evidenceText);
  if (quote.length < 3) return false;
  return normalize(sourceText).includes(quote);
}

export interface EvidenceVerificationOutcome {
  result: DimensionAIResult;
  rejectedCount: number;
}

/**
 * If the dimension's single evidence item can't be matched against the
 * source text, it's discarded (never "fixed" or replaced), confidence is
 * forced to "low", and a fixed, code-owned note is appended to
 * `shortReason` — the score itself is left as-is (rejecting evidence is
 * not the same as rejecting the score; a real provider's score may still
 * be well-founded even if its quoting was imprecise), but a
 * low-confidence, evidence-stripped finding reads very differently in a
 * report than a well-evidenced one, which is the point.
 */
export function verifyDimensionEvidence(result: DimensionAIResult, sourceText: string): EvidenceVerificationOutcome {
  if (!result.evidence) {
    return { result, rejectedCount: 0 };
  }
  if (evidenceIsVerifiable(result.evidence.excerpt, sourceText)) {
    return { result, rejectedCount: 0 };
  }
  return {
    result: {
      ...result,
      evidence: null,
      confidence: "low",
      shortReason: `${result.shortReason} (unverifiable evidence removed — could not be matched against the document; confidence lowered)`,
    },
    rejectedCount: 1,
  };
}
