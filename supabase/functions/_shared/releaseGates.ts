/**
 * EXPLICIT RELEASE GATES.
 *
 * Command 02's privacy/RLS test suite (A–H, K) has now been EXECUTED:
 *
 *  - A–H: supabase/tests/career_privacy_security.sql run against a local
 *    Docker Supabase stack (`npx supabase db reset` then `psql -f
 *    supabase/tests/career_privacy_security.sql`), all 9 checks + the
 *    consent-revocation bonus PASS. Covers anonymous/cross-user RLS
 *    isolation on resumes/resume_analyses, delete_resume() ownership
 *    enforcement + idempotency + audit trail, and consent grant/revoke
 *    isolation.
 *  - K: production-style log content verified hosted, live — three
 *    `analyze_resume_customer_blocked_gate` invocations of the real
 *    session-authenticated `analyze-resume` customer path, inspected
 *    directly in the Supabase Dashboard's function logs. Each line
 *    contained only `{event, request_id, user_id, status}` — no CV text,
 *    no email/phone, no prompt/AI output, no key material. delete-resume/
 *    delete-career-data were not separately observed live, but read the
 *    identical safeLog/safeLogError allowlisted-shape pattern in code.
 *
 * A human reviewed both results and authorized this flip.
 */
export const PRIVACY_SECURITY_EXECUTION_VERIFIED = true;

/** Convenience guard for future Edge Functions on the customer-data path. */
export function assertPrivacyVerifiedForCustomerData(): void {
  if (!PRIVACY_SECURITY_EXECUTION_VERIFIED) {
    throw new Error(
      "release gate: privacy/RLS tests (A-H/K) have not been executed — " +
        "customer CV processing is blocked. See supabase/functions/_shared/releaseGates.ts",
    );
  }
}
