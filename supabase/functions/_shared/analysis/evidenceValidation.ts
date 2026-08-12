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
 * `shortReason`. `signalLevel` itself is left as-is (rejecting a quote is
 * not the same as rejecting the classification — a real provider's
 * signalLevel may still be well-founded even if its quoting was
 * imprecise), but `evidencePresent`/`evidenceQuality` ARE pulled down to
 * false/"none" (Career V2 Part 4): scoring.ts's `rubricScoreFor` reads
 * those two fields to place the score within its signalLevel's band, so
 * an evidence claim that failed verification must not still buy the
 * document extra points inside that band.
 */
/**
 * Real production failure (Career V2, Arabic-output CV): this fixed
 * caveat suffix was English-only and unconditionally appended to
 * `shortReason` — which flows straight into `dimensions.*.reason`,
 * `issues.*.summary`, and `atsAnalysis.*.detail` — regardless of
 * `outputLanguage`. Evidence quotes failing to verify (a normal
 * occurrence, not a rare edge case: any imperfect AI quote trips it)
 * made this THE dominant leak source in practice, more than the
 * code-templated findings.ts strings (see that file's own note on the
 * same incident) — most/all of a real 5-field leak is plausibly
 * explained by this alone, since it can touch every dimension at once.
 */
const UNVERIFIABLE_EVIDENCE_SUFFIX: Record<"ar" | "en", string> = {
  en: " (unverifiable evidence removed — could not be matched against the document; confidence lowered)",
  ar: " (تم حذف الدليل لعدم تطابقه مع مستندك — تم تخفيض مستوى الثقة)",
};

export function verifyDimensionEvidence(result: DimensionAIResult, sourceText: string, outputLanguage: "ar" | "en" = "en"): EvidenceVerificationOutcome {
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
      evidencePresent: false,
      evidenceQuality: "none",
      confidence: "low",
      shortReason: `${result.shortReason}${UNVERIFIABLE_EVIDENCE_SUFFIX[outputLanguage]}`,
    },
    rejectedCount: 1,
  };
}
