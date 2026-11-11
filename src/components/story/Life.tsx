"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import Reveal from "./Reveal";

type Place = "milan" | "como" | "swiss";


/* The travel photographs, in the order they sit on the page. To add one, drop a
   resized file in /public/life and add a row here. `ratio` is the crop the tile
   is drawn at — the mix of heights is what makes the columns read as a wall
   rather than a table. */
const PHOTOS: { n: number; place: Place; ratio: string; pos?: string }[] = [
  { n: 21, place: "milan", ratio: "4 / 5" },
  { n: 9, place: "milan", ratio: "3 / 4", pos: "50% 60%" },
  { n: 15, place: "swiss", ratio: "3 / 4", pos: "50% 35%" },
  { n: 14, place: "swiss", ratio: "4 / 5", pos: "50% 55%" },
  { n: 17, place: "como", ratio: "4 / 5" },
  { n: 13, place: "swiss", ratio: "4 / 5" },
  { n: 22, place: "milan", ratio: "3 / 4" },
  { n: 24, place: "swiss", ratio: "4 / 5" },
  { n: 19, place: "milan", ratio: "3 / 4" },
  { n: 20, place: "milan", ratio: "4 / 5" },
];

const COPY = {
  ar: { title: "خارج الشاشة", sub: "سفر · كتب · رياضة" },
  en: { title: "Off screen", sub: "Travel · Books · Sport" },
} as const;

/* Two columns on a phone, three from 700px. Read once per change through
   useSyncExternalStore so the server render (three) is what hydration expects. */
const WIDE = "(min-width: 700px)";
function useColumns() {
  const wide = useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(WIDE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  return wide ? 3 : 2;
}

/* How far each column drifts, in px, over the section's pass through the
   viewport. Neighbouring columns move opposite ways, which is the whole effect. */
const DRIFT: Record<number, number[]> = { 3: [-70, 50, -30], 2: [-34, 28] };

export default function Life() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const cols = useColumns();
  const rootRef = useRef<HTMLDivElement>(null);

  const columns: (typeof PHOTOS)[] = Array.from({ length: cols }, () => []);
  PHOTOS.forEach((p, i) => columns[i % cols].push(p));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    /* the drift is a pointer-device flourish; on a touch screen the wall just scrolls */
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-col]"));
    const drift = DRIFT[cols];
    let raf = 0;
    const render = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      els.forEach((el, i) => {
        el.style.transform = `translate3d(0, ${((p - 0.5) * 2 * drift[i]).toFixed(1)}px, 0)`;
      });
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
  }, [cols]);

  return (
    <section id="life" className="lf-root" aria-labelledby="lf-title">
      <div className="lf-wrap">
        <Reveal as="header" className="lf-head">
          <h2 id="lf-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </Reveal>

        <div className="lf-cols" ref={rootRef} data-cols={cols}>
          {columns.map((col, c) => (
            <div key={c} className="lf-col" data-col={c}>
              {col.map((p, k) => (
                <Reveal key={p.n} i={k % 2} className="lf-cell">
                  <figure className="lf-fig" style={{ aspectRatio: p.ratio, "--pos": p.pos ?? "center" } as CSSProperties}>
                    <Image
                      src={`/life/${p.n}.jpg`}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 46vw, 360px"
                      className="lf-img"
                    />
                  </figure>
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .lf-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px) clamp(72px, 10vw, 140px); overflow-x: clip; }
        .lf-wrap { max-width: 1120px; margin: 0 auto; }
        .lf-head { text-align: center; margin-bottom: clamp(24px, 4vw, 48px); }
        .lf-head h2 { margin: 0 0 10px; font-size: clamp(38px, 7vw, 80px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .lf-head p { margin: 0; font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary); }
        .lf-cols { display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); align-items: start; padding-block: 40px; }
        .lf-cols[data-cols="2"] { --n: 2; }
        .lf-cols[data-cols="3"] { --n: 3; }
        .lf-col { display: flex; flex-direction: column; gap: clamp(10px, 1.6vw, 16px); }
        .lf-fig { position: relative; margin: 0; width: 100%; border-radius: clamp(18px, 2.4vw, 28px); overflow: hidden; background: var(--bg-card); isolation: isolate; }
        .lf-img { object-fit: cover; object-position: var(--pos); transition: transform 1.4s cubic-bezier(.16,1,.3,1); }
        .lf-fig::after { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(0deg, rgba(6,7,10,.5), transparent 38%); }
        .lf-fig figcaption { position: absolute; z-index: 2; inset-inline: 0; bottom: 0; padding: clamp(10px, 1.6vw, 18px); color: #fff; font-size: clamp(12px, 1.4vw, 15px); font-weight: 700; }
        @media (hover: hover) and (pointer: fine) { .lf-fig:hover .lf-img { transform: scale(1.06); } }
        @media (prefers-reduced-motion: reduce) { .lf-img { transition: none; } .lf-col { transform: none !important; } }
      `}</style>
    </section>
  );
}
