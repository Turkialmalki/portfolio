"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { STOPS } from "@/components/sections/FlightPath";
import { CountUp } from "@/components/work/CaseModal";

const COPY = {
  ar: { kicker: "الأثر", title: "الأرقام التي تحدّثت عنها الأعمال", sub: "من المصارف إلى المسرّعات — ما تغيّر بعد أن وصل العمل للناس." },
  en: { kicker: "Impact", title: "What the work did, in numbers", sub: "From banks to accelerators — what changed once the work reached people." },
} as const;

/* Every figure is read back out of the timeline's own stops, so this section
   can never quote a number the timeline does not carry. */
const SOURCES = ["practice", "alrajhi", "emkan", "film"] as const;

function Tile({ value, label, org, i, reduced }: { value: string; label: string; org: string; i: number; reduced: boolean }) {
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
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className="im-tile"
      data-run={run ? "1" : "0"}
      style={{ "--k": i } as CSSProperties}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 120, damping: 18, delay: (i % 3) * 0.08 }}
    >
      <strong>
        <CountUp value={value} run={run} />
      </strong>
      <span className="im-label">{label}</span>
      <span className="im-org">{org}</span>
      <i className="im-bar" aria-hidden="true" />
    </motion.div>
  );
}

export default function Impact() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();

  const tiles = useMemo(
    () =>
      SOURCES.flatMap((id) => {
        const s = STOPS.find((x) => x.id === id);
        return (s?.metrics ?? []).map((m) => ({
          key: `${id}-${m.value}`,
          value: m.value,
          label: m.label[lang],
          org: s!.org[lang],
        }));
      }),
    [lang],
  );

  return (
    <section id="impact" className="im-root" aria-labelledby="im-title">
      <div className="im-wrap">
        <header className="im-head">
          <span className="im-kicker">{copy.kicker}</span>
          <h2 id="im-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </header>
        <div className="im-grid">
          {tiles.map((t, i) => (
            <Tile key={t.key} i={i} reduced={reduced} value={t.value} label={t.label} org={t.org} />
          ))}
        </div>
      </div>

      <style>{`
        .im-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px); }
        .im-wrap { max-width: 1120px; margin: 0 auto; }
        .im-head { margin-bottom: clamp(28px, 5vw, 56px); max-width: 640px; }
        .im-kicker { font-size: 13px; font-weight: 700; letter-spacing: .08em; color: var(--accent); }
        .im-head h2 { margin: 12px 0 14px; font-size: clamp(34px, 7vw, 72px); line-height: 1.08; font-weight: 900; }
        .im-head p { margin: 0; font-size: clamp(16px, 2vw, 19px); line-height: 1.7; color: var(--text-secondary); }
        .im-grid { display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: repeat(2, 1fr); }
        .im-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
        .im-tile {
          position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 4px;
          padding: clamp(18px, 3vw, 30px); border-radius: clamp(22px, 3vw, 30px); background: var(--bg-card);
          border: 1px solid var(--border-subtle); min-height: clamp(150px, 22vw, 210px);
        }
        .im-tile strong { font-size: clamp(40px, 8vw, 84px); line-height: 1; font-weight: 900; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
        .im-label { margin-top: auto; padding-top: 14px; font-size: clamp(14px, 1.6vw, 17px); font-weight: 700; }
        .im-org { font-size: 13px; color: var(--text-secondary); }
        .im-bar { position: absolute; inset-inline: 0; bottom: 0; height: 4px; background: var(--accent); transform-origin: left; transform: scaleX(0); transition: transform 1.2s cubic-bezier(.16,1,.3,1); }
        [dir="rtl"] .im-bar { transform-origin: right; }
        .im-tile[data-run="1"] .im-bar { transform: scaleX(1); }
        @media (min-width: 900px) { .im-grid { grid-template-columns: repeat(3, 1fr); } .im-grid > :last-child:nth-child(odd) { grid-column: auto; } }
        @media (prefers-reduced-motion: reduce) { .im-bar { transition: none; transform: scaleX(1); } }
      `}</style>
    </section>
  );
}
