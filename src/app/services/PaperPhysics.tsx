"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useScrub } from "./scrub";

/* ═══════════════════════════════════════════════════════════════════════
   PAPER PHYSICS — the signature transformation of /services

   A crumpled sheet is not drawn on top of the CV. The CV *is* the sheet: its
   real printed content is pushed through an SVG displacement map, so the
   typography itself buckles along the creases, while a turbulence-driven
   diffuse-lighting pass supplies the facet shading and folds.

   Scrolling drives four physical channels at once —

     displacement  the paper's deformation (creases warp the print)
     surfaceScale  how deep the light reads those creases
     texture       an optional photographic paper grain, multiplied on top
     transform     perspective, rotation, scale, shadow, focus

   — all falling to zero together, so one continuous piece of paper flattens.
   Nothing is swapped out; only the printed *words* cross-fade, and only once
   the sheet is already flat enough to read.

   OPTIONAL UPGRADE: drop a photograph of real crumpled paper at
   `public/textures/crumple.jpg` (grayscale, no watermark) and it is multiplied
   over the sheet automatically. Nothing breaks when the file is absent — the
   layer simply renders nothing.
   ═══════════════════════════════════════════════════════════════════════ */

export const CRUMPLE_TEXTURE = "/textures/crumple.jpg";

type Range = [number, number];

/**
 * Imperatively drives one SVG filter attribute from a MotionValue.
 * Filter primitives are not style properties, so framer cannot animate them;
 * this writes them on change and skips redundant writes, which matters because
 * every distinct value re-runs the whole filter graph.
 */
function useFilterAttr(
  ref: React.RefObject<SVGElement | null>,
  name: string,
  mv: MotionValue<number>,
  decimals = 2,
) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    const write = (v: number) => {
      const next = v.toFixed(decimals);
      if (next === last.current) return;
      last.current = next;
      ref.current?.setAttribute(name, next);
    };
    write(mv.get());
    return mv.on("change", write);
  }, [ref, name, mv, decimals]);
}

/**
 * A sheet of paper that starts crumpled and physically flattens with scroll.
 *
 * `p` is the owning scene's progress; `range` is the window inside it over
 * which the restoration happens, so callers only ever think in story terms.
 */
