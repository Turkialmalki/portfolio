/**
 * CAREER ANALYTICS — the only way Career-surface events should reach GTM's
 * dataLayer (Command 02 §16). Wraps the site-wide `trackEvent`
 * (`src/lib/analytics.ts`) with two allowlists: which event names exist,
 * and which payload keys each may carry. Nothing calls this yet — no
 * Career UI exists in this command — but the discipline needs to exist
 * before the first `career_viewed` call is written, not retrofitted after.
 *
 * Two independent protections, not one:
 *  1. `CareerEventName` — only the events named in the brief may be sent.
 *  2. `SENSITIVE_KEYS` — even for an allowed event, a payload key matching
 *     this list is dropped before the event ever reaches `trackEvent`,
 *     so a future call site that accidentally spreads a whole resume/
 *     analysis object at this function can't leak it through a typo-safe
 *     API. This is a blocklist by design (not an allowlist of payload
 *     keys) because legitimate non-sensitive keys will vary per event
 *     (e.g. `product_key`, `variant`) — the one thing that must be caught
 *     unconditionally is the specific sensitive shapes named in the brief.
 */
import { trackEvent } from "./analytics";

export type CareerEventName =
  | "career_viewed"
  | "cv_upload_started"
  | "cv_upload_completed"
  | "analysis_started"
  | "analysis_completed"
  | "free_report_viewed"
  | "unlock_clicked"
  // Command 06A §44 — the /career product surface. Same discipline: names
  // are allowlisted here first, payloads stay primitive and PII-free.
  | "career_score_revealed"
  | "career_issue_expanded"
  | "career_full_review_viewed"
  | "career_checkout_clicked"
  | "career_auth_started"
  | "career_auth_completed"
  | "career_error_shown";

const CAREER_EVENT_NAMES: ReadonlySet<CareerEventName> = new Set([
  "career_viewed",
  "cv_upload_started",
  "cv_upload_completed",
  "analysis_started",
  "analysis_completed",
  "free_report_viewed",
  "unlock_clicked",
  "career_score_revealed",
  "career_issue_expanded",
  "career_full_review_viewed",
  "career_checkout_clicked",
  "career_auth_started",
  "career_auth_completed",
  "career_error_shown",
]);

/**
 * Never allowed in a Career analytics payload, regardless of event —
 * resume text, any form of name/email/phone, job description text, AI
 * output, and PayPal reference data. Matched against a snake_cased,
 * lowercased version of the key (see `normalizeKey` below) so `resumeText`,
 * `resume_text`, `ResumeText`, and `RESUME_TEXT` are all caught the same
 * way — a plain case-insensitive regex alone misses camelCase keys like
 * `jobDescriptionText` against a `job_description` pattern, which is
 * exactly the gap this normalization step closes.
 */
const SENSITIVE_KEY_PATTERN =
  /resume|cv_text|cv_body|job_description|ai_output|ai_result|analysis_result|paypal|email|phone|full_name|^name$/;

function normalizeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export type CareerEventParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Returns the payload with every sensitive-looking key removed, and, in
 * development, throws instead of silently dropping — so a call site that
 * tries to pass sensitive data fails loudly in dev rather than quietly
 * losing the field in production. `params` is intentionally the narrow
 * `CareerEventParams` shape (no nested objects/arrays) — there is no
 * legitimate primitive-only Career event field that resembles CV content,
 * so a caller cannot smuggle a resume through as a stringified blob without
 * it being an obvious `JSON.stringify(...)`-shaped string at the call site.
 */
function sanitizeParams(params: CareerEventParams | undefined): CareerEventParams {
  if (!params) return {};
  const clean: CareerEventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_KEY_PATTERN.test(normalizeKey(key))) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          `trackCareerEvent: refusing sensitive-looking key "${key}" — Career analytics payloads may never carry resume/contact/AI-output fields (Command 02 §16).`,
        );
      }
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export function trackCareerEvent(event: CareerEventName, params?: CareerEventParams): void {
  if (!CAREER_EVENT_NAMES.has(event)) return; // unknown event names are silently dropped, never forwarded
  trackEvent(event, sanitizeParams(params));
}
