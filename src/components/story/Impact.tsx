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
      <div className="im-top">
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
      <div className="im-shot">
        <Image src={img} alt="" fill sizes="(max-width: 900px) 92vw, 560px" className="im-img" style={{ objectPosition: pos }} />
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
        .im-wrap h2 { margin: 0 0 clamp(28px, 5vw, 56px); text-align: center; font-size: clamp(38px, 7vw, 80px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .im-grid { display: grid; gap: clamp(12px, 1.8vw, 18px); grid-template-columns: 1fr; }
        .im-card {
          position: relative; overflow: hidden; display: flex; flex-direction: column; gap: clamp(18px, 3vw, 28px);
          padding: clamp(22px, 3vw, 34px) clamp(22px, 3vw, 34px) 0; border-radius: clamp(28px, 3vw, 36px);
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          opacity: 0; transform: translate3d(0, 36px, 0);
          transition: opacity .9s cubic-bezier(.16,1,.3,1), transform 1.1s cubic-bezier(.16,1,.3,1), box-shadow .6s ease; transition-delay: calc((var(--k) % 2) * 90ms);
        }
        .im-card[data-run="1"] { opacity: 1; transform: none; }
        .im-top h3 { margin: 0 0 14px; font-size: 15px; font-weight: 800; color: var(--text-secondary); letter-spacing: .01em; }
        .im-top ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px 32px; }
        .im-top li { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .im-top strong { font-size: clamp(46px, 10vw, 80px); line-height: 1; font-weight: 900; letter-spacing: -.035em; font-variant-numeric: tabular-nums; color: var(--accent); }
        .im-top li span { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .im-shot { position: relative; margin-top: auto; height: clamp(170px, 34vw, 250px); border-radius: 22px 22px 0 0; overflow: hidden; background: var(--bg-card-muted, #eee); box-shadow: 0 -8px 30px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.06); transform: translateY(26px); transition: transform 1.3s .15s cubic-bezier(.16,1,.3,1); }
        .im-card[data-run="1"] .im-shot { transform: none; }
        .im-img { object-fit: cover; transform: scale(1.1); transition: transform 2.2s cubic-bezier(.16,1,.3,1); }
        .im-card[data-run="1"] .im-img { transform: scale(1); }
        @media (hover: hover) and (pointer: fine) { .im-card[data-run="1"]:hover { box-shadow: 0 24px 56px rgba(0,0,0,.1); } .im-card:hover .im-img { transform: scale(1.05); } }
        @media (min-width: 900px) {
          .im-grid { grid-template-columns: repeat(6, 1fr); }
          .im-card { grid-column: span 3; }
          .im-big { grid-column: span 4; }
          .im-card:not(.im-big) { grid-column: span 2; }
          .im-shot { height: 260px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .im-card { opacity: 1; transform: none; transition: none; }
          .im-img, .im-shot { transform: none; transition: none; }
        }
      `}</style>
    </section>
  );
}
