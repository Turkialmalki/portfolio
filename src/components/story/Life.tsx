"use client";

import Image from "next/image";
import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";

type Bi = { ar: string; en: string };
type Photo = { src: string; title: Bi; meta: Bi; pos?: string; area: string };

/* Every picture here is a real one already on the site, captioned with what
   the timeline says it is. To add a hobby, add a row: a photo in /public/op
   and its two captions — the grid places it. */
const PHOTOS: Photo[] = [
  {
    src: "/op/room.jpg",
    area: "a",
    title: { ar: "من الفكرة إلى MVP", en: "From idea to MVP" },
    meta: { ar: "ورشة عمل لرواد الأعمال", en: "A workshop for founders" },
    pos: "center 40%",
  },
  {
    src: "/speaking-portrait.jpg",
    area: "b",
    title: { ar: "على المسرح", en: "On stage" },
    meta: { ar: "هيئة الأدب والنشر والترجمة", en: "Literature, Publishing & Translation Commission" },
    pos: "50% 30%",
  },
  {
    src: "/op/1.jpg",
    area: "c",
    title: { ar: "مدرّب معتمد", en: "Certified instructor" },
    meta: { ar: "برامج تدريب وابتكار", en: "Training & innovation programs" },
    pos: "48% 32%",
  },
  {
    src: "/IMG-20181201-WA0054.jpg",
    area: "d",
    title: { ar: "فريق مسابقة واعد", en: "Wa'ed competition team" },
    meta: { ar: "المركز الأول — أرامكو", en: "1st place — Aramco" },
    pos: "center 40%",
  },
  {
    src: "/op/portrait.jpg",
    area: "e",
    title: { ar: "تركي", en: "Turki" },
    meta: { ar: "مهندس، مدرّب، ومستشار", en: "Engineer, teacher, consultant" },
    pos: "50% 25%",
  },
];

const COPY = {
  ar: { kicker: "خارج الكود", title: "ما أفعله خارج الشاشة", sub: "تدريب، ومنصات، وورش عمل — الجزء من العمل الذي يحدث في قاعة." },
  en: { kicker: "Beyond the code", title: "What I do away from the screen", sub: "Teaching, speaking and workshops — the part of the work that happens in a room." },
} as const;

export default function Life() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();
  const photos = useMemo(() => PHOTOS, []);

  return (
    <section id="life" className="lf-root" aria-labelledby="lf-title">
      <div className="lf-wrap">
        <header className="lf-head">
          <span className="lf-kicker">{copy.kicker}</span>
          <h2 id="lf-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </header>

        <ul className="lf-grid">
          {photos.map((p, i) => (
            <motion.li
              key={p.src}
              className="lf-cell"
              data-area={p.area}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 100, damping: 18, delay: (i % 2) * 0.1 }}
            >
              <figure className="lf-fig" style={{ "--pos": p.pos ?? "center" } as CSSProperties}>
                <Image src={p.src} alt={p.title[lang]} fill sizes="(max-width: 700px) 92vw, 560px" className="lf-img" />
                <figcaption>
                  <strong>{p.title[lang]}</strong>
                  <span>{p.meta[lang]}</span>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </ul>
      </div>

      <style>{`
        .lf-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px) clamp(48px, 8vw, 100px); }
        .lf-wrap { max-width: 1120px; margin: 0 auto; }
        .lf-head { max-width: 640px; margin-bottom: clamp(28px, 5vw, 56px); }
        .lf-kicker { font-size: 13px; font-weight: 700; letter-spacing: .08em; color: var(--accent); }
        .lf-head h2 { margin: 12px 0 14px; font-size: clamp(34px, 7vw, 72px); line-height: 1.08; font-weight: 900; }
        .lf-head p { margin: 0; font-size: clamp(16px, 2vw, 19px); line-height: 1.7; color: var(--text-secondary); }

        .lf-grid { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr 1fr; grid-auto-rows: clamp(150px, 42vw, 230px); }
        .lf-cell { display: block; min-height: 0; }
        .lf-cell[data-area="a"] { grid-column: 1 / -1; grid-row: span 2; }
        .lf-fig { position: relative; margin: 0; width: 100%; height: 100%; border-radius: clamp(20px, 3vw, 28px); overflow: hidden; background: var(--bg-card); isolation: isolate; }
        .lf-img { object-fit: cover; object-position: var(--pos); transition: transform 1.2s cubic-bezier(.16,1,.3,1); }
        .lf-fig::after { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(0deg, rgba(6,7,10,.72), transparent 55%); }
        .lf-fig figcaption { position: absolute; z-index: 2; inset-inline: 0; bottom: 0; padding: clamp(12px, 2vw, 22px); color: #fff; display: flex; flex-direction: column; gap: 2px; }
        .lf-fig strong { font-size: clamp(15px, 2vw, 22px); font-weight: 800; line-height: 1.25; }
        .lf-fig span { font-size: clamp(11px, 1.3vw, 13px); opacity: .8; line-height: 1.4; }

        @media (min-width: 800px) {
          .lf-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 200px; }
          .lf-cell[data-area="a"] { grid-column: span 2; grid-row: span 2; }
          .lf-cell[data-area="b"] { grid-column: span 1; grid-row: span 2; }
          .lf-cell[data-area="c"] { grid-column: span 1; grid-row: span 2; }
          .lf-cell[data-area="d"] { grid-column: span 2; grid-row: span 1; }
          .lf-cell[data-area="e"] { grid-column: span 2; grid-row: span 1; }
        }
        @media (hover: hover) and (pointer: fine) { .lf-fig:hover .lf-img { transform: scale(1.08); } }
        @media (prefers-reduced-motion: reduce) { .lf-img { transition: none; } }
      `}</style>
    </section>
  );
}