export function RestoringPaper({
  p,
  range = [0, 1],
  /** what is printed on the sheet while it is still wrecked */
  weak,
  /** what is printed on it once it has been rewritten */
  strong,
  /** skip the filter graph (mobile / reduced motion) — transforms remain */
  simple = false,
  /** initial tilt of the sheet in the picture plane */
  tilt = -12,
  className = "",
  children,
}: {
  p: MotionValue<number>;
  range?: Range;
  weak: ReactNode;
  strong: ReactNode;
  simple?: boolean;
  tilt?: number;
  className?: string;
  children?: ReactNode;
}) {
  const uid = "pp" + useId().replace(/:/g, "");
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const lightRef = useRef<SVGFEDiffuseLightingElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [a, b] = range;
  const at = (v: number) => a + (b - a) * v;

  /* ── the beats, as fractions of the restoration window ──
     .00 wrecked · .20 travelling · .35 rotation eases · .45 flattening
     .55 creases fade · .65 print legible · .75 typography changes
     .85 professional dominant · 1.0 pristine                            */

  const disp = useScrub(p, [at(0), at(0.2), at(0.45), at(0.75), at(0.9)], [30, 27, 19, 4.5, 0]);
  const shade = useScrub(p, [at(0), at(0.35), at(0.55), at(0.8), at(0.92)], [3.4, 3.1, 2.1, 0.45, 0]);
  useFilterAttr(dispRef, "scale", disp);
  useFilterAttr(lightRef, "surfaceScale", shade);

  /* Once the graph is doing nothing, take it off the element entirely: a
     zero-surfaceScale lighting pass still multiplies flat grey over the sheet,
     and an idle filter still costs a compositing pass every frame. */
  const filterOn = (v: number) => !simple && v < at(0.93) && v > a - 0.03;
  useMotionValueEvent(p, "change", (v) => {
    const el = sheetRef.current;
    if (!el) return;
    const want = filterOn(v) ? `url(#${uid})` : "none";
    if (el.style.filter !== want) el.style.filter = want;
  });
  useEffect(() => {
    const el = sheetRef.current;
    if (el) el.style.filter = filterOn(p.get()) ? `url(#${uid})` : "none";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple, uid]);

  // The sheet's body in space.
  const rotate = useTransform(p, [at(0), at(0.35), at(0.6)], [tilt, tilt * 0.35, 0]);
  const rotateX = useTransform(p, [at(0), at(0.45), at(0.7)], [10, 4, 0]);
  const rotateY = useTransform(p, [at(0), at(0.45), at(0.7)], [-15, -6, 0]);
  const scale = useTransform(p, [at(0), at(0.55), at(0.9), at(1)], [0.9, 0.97, 1.015, 1]);
  const blurPx = useScrub(p, [at(0), at(0.35), at(0.7)], [1.4, 0.8, 0]);
  const outerFilter = useTransform(blurPx, (v) => (v < 0.03 ? "none" : `blur(${v.toFixed(2)}px)`));

  // A tight, hard, thrown-away shadow becomes a wide premium one.
  const shadowT = useScrub(p, [at(0), at(0.55), at(1)], [0, 0.5, 1]);
  const boxShadow = useTransform(shadowT, (k) => {
    const hard = 1 - k;
    return (
      `0 ${(6 + 10 * k).toFixed(0)}px ${(14 + 14 * hard).toFixed(0)}px -8px rgba(28,25,20,${(
        0.4 * hard +
        0.08
      ).toFixed(3)}), ` +
      `0 ${(18 + 40 * k).toFixed(0)}px ${(34 + 60 * k).toFixed(0)}px -22px rgba(28,25,20,${(0.1 + 0.3 * k).toFixed(3)})`
    );
  });

  // Printed words. The rewrite only reads once the sheet is flat enough.
  const weakO = useScrub(p, [at(0.62), at(0.82)], [1, 0]);
  const textureO = useScrub(p, [at(0), at(0.4), at(0.85)], [0.55, 0.4, 0]);
  const foldO = useScrub(p, [at(0), at(0.2), at(0.55)], [1, 0.8, 0]);

  return (
    <motion.div
      className={`pp ${className}`}
      style={{ rotate, rotateX, rotateY, scale, filter: outerFilter }}
    >
      {!simple && (
        <svg className="pp-defs" aria-hidden focusable="false">
          <filter
            id={uid}
            x="-14%"
            y="-14%"
            width="128%"
            height="128%"
            colorInterpolationFilters="sRGB"
          >
            {/* one crease field drives both the warp and the light */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0125 0.019"
              numOctaves={4}
              seed={11}
              result="creases"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="creases"
              scale={30}
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            <feDiffuseLighting
              ref={lightRef}
              in="creases"
              surfaceScale={3.4}
              diffuseConstant={1.15}
              lightingColor="#ffffff"
              result="facets"
            >
              <feDistantLight azimuth={232} elevation={60} />
            </feDiffuseLighting>
            {/* clip the lighting to the warped sheet, then burn it in */}
            <feComposite in="facets" in2="warped" operator="in" result="facetsClipped" />
            <feBlend in="warped" in2="facetsClipped" mode="multiply" />
          </filter>
        </svg>
      )}

      <motion.div ref={sheetRef} className="pp-sheet" style={{ boxShadow }}>
        {/* the restored document establishes the sheet's size … */}
        <div className="pp-base">{strong}</div>
        {/* … and the abandoned one sits on top of it until it is rewritten */}
        <motion.div className="pp-over" style={{ opacity: weakO }}>
          {weak}
        </motion.div>

        {/* photographic grain, if the optional texture is present */}
        <motion.span
          className="pp-tex"
          aria-hidden
          style={{ opacity: simple ? 0 : textureO, backgroundImage: `url(${CRUMPLE_TEXTURE})` }}
        />
        {/* the bent corner — the tell that a hand did this */}
        <motion.span className="pp-fold" aria-hidden style={{ opacity: foldO }} />
        {children}
      </motion.div>

      <style>{`
        .pp { position: relative; width: 100%; transform-style: preserve-3d; perspective: 1400px; container-type: inline-size; }
        .pp-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
        .pp-sheet { position: relative; width: 100%; border-radius: 3px; will-change: filter; }
        .pp-base { position: relative; container-type: inline-size; }
        .pp-over { position: absolute; inset: 0; z-index: 2; container-type: inline-size; }
        .pp-tex {
          position: absolute; inset: 0; z-index: 4; pointer-events: none; border-radius: 3px;
          background-size: cover; background-position: center; mix-blend-mode: multiply;
        }
        .pp-fold {
          position: absolute; z-index: 5; pointer-events: none; top: 0; inset-inline-end: 0;
          width: 22%; aspect-ratio: 1; clip-path: polygon(100% 0, 100% 100%, 0 0);
          background: linear-gradient(225deg, rgba(255,255,255,0.95) 0%, rgba(214,208,194,0.9) 46%, rgba(120,113,96,0.5) 60%, rgba(0,0,0,0) 61%);
        }
        @media (prefers-reduced-motion: reduce) { .pp-sheet { will-change: auto; } }
      `}</style>
    </motion.div>
  );
}
