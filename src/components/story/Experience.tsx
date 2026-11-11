"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { JOBS } from "@/data/profile";
import Reveal from "./Reveal";

const COPY = {
  ar: { title: "الخبرات العملية", sub: "من التدريب إلى قيادة الفرق.", now: "الآن" },
  en: { title: "Work experience", sub: "From intern to leading teams.", now: "Now" },
} as const;

/* A line runs down the side of the list and fills as the page scrolls past it;
   each job hangs off it on a dot that lights when the card arrives. */
export default function Experience() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      list.style.setProperty("--fill", "1");
      return;
    }
    let raf = 0;
    const render = () => {
      raf = 0;
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / r.height));
      list.style.setProperty("--fill", p.toFixed(3));
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
  }, []);

  return (
    <section id="experience" className="ex-root" aria-labelledby="ex-title">
      <div className="ex-wrap">
        <Reveal as="header" className="ex-head">
          <h2 id="ex-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </Reveal>

        <ol className="ex-list" ref={listRef}>
          <span className="ex-rail" aria-hidden="true" />
          {JOBS.map((j, i) => (
            <Reveal as="li" key={j.id} className="ex-item">
              <span className="ex-dot" aria-hidden="true" />
              <article className="ex-card">
                <header>
                  <span className="ex-logo" aria-hidden="true">
                    {j.logo ? <Image src={j.logo} alt="" width={96} height={96} /> : <b>{j.mono}</b>}
                  </span>
                  <div className="ex-who">
                    <h3>{j.org[lang]}</h3>
                    <span className="ex-role">{j.role[lang]}</span>
                  </div>
                  <span className={`ex-when${i === 0 ? " ex-now" : ""}`}>{i === 0 ? copy.now : j.when[lang]}</span>
                </header>
                {i === 0 && <span className="ex-since">{j.when[lang]}</span>}
                <ul className="ex-points">
                  {j.points.map((p, k) => (
                    <li key={k}>{p[lang]}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>

      <style>{`
        .ex-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px) clamp(24px, 5vw, 60px); }
        .ex-wrap { max-width: 880px; margin: 0 auto; }
        .ex-head { text-align: center; margin-bottom: clamp(32px, 6vw, 64px); }
        .ex-head h2 { margin: 0 0 12px; font-size: clamp(36px, 7vw, 76px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .ex-head p { margin: 0; font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary); }
        .ex-list { --fill: 0; position: relative; list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(14px, 2vw, 22px); padding-inline-start: clamp(28px, 6vw, 52px); }
        .ex-rail { position: absolute; inset-block: 12px; inset-inline-start: 7px; width: 2px; border-radius: 2px; background: var(--border-subtle); overflow: hidden; }
        .ex-rail::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 30%, transparent)); transform-origin: top; transform: scaleY(var(--fill)); }
        .ex-item { position: relative; min-width: 0; }
        .ex-dot { position: absolute; inset-inline-start: calc(-1 * clamp(28px, 6vw, 52px) + 1px); top: 30px; width: 14px; height: 14px; border-radius: 50%; background: var(--bg-primary); box-shadow: 0 0 0 2px var(--border-subtle); transition: background-color .5s ease, box-shadow .5s ease, transform .6s cubic-bezier(.16,1,.3,1); }
        .ex-item[data-in="1"] .ex-dot { background: var(--accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 22%, transparent); transform: scale(1.1); }
        .ex-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: clamp(24px, 3vw, 30px);
          padding: clamp(18px, 3vw, 28px); transition: transform .6s cubic-bezier(.16,1,.3,1), box-shadow .6s ease;
        }
        .ex-item:first-of-type .ex-card { background: color-mix(in srgb, var(--accent) 8%, var(--bg-card)); }
        .ex-card header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .ex-logo { flex: none; width: 54px; height: 54px; border-radius: 16px; overflow: hidden; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.07); }
        .ex-logo img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
        .ex-logo b { font-size: 22px; font-weight: 900; color: #111; }
        .ex-who { flex: 1 1 160px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ex-who h3 { margin: 0; font-size: clamp(20px, 2.4vw, 25px); font-weight: 900; line-height: 1.2; }
        .ex-role { font-size: 15px; font-weight: 600; color: var(--text-secondary); }
        .ex-when { font-size: 13px; font-weight: 700; padding: 7px 13px; border-radius: 99px; background: var(--bg-card-muted, rgba(0,0,0,.05)); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ex-now { background: var(--accent); color: #fff; }
        .ex-since { display: block; margin-top: 10px; font-size: 13px; color: var(--text-secondary); }
        .ex-points { margin: 16px 0 0; padding: 0; list-style: none; display: grid; gap: 9px; }
        .ex-points li { position: relative; padding-inline-start: 18px; font-size: 15px; line-height: 1.65; color: var(--text-secondary); }
        .ex-points li::before { content: ""; position: absolute; inset-inline-start: 2px; top: .75em; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
        @media (hover: hover) and (pointer: fine) { .ex-card:hover { transform: translateY(-4px); box-shadow: 0 18px 44px rgba(0,0,0,.09); } }
        @media (prefers-reduced-motion: reduce) { .ex-card, .ex-dot { transition: none; } }
      `}</style>
    </section>
  );
}
