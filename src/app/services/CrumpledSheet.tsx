"use client";

import { useEffect, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useScrub } from "./scrub";

/* ═══════════════════════════════════════════════════════════════════════
   THE CRUMPLED CV — the opening state of /services

   This is not a wrinkled rectangle. It is a real A4 mesh that was crushed in
   three dimensions and rendered with a painter's algorithm, so the sheet
   genuinely covers itself: overlapping folds, hidden portions, an irregular
   silhouette with no readable A4 outline left. The frames are baked offline —
   `node scripts/crumple/build.mjs` — because a displacement filter recomputed
   every frame can only ever damage a flat plane, and because a handful of
   small WebPs cost less per frame than one turbulence pass.

   Every frame is the SAME mesh at a different point in one continuous
   release, so playing them back is a physical unfolding, not a slideshow. The
   last frame deliberately stops short of flat: it is the state the live
   PaperPhysics sheet begins in, which is what lets the two cross-dissolve
   without the visitor seeing one document replaced by another.

   Timeline (as fractions of the whole restoration):
     0.00  a paper ball, ~190px across, off to one side of the frame
     0.15  drifting in, outer folds beginning to separate
     0.30  larger; a corner emerges; the first typography appears in the folds
     0.45  physically opening — a crushed sheet somebody tried to flatten
     0.60  A4 again, and the hand-off to PaperPhysics
   ═══════════════════════════════════════════════════════════════════════ */

export const CRUMPLE_FRAMES = 22;

/** Canvas is 1080 × 1360 with the A4 sheet 600 × 848 centred inside it. */
const FRAME_W = 1080, SHEET_W = 600;
const SCALE = FRAME_W / SHEET_W; // 1.8 — the image is this much wider than the sheet

/* One baked set per language. The print is part of the sheet — it warps with
   the folds — so the language has to be baked in, and an English reader must
   never catch Arabic in the creases of their own CV. Only the visitor's own
   set is ever fetched. */
const srcOf = (lang: string, i: number) =>
  `/cv/crumple-${lang}-${String(i).padStart(2, "0")}.webp`;

/**
 * The crushed sheet, playing back across `range` of the scene's progress and
 * dissolving into whatever sits beneath it over `fade`.
 *
 * `tilt` is the picture-plane rotation the live sheet is at when it takes
 * over — the ball rotates toward it rather than to zero, so the two objects
 * share one rotation trajectory across the cut.
 */
