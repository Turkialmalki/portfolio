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

   ── TWO RENDERERS, ONE STORY ────────────────────────────────────────────
   Desktop plays the full 22-frame set as stacked <img> layers: the compositor
   holds them all and the scrub is pure opacity, which is the cheapest possible
   scrub when you have the GPU memory for it. A phone does not. Twenty-two
   1404×1768 surfaces, each carrying an animated drop-shadow, is several
   hundred megabytes of composited texture to change the alpha of on every
   touch-move — which is exactly what "the scroll fights the animation" feels
   like.

   So mobile plays a separate 12-frame set, baked at 560px, through ONE canvas:
   at most two frames are ever touched, both drawn into a single surface, and
   nothing else on the sheet is a live layer. Same mesh, same story, same
   silhouette at every point — a fraction of the work.
   ═══════════════════════════════════════════════════════════════════════ */

export const CRUMPLE_FRAMES = 22;
/** The phone set. Re-baked, not subsampled — see scripts/crumple/build.mjs. */
export const CRUMPLE_FRAMES_M = 12;

/** Canvas is 1080 × 1360 with the A4 sheet 600 × 848 centred inside it. */
const FRAME_W = 1080, SHEET_W = 600;
const SCALE = FRAME_W / SHEET_W; // 1.8 — the image is this much wider than the sheet
/** the mobile bake's own pixel size, so the canvas backing store is exact */
const M_W = 560, M_H = 706;

/* One baked set per language. The print is part of the sheet — it warps with
   the folds — so the language has to be baked in, and an English reader must
   never catch Arabic in the creases of their own CV. Only the visitor's own
   set is ever fetched. */
const srcOf = (lang: string, i: number, mobile = false) =>
  `/cv/crumple-${mobile ? "m-" : ""}${lang}-${String(i).padStart(2, "0")}.webp`;

/**
 * Where in the sequence progress `t` (0→1 across the crumple window) sits, as
 * a whole frame index plus the fraction toward the next one.
 *
 * Desktop opens as t^1.55: slow enough off the mark that the ball is still a
 * ball while the visitor works out what they are looking at. On a phone that
 * head start is a dead zone — the first swipe is most of the scene, and it has
 * to visibly do something — so mobile opens at t^1.12 instead. Same shapes in
 * the same order; the phone simply does not loiter on the first one.
 *
 * The frames themselves are evenly spaced in shape (see frame.html), so this
 * curve is the only easing.
 */
function frameAt(t: number, count: number, exp: number) {
  const k = Math.pow(t, exp) * (count - 1);
  const lo = Math.min(count - 2, Math.floor(k));
  return { lo, frac: k - lo };
}

/* A dissolve is at its most visible halfway through, where two slightly
   different silhouettes are both on screen. Weighting it late keeps the
   incoming frame out of sight until it is nearly the right shape. */
const mix = (f: number) => f * f * (3 - 2 * f) * f;

type Props = {
  p: MotionValue<number>;
  lang: "ar" | "en";
  range: [number, number];
  fade: [number, number];
  /** picture-plane rotation the live sheet is at when it takes over */
  tilt?: number;
  /** ball diameter at rest, as a multiple of the sheet's own width */
  lift?: number;
  /** play the light 12-frame canvas sequence instead of the 22-frame stack */
  mobile?: boolean;
};

/**
 * The crushed sheet, playing back across `range` of the scene's progress and
 * dissolving into whatever sits beneath it over `fade`.
 *
 * `tilt` is the picture-plane rotation the live sheet is at when it takes
 * over — the ball rotates toward it rather than to zero, so the two objects
 * share one rotation trajectory across the cut.
 */
export function CrumpledSheet(props: Props) {
  return props.mobile ? <CrumpleCanvas {...props} /> : <CrumpleLayers {...props} />;
}

/**
 * The transform channels, shared by both renderers.
 *
 * These are the backward continuation of the live sheet's own: at the end of
 * `range` they arrive exactly at the values PaperPhysics starts from, so the
 * dissolve happens between two objects that are already in the same place, at
 * the same size, on the same rotation.
 *
 * Everything physical — the frames and the transform channels — finishes at
 * the moment the dissolve starts, so for the whole of the cross-fade the two
 * sheets are the same size, in the same place, on the same rotation. That is
 * the only way the cut disappears: the eye is given nothing that moves.
 */
