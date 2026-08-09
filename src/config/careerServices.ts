/**
 * Checkout (Lemon Squeezy) and intake (Tally) URLs for the career-services
 * offering on /services.
 *
 * Checkout: every service currently points at ONE shared Lemon Squeezy cart —
 * a deliberate interim setup until per-service products exist. Because they
 * share a link, the buyer's chosen service is not encoded in the checkout;
 * the `service` property on the analytics events is the only signal of which
 * one they clicked. Give each service its own link when the products are set
 * up, then this comment can go away.
 *
 * Intake: still PLACEHOLDERS — swap each for the real Tally form URL.
 */

const SHARED_CHECKOUT_URL =
  "https://tryproduct-ai.lemonsqueezy.com/checkout/cart/7c8db786-6f5e-486a-8731-383355308aea";

export const CHECKOUT_URLS = {
  cvReview: SHARED_CHECKOUT_URL,
  cvRewrite: SHARED_CHECKOUT_URL,
  linkedin: SHARED_CHECKOUT_URL,
  portfolio: SHARED_CHECKOUT_URL,
  careerUpgrade: SHARED_CHECKOUT_URL,
} as const;

export const INTAKE_URLS = {
  cvReview: "https://tally.so/r/REPLACE_CV_REVIEW_INTAKE_URL",
  cvRewrite: "https://tally.so/r/REPLACE_CV_REWRITE_INTAKE_URL",
  linkedin: "https://tally.so/r/REPLACE_LINKEDIN_INTAKE_URL",
  portfolio: "https://tally.so/r/REPLACE_PORTFOLIO_INTAKE_URL",
  careerUpgrade: "https://tally.so/r/REPLACE_CAREER_UPGRADE_INTAKE_URL",
} as const;

/**
 * PLACEHOLDER PRICING — no real prices were provided. These are reasonable
 * SAR figures scaled to each service's effort level so the page is usable
 * end-to-end; replace with actual configured prices before launch.
 */
export const PRICING_SAR = {
  cvReview: 349,
  cvRewrite: 899,
  linkedin: 549,
  portfolio: 2499,
  careerUpgradeIndividualValue: 1448, // cvRewrite + linkedin
  careerUpgradePackage: 1199,
  get careerUpgradeSavings() {
    return this.careerUpgradeIndividualValue - this.careerUpgradePackage;
  },
} as const;