export function CrumpledSheet({
  p,
  lang,
  range,
  fade,
  tilt = -12,
  /** ball diameter at rest, as a multiple of the sheet's own width */
  lift = 1.75,
}: {
  p: MotionValue<number>;
  lang: "ar" | "en";
  range: [number, number];
  fade: [number, number];
  tilt?: number;
  lift?: number;
}) {
  /* Everything physical — the frames and the transform channels — finishes at
     the moment the dissolve starts, so for the whole of the cross-fade the two
     sheets are the same size, in the same place, on the same rotation. That is
     the only way the cut disappears: the eye is given nothing that moves. */
  const [a] = range;
  const b = fade[0];
  const at = (v: number) => a + (b - a) * v;
  const layers = useRef<(HTMLImageElement | null)[]>([]);
  const shown = useRef(-1);

  /* Frame selection is imperative: two layers are lit at a time — the lower
     one opaque, the next fading in over it — and the rest are taken out of the
     compositor entirely. Nothing here touches layout. */
  useEffect(() => {
    const paint = (v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      /* Two curves composed. The paper opens as t^1.55: slow enough off the
         mark that the ball is still a ball while the visitor is working out
         what they are looking at, but not so slow that the middle of the story
         is a sheet that merely grows — by a quarter of the way through, folds
         have to be visibly coming apart. The frames themselves are evenly
         spaced in shape (see frame.html), so this curve is the only easing. */
      const opened = Math.pow(t, 1.55);
      const k = opened * (CRUMPLE_FRAMES - 1);
      const lo = Math.min(CRUMPLE_FRAMES - 2, Math.floor(k));
      const frac = k - lo;
      if (lo !== shown.current) {
        shown.current = lo;
        layers.current.forEach((el, i) => {
          if (!el) return;
          const on = i === lo || i === lo + 1;
          if (el.style.visibility !== (on ? "visible" : "hidden"))
            el.style.visibility = on ? "visible" : "hidden";
          if (i === lo) el.style.opacity = "1";
        });
      }
      /* Eased rather than linear: a dissolve is at its most visible halfway
         through, where two slightly different silhouettes are both on screen.
         Weighting it late keeps the incoming frame out of sight until it is
         nearly the right shape. */
      const top = layers.current[lo + 1];
      if (top) top.style.opacity = (frac * frac * (3 - 2 * frac) * frac).toFixed(3);
    };
    paint(p.get());
    return p.on("change", paint);
  }, [p, a, b]);
  // a language switch swaps 15 sources; start the new set again from the top
  useEffect(() => {
    shown.current = -1;
  }, [lang]);

  /* ── the object in space ──
     These channels are the backward continuation of the live sheet's own: at
     the end of `range` they arrive exactly at the values PaperPhysics starts
     from, so the dissolve happens between two objects that are already in the
     same place, at the same size, on the same rotation. */
  const scale = useTransform(
    p,
    [at(0), at(0.45), at(0.75), at(0.92), at(1)],
    [lift, lift * 0.9, lift * 0.62, 1.05, 0.96],
  );
  const rotate = useTransform(p, [at(0), at(0.35), at(0.7), at(1)], [tilt * 2.1, tilt * 1.7, tilt * 1.25, tilt]);
  const rotateX = useTransform(p, [at(0), at(0.6), at(1)], [3, 6, 8]);
  const rotateY = useTransform(p, [at(0), at(0.6), at(1)], [-4, -9, -12]);
  const opacity = useScrub(p, [fade[0], fade[1]], [1, 0]);

  /* A crumpled ball throws a tight, dark shadow because it is a solid object;
     it is only as the sheet opens that the shadow spreads and softens. */
  const shadow = useTransform(p, [at(0), at(0.55), at(1)], [1, 0.55, 0.08]);
  const dropShadow = useTransform(
    shadow,
    (k) =>
      `drop-shadow(${(-4 * k).toFixed(1)}px ${(10 + 8 * k).toFixed(1)}px ${(9 + 9 * k).toFixed(1)}px rgba(30,26,20,${(
        0.14 +
        0.2 * k
      ).toFixed(3)}))`,
  );

  return (
    <motion.div
      className="cz"
      aria-hidden
      style={{ opacity, scale, rotate, rotateX, rotateY, transformPerspective: 1200 }}
    >
      {Array.from({ length: CRUMPLE_FRAMES }).map((_, i) => (
        <motion.img
          key={i}
          ref={(el: HTMLImageElement | null) => {
            layers.current[i] = el;
          }}
          src={srcOf(lang, i)}
          alt=""
          decoding="async"
          /* The opening frames are the hero; the rest are left at the default
             rather than "low", which would queue them behind every decorative
             photograph on the page and step the unfolding on a slow link. */
          fetchPriority={i < 6 ? "high" : undefined}
          className="cz-f"
          /* first paint shows frame 0; the effect above takes over immediately */
          style={{ filter: dropShadow, opacity: i === 0 ? 1 : 0, visibility: i < 2 ? "visible" : "hidden" }}
        />
      ))}
      <style>{`
        .cz { position: absolute; inset: 0; z-index: 3; pointer-events: none; transform-style: preserve-3d; }
        /* 180% wide, pulled back by 40%, so the A4 baked into the middle of
           the frame lands exactly on the live sheet underneath it. */
        .cz-f {
          position: absolute; left: -${((SCALE - 1) / 2) * 100}%; top: 50%;
          /* the global image reset caps images at their container — these have
             to overhang it, because the sheet is only the middle of the frame */
          width: ${SCALE * 100}%; max-width: none; height: auto;
          transform: translateY(-50%); transform-origin: center;
          will-change: opacity;
        }
      `}</style>
    </motion.div>
  );
}
