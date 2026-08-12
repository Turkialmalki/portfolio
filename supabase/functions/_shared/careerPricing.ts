/**
 * SERVER-SIDE MIRROR of `src/config/payments.ts`'s `CAREER_USD_PAYMENT_CONFIG`.
 *
 * Edge Functions cannot import from `src/` (separate deploy pipeline, and
 * that file is Next.js/browser code) so the price the SERVER trusts is
 * declared once here — this is the value `create-purchase` actually writes
 * into a `purchases` row, never anything a client request supplies. If the
 * price ever changes, update BOTH this file and `src/config/payments.ts`
 * together; a mismatch only affects displayed price vs. charged price, so
 * keeping them in sync is a discipline, not something enforced by code.
 *
 * Only `career_cv_full_review` has a live price — the same
 * "no field to accidentally inherit into" guarantee `payments.ts` documents
 * for its own product map.
 */
export const CAREER_PRODUCT_PRICING: Partial<
  Record<string, { amount: number; currency: "USD" | "SAR"; provider: "paypal" }>
> = {
  career_cv_full_review: { amount: 5, currency: "USD", provider: "paypal" },
};
