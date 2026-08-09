"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { PRICE_RAIL, formatPrice, type Lang } from "@/data/careerServices";

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

export function PriceRail({ lang, hidden = false }: { lang: Lang; hidden?: boolean }) {
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
    nameSpring.set(target);
    priceSpring.set(target);
  }, [target, nameSpring, priceSpring]);

  // A percentage translate on the stack is a percentage of the *whole* stack,
  // so one entry is 100/N of it.
  const step = 100 / PRICE_RAIL.length;
  const nameY = useTransform(nameSpring, (v) => `${-v * step}%`);
  const priceY = useTransform(priceSpring, (v) => `${-v * step}%`);
  const progress = useTransform(priceSpring, (v) => (v + 1) / PRICE_RAIL.length);

  const show = active !== null && !hidden;

  return (
    <div className={`rail${show ? " rail-on" : ""}`} aria-hidden>
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
            {PRICE_RAIL.map((s) => (
              <span key={s.index} className="rail-cell rail-price">
                {formatPrice(s.price, lang)}
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
