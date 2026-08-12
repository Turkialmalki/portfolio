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
 * A price prepared but NOT yet wired to any checkout. `url` is `null` on
 * purpose — Command 05C §14 requires the actual PayPal payment link to
 * charge exactly this amount in this currency BEFORE anything reads this
 * config to render a checkout button. No dynamic SAR↔USD conversion is
 * ever performed anywhere in this codebase; each currency has its own
 * fixed, manually-set price. `enabled: false` is the second gate — even
 * once a real link exists, flipping this to `true` is a deliberate,
 * separate step, not a side effect of adding the URL.
 */
export type PendingPaymentLinkConfig = {
  provider: "paypal";
  type: "payment-link";
  url: string | null;
  expectedPrice: { amount: number; currency: "SAR" | "USD" };
  enabled: false;
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
 * To activate once the link exists: set `url`, flip `enabled: true`, and
 * only then wire a checkout surface to read it — each step deliberate,
 * never automatic from the other.
 */
export const CAREER_USD_PAYMENT_CONFIG: Partial<
  Record<"career_cv_full_review", PendingPaymentLinkConfig>
> = {
  career_cv_full_review: {
    provider: "paypal",
    type: "payment-link",
    url: null,
    expectedPrice: { amount: 5, currency: "USD" },
    enabled: false,
  },
};
