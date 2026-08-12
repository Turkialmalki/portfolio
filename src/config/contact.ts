/**
 * SINGLE SOURCE OF TRUTH for Turki's public contact/social links.
 *
 * Every component that renders an email address, LinkedIn URL, GitHub URL,
 * or the canonical site URL must import `CONTACT` from here instead of
 * hardcoding its own copy. This mirrors the pattern in `careerFlags.ts`:
 * one typed, well-commented config object, no re-derivation, no drift.
 *
 * Values below were cross-checked against every place that hardcoded them
 * as of this refactor:
 *  - src/components/sections/Footer.tsx  (`SOCIAL_LINKS`)
 *  - src/app/contact/page.tsx            (`mailto:` links)
 *  - src/app/about/AboutClient.tsx       (`mailto:` links)
 *  - src/app/services/CareerObjects.tsx  (résumé-mockup plain text)
 *
 * DISCREPANCY FOUND (unresolved — do not silently pick one):
 *   Footer.tsx's real, live "Get in Touch" link points to
 *     https://www.linkedin.com/in/turki-almalki
 *   but src/app/services/CareerObjects.tsx's résumé-mockup prop (plain text,
 *   not a real link) reads:
 *     linkedin.com/in/turkialmalki   (no hyphen — a different handle)
 *   Footer.tsx is treated as the verified source of truth here because it is
 *   the live, clickable link users actually follow. The CareerObjects.tsx
 *   handle has NOT been independently verified anywhere else in the repo.
 *   TODO(turki): confirm which LinkedIn handle is actually correct
 *   ("turki-almalki" vs "turkialmalki") and update both this file and the
 *   mockup copy in CareerObjects.tsx to match.
 *
 * `siteUrl` is not sourced from any existing canonical constant — none was
 * found in next.config.ts or layout.tsx metadata — so it is set directly
 * per the verified production domain.
 */
export const CONTACT = {
  /** Verified official email — agrees across Footer, /contact, and /about. */
  email: "turkialmalki202200@gmail.com",

  /**
   * Verified live LinkedIn URL (from Footer.tsx `SOCIAL_LINKS`).
   * See DISCREPANCY note above re: CareerObjects.tsx's unverified handle.
   */
  linkedinUrl: "https://www.linkedin.com/in/turki-almalki" as string | null,

  /** Verified live GitHub URL (from Footer.tsx `SOCIAL_LINKS`). */
  githubUrl: "https://github.com/Turkialmalki" as string | null,

  /** Canonical production site URL. No existing shared constant found. */
  siteUrl: "https://www.turkialmalki.com",
} as const;
