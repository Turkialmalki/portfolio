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
 * There is exactly ONE place a real product link goes: `REAL_CHECKOUT_URLS`.
 * A service with an entry there is live. A service without one is a
 * PLACEHOLDER — it falls back to the single shared cart, and the whole app can
 * see that it did, because `CHECKOUT_IS_PLACEHOLDER` is DERIVED from the table
 * rather than hand-maintained beside it. There is no way to add a real link and
 * forget to flip a flag, and no way to look at this file and believe six
 * services have six products when they have one.
 *
 * What a placeholder costs the buyer is real and worth stating plainly: the
 * shared cart charges the shared cart's price, not the price printed on the
 * panel. Until each product exists in Lemon Squeezy, every checkout carries
 * `checkout[custom][service]` (see `lib/checkout.ts`) so at least the order
 * records which service the customer believed they were buying, and
 * development builds show a visible PLACEHOLDER badge on the affected CTAs.
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

export const SERVICE_IDS: ServiceId[] = [
  "resumeReview",
  "resumeWriting",
  "publicSpeaking",
  "linkedinOptimization",
  "mvpPortfolio",
  "dashboardReporting",
  "completeBundle",
];

/** The Lemon Squeezy store the checkout lives on — preconnected before any tap. */
export const LEMON_STORE_ORIGIN = "https://tryproduct-ai.lemonsqueezy.com";

/** The one cart that is live today. Used only where no real product exists yet. */
const SHARED_CART = `${LEMON_STORE_ORIGIN}/checkout/cart/7c8db786-6f5e-486a-8731-383355308aea`;

/**
 * REAL, per-product checkout URLs — the only table to edit.
 *
 * Add an entry and that service is instantly live end to end: its CTA stops
 * being a placeholder, the dev badge disappears, and nothing else changes.
 */
const REAL_CHECKOUT_URLS: Partial<Record<ServiceId, string>> = {
  // resumeReview:         "https://tryproduct-ai.lemonsqueezy.com/buy/<uuid>",
  // resumeWriting:        "…",
  // publicSpeaking:       "…",
  // linkedinOptimization: "…",
  // mvpPortfolio:         "…",
  // dashboardReporting:   "…",
  // completeBundle:       "…",
};

const entries = SERVICE_IDS.map(
  (id) => [id, REAL_CHECKOUT_URLS[id] ?? SHARED_CART] as const,
);

export const CHECKOUT_URLS = Object.fromEntries(entries) as Record<ServiceId, string>;

/** Derived, never hand-written: `true` means "this is the shared cart, not a product". */
export const CHECKOUT_IS_PLACEHOLDER = Object.fromEntries(
  SERVICE_IDS.map((id) => [id, !REAL_CHECKOUT_URLS[id]]),
) as Record<ServiceId, boolean>;

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
