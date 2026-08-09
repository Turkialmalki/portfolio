/**
 * Checkout (Lemon Squeezy) and intake (Tally) URLs for the career-services
 * offering on /services. These are PLACEHOLDERS — swap each constant for the
 * real Lemon Squeezy checkout link / Tally form URL once they exist. Every
 * service has its own dedicated checkout and intake link; never point two
 * services at the same URL.
 */

export const CHECKOUT_URLS = {
  cvReview: "https://checkout.lemonsqueezy.com/buy/REPLACE_CV_REVIEW_CHECKOUT_URL",
  cvRewrite: "https://checkout.lemonsqueezy.com/buy/REPLACE_CV_REWRITE_CHECKOUT_URL",
  linkedin: "https://checkout.lemonsqueezy.com/buy/REPLACE_LINKEDIN_CHECKOUT_URL",
  portfolio: "https://checkout.lemonsqueezy.com/buy/REPLACE_PORTFOLIO_CHECKOUT_URL",
  careerUpgrade: "https://checkout.lemonsqueezy.com/buy/REPLACE_CAREER_UPGRADE_CHECKOUT_URL",
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
