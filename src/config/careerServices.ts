/**
 * Commerce configuration for the /services journey.
 *
 * ── ONE TABLE ─────────────────────────────────────────────────────────────
 * `SERVICES` below is the only place a price, a checkout URL or a service's
 * availability is written down. Nothing else in the app hard-codes any of the
 * three, so a repricing or a product swap is a one-line edit here.
 *
 * ── PRICES ────────────────────────────────────────────────────────────────
 * Every live service stores BOTH currencies explicitly. There is no live FX
 * call and no runtime conversion: the English site renders USD, the Arabic
 * site renders SAR, and the two figures are independently authored so either
 * can be repriced without disturbing the other.
 *
 * ── AVAILABILITY ──────────────────────────────────────────────────────────
 * A service is either `live` — it has a price and its own Lemon Squeezy
 * product — or `coming-soon`, in which case it has NEITHER, by type. That is
 * deliberate: a coming-soon service cannot accidentally inherit another
 * product's URL, because there is no field for it to inherit into. The page
 * cannot render a buy button for it either, for the same reason.
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

/** Live: purchasable today, has its own product. */
type LiveService = { status: "live"; price: Price; checkoutUrl: string };
/** Coming soon: no price, no product, no way to start a checkout. */
type ComingSoonService = { status: "coming-soon"; price: null; checkoutUrl: null };
export type ServiceCommerce = LiveService | ComingSoonService;

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

/**
 * The ONLY shape of checkout URL this site is allowed to produce.
 *
 * `/checkout/buy/<product-uuid>` is a permanent, per-product link. It is a
 * plain URL: it can sit in an `href` in the server-rendered HTML, it survives
 * View Source, it works with JavaScript disabled, and it cannot go stale the
 * way a `/checkout/cart/...` link can — those are generated, shared session
 * carts and are never stored anywhere in this codebase.
 *
 * Nothing appends query parameters to these. No `embed=1`, no overlay, no
 * custom fields: the product itself now records which service was bought, so
 * the URL a customer navigates to is byte-for-byte the string below.
 */
const buy = (id: string) => `${LEMON_STORE_ORIGIN}/checkout/buy/${id}`;

/**
 * The one origin a purchase actually touches. Preconnected in the page head so
 * the TLS handshake is already done when the visitor taps — which is the only
 * "optimisation" the checkout path has, and it happens before the click rather
 * than during it.
 */
export const CHECKOUT_ORIGINS = [LEMON_STORE_ORIGIN];

/**
 * THE table. Every price and every product link on the site comes from here.
 *
 * `satisfies` rather than an annotation, on purpose: it checks every entry
 * against the union above AND keeps each one's own type, so `publicSpeaking`
 * is statically known to have no URL and the bundle is statically known to
 * have a price. Callers that touch one service by name need no null check;
 * callers that walk the whole table still get the union and must handle both.
 */
export const SERVICES = {
  resumeReview: {
    status: "live",
    price: { usd: 5, sar: 19 },
    checkoutUrl: buy("ebc85fa5-caab-418d-9ff8-8653f88900b0"),
  },
  resumeWriting: {
    status: "live",
    price: { usd: 30, sar: 113 },
    checkoutUrl: buy("a1c570da-0e8a-4779-9c4b-d94ad454063b"),
  },
  publicSpeaking: {
    // Kept in the journey for its range and its photography; not for sale yet.
    status: "coming-soon",
    price: null,
    checkoutUrl: null,
  },
  linkedinOptimization: {
    status: "live",
    price: { usd: 30, sar: 113 },
    checkoutUrl: buy("252fa2d7-290f-492b-ae6f-999e587811a8"),
  },
  mvpPortfolio: {
    status: "live",
    price: { usd: 250, sar: 939 },
    checkoutUrl: buy("9e30b22c-9a8b-43de-8950-1e6e5b087f8c"),
  },
  dashboardReporting: {
    status: "live",
    price: { usd: 100, sar: 376 },
    checkoutUrl: buy("bd802235-43be-40e5-8135-c9bace789cb6"),
  },
  completeBundle: {
    status: "live",
    price: { usd: 399, sar: 1499 },
    checkoutUrl: buy("a5c2524f-ed9b-4993-8fc2-cd29331674bf"),
  },
} satisfies Record<ServiceId, ServiceCommerce>;

/**
 * The event-name stem each service reports under, so analytics reads
 * `resume_review_checkout_started` rather than `resumeReview_…`. Written out
 * rather than derived from the id: these names end up in a dashboard someone
 * else reads, and a naming scheme is worth stating.
 */
export const ANALYTICS_ID: Record<ServiceId, string> = {
  resumeReview: "resume_review",
  resumeWriting: "resume_writing",
  publicSpeaking: "public_speaking",
  linkedinOptimization: "linkedin",
  mvpPortfolio: "mvp_portfolio",
  dashboardReporting: "dashboard",
  completeBundle: "complete_bundle",
};

/**
 * WHERE AN UNSURE VISITOR GOES.
 *
 * `MEETING_URL` is the booking flow — today the same Calendly the /contact
 * page offers, kept here so it can be swapped for a Cal.com link (or a local
 * /book route) in one place. `CONTACT_URL` is the quieter, on-site fallback
 * and the destination for every "coming soon" interest click.
 */
export const MEETING_URL = "https://calendly.com/turkialmalki202200/30min";
export const CONTACT_URL = "/contact";

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

/**
 * The bundle's strike-through anchor: the sum of the individual services a
 * customer could actually buy today. Derived, so a service going live — or
 * going away — moves the anchor without anyone remembering to.
 */
export const INDIVIDUAL_TOTAL: Price = SERVICE_IDS.filter(
  (id) => id !== "completeBundle",
).reduce<Price>(
  (acc, id) => {
    const p = SERVICES[id].price;
    return p ? { usd: acc.usd + p.usd, sar: acc.sar + p.sar } : acc;
  },
  { usd: 0, sar: 0 },
);
