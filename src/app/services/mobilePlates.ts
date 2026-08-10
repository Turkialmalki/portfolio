/**
 * THE PLATE TABLE — the one description of every pre-rendered mobile visual.
 *
 * `scripts/render-mobile-scenes.mjs` bakes each file at exactly these
 * dimensions, and the phone stylesheet reserves each plate's box from the
 * same numbers. A plate whose aspect ratio does not match its file letterboxes
 * or crops, so the two must be stated once and read twice, never typed twice.
 *
 * The shapes differ per scene on purpose. A rewritten A4 page is portrait; a
 * dashboard is landscape; the complete package is a row. Forcing all five
 * into one ratio would crop the wide compositions or shrink the tall ones
 * until nothing in them could be read on a 390px screen.
 */

export type SceneId = "rewrite" | "linkedin" | "work" | "dashboard" | "bundle";

export type Plate = {
  /** the baked file's pixel dimensions, which are also its aspect ratio */
  w: number;
  h: number;
};

export const PLATES: Record<SceneId, Plate> = {
  rewrite: { w: 620, h: 720 },
  linkedin: { w: 640, h: 620 },
  work: { w: 660, h: 620 },
  dashboard: { w: 680, h: 560 },
  bundle: { w: 700, h: 320 },
};

/**
 * Play order — which is also the order the next-one-ahead prefetch follows.
 * A visitor gets the file for the service they are about to reach, and never
 * the four they may not.
 */
export const PLATE_ORDER: SceneId[] = [
  "rewrite",
  "linkedin",
  "work",
  "dashboard",
  "bundle",
];
