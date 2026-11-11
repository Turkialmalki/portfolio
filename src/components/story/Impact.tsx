"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { STOPS } from "@/components/sections/FlightPath";
import { CountUp } from "@/components/work/CaseModal";

const COPY = {
  ar: { title: "الأثر" },
  en: { title: "Impact" },
} as const;

/* Each card is one organisation, with the real screen or room the numbers came
   from behind it. The figures are read back out of the timeline's own stops, so
   this section cannot quote a number the timeline does not carry. */
const CARDS = [
  { id: "alrajhi", img: "/hero/alrajhi-pair.jpg", pos: "50% 40%", big: true },
  { id: "emkan", img: "/hero/emkan.jpg", pos: "50% 30%", big: false },
  { id: "film", img: "/hero/fba.jpg", pos: "50% 30%", big: false },
  { id: "practice", img: "/op/room.jpg", pos: "50% 40%", big: true },
] as const;

function Card({ id, img, pos, big, i }: (typeof CARDS)[number] & { i: number }) {
  const { lang } = useLanguage();
  const stop = STOPS.find((s) => s.id === id);
  const ref = useRef<HTMLElement>(null);
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
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const metrics = useMemo(() => stop?.metrics ?? [], [stop]);
  if (!stop) return null;

  return (
    <article ref={ref} className={`im-card${big ? " im-big" : ""}`} data-run={run ? "1" : "0"} style={{ "--k": i } as CSSProperties}>
      <Image src={img} alt="" fill sizes="(max-width: 900px) 100vw, 560px" className="im-img" style={{ objectPosition: pos }} />
      <span className="im-scrim" aria-hidden="true" />
      <div className="im-body">
        <h3>{stop.org[lang]}</h3>
        <ul>
          {metrics.map((m) => (
            <li key={m.value}>
              <strong>
                <CountUp value={m.value} run={run} />
              </strong>
              <span>{m.label[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Impact() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section id="impact" className="im-root" aria-labelledby="im-title">
      <div className="im-wrap">
        <h2 id="im-title">{copy.title}</h2>
        <div className="im-grid">
          {CARDS.map((c, i) => (
            <Card key={c.id} {...c} i={i} />
          ))}
        </div>
      </div>

      <style>{`
        .im-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px); }
        .im-wrap { max-width: 1120px; margin: 0 auto; }
        .im-wrap h2 { margin: 0 0 clamp(24px, 4vw, 44px); font-size: clamp(38px, 7vw, 80px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .im-grid { display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr; }
        .im-card {
          position: relative; overflow: hidden; isolation: isolate; color: #fff;
          min-height: clamp(360px, 92vw, 440px); border-radius: clamp(26px, 3vw, 34px); background: #10131a;
          opacity: 0; transform: translate3d(0, 36px, 0) scale(.97);
          transition: opacity .9s cubic-bezier(.16,1,.3,1), transform 1.1s cubic-bezier(.16,1,.3,1); transition-delay: calc((var(--k) % 2) * 90ms);
        }
        .im-card[data-run="1"] { opacity: 1; transform: none; }
        .im-img { object-fit: cover; z-index: -2; transform: scale(1.12); transition: transform 2.2s cubic-bezier(.16,1,.3,1); will-change: transform; }
        .im-card[data-run="1"] .im-img { transform: scale(1); }
        .im-scrim { position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(8,10,16,.05) 0%, rgba(8,10,16,.62) 45%, rgba(8,10,16,.92) 100%); }
        .im-body { position: absolute; inset: auto 0 0 0; padding: clamp(20px, 3vw, 32px); display: flex; flex-direction: column; gap: 14px; }
        .im-body h3 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: .02em; opacity: .85; }
        .im-body ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 28px; }
        .im-body li { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .im-body strong { font-size: clamp(44px, 11vw, 76px); line-height: 1; font-weight: 900; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
        .im-body li span { font-size: 14px; font-weight: 600; opacity: .85; }
        @media (min-width: 900px) {
          .im-grid { grid-template-columns: repeat(6, 1fr); }
          .im-card { grid-column: span 3; min-height: 440px; }
          .im-big { grid-column: span 4; }
          .im-card:not(.im-big) { grid-column: span 2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .im-card { opacity: 1; transform: none; transition: none; }
          .im-img { transform: none; transition: none; }
        }
      `}</style>
    </section>
  );
}
