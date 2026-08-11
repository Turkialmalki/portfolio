/**
 * AI PROVIDER DATA BOUNDARY — DESIGN ONLY (Command 02 §12–13).
 *
 * No `analyze-resume` function exists yet and no AI provider is called
 * anywhere in this codebase today. This file exists so that when that work
 * starts, the shape of "what an AI request is allowed to contain" is
 * already fixed and typed — not decided ad hoc inside the first function
 * that needs it.
 *
 * ── THE HARD BOUNDARY (§13) ────────────────────────────────────────────────
 *   browser → Edge Function → AI provider.   ALWAYS.
 *   browser → AI provider.                   NEVER.
 * AI credentials are Edge Function secrets only (`AI_PROVIDER_API_KEY` in
 * `.env.example`) — never `NEXT_PUBLIC_*`, never imported by anything that
 * ships to the browser (see `src/lib/supabaseClient.ts`'s own doc comment
 * for the same discipline applied to Supabase keys).
 *
 * ── WHAT MAY GO IN AN AI REQUEST (§12) ────────────────────────────────────
 * `AIAnalysisRequest` below lists EXACTLY the allowed fields. TypeScript's
 * structural typing means a caller can only construct one of these by
 * providing exactly these keys — there is no field to accidentally carry
 * `email`, `purchase_id`, `paypal_reference`, or a database internal id
 * through to the provider. If a future field is genuinely needed, it must
 * be added here deliberately, not passed through an open `Record<string, unknown>`.
 */

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export type AIAnalysisRequest = {
  /** Parsed CV text — already run through `stripContactFields` below if a parsed-text pipeline exists. */
  parsedCvText: string;
  targetRole?: string;
  experienceLevel?: ExperienceLevel;
  jobDescription?: string;
  /** Which rubric/methodology version to apply — a `knowledge.career_rubrics` id, once that table is populated (Command 02 creates the table only; nothing populates it yet). */
  rubricId?: string;
  /** Anonymized approved examples only — never a live customer resume from another user. */
  relevantApprovedExampleIds?: string[];
};

/**
 * Fields that must NEVER be constructed into an `AIAnalysisRequest`, listed
 * for the doc comment's sake — TypeScript already makes this true
 * structurally, this is the human-readable version of the same rule:
 * email, phone (when stored separately from the CV text), purchase/PayPal
 * data, analytics ids, database internal metadata (row ids, timestamps,
 * storage paths). If any of those appear INSIDE the resume text itself and
 * are load-bearing for the analysis, they travel as part of `parsedCvText`
 * only — never as a separate structured field.
 */
export const _NEVER_SEND_SEPARATELY = [
  "email",
  "phone",
  "purchase_id",
  "paypal_reference",
  "analytics_id",
  "user_id",
  "storage_path",
] as const;

/**
 * Preprocessing hook: strip obvious contact fields (email, phone) from CV
 * text before it goes into an AI request, WHERE those fields are not
 * themselves needed for the analysis task. NOT IMPLEMENTED — no parser or
 * analyze-resume function exists yet to call this. The signature is fixed
 * now so the future implementation has a contract to match rather than
 * inventing one under deadline pressure.
 */
export function stripContactFields(_cvText: string): string {
  throw new Error(
    "stripContactFields() is a design-only interface (Command 02 §12) — no CV parsing pipeline exists yet.",
  );
}
