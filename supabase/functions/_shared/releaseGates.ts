/**
 * EXPLICIT RELEASE GATES.
 *
 * Command 02's privacy/RLS test suite (A–H, K in
 * supabase/tests/career_privacy_security.sql) is WRITTEN but has never
 * been EXECUTED — the environments so far had no Docker/local Supabase.
 * Code review is not execution. Until those tests run green against a
 * real stack, nothing may connect real customer CV uploads or scanning
 * to customer data.
 *
 * Flipping this to `true` requires: running the full A–H/K suite (plus
 * the D–F HTTP checks in supabase/tests/README.md) against a local
 * Docker stack or a safe hosted TEST project, and recording the run in
 * docs/career-privacy.md. Command 05 must check this constant — and a
 * human must have made it true — before wiring uploads to analysis.
 *
 * Methodology work (Command 03/04) may proceed without this gate;
 * it touches no customer data.
 */
export const PRIVACY_SECURITY_EXECUTION_VERIFIED = false;

/** Convenience guard for future Edge Functions on the customer-data path. */
export function assertPrivacyVerifiedForCustomerData(): void {
  if (!PRIVACY_SECURITY_EXECUTION_VERIFIED) {
    throw new Error(
      "release gate: privacy/RLS tests (A-H/K) have not been executed — " +
        "customer CV processing is blocked. See supabase/functions/_shared/releaseGates.ts",
    );
  }
}
