/**
 * ANONYMIZATION PIPELINE — DESIGN ONLY (Command 02 §11).
 *
 * Nothing in this file is called by any Edge Function yet. No customer
 * content reaches this module in this phase — the interface exists so a
 * future ingestion path (built only after Command 02's consent + approval
 * model is wired to a real UI) has a single, well-defined shape to
 * implement against, instead of ad-hoc regex scattered across whatever
 * function eventually needs it.
 *
 * ── WHAT THIS MUST ONE DAY REMOVE OR REPLACE ──────────────────────────────
 * name, email, phone, address/location (where identifying), LinkedIn URLs,
 * portfolio URLs, company/project identifiers (where necessary to prevent
 * re-identification), and other unique personal identifiers.
 *
 * ── WHERE THIS SITS IN THE FLOW (future, not built) ───────────────────────
 *   customer resume + explicit `knowledge_contribution` consent
 *     → operator manually reviews and approves
 *     → anonymize(approvedText)     ← THIS MODULE
 *     → operator reviews the anonymized output (never auto-published)
 *     → knowledge.approved_examples row, with anonymized = true and
 *       source_consent_id pointing at the consent record that authorized it
 *
 * A consent check (`has_active_consent`, see the Command 02 migration) must
 * be re-evaluated at the ingestion step, not just recorded at approval time
 * — a revocation between "approved" and "ingested" must still block use.
 */

export type AnonymizationFindingCategory =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "linkedin_url"
  | "portfolio_url"
  | "company_identifier"
  | "project_identifier"
  | "other_identifier";

export type AnonymizationFinding = {
  category: AnonymizationFindingCategory;
  /** Character range in the ORIGINAL text, never the anonymized text — used only for the operator review UI, never persisted alongside output. */
  start: number;
  end: number;
  replacement: string;
};

export type AnonymizationResult = {
  anonymizedText: string;
  findings: AnonymizationFinding[];
  /**
   * false means "an operator MUST manually review before this can ever be
   * approved" — this pipeline is designed to never claim full confidence.
   * Even at true, `knowledge.approved_examples` insertion still requires a
   * human `approved_by` value; nothing here can approve on its own.
   */
  requiresManualReview: true;
};

/**
 * NOT IMPLEMENTED. The signature is the contract: takes raw approved text
 * (already consent-checked and operator-selected upstream — never raw,
 * unreviewed customer CV text), returns a redacted result plus a findings
 * list an operator reviews before anything is inserted into
 * `knowledge.approved_examples`. Throwing here is deliberate — it fails
 * loudly if something tries to wire this up before it's actually built,
 * rather than silently returning the input unredacted.
 */
export function anonymize(_sourceText: string): AnonymizationResult {
  throw new Error(
    "anonymize() is a design-only interface (Command 02 §11) — no implementation exists yet, and nothing should call it until the manual-review knowledge-ingestion flow is built.",
  );
}
