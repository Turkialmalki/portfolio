/**
 * THE ONE PLACE A RETENTION PERIOD IS WRITTEN DOWN — same discipline as
 * `src/config/payments.ts` for prices and `productKeys.ts` for product
 * identity. No Edge Function, migration, or future cron job should hardcode
 * a number of days for anything Career-related; it imports from here.
 *
 * ── WHAT IS AND ISN'T ACTUALLY IMPLEMENTED TODAY ──────────────────────────
 * Every period below is a CONFIGURED TARGET. The only one with code behind
 * it right now is `deletedRowPurgeDays` insofar as `deleted_at` gets set
 * immediately by `delete-resume`/`delete-career-data` (Command 02) — but no
 * scheduled job exists yet that actually purges rows once `deletedRowPurgeDays`
 * has elapsed, and no job trims `temporaryProcessingArtifactHours` either,
 * because no temporary processing artifacts exist yet (no scanner, no
 * analyze-resume function — Command 02 explicitly does not build those).
 *
 * This is why the privacy page must not claim "we delete after N hours" —
 * see docs/career-privacy.md, "Retention: configured vs. implemented." The
 * one thing that IS true today, in both code and copy: calling delete-resume
 * removes the Storage object immediately (not on a timer) and soft-deletes
 * the database rows immediately. Nothing else here has a running job behind
 * it yet.
 */

export const RETENTION_CONFIG = {
  /**
   * Original uploaded CV file, in the private `career-resumes` bucket.
   * Target: kept only as long as the account is active and the file hasn't
   * been explicitly deleted. No automatic expiry job exists — a CV sits in
   * Storage until the user deletes it or their account, or an operator-run
   * cleanup (not built) purges it under this ceiling.
   */
  originalCvMaxDays: 730,

  /**
   * Parsed resume text (once a parser exists — not built yet). Target:
   * same lifecycle as the original file it was derived from, since it is
   * private customer data (classification A) with no independent reason to
   * outlive or underlive the source document.
   */
  parsedTextMaxDays: 730,

  /**
   * `resume_analyses` rows (once analyze-resume exists — not built yet).
   * Target: same lifecycle as the resume it analyzes. Deleting a resume
   * already cascades a soft-delete to its analyses (see `delete_resume` in
   * the Command 02 migration) regardless of this number.
   */
  analysisMaxDays: 730,

  /**
   * Temporary processing artifacts (e.g. intermediate files during a future
   * analyze/rewrite pipeline). Target: hours, not days — these should never
   * outlive a single request. Nothing generates these yet.
   */
  temporaryProcessingArtifactHours: 24,

  /**
   * How long a SOFT-deleted row (`deleted_at` set) is kept before a
   * (not-yet-built) purge job removes it permanently. Keeping soft-deleted
   * rows briefly is what makes `deletion_audit` and idempotent repeat-delete
   * calls possible; keeping them forever would contradict "deletion" as a
   * user-facing claim. No purge job exists yet — see the module doc comment.
   */
  deletedRowPurgeDays: 30,

  /**
   * Payment/account records (`purchases`, `entitlements`, `deletion_audit`).
   * Target: kept indefinitely for financial/audit reasons, separate from
   * career content — see docs/career-privacy.md, "Career content vs.
   * financial records." Not user-deletable via any Career deletion flow.
   */
  paymentRecordRetention: "indefinite" as const,
} as const;

export type RetentionConfig = typeof RETENTION_CONFIG;
