/**
 * Which hero composition the homepage draws.
 *
 * Same shape as `siteFlags.ts`, which is the existing convention here: one
 * module owns the decision and components read it rather than re-deriving it
 * from their own `process.env` calls.
 *
 *   classic     the shipped archive spread — three columns, identity in the
 *               middle, artifacts either side of it
 *   meaningful  the experiment: one bounded visual stage ABOVE the identity at
 *               every width, the three pieces of evidence arranged as an
 *               editorial composition, and the route cue between the buttons
 *               and the row of marks
 *
 * Both variants render the SAME artifacts with the SAME ids and the same
 * flight plans — only the resting geometry and the palette differ, which is
 * what makes this switchable without touching the choreography.
 *
 * · production build → whatever NEXT_PUBLIC_HERO_VISUAL_VARIANT was set to at
 *   build time, and nothing else. There is no runtime switch in production and
 *   nothing is ever chosen at random.
 * · development      → the same default, overridable per-tab with `?hero=`
 *   (`?hero=meaningful`, `?hero=classic`) so the two can be compared side by
 *   side without a rebuild.
 */

export type HeroVariant = "classic" | "meaningful";

const VARIANTS: HeroVariant[] = ["classic", "meaningful"];

function parse(value: string | null | undefined): HeroVariant | null {
  return VARIANTS.includes(value as HeroVariant) ? (value as HeroVariant) : null;
}

/**
 * The build-time answer, inlined by Next — and therefore the value the server
 * renders and the value hydration must match.
 */
export const HERO_VISUAL_VARIANT: HeroVariant =
  parse(process.env.NEXT_PUBLIC_HERO_VISUAL_VARIANT) ?? "classic";

/** `?hero=` is a development affordance only. */
export const HERO_VARIANT_OVERRIDABLE = process.env.NODE_ENV !== "production";

/**
 * The variant this tab asked for, or null.
 *
 * Client-only by construction: it reads `location`, so it is never called
 * during render — see `useHeroVariant` in Hero.tsx, which applies it in an
 * effect so the first paint still matches what the server sent.
 */
export function heroVariantOverride(): HeroVariant | null {
  if (!HERO_VARIANT_OVERRIDABLE || typeof window === "undefined") return null;
  try {
    return parse(new URLSearchParams(window.location.search).get("hero"));
  } catch {
    return null;
  }
}
