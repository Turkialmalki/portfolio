/**
 * ROUTES WHOSE CONTENT IS TOO SENSITIVE FOR SESSION RECORDING — the single
 * source of truth `Analytics.tsx` reads to decide whether to load Microsoft
 * Clarity at all on a given page (Command 02 §17).
 *
 * `/career` itself IS the product surface (Command 06A): upload, analysis
 * and the report all happen inline on that one page, so the whole `/career`
 * subtree is excluded — with the single exception of `/career/privacy`,
 * which is static policy text with no user data and no reason to exclude.
 *
 * Matching is by prefix, case-sensitive, against `window.location.pathname`.
 */
export const CLARITY_EXCLUDED_PATH_PREFIXES: readonly string[] = ["/career"];

/** Static, data-free pages inside an excluded subtree that MAY be recorded. */
export const CLARITY_EXCLUSION_EXEMPT_PATHS: readonly string[] = ["/career/privacy"];

export function isClarityExcludedPath(pathname: string): boolean {
  if (CLARITY_EXCLUSION_EXEMPT_PATHS.includes(pathname.replace(/\/+$/, "") || "/")) return false;
  return CLARITY_EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
