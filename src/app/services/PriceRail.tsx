"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { COMING_SOON, PRICE_RAIL, formatPrice, type Lang } from "@/data/careerServices";

/* ═══════════════════════════════════════════════════════════════════════
   PRICE RAIL — a scroll-linked instrument, not a cart.

   One small fixed readout that stays in step with the journey: as each
   service takes the viewport's centre line, the chapter number, the name and
   the price roll vertically to the next entry, the way a premium financial
   interface steps a figure. Two springs of slightly different weight drive the
   name and the price, so they arrive a beat apart instead of as a block.

   Currency follows language: English renders USD, Arabic renders SAR, never
   both. The figures come from the service config; nothing is converted here.
   ═══════════════════════════════════════════════════════════════════════ */

/** Section ids the rail steps through, in scroll order. */
export const RAIL_SECTIONS = [
  "resumeReview",
  "resumeWriting",
  "publicSpeaking",
  "linkedinOptimization",
  "mvpPortfolio",
  "dashboardReporting",
  "completeBundle",
];

export function PriceRail({
  lang,
  hidden = false,
  lite = false,
}: {
  lang: Lang;
  hidden?: boolean;
  /** step the readout with a CSS transition instead of two live springs */
  lite?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const seen = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = RAIL_SECTIONS.indexOf(e.target.id);
          if (i < 0) continue;
          seen.set(i, e.isIntersecting ? e.intersectionRatio : 0);
        }
        // Whichever tracked section owns the viewport's centre band wins.
        let best: number | null = null;
        let bestV = 0;
        for (const [i, v] of seen) if (v > bestV) [best, bestV] = [i, v];
        setActive(bestV > 0 ? best : null);
      },
      // A thin band across the middle of the viewport: only one section can
      // realistically hold it, which keeps the readout from flickering.
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01, 0.5, 1] },
    );
    for (const id of RAIL_SECTIONS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const target = active ?? 0;
  const nameSpring = useSpring(target, { stiffness: 220, damping: 32, mass: 0.7 });
  const priceSpring = useSpring(target, { stiffness: 170, damping: 30, mass: 0.8 });
  useEffect(() => {
    // in lite mode the springs are never read, so never wake them
    if (lite) return;
    nameSpring.set(target);
    priceSpring.set(target);
  }, [target, lite, nameSpring, priceSpring]);

  // A percentage translate on the stack is a percentage of the *whole* stack,
  // so one entry is 100/N of it.
  const step = 100 / PRICE_RAIL.length;
  const springNameY = useTransform(nameSpring, (v) => `${-v * step}%`);
  const springPriceY = useTransform(priceSpring, (v) => `${-v * step}%`);
  const springProgress = useTransform(priceSpring, (v) => (v + 1) / PRICE_RAIL.length);

  /* ── the touch readout ──
     Two springs settling against each other is a lovely instrument and it is
     also two RAF loops running while a thumb is on the glass. The price does
     not actually track scroll — it changes when the ACTIVE CHAPTER changes,
     which is a handful of times over the whole page — so on touch it steps
     with a CSS transition instead: the browser runs it off the main thread and
     nothing is being computed in between. Two slightly different durations
     keep the name and the figure arriving a beat apart, as before. */
  const flatNameY = `${-target * step}%`;
  const flatPriceY = `${-target * step}%`;
  const nameY = lite ? flatNameY : springNameY;
  const priceY = lite ? flatPriceY : springPriceY;
  const progress = lite ? (target + 1) / PRICE_RAIL.length : springProgress;

  const show = active !== null && !hidden;

  return (
    <div className={`rail${show ? " rail-on" : ""}${lite ? " rail-lite" : ""}`} aria-hidden>
      <div className="rail-line">
        <span className="rail-win rail-win-name">
          <motion.span className="rail-stack" style={{ y: nameY }}>
            {PRICE_RAIL.map((s) => (
              <span key={s.index} className="rail-cell">
                <i>{s.index}</i>
                {s.name[lang]}
              </span>
            ))}
          </motion.span>
        </span>
        <span className="rail-win rail-win-price">
          <motion.span className="rail-stack" style={{ y: priceY }}>
            {/* A service with no price prints its availability instead —
                never a stale figure, and never another service's. */}
            {PRICE_RAIL.map((s) => (
              <span key={s.index} className="rail-cell rail-price">
                {s.price ? (
                  formatPrice(s.price, lang)
                ) : (
                  /* Inside the cell, never instead of it: the cell's height is
                     1.35em of the PRICE size, and the window rolls by a
                     percentage of the stack. A smaller font on the cell itself
                     would shorten that one row and throw every step after it
                     out of register. */
                  <i className="rail-soon">{COMING_SOON[lang]}</i>
                )}
              </span>
            ))}
          </motion.span>
        </span>
      </div>
      <span className="rail-prog">
        <motion.i style={{ scaleX: progress }} />
      </span>

      <style>{`
        .rail {
          position: fixed; z-index: 40; bottom: clamp(30px, 5vh, 52px);
          inset-inline-start: clamp(18px, 3vw, 40px);
          display: flex; flex-direction: column; gap: 8px;
          pointer-events: none; opacity: 0; transform: translateY(10px);
          transition: opacity 420ms ease, transform 420ms cubic-bezier(0.16,1,0.3,1);
        }
        .rail-on { opacity: 1; transform: none; }
        .rail-line { display: flex; flex-direction: column; gap: 2px; }
        .rail-win { display: block; overflow: hidden; height: 1.35em; }
        .rail-win-name { font-size: 10.5px; height: 1.6em; }
        .rail-win-price { font-size: clamp(19px, 2.1vw, 26px); }
        .rail-stack { display: block; will-change: transform; }
        /* 240ms for the name, 300ms for the figure — the same beat apart the
           two springs gave, for none of the per-frame cost. */
        .rail-lite .rail-stack { transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1); }
        .rail-lite .rail-win-price .rail-stack { transition-duration: 300ms; }
        .rail-lite .rail-prog i { transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1); }
        .rail-cell {
          display: flex; align-items: center; gap: 8px; height: 1.6em;
          font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-muted, #8b8b8b); white-space: nowrap;
        }
        .rail-cell i { font-style: normal; opacity: 0.55; }
        .rail-price {
          height: 1.35em; font-size: 1em; font-weight: 900; letter-spacing: -0.03em;
          text-transform: none; color: var(--text-primary, #0d0e12);
        }
        /* "COMING SOON" is a label, not a figure: it takes the label's size
           and weight so the rail never reads as a price it is not. */
        /* Two classes deep so it outranks the .rail-cell i rule, which would
           otherwise dim it to 0.55 along with the chapter numbers. */
        .rail-price .rail-soon {
          font-size: 0.46em; font-style: normal; font-weight: 800; opacity: 1;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted, #8b8b8b);
        }
        [dir="rtl"] .rail-price .rail-soon { font-size: 0.56em; letter-spacing: 0; }
        .rail-prog { display: block; width: 88px; height: 1px; background: currentColor; opacity: 0.18; }
        .rail-prog i { display: block; height: 100%; background: currentColor; opacity: 1; transform-origin: left center; }
        [dir="rtl"] .rail-prog i { transform-origin: right center; }

        /* ══ Arabic rail ══
           The rail is a rolling window: the stack translates by a percentage,
           so the window height and the cell height must stay identical. Arabic
           needs a taller cell than the 1.35/1.6em Latin one — bump BOTH, and
           the roll stays exactly in register. */
        [dir="rtl"] .rail-win { height: 1.7em; }
        [dir="rtl"] .rail-win-name { height: 2em; }
        [dir="rtl"] .rail-cell { height: 2em; line-height: 1.7; }
        [dir="rtl"] .rail-price { height: 1.7em; line-height: 1.4; unicode-bidi: isolate; }
        /* The chapter figure is Latin inside an Arabic label. */
        [dir="rtl"] .rail-cell i { unicode-bidi: isolate; }
        @media (max-width: 620px) {
          /* The bottom dock spans the full width on phones, so a 14px offset
             put the readout underneath it — the price was unreadable in both
             languages. Sit the rail on top of the dock instead. */
          .rail { bottom: 104px; inset-inline-start: 16px; gap: 6px; }
          .rail-win-price { font-size: 18px; }
          .rail-prog { width: 64px; }
        }
        @media (prefers-reduced-motion: reduce) { .rail-stack { will-change: auto; } }
      `}</style>
    </div>
  );
}
