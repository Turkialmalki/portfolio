"use client";

import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageProvider";
import { JOBS, BUILDS, SCHOOL } from "@/data/profile";
import Reveal from "./Reveal";

const COPY = {
  ar: { title: "الخبرة", builds: "قبل ذلك", school: "التعليم" },
  en: { title: "Experience", builds: "Earlier builds", school: "Education" },
} as const;

export default function Experience() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section id="experience" className="ex-root" aria-labelledby="ex-title">
      <div className="ex-wrap">
        <Reveal as="header" className="ex-head">
          <h2 id="ex-title">{copy.title}</h2>
        </Reveal>

        <ol className="ex-grid">
          {JOBS.map((j, i) => (
            <Reveal as="li" key={j.id} i={i % 2} className={`ex-card${i === 0 ? " ex-first" : ""}`}>
              <div className="ex-top">
                <span className="ex-logo" aria-hidden="true">
                  {j.logo ? (
                    <Image src={j.logo} alt="" width={96} height={96} />
                  ) : (
                    <b>{j.mono}</b>
                  )}
                </span>
                <div className="ex-who">
                  <h3>{j.org[lang]}</h3>
                  <span className="ex-role">{j.role[lang]}</span>
                  <span className="ex-when">{j.when[lang]}</span>
                </div>
              </div>
              <ul className="ex-points">
                {j.points.map((p, k) => (
                  <li key={k}>{p[lang]}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>

        <Reveal className="ex-sub">
          <h3>{copy.builds}</h3>
        </Reveal>
        <div className="ex-builds">
          {BUILDS.map((b, i) => (
            <Reveal key={b.id} i={i} className="ex-build">
              <span className="ex-when">{b.when[lang]}</span>
              <h4>{b.title[lang]}</h4>
              <p>{b.body[lang]}</p>
              <ul className="ex-tags">
                {b.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal i={2} className="ex-build ex-school">
            <span className="ex-when">{SCHOOL.when}</span>
            <h4>{SCHOOL.name[lang]}</h4>
            <p>{SCHOOL.degree[lang]}</p>
            <span className="ex-chip">{copy.school}</span>
          </Reveal>
        </div>
      </div>

      <style>{`
        .ex-root { background: var(--bg-primary); color: var(--text-primary); padding: clamp(72px, 12vw, 150px) clamp(16px, 4vw, 40px) clamp(40px, 8vw, 90px); }
        .ex-wrap { max-width: 1120px; margin: 0 auto; }
        .ex-head h2 { margin: 0 0 clamp(24px, 4vw, 44px); font-size: clamp(38px, 7vw, 80px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .ex-grid { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr; }
        .ex-card, .ex-build {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: clamp(24px, 3vw, 32px); padding: clamp(20px, 3vw, 32px);
          min-width: 0;
        }
        .ex-top { display: flex; align-items: center; gap: 16px; }
        .ex-logo {
          flex: none; width: 56px; height: 56px; border-radius: 16px; overflow: hidden; display: grid; place-items: center;
          background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.06);
        }
        .ex-logo img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
        .ex-logo b { font-size: 22px; font-weight: 900; color: #111; }
        .ex-who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ex-who h3 { margin: 0; font-size: clamp(20px, 2.4vw, 26px); font-weight: 900; line-height: 1.2; }
        .ex-role { font-size: 15px; font-weight: 600; }
        .ex-when { font-size: 13.5px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .ex-points { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
        .ex-points li { position: relative; padding-inline-start: 18px; font-size: 15px; line-height: 1.6; color: var(--text-secondary); }
        .ex-points li::before { content: ""; position: absolute; inset-inline-start: 2px; top: .72em; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
        .ex-sub h3 { margin: clamp(40px, 7vw, 72px) 0 18px; font-size: clamp(22px, 3vw, 30px); font-weight: 900; }
        .ex-builds { display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr; }
        .ex-build h4 { margin: 8px 0 8px; font-size: 22px; font-weight: 900; }
        .ex-build p { margin: 0; font-size: 15px; line-height: 1.65; color: var(--text-secondary); }
        .ex-tags { margin: 16px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
        .ex-tags li, .ex-chip { font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 99px; background: var(--bg-card-muted, rgba(0,0,0,.05)); }
        .ex-chip { display: inline-block; margin-top: 16px; }
        @media (min-width: 760px) {
          .ex-grid { grid-template-columns: repeat(2, 1fr); }
          .ex-first { grid-column: 1 / -1; }
          .ex-first .ex-points { grid-template-columns: repeat(2, 1fr); column-gap: 32px; }
          .ex-builds { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </section>
  );
}
