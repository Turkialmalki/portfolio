/**
 * EXPLICIT PROVIDER PRICING CONFIGURATION (Command 05D.3).
 *
 * The ONLY place a per-token USD rate is written down. Nothing in
 * anthropicProvider.ts, pipeline.ts, or any diagnostic reads a hardcoded
 * price — cost is always computed by calling `estimateCostUsd()` here
 * with a token count, so a pricing change is a one-line edit in this file
 * and can never silently affect scoring, validation, or any other
 * analysis behavior (this module has no side effects and influences
 * nothing but its own return value).
 *
 * Rates are keyed by model ID and dated (`effectiveFrom`), because
 * Anthropic's intro pricing is time-boxed (see the source note per
 * entry) — a stale rate is a data problem to fix here, not a reason to
 * guess at call sites.
 */

export interface ModelRateUsd {
  /** USD per 1,000,000 input tokens. */
  inputPerMillion: number;
  /** USD per 1,000,000 output tokens. */
  outputPerMillion: number;
  /** ISO date this rate became active. */
  effectiveFrom: string;
  /** ISO date this rate stops applying, if known (e.g. an introductory rate's end date). */
  effectiveUntil?: string;
  source: string;
}

/**
 * Current rates only — this is NOT a historical ledger. If a model's rate
 * changes, update the entry (and note the change in the source string);
 * cost estimates always reflect "the current configured rate", not "the
 * rate that was active when a past call was made".
 */
export const MODEL_RATES_USD: Record<string, ModelRateUsd> = {
  "claude-sonnet-5": {
    inputPerMillion: 2.0,
    outputPerMillion: 10.0,
    effectiveFrom: "2026-01-01",
    effectiveUntil: "2026-08-31",
    source: "Claude Sonnet 5 introductory pricing (standard rate after 2026-08-31 is $3.00/$15.00 per MTok) — verify against platform.claude.com/docs/en/pricing before relying on this for real billing.",
  },
};

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** False when the model has no configured rate — costUsd is 0 in that case, never guessed. */
  rateFound: boolean;
  rateEffectiveFrom: string | null;
}

/**
 * Pure function — no I/O, no env reads, no side effects. Returns 0 cost
 * (with `rateFound: false`) for an unconfigured model rather than
 * throwing or guessing a rate, so a missing price entry fails visibly in
 * a report instead of silently in a calculation.
 */
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): CostEstimate {
  const rate = MODEL_RATES_USD[model];
  if (!rate) {
    return { model, inputTokens, outputTokens, costUsd: 0, rateFound: false, rateEffectiveFrom: null };
  }
  const costUsd = (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
  return { model, inputTokens, outputTokens, costUsd, rateFound: true, rateEffectiveFrom: rate.effectiveFrom };
}
