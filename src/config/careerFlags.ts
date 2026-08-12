/**
 * LAUNCH-SENSITIVE CAREER FEATURE FLAGS — the one place the /career UI asks
 * "is this part of the product actually allowed to run yet?" (Command 06A
 * §11, §25, §29, §63). No component may re-derive any of these from its own
 * env reads or invent a bypass.
 *
 * These flags mirror — they do not override — the real server-side gates:
 *
 *  · `analysisEnabled` mirrors `PRIVACY_SECURITY_EXECUTION_VERIFIED`
 *    (supabase/functions/_shared/releaseGates.ts). While that gate is false
 *    the `analyze-resume` Edge Function physically refuses everything except
 *    admin-key-gated fixture runs, so even a tampered client build that
 *    flipped this to `true` could not send a real CV anywhere. The flag
 *    exists so the UI can be HONEST about the state, not to enforce it.
 *
 *  · `rewriteEnabled` mirrors the deferred-rewrite launch gate: real-model
 *    rewrite fact-safety has not been approved for public use. When false,
 *    the Before/After surface may only ever show clearly-synthetic
 *    demonstration content, and only in synthetic demo mode.
 *
 *  · `paymentEnabled` is READ from `CAREER_USD_PAYMENT_CONFIG` — never
 *    written here, never duplicated. `enabled: false` + `url: null` means
 *    the $5 price may be displayed but no checkout action may exist.
 *
 *  · `syntheticDemoMode` is the explicit SAFE_SYNTHETIC_DEMO_MODE (§11):
 *    the full product flow runs against the synthetic fixture reports in
 *    `src/app/career/careerFixtures.ts` — no file leaves the browser, no
 *    network call is made, and the UI labels the result as a demo. On by
 *    default in development; in a production build it requires the explicit
 *    `NEXT_PUBLIC_CAREER_SYNTHETIC_DEMO=true` (inlined at build time), so
 *    the deployed site never demos by accident.
 */
import { CAREER_USD_PAYMENT_CONFIG } from "./payments";

export const CAREER_FULL_REVIEW_PRICE =
  CAREER_USD_PAYMENT_CONFIG.career_cv_full_review?.expectedPrice ?? {
    amount: 5,
    currency: "USD" as const,
  };

export const CAREER_FLAGS = {
  /**
   * Real customer analysis. Mirrors PRIVACY_SECURITY_EXECUTION_VERIFIED —
   * flip THERE first, then here, never here alone. Command 06A.5 wired
   * the real code path this flag activates (CareerClient's
   * `runRealAnalysis` → real upload → `analyze-resume` mode:"customer" →
   * scoring.ts → real report) — flipping this to `true` is no longer a
   * no-op waiting for code, it turns on tested, real behavior. It still
   * changes nothing on its own while the server-side gate is false: the
   * Edge Function answers every customer request with `GATED` first.
   */
  analysisEnabled: false,

  /** Real rewrite generation for the public. Fact-safety validation pending. */
  rewriteEnabled: false,

  /** Read from the canonical payment config — both `enabled` and a real
   *  `url` must exist. Widened past the config's literal `enabled: false`
   *  so this line doesn't need editing when the config activates. */
  paymentEnabled: ((cfg?: { url: string | null; enabled: boolean }) =>
    cfg?.enabled === true && typeof cfg.url === "string")(
    CAREER_USD_PAYMENT_CONFIG.career_cv_full_review,
  ),

  /**
   * Hosted magic-link auth. AUTH_READY = PARTIAL: `runRealAnalysis`'s
   * sign-in gate (CareerClient/CareerFlow, Command 06A.5) is real code
   * against real `supabase.auth.signInWithOtp`/`onAuthStateChange`, but
   * the hosted Auth Dashboard config (Site URL / Redirect URLs) and one
   * real end-to-end magic-link delivery have not been attested by a
   * human yet — see Command 06A.5 §19. Do not flip until that's done,
   * independent of whether `analysisEnabled` is true.
   */
  authEnabled: true,

  syntheticDemoMode:
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_CAREER_SYNTHETIC_DEMO === "true",
} as const;
