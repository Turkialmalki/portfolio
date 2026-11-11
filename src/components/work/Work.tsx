"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { LuArrowUpRight } from "react-icons/lu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { trackEvent } from "@/lib/analytics";
import CaseModal from "./CaseModal";
import { buildWork } from "./workData";

const COPY = {
  ar: {
    kicker: "",
    title: "أعمالي",
    sub: "اضغط على أي مشروع لتقرأ قصته.",
    open: "افتح القصة",
  },
  en: {
    kicker: "",
    title: "Work",
    sub: "Tap a project to read its story.",
    open: "Open the story",
  },
} as const;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/* Where card i pins, in px from the top: a fixed base clear of the header plus
   a small step per card, so the edge of every card already passed stays
   visible above the current one. Mirrored by --pin in the CSS. */
const PIN_BASE = 84;
const PIN_STEP = 14;
const pin = (i: number) => PIN_BASE + PIN_STEP * i;

/**
 * The showcase is a deck of full-screen cards, each pinned (position: sticky)
 * as it arrives so the next one slides up over it.
 *
 *   --e  how far THIS card has arrived   (0 = just entering, 1 = pinned)
 *   --q  how far the NEXT card has covered it (0 = alone, 1 = fully covered)
 *
 * One passive scroll listener + one rAF writes those two numbers per card; all
 * the visual work (tilt, rise, shrink, dim) is CSS reading them, so it is
 * scrubbed by the scrollbar and reversible by construction. Only transform and
 * opacity are driven — no filter, no blur.
 */
