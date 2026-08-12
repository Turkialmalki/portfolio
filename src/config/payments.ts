/**
 * THE ONE PLACE A PAYMENT LINK OR PRICE IS WRITTEN DOWN — for the Career
 * MVP's payment layer, the same discipline `src/config/careerServices.ts`
 * already applies to the live /services checkout.
 *
 * ── WHY PAYPAL, WHY A PLAIN LINK ──────────────────────────────────────────
 * The Career MVP is not using Lemon Squeezy. Payment is a PayPal payment
 * link (`https://www.paypal.com/ncp/payment/...`) and NOTHING automatically
 * unlocks anything when the customer returns from it — a click, a redirect,
 * a query parameter and localStorage are all things a visitor can produce
 * without paying, so none of them are treated as proof of payment anywhere
 * in this codebase. The only path to an entitlement is:
 *
 *   PAYMENT (this link) → VERIFICATION (customer submits a reference,
 *   `request-payment-verification`) → VERIFIED PURCHASE (a trusted admin
 *   confirms it, `verify-payment`) → ENTITLEMENT (granted server-side).
 *
 * See `docs/backend-architecture.md` for the full chain and
 * `supabase/functions/verify-payment/` for where "verified" actually means
 * something.
 *
 * ── PROVIDER-AGNOSTIC BY DESIGN ───────────────────────────────────────────
 * `PaymentProvider` names three values on purpose, though only `"paypal"`
 * is active. Nothing that consumes a product's entitlement — the database
 * schema, `grant_entitlement()`, the Career product UI once it exists —
 * is allowed to know which provider produced a verified purchase. Adding a
 * provider later (automated PayPal API, a reinstated Lemon Squeezy, a
 * different gateway entirely) means adding a new `PaymentLinkConfig`-like
 * shape here and a new verification implementation; it does not mean
 * touching product logic.
 */

export type PaymentProvider = "paypal" | "lemon_squeezy" | "manual";

export type PaymentLinkConfig = {
  provider: "paypal";
  /** `"payment-link"` today; a future automated integration would be its own type. */
  type: "payment-link";
  /** The exact, single PayPal Payment Link URL — never duplicated in a UI component. */
  url: string;
  expectedPrice: { amount: number; currency: "SAR" | "USD" };
};

/**
 * A price prepared, `url`/`enabled` flipped only as a deliberate, separate
 * step once the exact production checkout link exists. No dynamic SAR↔USD
 * conversion is ever performed anywhere in this codebase; each currency
 * has its own fixed, manually-set price. `enabled` stays `false` (the
 * type still defaults new entries that way in spirit) until a real link
 * is wired AND the purchase-creation/verification chain behind it is
 * actually live — flipping `url` alone must never be read as "checkout is
 * ready" by anything that consumes this config.
 */
export type PendingPaymentLinkConfig = {
  provider: "paypal";
  type: "payment-link";
  url: string | null;
  expectedPrice: { amount: number; currency: "SAR" | "USD" };
  enabled: boolean;
};

/**
 * THE ONLY LIVE CAREER PRODUCT TODAY. Every other Career product from the
 * 01A catalog (`career_cv_rewrite`, `career_linkedin_review`, `career_pass`,
 * `career_expert_review`, `career_done_for_you`) has no payment config yet
 * — deliberately: a product with no entry here has no way to be sold, the
 * same "no field to accidentally inherit into" guarantee the /services
 * commerce table already relies on for its `coming-soon` services.
 */
export const CAREER_PAYMENT_CONFIG: Partial<
  Record<
    | "career_cv_free_scan"
    | "career_cv_full_review"
    | "career_cv_rewrite"
    | "career_linkedin_review"
    | "career_linkedin_optimization"
    | "career_pass"
    | "career_expert_review"
    | "career_done_for_you",
    PaymentLinkConfig
  >
> = {
  career_cv_full_review: {
    provider: "paypal",
    type: "payment-link",
    url: "https://www.paypal.com/ncp/payment/QNQ6Z525NZC7J",
    expectedPrice: { amount: 19, currency: "SAR" },
  },
};

/**
 * USD product direction (Command 05C §14) — "Career Full Review" priced at
 * a fixed $5 USD, no SAR conversion. NOT the live product: `enabled: false`
 * and `url: null` until a real PayPal payment link exists that charges
 * exactly $5.00 USD. Nothing in this codebase reads this constant yet
 * (Career/Build UI is out of scope for this command) — it exists so the
 * price is written down in exactly one place ahead of that work, per this
 * file's own stated discipline.
 *
 * ACTIVATED: this is the official, human-confirmed production PayPal
 * Payment Link for "Career Full CV Review", $5.00 USD, one-time payment
 * (checkpoint resolved in chat — the exact URL was provided directly, not
 * invented). Checkout opens through `create-purchase` (which records a
 * `pending` purchase row server-side, at THIS price, before the customer
 * ever reaches PayPal) → this link → `request-payment-verification` →
 * an admin's `verify-payment` → `grant_entitlement`. Nothing here skips
 * that chain — see FullReviewGate in CareerReport.tsx.
 */
export const CAREER_USD_PAYMENT_CONFIG: Partial<
  Record<"career_cv_full_review", PendingPaymentLinkConfig>
> = {
  career_cv_full_review: {
    provider: "paypal",
    type: "payment-link",
    url: "https://www.paypal.com/ncp/payment/HXZMDU97GMX9L",
    expectedPrice: { amount: 5, currency: "USD" },
    enabled: true,
  },
};
