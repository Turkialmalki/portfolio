/**
 * Site-wide surface flags — the one place the app asks "is this part of the
 * site public yet?". Components must not re-derive any of this from their own
 * `process.env` reads: a second source of truth is how a page ends up hidden
 * from the navigation but still reachable by URL.
 *
 * Same shape as `careerFlags.ts`, which is the existing convention here.
 */

/**
 * The portfolio (`/projects`, `/projects/[slug]`) and every link into it.
 *
 * · local development  → visible (NODE_ENV is not "production")
 * · preview build      → visible (build with NEXT_PUBLIC_SHOW_PROJECTS=true)
 * · production build   → hidden  (the variable is simply not set)
 *
 * `NEXT_PUBLIC_SHOW_PROJECTS=false` forces it off everywhere, including
 * locally, which is what makes the production behaviour testable on a laptop.
 *
 * The value is inlined at build time by Next, so this is a build-time decision
 * — nothing about the hidden pages ships to a production visitor's navigation.
 */
export const SHOW_PROJECTS =
  process.env.NEXT_PUBLIC_SHOW_PROJECTS === "true" ||
  (process.env.NEXT_PUBLIC_SHOW_PROJECTS !== "false" &&
    process.env.NODE_ENV !== "production");

/**
 * Where "view my work" points when the portfolio is not public: the flight-path
 * timeline on the homepage, which carries the same work as verified proof.
 */
export const WORK_HREF = SHOW_PROJECTS ? "/projects" : "/#journey";
