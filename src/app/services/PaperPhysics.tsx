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
 * A sheet of paper that starts badly creased and physically flattens with
 * scroll. It is NOT the opening state of the story — the paper ball and its
 * unfolding are baked frames (see CrumpledSheet); this picks the sheet up at
 * roughly 60% of the way back, which is why its opening values are set to
 * match the last baked frame rather than to look as wrecked as possible.
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
  const light2Ref = useRef<SVGFEDiffuseLightingElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [a, b] = range;
  const at = (v: number) => a + (b - a) * v;

  /* ── the beats, as fractions of the restoration window ──
     .00 wrecked · .20 travelling · .35 rotation eases · .45 flattening
     .55 creases fade · .65 print legible · .75 typography changes
     .85 professional dominant · 1.0 pristine                            */

  const disp = useScrub(p, [at(0), at(0.2), at(0.45), at(0.75), at(0.9)], [24, 21, 15, 4, 0]);
  const shade = useScrub(p, [at(0), at(0.35), at(0.55), at(0.8), at(0.92)], [3, 2.7, 1.9, 0.45, 0]);
  /* A second, low, opposing light. Two lights disagreeing is what makes the
     shading between folds read as irregular rather than as one clean bevel —
     so it is also the first thing to go, and the sheet is left lit once. */
  const shade2 = useScrub(p, [at(0), at(0.25), at(0.5), at(0.62)], [1.8, 1.5, 0.7, 0]);
  useFilterAttr(dispRef, "scale", disp);
  useFilterAttr(lightRef, "surfaceScale", shade);
  useFilterAttr(light2Ref, "surfaceScale", shade2);

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

  /* ── the sheet's body in space ──
     The out-of-plane rotations are the "perspective" channel: they run longer
     than the flattening and approach zero slowly, then the sheet settles with
     one small counter-rotation and a half-millimetre drop, the way a released
     sheet does. Perspective distance opens out at the same time, so the last
     of the foreshortening leaves without a visible step.                     */
  const rotate = useTransform(
    p,
    [at(0), at(0.35), at(0.62), at(0.86), at(1)],
    [tilt, tilt * 0.4, tilt * 0.06, -0.35, 0],
  );
  const rotateX = useTransform(p, [at(0), at(0.45), at(0.7), at(0.86)], [8, 4, 1, 0]);
  const rotateY = useTransform(p, [at(0), at(0.45), at(0.7), at(0.86)], [-12, -6, -1.4, 0]);
  const persp = useTransform(p, [at(0), at(0.55), at(0.9)], [900, 1800, 4200]);
  const scale = useTransform(
    p,
    [at(0), at(0.55), at(0.88), at(0.96), at(1)],
    [0.96, 0.985, 1.022, 0.998, 1],
  );
  const settleY = useTransform(p, [at(0.82), at(0.91), at(0.97), at(1)], [0, -3.5, 1.6, 0]);
  /* Focus: the print keeps sharpening after the paper is flat, so the words
     become progressively easier to read right to the end.

     Not on a phone. A blur is a per-pixel pass over the whole sheet, re-run at
     every scroll position, and it is buying a subtlety nobody can see at 390px
     — the geometry alone already says "this is being restored". `simple` keeps
     the paper sharp throughout instead. */
  const blurPx = useScrub(p, [at(0), at(0.35), at(0.7), at(0.9)], [1, 0.7, 0.3, 0]);
  const blurFilter = useTransform(blurPx, (v) => (v < 0.03 ? "none" : `blur(${v.toFixed(2)}px)`));
  const outerFilter = simple ? "none" : blurFilter;

  /* Two tight shadows thrown in disagreeing directions — the sheet is not
     lying on the surface, it is buckled off it — resolving into one wide,
     centred, premium shadow. */
  /* On a phone this is quantised to three states and CSS-transitioned between
     them (see .pp-simple below): a three-layer box-shadow is a paint, and
     re-laying it out at every scroll position is the kind of work that shows
     up as a long frame while the finger is still moving. Three prebaked steps,
     crossfaded by the compositor, are indistinguishable at this size. */
  const shadowRaw = useScrub(p, [at(0), at(0.55), at(1)], [0, 0.5, 1]);
  const shadowT = useTransform(shadowRaw, (v) => (simple ? Math.round(v * 2) / 2 : v));
  const boxShadow = useTransform(shadowT, (k) => {
    const hard = 1 - k;
    return (
      `${(-9 * hard).toFixed(0)}px ${(6 + 10 * k).toFixed(0)}px ${(14 + 14 * hard).toFixed(0)}px -8px rgba(28,25,20,${(
        0.44 * hard +
        0.08
      ).toFixed(3)}), ` +
      `${(11 * hard).toFixed(0)}px ${(3 + 4 * k).toFixed(0)}px ${(10 + 12 * hard).toFixed(0)}px -9px rgba(28,25,20,${(
        0.3 * hard
      ).toFixed(3)}), ` +
      `0 ${(18 + 40 * k).toFixed(0)}px ${(34 + 60 * k).toFixed(0)}px -22px rgba(28,25,20,${(0.1 + 0.3 * k).toFixed(3)})`
    );
  });

  // Printed words. The rewrite only reads once the sheet is flat enough.
  const weakO = useScrub(p, [at(0.62), at(0.82)], [1, 0]);
  const textureO = useScrub(p, [at(0), at(0.4), at(0.85)], [0.62, 0.44, 0]);
  const grainO = useScrub(p, [at(0), at(0.5), at(1)], [0.17, 0.11, 0.035]);
  const creaseO = useScrub(p, [at(0), at(0.3), at(0.55), at(0.72)], [1, 0.82, 0.34, 0]);
  // The bent corner is the last damage to leave — a sheet forgives its
  // middle long before it forgives its corners.
  const foldO = useScrub(p, [at(0), at(0.3), at(0.6), at(0.97)], [1, 0.95, 0.66, 0]);

  return (
    <motion.div
      className={`pp ${className}`}
      style={{
        rotate,
        rotateX,
        rotateY,
        scale,
        y: settleY,
        transformPerspective: persp,
        filter: outerFilter,
      }}
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
            {/* Each light's constant is 1 / sin(its elevation), so a flat piece
                of paper comes back out of the pass white. Left at the default,
                a low light multiplies the *whole* sheet down — which is how a
                white CV ends up rendering as a grey one. */}
            <feDiffuseLighting
              ref={lightRef}
              in="creases"
              surfaceScale={3.4}
              diffuseConstant={1.155}
              lightingColor="#ffffff"
              result="facets"
            >
              <feDistantLight azimuth={232} elevation={60} />
            </feDiffuseLighting>
            {/* a second, low, opposing light: the irregular between-fold shade */}
            <feDiffuseLighting
              ref={light2Ref}
              in="creases"
              surfaceScale={2.7}
              diffuseConstant={2.67}
              lightingColor="#ffffff"
              result="facets2"
            >
              <feDistantLight azimuth={58} elevation={22} />
            </feDiffuseLighting>
            {/* clip the lighting to the warped sheet, then burn it in */}
            <feComposite in="facets" in2="warped" operator="in" result="facetsClipped" />
            <feComposite in="facets2" in2="warped" operator="in" result="facets2Clipped" />
            <feBlend in="warped" in2="facetsClipped" mode="multiply" result="lit" />
            <feBlend in="lit" in2="facets2Clipped" mode="multiply" />
          </filter>
        </svg>
      )}

      <motion.div
        ref={sheetRef}
        className={`pp-sheet${simple ? " pp-simple" : ""}`}
        style={{ boxShadow }}
      >
        {/* the restored document establishes the sheet's size … */}
        <div className="pp-base">{strong}</div>
        {/* … and the abandoned one sits on top of it until it is rewritten */}
        <motion.div className="pp-over" style={{ opacity: weakO }}>
          {weak}
        </motion.div>

        {/* photographic grain, if the optional texture is present. Not built at
            all in simple mode: a multiply layer still costs a blend pass when
            its opacity happens to be zero. */}
        {!simple && (
          <motion.span
            className="pp-tex"
            aria-hidden
            style={{ opacity: textureO, backgroundImage: `url(${CRUMPLE_TEXTURE})` }}
          />
        )}
        {/* three major creases: the shadow in the valley and the light on the
            ridge, as two passes, because a crease is both. These are the whole
            wrinkle story in simple mode — baked gradients fading out on
            opacity, which is what "creases leaving" costs when it is not being
            recomputed by a filter graph. */}
        <motion.span className="pp-crease" aria-hidden style={{ opacity: creaseO }} />
        <motion.span className="pp-crease-hi" aria-hidden style={{ opacity: creaseO }} />
        {/* Real paper grain — never fully gone, paper is not glass. Except on a
            phone, where it is: a tiled turbulence bitmap multiplied over the
            sheet is a rasterisation and a blend pass to deliver texture at a
            scale no thumb-held screen resolves. The creases below carry the
            surface on their own. */}
        {!simple && <motion.span className="pp-grain" aria-hidden style={{ opacity: grainO }} />}
        {/* the bent corners — the tell that a hand did this */}
        <motion.span className="pp-fold" aria-hidden style={{ opacity: foldO }} />
        <motion.span className="pp-fold pp-fold-b" aria-hidden style={{ opacity: foldO }} />
        {children}
      </motion.div>

      <style>{`
        .pp { position: relative; width: 100%; transform-style: preserve-3d; perspective: 1400px; container-type: inline-size; }
        .pp-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
        .pp-sheet { position: relative; width: 100%; border-radius: 3px; will-change: filter; isolation: isolate; }
        /* No filter graph runs here, so promoting for one is a wasted layer.
           The shadow arrives in three steps (see shadowT) and this is what
           makes the steps invisible. */
        /* No transition on the phone. The shadow is already quantised to
           three states above, so the only thing a 340ms box-shadow
           transition adds is 340ms of continuously re-rasterised blurred
           shadow — three times, mid-scroll, on the one element the hero
           repaints per frame. The three steps cut straight instead: at this
           size the cut is invisible and the paint is not. */
        .pp-simple { will-change: auto; }
        .pp-base { position: relative; container-type: inline-size; }
        .pp-over { position: absolute; inset: 0; z-index: 2; container-type: inline-size; }
        .pp-tex {
          position: absolute; inset: 0; z-index: 4; pointer-events: none; border-radius: 3px;
          background-size: cover; background-position: center; mix-blend-mode: multiply;
        }
        .pp-crease, .pp-crease-hi, .pp-grain {
          position: absolute; inset: 0; z-index: 4; pointer-events: none; border-radius: 3px;
        }
        .pp-crease {
          mix-blend-mode: multiply;
          background:
            linear-gradient(104deg, rgba(0,0,0,0) 35.5%, rgba(88,82,68,0.30) 38.4%, rgba(88,82,68,0.09) 40.2%, rgba(0,0,0,0) 42.5%),
            linear-gradient(171deg, rgba(0,0,0,0) 58.5%, rgba(88,82,68,0.24) 61.6%, rgba(88,82,68,0.07) 63.4%, rgba(0,0,0,0) 66%),
            linear-gradient(56deg,  rgba(0,0,0,0) 70%,   rgba(88,82,68,0.17) 72.4%, rgba(0,0,0,0) 75%);
        }
        .pp-crease-hi {
          mix-blend-mode: screen;
          background:
            linear-gradient(104deg, rgba(255,255,255,0) 32%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0) 37.5%),
            linear-gradient(171deg, rgba(255,255,255,0) 55%, rgba(255,255,255,0.4) 58%, rgba(255,255,255,0) 60.5%),
            linear-gradient(56deg,  rgba(255,255,255,0) 67%, rgba(255,255,255,0.3) 69.6%, rgba(255,255,255,0) 72%);
        }
        .pp-grain {
          mix-blend-mode: multiply; background-size: 150px 150px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)'/%3E%3C/svg%3E");
        }
        .pp-fold {
          position: absolute; z-index: 5; pointer-events: none; top: 0; inset-inline-end: 0;
          width: 26%; aspect-ratio: 1; clip-path: polygon(100% 0, 100% 100%, 0 0);
          background: linear-gradient(225deg, rgba(255,255,255,0.96) 0%, rgba(210,204,189,0.92) 44%, rgba(108,101,85,0.58) 60%, rgba(0,0,0,0) 61.5%);
        }
        .pp-fold-b {
          top: auto; bottom: 0; inset-inline-end: auto; inset-inline-start: 0;
          width: 13%; clip-path: polygon(0 100%, 100% 100%, 0 0);
          background: linear-gradient(45deg, rgba(255,255,255,0.9) 0%, rgba(212,206,192,0.85) 46%, rgba(112,105,89,0.45) 60%, rgba(0,0,0,0) 61.5%);
        }
        @media (prefers-reduced-motion: reduce) { .pp-sheet { will-change: auto; } }
      `}</style>
    </motion.div>
  );
}