function useBody({ p, range, fade, tilt = -12, lift = 1.75 }: Props) {
  const a = range[0];
  const b = fade[0];
  const at = (v: number) => a + (b - a) * v;

  const scale = useTransform(
    p,
    [at(0), at(0.45), at(0.75), at(0.92), at(1)],
    [lift, lift * 0.9, lift * 0.62, 1.05, 0.96],
  );
  const rotate = useTransform(p, [at(0), at(0.35), at(0.7), at(1)], [tilt * 2.1, tilt * 1.7, tilt * 1.25, tilt]);
  const rotateX = useTransform(p, [at(0), at(0.6), at(1)], [3, 6, 8]);
  const rotateY = useTransform(p, [at(0), at(0.6), at(1)], [-4, -9, -12]);
  const opacity = useScrub(p, [fade[0], fade[1]], [1, 0]);
  return { a, b, at, scale, rotate, rotateX, rotateY, opacity };
}

/* ─────────────────────── desktop: 22 stacked layers ─────────────────────── */

function CrumpleLayers(props: Props) {
  const { p, lang } = props;
  const { a, b, at, scale, rotate, rotateX, rotateY, opacity } = useBody(props);
  const layers = useRef<(HTMLImageElement | null)[]>([]);
  const shown = useRef(-1);

  /* Frame selection is imperative: two layers are lit at a time — the lower
     one opaque, the next fading in over it — and the rest are taken out of the
     compositor entirely. Nothing here touches layout. */
  useEffect(() => {
    const paint = (v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      const { lo, frac } = frameAt(t, CRUMPLE_FRAMES, 1.55);
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
      const top = layers.current[lo + 1];
      if (top) top.style.opacity = mix(frac).toFixed(3);
    };
    paint(p.get());
    return p.on("change", paint);
  }, [p, a, b]);
  // a language switch swaps every source; start the new set again from the top
  useEffect(() => {
    shown.current = -1;
  }, [lang]);

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

/* ─────────────────────── mobile: one canvas surface ─────────────────────── */

function CrumpleCanvas(props: Props) {
  const { p, lang } = props;
  const { a, b, at, scale, rotate, rotateX, rotateY, opacity } = useBody(props);
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    /* `alpha` is required — the sheet has a silhouette, not a background — but
       `desynchronized` lets the browser skip a round of compositor sync, and
       the context is read once and kept rather than re-fetched per paint. */
    const ctx = cvs.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    /* ── BACKING STORE SIZE ──
       The bake is 560 × 706 and the sheet renders at roughly 180–340 CSS px
       on a phone, so the native bake is already comfortably over 1× and there
       is nothing to gain by asking for more. What matters is the ceiling: a
       DPR-3 device would otherwise be handed a canvas three times the linear
       size of the thing on screen — nine times the pixels to clear and
       redraw, every frame, for detail no one can see. Capped at 2, and never
       above the bake's own resolution, because upscaling a 560px source into
       a larger surface is pure cost for no extra information. */
    const dpr = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 2);
    const cssW = cvs.clientWidth || M_W / dpr;
    const W = Math.min(M_W, Math.round(cssW * dpr));
    const H = Math.round((W / M_W) * M_H);
    if (cvs.width !== W || cvs.height !== H) {
      cvs.width = W;
      cvs.height = H;
    }

    /* Decoded once, held as plain Images. 12 frames × ~8 KB is a smaller
       download than a single one of the desktop frames, and the whole set is
       resident before the first swipe finishes. */
    const imgs: HTMLImageElement[] = [];
    const ready: boolean[] = new Array(CRUMPLE_FRAMES_M).fill(false);
    let live = true;

    let last = -1; // the frame pair currently on the canvas
    let lastFrac = -1;
    let visible = true;
    let pending = 0; // progress waiting to be drawn while offscreen

    const draw = (v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      const { lo, frac } = frameAt(t, CRUMPLE_FRAMES_M, 1.12);
      const q = Math.round(mix(frac) * 100) / 100;
      // nothing visibly changed — the commonest case mid-frame, and free
      if (lo === last && q === lastFrac) return;
      last = lo;
      lastFrac = q;
      if (!ready[lo]) return;

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(imgs[lo], 0, 0, W, H);
      /* At most one more. Two source images, one destination surface — after
         this call there is still exactly one live layer on the page. */
      if (q > 0 && ready[lo + 1]) {
        ctx.globalAlpha = q;
        ctx.drawImage(imgs[lo + 1], 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    };

    /* Painted straight from the scroll handler, deliberately. framer's scroll
       progress is already coalesced to one emission per animation frame, so
       this is one paint per frame either way — and hopping through another
       requestAnimationFrame would only push the paper a frame behind the
       finger, which is the exact lag this renderer exists to remove. */
    const onChange = (v: number) => {
      if (!visible) {
        pending = v;
        return;
      }
      draw(v);
    };

    /* ── PREDECODE ──
       `load` only means the bytes arrived. The first `drawImage` of an
       undecoded WebP decodes it synchronously, on the main thread, in the
       middle of a scroll — which is a stall precisely where it is least
       affordable. `decode()` moves that work off the critical path and
       resolves only once the bitmap is genuinely ready to paint, so a frame
       is marked ready when it can actually be drawn for free.

       Frame 0 leads and is fetched at high priority: it is what the visitor
       sees before they have scrolled at all, so it must never be missing. The
       next few follow it so the opening swipe has somewhere to go, and the
       tail arrives while the headline is being read.

       Only the current language's set is ever requested — an English reader
       must never pull the Arabic bake, and vice versa. */
    for (let i = 0; i < CRUMPLE_FRAMES_M; i++) {
      const img = new Image();
      img.decoding = "async";
      if (i < 4) img.fetchPriority = "high";
      const settle = () => {
        if (!live) return;
        ready[i] = true;
        // whatever is on screen may now be drawable — force the next paint
        if (i === last || i === last + 1) {
          last = -1;
          draw(p.get());
        }
      };
      img.src = srcOf(lang, i, true);
      // decode() rejects on a broken image; onload is the honest fallback for
      // a browser that resolves it differently, and a frame that never
      // arrives simply holds the previous one rather than blanking the sheet.
      img.decode().then(settle, () => {
        if (img.complete && img.naturalWidth) settle();
        else img.onload = settle;
      });
      imgs.push(img);
    }

    /* Nothing above or below the viewport gets painted. When the scene comes
       back, one catch-up draw puts it at the right frame immediately. */
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) draw(pending || p.get());
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(cvs);

    draw(p.get());
    const stop = p.on("change", onChange);
    return () => {
      live = false;
      stop();
      io.disconnect();
      for (const img of imgs) img.onload = null;
    };
  }, [p, a, b, lang]);

  /* The grounding shadow is a separate, static ellipse rather than a filter on
     the sheet: a drop-shadow over a canvas whose pixels change every frame has
     to be recomputed every frame, and this reads the same. It tightens and
     darkens under the ball and spreads as the sheet opens — through opacity
     and scale only. */
  const shX = useTransform(p, [at(0), at(0.55), at(1)], [0.34, 0.66, 1]);
  const shY = useTransform(p, [at(0), at(0.55), at(1)], [0.3, 0.6, 0.92]);
  const shO = useScrub(p, [at(0), at(0.55), at(1)], [0.34, 0.22, 0.14]);

  return (
    <motion.div
      className="cz cz-m"
      aria-hidden
      style={{ opacity, scale, rotate, rotateX, rotateY, transformPerspective: 1200 }}
    >
      <motion.span className="cz-sh" style={{ scaleX: shX, scaleY: shY, opacity: shO }} />
      <canvas ref={cvsRef} width={M_W} height={M_H} className="cz-c" />
      <style>{`
        .cz { position: absolute; inset: 0; z-index: 3; pointer-events: none; transform-style: preserve-3d; }
        /* identical framing to the desktop layers: 180% wide, pulled back by
           40%, so the A4 baked into the middle of the frame lands exactly on
           the live sheet underneath it */
        .cz-c {
          position: absolute; left: -${((SCALE - 1) / 2) * 100}%; top: 50%;
          width: ${SCALE * 100}%; max-width: none; height: auto;
          transform: translateY(-50%); transform-origin: center;
        }
        .cz-sh {
          position: absolute; left: 50%; top: 62%; width: 78%; aspect-ratio: 2.6 / 1;
          margin-left: -39%; border-radius: 50%; transform-origin: center;
          background: radial-gradient(closest-side, rgba(30,26,20,0.9) 0%, rgba(30,26,20,0.42) 52%, rgba(30,26,20,0) 100%);
        }
      `}</style>
    </motion.div>
  );
}
