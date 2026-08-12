/**
 * COMPACT REASON CODES (Command 05D.2 §4).
 *
 * The compact AI dimension-evaluation contract (analysis/types.ts's
 * `DimensionAIResult`) asks the model for a coarse `reasonCode` plus a
 * short free-text `shortReason`, instead of the long generated prose the
 * old contract required per dimension. The methodology we already own
 * explains WHY a code applies; the model's job shrinks to picking the
 * right bucket and adding one short sentence of nuance.
 *
 * This is intentionally NOT a closed enum enforced at the schema/validation
 * layer: a fixed code list can't cover 12–15 dimensions × every real CV
 * shape, and rejecting a legitimate result because the model chose a
 * reasonable code outside this list would recreate the exact
 * schema-validation-failure problem Command 05D.1 diagnosed. `"OTHER"` is
 * the explicit escape hatch — `shortReason` still carries the real
 * explanation either way. This file exists for documentation and for
 * `reasonCodeLabel()` below, a deterministic (non-AI) enrichment used
 * where practical — never a validation gate.
 */

export const KNOWN_REASON_CODES = [
  "RESPONSIBILITY_WITHOUT_OUTCOME",
  "GENERIC_POSITIONING",
  "STRONG_ROLE_IDENTITY",
  "INSUFFICIENT_EVIDENCE",
  "CLEAR_OWNERSHIP",
  "ROLE_ALIGNMENT_WEAK",
  "ROLE_ALIGNMENT_STRONG",
  "ATS_STRUCTURE_CLEAR",
  "ATS_STRUCTURE_RISK",
  "REDUNDANT_CONTENT",
  "SUMMARY_TOO_GENERIC",
  "SKILLS_RELEVANT",
  "SKILLS_UNFOCUSED",
  "STRONG_EVIDENCE",
  "WEAK_SENIORITY_SIGNAL",
  "STRONG_SENIORITY_SIGNAL",
  "OTHER",
] as const;

export type KnownReasonCode = (typeof KNOWN_REASON_CODES)[number];

/** Short, deterministic English label per code — used only where a template beats re-deriving from shortReason; never a substitute for shortReason itself. */
const REASON_CODE_LABELS: Partial<Record<KnownReasonCode, string>> = {
  RESPONSIBILITY_WITHOUT_OUTCOME: "Describes a responsibility without a stated outcome",
  GENERIC_POSITIONING: "Positioning reads as generic rather than specific",
  STRONG_ROLE_IDENTITY: "Clear, specific professional identity",
  INSUFFICIENT_EVIDENCE: "Not enough checkable evidence in the document",
  CLEAR_OWNERSHIP: "Clear ownership language",
  ROLE_ALIGNMENT_WEAK: "Weak alignment with the target role",
  ROLE_ALIGNMENT_STRONG: "Strong alignment with the target role",
  ATS_STRUCTURE_CLEAR: "Structure reads cleanly for automated parsing",
  ATS_STRUCTURE_RISK: "Structure carries some parsing risk",
  REDUNDANT_CONTENT: "Content repeats itself across sections",
  SUMMARY_TOO_GENERIC: "Summary reads as boilerplate",
  SKILLS_RELEVANT: "Listed skills are demonstrated in the experience section",
  SKILLS_UNFOCUSED: "Skills list is broad and largely undemonstrated",
  STRONG_EVIDENCE: "Claims are specific and checkable",
  WEAK_SENIORITY_SIGNAL: "Content register doesn't match the claimed seniority",
  STRONG_SENIORITY_SIGNAL: "Content register matches the claimed seniority",
};

/** Deterministic label for a code, falling back to the model's own shortReason when the code is unrecognized or has no template. */
export function reasonCodeLabel(code: string, fallback: string): string {
  return REASON_CODE_LABELS[code as KnownReasonCode] ?? fallback;
}
