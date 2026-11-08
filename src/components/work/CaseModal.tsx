"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { LuArrowUpRight, LuX } from "react-icons/lu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { trackEvent } from "@/lib/analytics";
import type { Chapter, WorkCase } from "./workData";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const COPY = {
  ar: { close: "إغلاق", next: "القصة التالية", gallery: "من داخل المشروع", visit: "فتح" },
  en: { close: "Close", next: "Next story", gallery: "Inside the project", visit: "Open" },
} as const;

/* ------------------------------------------------------------------ */
/* Count-up                                                            */
/* ------------------------------------------------------------------ */

/**
 * "−78%", "+90%", "1,000+", "64%": the number is counted up from zero and the
 * words around it are left alone. A value with no digit in it ("Instant") is
 * printed as written. The number is wrapped LTR so a minus or plus sign cannot
 * be reordered to the wrong side of it inside Arabic text.
 */
export function CountUp({ value, run }: { value: string; run: boolean }) {
  const reduced = useSafeReducedMotion();
  const m = /^(\D*?)(\d[\d,]*\.?\d*)(.*)$/.exec(value);
  const [shown, setShown] = useState(0);

  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const grouped = !!m && m[2].includes(",");

  useEffect(() => {
    if (!m || !run || reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1300);
      setShown(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduced, target]);

  if (!m) return <bdi>{value}</bdi>;

  const n = reduced || !run ? (reduced ? target : 0) : shown;
  const text = grouped
    ? Math.round(n).toLocaleString("en-US")
    : n.toFixed(decimals);

  return (
    <bdi dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {m[1]}
      {text}
      {m[3]}
    </bdi>
  );
}

function Metric({ value, label, body }: { value: string; label: string; body?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="cm-metric" ref={ref}>
      <strong>
        <CountUp value={value} run={run} />
      </strong>
      <span>{label}</span>
      {body && <p>{body}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapters                                                            */
/* ------------------------------------------------------------------ */

function ChapterBlock({ c, index }: { c: Chapter; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <section className="cm-chapter" data-rv>
      <header className="cm-chapter-head">
        <span className="cm-chapter-n">{n}</span>
        <span className="cm-chapter-label">{c.label}</span>
      </header>

      {c.kind === "text" && <p className="cm-lead">{c.body}</p>}

      {c.kind === "pair" && (
        <div className="cm-pair">
          {[c.left, c.right].map((side, i) => (
            <div key={i} className="cm-pair-side" style={{ "--i": i } as CSSProperties}>
              <h4>{side.title}</h4>
              <p>{side.body}</p>
            </div>
          ))}
        </div>
      )}

      {c.kind === "cards" && (
        <div className="cm-cards">
          {c.items.map((it, i) => (
            <article key={it.title} className="cm-card" style={{ "--i": i } as CSSProperties}>
              <h4>{it.title}</h4>
              <p>{it.body}</p>
            </article>
          ))}
        </div>
      )}

      {c.kind === "list" && (
        <>
          {c.body && <p className="cm-lead">{c.body}</p>}
          <ul className="cm-list">
            {c.items.map((it, i) => (
              <li key={it} style={{ "--i": i } as CSSProperties}>
                {it}
              </li>
            ))}
          </ul>
        </>
      )}

      {c.kind === "metrics" && (
        <div className="cm-metrics">
          {c.items.map((it) => (
            <Metric key={it.label} {...it} />
          ))}
        </div>
      )}

      {c.kind === "quote" && <blockquote className="cm-quote">{c.body}</blockquote>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export default function CaseModal({
  item,
  next,
  origin,
  onClose,
  onNext,
}: {
  item: WorkCase;
  next: WorkCase;
  /** viewport point the pop-up grows out of: the centre of the tile that opened it */
  origin: { x: number; y: number };
  onClose: () => void;
  onNext: () => void;
}) {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Lock the page behind the dialog, return focus to the tile on the way out,
     and keep Tab inside. The scrollbar's width is added back as padding so a
     desktop page does not jump sideways when its scrollbar disappears. */
  useEffect(() => {
    const html = document.documentElement;
    const opener = document.activeElement as HTMLElement | null;
    const gutter = window.innerWidth - html.clientWidth;
    const prevOverflow = html.style.overflow;
    const prevPad = html.style.paddingInlineEnd;
    html.style.overflow = "hidden";
    if (gutter > 0) html.style.paddingInlineEnd = `${gutter}px`;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;
      const f = rootRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      html.style.paddingInlineEnd = prevPad;
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  /* A new story starts at the top, and its chapters are re-armed. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.scrollTop = 0;
    const els = panel.querySelectorAll<HTMLElement>("[data-rv]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "1";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => {
      delete el.dataset.in;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [item.id]);

  useEffect(() => {
    trackEvent("work_case_open", { case: item.id });
  }, [item.id]);

  const style = {
    "--cm-accent": item.accent,
    "--cm-ground": item.ground,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="cm-root"
      style={style}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <motion.button
        type="button"
        className="cm-backdrop"
        aria-label={copy.close}
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.35 }}
      />

      {/* The whole sheet grows out of the tile that was tapped. Only transform
          and opacity animate — no filter, no blur — so it stays cheap on a
          phone. */}
      <motion.div
        className="cm-stage"
        style={{ transformOrigin: `${origin.x}px ${origin.y}px` }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        transition={{ duration: reduced ? 0.01 : 0.55, ease: EASE }}
      >
        <div className="cm-panel" ref={panelRef} tabIndex={-1}>
          <button
            ref={closeRef}
            type="button"
            className="cm-close"
            onClick={onClose}
            aria-label={copy.close}
          >
            <LuX size={20} />
          </button>

          <header className="cm-hero">
            {item.cover ? (
              <Image
                src={item.cover}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 1000px"
                className="cm-hero-img"
                priority
              />
            ) : (
              <span className="cm-hero-num" aria-hidden="true">
                {item.num}
              </span>
            )}
            <div className="cm-hero-shade" />
            <div className="cm-hero-copy">
              <span className="cm-eyebrow">
                {[item.industry, item.year].filter(Boolean).join(" · ")}
              </span>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </div>
          </header>

          <div className="cm-body">
            {item.tags.length > 0 && (
              <ul className="cm-tags" aria-hidden="true">
                {item.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}

            {item.chapters.map((c, i) => (
              <ChapterBlock key={`${item.id}-${i}`} c={c} index={i} />
            ))}

            {item.gallery.length > 0 && (
              <section className="cm-chapter" data-rv>
                <header className="cm-chapter-head">
                  <span className="cm-chapter-n">
                    {String(item.chapters.length + 1).padStart(2, "0")}
                  </span>
                  <span className="cm-chapter-label">{copy.gallery}</span>
                </header>
                <div className="cm-gallery">
                  {item.gallery.map((g) => (
                    <figure key={g.src} className="cm-shot">
                      <div className="cm-shot-frame">
                        <Image src={g.src} alt={g.label} fill sizes="(max-width: 900px) 84vw, 480px" />
                      </div>
                      <figcaption>{g.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <footer className="cm-foot">
              {item.link && (
                <a
                  className="cm-link"
                  href={item.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("work_case_link_click", { case: item.id })}
                >
                  {item.link.label}
                  <LuArrowUpRight size={18} />
                </a>
              )}
              <button type="button" className="cm-next" onClick={onNext}>
                <span>{copy.next}</span>
                <strong>{next.title}</strong>
              </button>
            </footer>
          </div>
        </div>
      </motion.div>

      <style>{`
        .cm-root { position: fixed; inset: 0; z-index: 3000; }
        .cm-backdrop {
          position: absolute; inset: 0; width: 100%; border: 0; padding: 0;
          background: rgba(6, 7, 10, 0.72); cursor: pointer;
        }
        .cm-stage {
          position: absolute; inset: 0; display: flex; align-items: center;
          justify-content: center; pointer-events: none;
          padding: clamp(10px, 3vw, 40px);
        }
        .cm-panel {
          pointer-events: auto; position: relative; width: min(1040px, 100%);
          max-height: 100%; overflow-y: auto; overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          background: var(--bg-primary); color: var(--text-primary);
          border-radius: 28px; box-shadow: 0 40px 120px rgba(0,0,0,0.5);
          outline: none; contain: content;
        }

        .cm-close {
          position: sticky; top: 12px; z-index: 5; float: inline-end;
          margin: 12px 12px -56px 12px; width: 44px; height: 44px; border-radius: 50%;
          display: grid; place-items: center; border: 1px solid rgba(255,255,255,0.28);
          background: rgba(10,11,14,0.62); color: #fff; cursor: pointer;
        }
        .cm-close:focus-visible, .cm-link:focus-visible, .cm-next:focus-visible {
          outline: 2px solid var(--cm-accent); outline-offset: 3px;
        }

        .cm-hero {
          position: relative; aspect-ratio: 16 / 8; min-height: 260px; max-height: 460px;
          background: var(--cm-ground); overflow: hidden; color: #fff;
          display: flex; align-items: flex-end;
        }
        .cm-hero-img { object-fit: cover; object-position: center 30%; }
        .cm-hero-num {
          position: absolute; inset-inline-end: 4%; top: 50%; transform: translateY(-54%);
          font-size: clamp(160px, 34vw, 380px); font-weight: 900; line-height: 1;
          color: transparent; -webkit-text-stroke: 2px var(--cm-accent); opacity: 0.55;
          font-variant-numeric: tabular-nums;
        }
        .cm-hero-shade {
          position: absolute; inset: 0;
          background:
            linear-gradient(0deg, rgba(8,9,12,0.88) 0%, rgba(8,9,12,0.15) 62%, transparent 100%);
        }
        .cm-hero-copy { position: relative; padding: clamp(20px, 4vw, 44px); max-width: 760px; }
        .cm-eyebrow {
          display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          padding: 6px 12px; border-radius: 99px; background: var(--cm-accent); color: #07090d;
        }
        .cm-hero-copy h3 {
          margin: 14px 0 6px; font-size: clamp(32px, 6.4vw, 64px); line-height: 1.12; font-weight: 900;
        }
        .cm-hero-copy p { margin: 0; font-size: clamp(15px, 2vw, 19px); opacity: 0.86; line-height: 1.6; }

        .cm-body { padding: clamp(20px, 4vw, 48px); padding-bottom: calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-bottom, 0px)); }
        .cm-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 8px; padding: 0; list-style: none; }
        .cm-tags li {
          font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 99px;
          background: var(--chip-bg); color: var(--chip-text);
        }

        .cm-chapter { padding-top: clamp(28px, 5vw, 56px); }
        .cm-chapter-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .cm-chapter-n {
          font-size: 13px; font-weight: 800; color: var(--cm-accent); font-variant-numeric: tabular-nums;
        }
        .cm-chapter-label {
          font-size: 13px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-secondary);
        }
        .cm-chapter-head::after { content: ""; flex: 1; height: 1px; background: var(--border-subtle); }

        .cm-lead { margin: 0; font-size: clamp(18px, 2.4vw, 26px); line-height: 1.7; font-weight: 500; max-width: 46ch; }
        .cm-pair { display: grid; gap: 28px; grid-template-columns: 1fr; }
        .cm-pair-side h4, .cm-card h4 { margin: 0 0 8px; font-size: 18px; font-weight: 800; line-height: 1.4; }
        .cm-pair-side p, .cm-card p { margin: 0; font-size: 16px; line-height: 1.75; color: var(--text-secondary); }
        .cm-cards { display: grid; gap: 12px; grid-template-columns: 1fr; }
        .cm-card {
          padding: 20px; border-radius: 20px; background: var(--bg-card);
          border: 1px solid var(--border-color);
        }
        .cm-list { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
        .cm-list li {
          position: relative; padding: 14px 18px; padding-inline-start: 44px; border-radius: 16px;
          background: var(--bg-card); font-size: 16px; line-height: 1.65;
        }
        .cm-list li::before {
          content: ""; position: absolute; inset-inline-start: 18px; top: 22px; width: 10px; height: 10px;
          border-radius: 50%; background: var(--cm-accent);
        }
        .cm-metrics { display: grid; gap: 12px; grid-template-columns: 1fr; }
        .cm-metric {
          padding: 22px 22px 20px; border-radius: 22px; background: var(--cm-ground); color: #fff;
        }
        .cm-metric strong {
          display: block; font-size: clamp(40px, 8vw, 64px); line-height: 1.05; font-weight: 900;
          color: var(--cm-accent); font-variant-numeric: tabular-nums;
        }
        .cm-metric span { display: block; margin-top: 6px; font-size: 15px; font-weight: 700; }
        .cm-metric p { margin: 8px 0 0; font-size: 14px; line-height: 1.65; opacity: 0.74; }
        .cm-quote {
          margin: 0; padding-inline-start: 22px; border-inline-start: 4px solid var(--cm-accent);
          font-size: clamp(18px, 2.4vw, 24px); line-height: 1.75; font-weight: 500;
        }

        .cm-gallery {
          display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory;
          margin-inline: calc(clamp(20px, 4vw, 48px) * -1); padding-inline: clamp(20px, 4vw, 48px);
          padding-bottom: 6px; scrollbar-width: thin;
        }
        .cm-shot { margin: 0; flex: 0 0 min(84%, 480px); scroll-snap-align: start; }
        .cm-shot-frame { position: relative; aspect-ratio: 16 / 10; border-radius: 18px; overflow: hidden; background: var(--bg-card); }
        .cm-shot-frame img { object-fit: cover; }
        .cm-shot figcaption { margin-top: 10px; font-size: 14px; color: var(--text-secondary); }

        .cm-foot {
          display: flex; flex-wrap: wrap; gap: 12px; align-items: stretch;
          margin-top: clamp(32px, 5vw, 56px); padding-top: 24px; border-top: 1px solid var(--border-subtle);
        }
        .cm-link, .cm-next {
          min-height: 52px; border-radius: 99px; padding: 0 24px; display: inline-flex; align-items: center;
          gap: 10px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none;
        }
        .cm-link { background: var(--cm-accent); color: #07090d; border: 0; }
        .cm-next {
          margin-inline-start: auto; flex-direction: column; align-items: flex-start; justify-content: center;
          gap: 0; padding: 8px 24px; border: 1px solid var(--border-subtle); background: transparent; color: inherit;
        }
        .cm-next span { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
        .cm-next strong { font-size: 16px; }

        /* chapters rise in as they are scrolled to; children stagger by --i */
        .cm-chapter[data-rv] { opacity: 0; transform: translateY(34px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .cm-chapter[data-in="1"] { opacity: 1; transform: none; }
        .cm-chapter[data-rv] .cm-card, .cm-chapter[data-rv] .cm-pair-side, .cm-chapter[data-rv] .cm-list li, .cm-chapter[data-rv] .cm-metric {
          opacity: 0; transform: translateY(22px) scale(0.97);
          transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1);
          transition-delay: calc(var(--i, 0) * 90ms + 120ms);
        }
        .cm-chapter[data-in="1"] .cm-card, .cm-chapter[data-in="1"] .cm-pair-side, .cm-chapter[data-in="1"] .cm-list li, .cm-chapter[data-in="1"] .cm-metric {
          opacity: 1; transform: none;
        }

        @media (min-width: 720px) {
          .cm-pair { grid-template-columns: 1fr 1fr; gap: 40px; }
          .cm-cards { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
          .cm-metrics { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        }

        /* Phones: a full-height sheet from the bottom edge, not a floating card. */
        @media (max-width: 640px) {
          .cm-stage { padding: 0; align-items: flex-end; }
          .cm-panel { border-radius: 24px 24px 0 0; max-height: 94dvh; width: 100%; }
          .cm-hero { aspect-ratio: 4 / 3; max-height: none; }
          .cm-next { margin-inline-start: 0; width: 100%; }
          .cm-link { width: 100%; justify-content: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cm-chapter[data-rv], .cm-chapter[data-rv] .cm-card, .cm-chapter[data-rv] .cm-pair-side,
          .cm-chapter[data-rv] .cm-list li, .cm-chapter[data-rv] .cm-metric {
            opacity: 1; transform: none; transition: none;
          }
        }
      `}</style>
    </div>
  );
}
