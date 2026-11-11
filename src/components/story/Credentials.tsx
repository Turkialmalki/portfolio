"use client";

import type { CSSProperties } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AWARDS, CERTS } from "@/data/profile";
import Reveal from "./Reveal";

const COPY = {
  ar: {
    title: "الجوائز والشهادات",
    certs: "الشهادات",
    member: "عضو في Startup Grind منذ 2018 — مجتمع عالمي لرواد الأعمال.",
  },
  en: {
    title: "Awards & credentials",
    certs: "Certificates",
    member: "Member of Startup Grind since 2018 — the global founders' community.",
  },
} as const;

export default function Credentials() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section id="credentials" className="cr-root" aria-labelledby="cr-title">
      <div className="cr-wrap">
        <Reveal as="header" className="cr-head">
          <h2 id="cr-title">{copy.title}</h2>
        </Reveal>

        <div className="cr-awards">
          {AWARDS.map((a, i) => (
            <Reveal key={a.id} i={i} className="cr-award">
              <span className="cr-place">{a.place[lang]}</span>
              <h3>{a.title[lang]}</h3>
              <p className="cr-by">{a.by[lang]}</p>
              <p className="cr-note">{a.note[lang]}</p>
              <span className="cr-date">{a.when}</span>
            </Reveal>
          ))}
        </div>

        <Reveal className="cr-sub">
          <h3>{copy.certs}</h3>
        </Reveal>
        <ul className="cr-certs">
          {CERTS.map((c, i) => (
            <Reveal as="li" key={c.id} i={i % 3} className="cr-cert">
              <span className="cr-mono" style={{ "--h": c.hue } as CSSProperties} aria-hidden="true">
                {c.mono}
              </span>
              <span className="cr-text">
                <strong>{c.title[lang]}</strong>
                <span>
                  {c.by} · {c.when}
                </span>
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal className="cr-member">
          <p>{copy.member}</p>
        </Reveal>
      </div>

      <style>{`
        .cr-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(56px, 10vw, 130px) clamp(16px, 4vw, 40px); }
        .cr-wrap { max-width: 1120px; margin: 0 auto; }
        .cr-head h2 { margin: 0 0 clamp(24px, 4vw, 44px); font-size: clamp(34px, 6.4vw, 72px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .cr-awards { display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr; }
        .cr-award {
          position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 6px;
          padding: clamp(22px, 3vw, 32px); min-height: 250px; border-radius: clamp(24px, 3vw, 32px);
          background: color-mix(in srgb, var(--accent) 9%, var(--bg-card)); border: 1px solid var(--border-subtle);
        }
        .cr-place { font-size: clamp(34px, 5vw, 52px); font-weight: 900; line-height: 1.05; letter-spacing: -.02em; color: var(--accent); }
        .cr-award h3 { margin: 6px 0 0; font-size: 20px; font-weight: 900; }
        .cr-by { margin: 0; font-size: 14px; color: var(--text-secondary); }
        .cr-note { margin: 10px 0 0; font-size: 15px; line-height: 1.6; }
        .cr-date { margin-top: auto; padding-top: 14px; font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .cr-sub h3 { margin: clamp(40px, 7vw, 72px) 0 18px; font-size: clamp(22px, 3vw, 30px); font-weight: 900; }
        .cr-certs { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: 1fr; }
        .cr-cert { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 22px; background: var(--bg-card); border: 1px solid var(--border-subtle); min-width: 0; }
        .cr-mono {
          flex: none; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
          font-weight: 900; font-size: 16px; color: hsl(var(--h) 60% 32%); background: hsl(var(--h) 80% 92%);
        }
        [data-theme="dark"] .cr-mono { color: hsl(var(--h) 80% 80%); background: hsl(var(--h) 40% 22%); }
        .cr-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cr-text strong { font-size: 15px; font-weight: 800; line-height: 1.35; }
        .cr-text span { font-size: 13px; color: var(--text-secondary); }
        .cr-member { margin-top: 28px; }
        .cr-member p { margin: 0; font-size: 14px; color: var(--text-secondary); }
        @media (min-width: 700px) { .cr-awards { grid-template-columns: repeat(3, 1fr); } .cr-certs { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .cr-certs { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </section>
  );
}
