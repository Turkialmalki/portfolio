/**
 * THE INTERNAL PRODUCT IDENTITY — stable keys, provider-agnostic.
 *
 * This replaces the earlier Lemon Squeezy variant→product mapping. Lemon
 * Squeezy is NOT the active payment provider for the Career MVP — PayPal
 * payment links are (see `docs/backend-architecture.md`) — and PayPal
 * payment links carry no provider-issued product identifier the way a
 * Lemon Squeezy webhook's `variant_id` did. There is nothing to map FROM
 * here yet.
 *
 * What stays true regardless of provider: a product is identified ONLY by
 * this internal key, never by button label, checkout URL, displayed price,
 * or a query string — all four are editable in devtools before a click.
 * `verify-payment` reads `product_key` off the `purchases` row itself
 * (set when the purchase was created — see `docs/backend-architecture.md`'s
 * note on the not-yet-built purchase-creation step), not from anything the
 * verification request or the caller supplies.
 */
export type CareerProductKey =
  | "career_cv_free_scan"
  | "career_cv_full_review"
  | "career_cv_rewrite"
  | "career_linkedin_review"
  | "career_linkedin_optimization"
  | "career_pass"
  | "career_expert_review"
  | "career_done_for_you";

export type BuildProductKey =
  | "build_portfolio"
  | "build_mvp_sprint"
  | "build_dashboard_reporting"
  | "build_consultation";

export type ProductKey = CareerProductKey | BuildProductKey;

export const KNOWN_PRODUCT_KEYS: readonly ProductKey[] = [
  "career_cv_free_scan",
  "career_cv_full_review",
  "career_cv_rewrite",
  "career_linkedin_review",
  "career_linkedin_optimization",
  "career_pass",
  "career_expert_review",
  "career_done_for_you",
  "build_portfolio",
  "build_mvp_sprint",
  "build_dashboard_reporting",
  "build_consultation",
];

export function isKnownProductKey(value: string): value is ProductKey {
  return (KNOWN_PRODUCT_KEYS as readonly string[]).includes(value);
}
