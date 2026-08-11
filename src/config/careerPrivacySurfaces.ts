/**
 * ROUTES WHOSE CONTENT IS TOO SENSITIVE FOR SESSION RECORDING — the single
 * source of truth `Analytics.tsx` reads to decide whether to load Microsoft
 * Clarity at all on a given page (Command 02 §17).
 *
 * None of these routes exist yet (`/career`, the scanner, the report/editor
 * views are explicitly out of scope for this command) — this list is
 * prepared now so Clarity is excluded from the FIRST COMMIT that adds any
 * of them, not retrofitted after a recording has already captured a CV.
 * `/career/privacy` is deliberately NOT listed: it's static policy text,
 * no user data, no reason to exclude it.
 *
 * Matching is by prefix, case-sensitive, against `window.location.pathname`.
 */
export const CLARITY_EXCLUDED_PATH_PREFIXES: readonly string[] = [
  "/career/upload",
  "/career/scan",
  "/career/report",
  "/career/editor",
  "/career/account",
];

export function isClarityExcludedPath(pathname: string): boolean {
  return CLARITY_EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