export default function Work() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();
  const cases = useMemo(() => buildWork(lang), [lang]);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const index = cases.findIndex((c) => c.id === openId);
  const current = index >= 0 ? cases[index] : null;

  useEffect(() => {
    const cards = cardRefs.current;
    const last = new Map<HTMLElement, string>();
    const set = (el: HTMLElement, e: number, q: number) => {
      const key = `${e.toFixed(3)}|${q.toFixed(3)}`;
      if (last.get(el) === key) return;
      last.set(el, key);
      el.style.setProperty("--e", e.toFixed(3));
      el.style.setProperty("--q", q.toFixed(3));
    };

    if (reduced) {
      cards.forEach((el) => el && set(el, 1, 0));
      return;
    }

    let raf = 0;
    const render = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top > vh * 1.2) {
          set(el, 0, 0);
          continue;
        }
        const nextEl = cards[i + 1];
        const nextTop = nextEl ? nextEl.getBoundingClientRect().top : vh;
        set(
          el,
          clamp01((vh - top) / (vh - pin(i))),
          nextEl ? clamp01((vh - nextTop) / (vh - pin(i + 1))) : 0,
        );
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cases, reduced]);

  /* desktop only: the screenshot leans a few degrees toward the pointer */
  const tilt = useCallback((ev: React.PointerEvent<HTMLElement>) => {
    if (ev.pointerType !== "mouse") return;
    const el = ev.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
  }, []);
  const untilt = useCallback((ev: React.PointerEvent<HTMLElement>) => {
    ev.currentTarget.style.setProperty("--ry", "0deg");
    ev.currentTarget.style.setProperty("--rx", "0deg");
  }, []);

  const open = useCallback((id: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpenId(id);
  }, []);
  const close = useCallback(() => setOpenId(null), []);
  const next = useCallback(() => {
    setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setOpenId((id) => {
      const i = cases.findIndex((c) => c.id === id);
      return cases[(i + 1) % cases.length].id;
    });
  }, [cases]);

  return (
    <section id="work" className="sc-root" aria-labelledby="sc-title">
      <header className="sc-head">
        
        <h2 id="sc-title">{copy.title}</h2>
        <p>{copy.sub}</p>
      </header>

      <div className="sc-deck">
        {cases.map((c, i) => (
          <article
            key={c.id}
            className="sc-card"
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{ "--accent": c.accent, "--i": i, "--e": reduced ? 1 : 0, "--q": 0 } as CSSProperties}
          >
            <div className="sc-inner">
              <div className="sc-copy">
                <span className="sc-meta">{[c.industry, c.year].filter(Boolean).join(" · ")}</span>
                <h3 aria-label={c.title}>
                  {c.title.split(" ").map((w, k) => (
                    <span key={k} className="sc-w" aria-hidden="true" style={{ "--w": k } as CSSProperties}>
                      <span>{w}</span>
                    </span>
                  ))}
                </h3>
                <p>{c.subtitle}</p>
                <ul className="sc-tags" aria-hidden="true">
                  {c.tags.slice(0, 4).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="sc-open"
                  aria-haspopup="dialog"
                  onClick={(e) => {
                    trackEvent("work_tile_click", { case: c.id });
                    open(c.id, e.currentTarget);
                  }}
                >
                  {copy.open}
                  <LuArrowUpRight size={18} />
                </button>
              </div>

              <button
                type="button"
                className="sc-frame"
                tabIndex={-1}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                aria-label={`${c.title} — ${copy.open}`}
                onClick={(e) => {
                  trackEvent("work_tile_click", { case: c.id });
                  open(c.id, e.currentTarget);
                }}
              >
                {c.cover ? (
                  <Image
                    src={c.cover}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 90vw, 640px"
                    className="sc-img"
                    style={{ objectPosition: c.pos }}
                  />
                ) : (
                  <span className="sc-art" aria-hidden="true">
                    <b>{c.title}</b>
                    <i>{c.industry}</i>
                  </span>
                )}
              </button>

              <span className="sc-dim" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <CaseModal
            key="case"
            item={current}
            next={cases[(index + 1) % cases.length]}
            origin={origin}
            onClose={close}
            onNext={next}
          />
        )}
      </AnimatePresence>

      <style>{`
        .sc-root { background: var(--bg-primary); color: var(--text-primary); }
        .sc-head { max-width: 1120px; margin: 0 auto; padding: clamp(80px, 14vw, 170px) clamp(20px, 4vw, 40px) clamp(28px, 5vw, 56px); }
        .sc-kicker { font-size: 13px; font-weight: 700; letter-spacing: .08em; color: var(--accent); }
        .sc-head h2 { margin: 12px 0 14px; font-size: clamp(38px, 8vw, 88px); line-height: 1.06; font-weight: 900; }
        .sc-head p { margin: 0; max-width: 46ch; font-size: clamp(16px, 2vw, 20px); line-height: 1.7; color: var(--text-secondary); }

        .sc-deck { max-width: 1120px; margin: 0 auto; padding: 0 clamp(14px, 3vw, 24px) clamp(60px, 10vw, 120px); }
        .sc-card {
          --pin: calc(84px + var(--i) * 14px);
          position: sticky; top: var(--pin); margin-bottom: clamp(40px, 9svh, 96px);
        }
        .sc-card:last-child { margin-bottom: 0; }

        /* a calm surface tinted by the project's own colour — Apple/Revolut, not a poster */
        .sc-inner {
          position: relative; overflow: hidden; isolation: isolate;
          height: clamp(500px, 68svh, 600px); border-radius: clamp(26px, 3vw, 36px);
          background: color-mix(in srgb, var(--accent) 9%, var(--bg-card));
          border: 1px solid var(--border-subtle);
          padding: clamp(24px, 4vw, 52px);
          transform: scale(calc(1 - var(--q) * 0.05)); transform-origin: 50% 0; will-change: transform;
          box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 18px 48px rgba(0,0,0,.08);
        }
        .sc-copy { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; max-width: 460px; }
        .sc-meta { font-size: 13px; font-weight: 700; letter-spacing: .02em; color: var(--text-secondary); }
        .sc-copy h3 { margin: 0; font-size: clamp(34px, 6vw, 60px); line-height: 1.12; font-weight: 900; letter-spacing: -0.01em; }
        /* each word slides up out of its own mask, one after the other */
        .sc-w { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .08em; margin-inline-end: .26em; }
        .sc-w > span {
          display: inline-block;
          transform: translateY(calc((1 - clamp(0, calc((var(--e) - .12 - var(--w) * .09) * 3.2), 1)) * 115%));
        }
        .sc-copy p { margin: 0; font-size: clamp(16px, 1.8vw, 20px); line-height: 1.5; color: var(--text-secondary); }
        .sc-tags { display: none; gap: 8px; flex-wrap: wrap; margin: 10px 0 0; padding: 0; list-style: none; }
        .sc-tags li { font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 99px; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--text-primary); }
        .sc-open {
          margin-top: 14px; min-height: 48px; padding: 0 22px; border: 0; border-radius: 99px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px; font: inherit; font-weight: 700; font-size: 15px;
          background: var(--text-primary); color: var(--bg-primary); transition: transform .4s cubic-bezier(.16,1,.3,1);
        }
        .sc-open:focus-visible, .sc-frame:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

        /* words rise as the card arrives, one behind the other */
        .sc-meta, .sc-copy p, .sc-tags, .sc-open {
          opacity: clamp(0, calc((var(--e) - .35) * 3), 1);
          transform: translateY(calc((1 - var(--e)) * 36px));
        }

        /* the screenshot sits in the lower part of the card and runs off its edge */
        .sc-frame {
          position: absolute; z-index: 1; inset-inline: clamp(20px, 5vw, 48px); bottom: 0; aspect-ratio: 16 / 9; max-height: 52%;
          border: 0; padding: 0; cursor: pointer; overflow: hidden;
          border-radius: 20px 20px 0 0; background: color-mix(in srgb, var(--accent) 12%, var(--bg-card-muted));
          box-shadow: 0 -10px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06);
          transform: perspective(1100px) translateY(calc((1 - var(--e)) * 90px)) scale(calc(.94 + var(--e) * .06))
            rotateX(calc(var(--rx, 0deg) + (1 - var(--e)) * 10deg)) rotateY(var(--ry, 0deg));
          transform-origin: 50% 100%; transition: transform .25s ease-out;
          will-change: transform; -webkit-tap-highlight-color: transparent;
        }
        .sc-img { object-fit: cover; transform: scale(calc(1.16 - var(--e) * .16)); transform-origin: 50% 40%; }
        .sc-art { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 6px; padding: 20px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 34%, transparent), transparent 75%); }
        .sc-art b { font-size: clamp(26px, 5vw, 54px); font-weight: 900; line-height: 1.1; }
        .sc-art i { font-style: normal; font-size: 14px; color: var(--text-secondary); }
        .sc-dim { position: absolute; inset: 0; z-index: 5; background: var(--bg-primary); opacity: calc(var(--q) * .55); pointer-events: none; }

        @media (min-width: 900px) {
          .sc-inner { height: clamp(460px, 62svh, 560px); }
          .sc-tags { display: flex; }
          .sc-frame { inset-inline-start: auto; inset-inline-end: 0; width: 60%; max-height: 86%; bottom: 0;
            aspect-ratio: 16 / 10; border-radius: 24px 0 0 0; }
          [dir="rtl"] .sc-frame { border-radius: 0 24px 0 0; }
        }
        @media (hover: hover) and (pointer: fine) {
          .sc-open:hover { transform: translateY(-2px) scale(1.03); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sc-inner, .sc-frame, .sc-img, .sc-w > span, .sc-copy > * { transform: none !important; opacity: 1 !important; }
          .sc-dim { display: none; }
        }
      `}</style>
    </section>
  );
}
