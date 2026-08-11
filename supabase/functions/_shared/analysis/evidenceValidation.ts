/**
 * EVIDENCE VERIFICATION (Command 05 §11).
 *
 * Any quoted evidence an AI provider returns must be checkable against the
 * normalized resume text it was given. Hallucinated evidence must never
 * influence scoring or reach a report. Matching is normalized/fuzzy
 * (case-insensitive, punctuation-insensitive, whitespace-collapsed) so
 * that trivial formatting differences — smart quotes, double spaces, a
 * trailing period the model dropped — don't cause a false rejection of
 * real evidence, while still refusing anything not actually present.
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
 * Filters each dimension result's evidence array down to verifiable
 * quotes. If evidence existed but none survived, confidence is forced to
 * "low" and the reason is annotated — the score itself is left as-is
 * (rejecting evidence is not the same as rejecting the score; a real
 * provider's score may still be well-founded even if its quoting was
 * imprecise), but a low-confidence, evidence-stripped finding reads very
 * differently in a report than a well-evidenced one, which is the point.
 */
export function verifyDimensionEvidence(result: DimensionAIResult, sourceText: string): EvidenceVerificationOutcome {
  const originalCount = result.evidence.length;
  const valid = result.evidence.filter((e) => evidenceIsVerifiable(e.text, sourceText));
  const rejectedCount = originalCount - valid.length;

  if (rejectedCount === 0) {
    return { result, rejectedCount: 0 };
  }

  const allRejected = valid.length === 0 && originalCount > 0;
  return {
    result: {
      ...result,
      evidence: valid,
      confidence: allRejected ? "low" : result.confidence,
      reason: allRejected
        ? `${result.reason} (unverifiable evidence removed — could not be matched against the document; confidence lowered)`
        : result.reason,
    },
    rejectedCount,
  };
}
