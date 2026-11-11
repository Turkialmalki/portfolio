"use client";

import Image from "next/image";
import { FiArrowUpRight, FiStar } from "react-icons/fi";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";
import Reveal from "./Reveal";

const HASHPLUS_URL = "https://learn.ihashplus.com/platform/teacher/turkialmalki202200";

const COPY = {
  ar: {
    title: "الاستشارات والتدريس",
    sub: "احجز جلسة معي، أو تعلّم على منصتي.",
    nTag: "استشارات",
    nTitle: "مستشار تقني على Nawafeth",
    nBody: "جلسات استشارية في التقنية وبناء المنتجات. ابحث عن اسمي في تطبيق Nawafeth واحجز موعدك.",
    nRate: "تقييم 5.0 من 77 مراجعة",
    hTag: "تدريس",
    hTitle: "مدرّس على Hash+",
    hBody: "أشارك خبرتي مع المتعلمين على منصة Hash+.",
    hCta: "افتح ملفي على Hash+",
  },
  en: {
    title: "Consulting & teaching",
    sub: "Book a session with me, or learn on my page.",
    nTag: "Consulting",
    nTitle: "Tech consultant on Nawafeth",
    nBody: "Advisory sessions on technology and building products. Find my name in the Nawafeth app and pick a time.",
    nRate: "5.0 rating from 77 reviews",
    hTag: "Teaching",
    hTitle: "Teacher on Hash+",
    hBody: "I share what I know with learners on the Hash+ platform.",
    hCta: "Open my Hash+ profile",
  },
} as const;

export default function Mentoring() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section id="mentoring" className="mt-root" aria-labelledby="mt-title">
      <div className="mt-wrap">
        <Reveal as="header" className="mt-head">
          <h2 id="mt-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </Reveal>

        <div className="mt-grid">
          <Reveal className="mt-card mt-n">
            <div className="mt-shot">
              <Image src="/life/nawafeth.jpg" alt="" fill sizes="(max-width: 800px) 92vw, 560px" className="mt-img" />
            </div>
            <div className="mt-body">
              <span className="mt-tag">{copy.nTag}</span>
              <h3>{copy.nTitle}</h3>
              <p>{copy.nBody}</p>
              <span className="mt-rate">
                <FiStar size={15} aria-hidden="true" />
                {copy.nRate}
              </span>
            </div>
          </Reveal>

          <Reveal i={1} className="mt-card mt-h">
            <div className="mt-body">
              <span className="mt-tag">{copy.hTag}</span>
              <h3>{copy.hTitle}</h3>
              <p>{copy.hBody}</p>
              <a
                className="mt-cta"
                href={HASHPLUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("hashplus_click", { location: "mentoring" })}
              >
                {copy.hCta}
                <FiArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
            <span className="mt-glyph" aria-hidden="true">
              #+
            </span>
          </Reveal>
        </div>
      </div>

      <style>{`
        .mt-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(56px, 10vw, 120px) clamp(16px, 4vw, 40px); }
        .mt-wrap { max-width: 1120px; margin: 0 auto; }
        .mt-head { text-align: center; margin-bottom: clamp(28px, 5vw, 56px); }
        .mt-head h2 { margin: 0 0 12px; font-size: clamp(34px, 6.6vw, 72px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .mt-head p { margin: 0; font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary); }
        .mt-grid { display: grid; gap: clamp(12px, 1.8vw, 18px); grid-template-columns: 1fr; }
        .mt-card { position: relative; overflow: hidden; display: flex; flex-direction: column; border-radius: clamp(26px, 3vw, 34px); background: var(--bg-card); border: 1px solid var(--border-subtle); }
        .mt-shot { position: relative; aspect-ratio: 900 / 418; background: #0f1520; overflow: hidden; }
        .mt-img { object-fit: cover; object-position: 50% 30%; transform: scale(1.06); transition: transform 1.6s cubic-bezier(.16,1,.3,1); }
        .mt-card[data-in="1"] .mt-img { transform: scale(1); }
        .mt-body { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: clamp(20px, 3vw, 32px); }
        .mt-tag { font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 99px; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
        .mt-body h3 { margin: 0; font-size: clamp(22px, 3vw, 30px); font-weight: 900; line-height: 1.2; }
        .mt-body p { margin: 0; font-size: 15.5px; line-height: 1.65; color: var(--text-secondary); max-width: 44ch; }
        .mt-rate { display: inline-flex; align-items: center; gap: 7px; margin-top: 4px; font-size: 14px; font-weight: 700; }
        .mt-rate svg { color: #f5a524; fill: #f5a524; }
        .mt-h { background: color-mix(in srgb, var(--accent) 8%, var(--bg-card)); justify-content: center; }
        .mt-glyph { position: absolute; inset-inline-end: 16px; bottom: -22px; font-size: clamp(120px, 22vw, 190px); font-weight: 900; line-height: 1; color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 28%, transparent); pointer-events: none; direction: ltr; }
        .mt-cta { margin-top: 10px; min-height: 50px; padding: 0 22px; border-radius: 99px; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; text-decoration: none; background: var(--text-primary); color: var(--bg-primary); transition: transform .45s cubic-bezier(.16,1,.3,1); }
        .mt-cta:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        @media (hover: hover) and (pointer: fine) { .mt-cta:hover { transform: translateY(-3px); } }
        @media (min-width: 860px) { .mt-grid { grid-template-columns: 1.25fr 1fr; } }
        @media (prefers-reduced-motion: reduce) { .mt-img, .mt-cta { transition: none; transform: none; } }
      `}</style>
    </section>
  );
}
