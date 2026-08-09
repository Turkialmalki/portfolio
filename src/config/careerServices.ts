/**
 * Commerce configuration for the /services journey.
 *
 * ── PRICES ────────────────────────────────────────────────────────────────
 * Every service stores BOTH currencies explicitly. There is no live FX call
 * and no runtime conversion: the English site renders USD, the Arabic site
 * renders SAR, and the two figures are independently authored so either can
 * be repriced without disturbing the other.
 *
 * ── CHECKOUT ──────────────────────────────────────────────────────────────
 * Each service has its OWN entry below so the CTAs can be pointed at separate
 * Lemon Squeezy products the moment those products exist. Until then every
 * entry resolves to the one cart that is live today — that is recorded in
 * `CHECKOUT_IS_PLACEHOLDER` rather than hidden, so it is obvious which links
 * still need a real product URL. Replace the values one at a time; nothing
 * else in the page needs to change.
 */

export type ServiceId =
  | "resumeReview"
  | "resumeWriting"
  | "publicSpeaking"
  | "linkedinOptimization"
  | "mvpPortfolio"
  | "dashboardReporting"
  | "completeBundle";

export type Price = { usd: number; sar: number };

/** The single Lemon Squeezy cart that is live today. */
const LIVE_SHARED_CART =
  "https://tryproduct-ai.lemonsqueezy.com/checkout/cart/7c8db786-6f5e-486a-8731-383355308aea";

/**
 * PLACEHOLDER — every id points at the shared cart until per-service products
 * are created. `true` means "this URL is not yet the real product link".
 */
export const CHECKOUT_IS_PLACEHOLDER: Record<ServiceId, boolean> = {
  resumeReview: true,
  resumeWriting: true,
  publicSpeaking: true,
  linkedinOptimization: true,
  mvpPortfolio: true,
  dashboardReporting: true,
  completeBundle: true,
};

export const CHECKOUT_URLS: Record<ServiceId, string> = {
  resumeReview: LIVE_SHARED_CART,
  resumeWriting: LIVE_SHARED_CART,
  publicSpeaking: LIVE_SHARED_CART,
  linkedinOptimization: LIVE_SHARED_CART,
  mvpPortfolio: LIVE_SHARED_CART,
  dashboardReporting: LIVE_SHARED_CART,
  completeBundle: LIVE_SHARED_CART,
};

/** PLACEHOLDER — swap each for the real Tally intake form. */
export const INTAKE_URLS: Record<ServiceId, string> = {
  resumeReview: "https://tally.so/r/REPLACE_RESUME_REVIEW_INTAKE",
  resumeWriting: "https://tally.so/r/REPLACE_RESUME_WRITING_INTAKE",
  publicSpeaking: "https://tally.so/r/REPLACE_PUBLIC_SPEAKING_INTAKE",
  linkedinOptimization: "https://tally.so/r/REPLACE_LINKEDIN_INTAKE",
  mvpPortfolio: "https://tally.so/r/REPLACE_MVP_PORTFOLIO_INTAKE",
  dashboardReporting: "https://tally.so/r/REPLACE_DASHBOARD_INTAKE",
  completeBundle: "https://tally.so/r/REPLACE_COMPLETE_BUNDLE_INTAKE",
};

export const PRICING: Record<ServiceId, Price> = {
  resumeReview: { usd: 5, sar: 19 },
  resumeWriting: { usd: 30, sar: 113 },
  publicSpeaking: { usd: 40, sar: 150 },
  linkedinOptimization: { usd: 30, sar: 113 },
  mvpPortfolio: { usd: 250, sar: 939 },
  dashboardReporting: { usd: 100, sar: 376 },
  completeBundle: { usd: 399, sar: 1499 },
};

/** Sum of the six individual services — the bundle's strike-through anchor. */
export const INDIVIDUAL_TOTAL: Price = (
  ["resumeReview", "resumeWriting", "publicSpeaking", "linkedinOptimization", "mvpPortfolio", "dashboardReporting"] as const
).reduce<Price>((acc, id) => ({ usd: acc.usd + PRICING[id].usd, sar: acc.sar + PRICING[id].sar }), {
  usd: 0,
  sar: 0,
});
