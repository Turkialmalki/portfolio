"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { FiAward, FiCheck } from "react-icons/fi";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AWARDS, BUILDS, CERTS, SCHOOL } from "@/data/profile";
import Reveal from "./Reveal";

const COPY = {
  ar: {
    title: "الجوائز والشهادات",
    sub: "ما حصلت عليه، وما تعلمته على الطريق.",
    awards: "الجوائز",
    before: "قبل ذلك",
    school: "التعليم",
    certs: "الشهادات",
    member: "عضو في Startup Grind منذ 2018 — مجتمع عالمي لرواد الأعمال.",
  },
  en: {
    title: "Awards & certificates",
    sub: "What I won, and what I learned on the way.",
    awards: "Awards",
    before: "Before that",
    school: "Education",
    certs: "Certificates",
    member: "Member of Startup Grind since 2018 — the global founders' community.",
  },
} as const;

/* One look per award: the winners' photograph where we have one, a big numeral
   where we do not. */
const LOOK: Record<string, { img?: string; mark: string; hue: number }> = {
  waad: { img: "/life/waad.jpg", mark: "1", hue: 212 },
  kaust: { mark: "2", hue: 268 },
  urc: { mark: "★", hue: 32 },
};

export default function Credentials() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <section id="credentials" className="cr-root" aria-labelledby="cr-title">
      <div className="cr-wrap">
        <Reveal as="header" className="cr-head">
          <h2 id="cr-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </Reveal>

        <div className="cr-awards">
          {AWARDS.map((a, i) => {
            const look = LOOK[a.id] ?? { mark: "★", hue: 212 };
            return (
              <Reveal key={a.id} i={i} className="cr-award">
                <div className="cr-art" style={{ "--h": look.hue } as CSSProperties}>
                  {look.img ? (
                    <Image src={look.img} alt="" fill sizes="(max-width: 700px) 92vw, 360px" className="cr-photo" />
                  ) : (
                    <span className="cr-num" aria-hidden="true">
                      {look.mark}
                    </span>
                  )}
                  <span className="cr-medal">
                    <FiAward size={14} aria-hidden="true" />
                    {a.place[lang]}
                  </span>
                </div>
                <div className="cr-body">
                  <h3>{a.title[lang]}</h3>
                  <p className="cr-by">{a.by[lang]}</p>
                  <p className="cr-note">{a.note[lang]}</p>
                  <span className="cr-date">{a.when}</span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="cr-sub">
          <h3>{copy.before}</h3>
        </Reveal>
        <div className="cr-before">
          {BUILDS.map((b, i) => (
            <Reveal key={b.id} i={i} className="cr-b">
              <span className="cr-when">{b.when[lang]}</span>
              <h4>{b.title[lang]}</h4>
              <p>{b.body[lang]}</p>
              <ul>
                {b.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal i={2} className="cr-b cr-school">
            <span className="cr-when">{SCHOOL.when}</span>
            <h4>{SCHOOL.name[lang]}</h4>
            <p>{SCHOOL.degree[lang]}</p>
            <ul>
              <li>{copy.school}</li>
            </ul>
          </Reveal>
        </div>

        <Reveal className="cr-sub">
          <h3>{copy.certs}</h3>
        </Reveal>
        <ul className="cr-certs">
          {CERTS.map((c, i) => (
            <Reveal as="li" key={c.id} i={i % 3} className="cr-cert">
              <div className="cr-card" style={{ "--h": c.hue } as CSSProperties}>
                <span className="cr-banner" aria-hidden="true">
                  <b>{c.mono}</b>
                  <span className="cr-shine" />
                </span>
                <div className="cr-text">
                  <strong>{c.title[lang]}</strong>
                  <span>{c.by}</span>
                  <span className="cr-dt">
                    <FiCheck size={13} aria-hidden="true" />
                    {c.when}
                  </span>
                </div>
              </div>
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
        .cr-head { text-align: center; margin-bottom: clamp(32px, 6vw, 64px); }
        .cr-head h2 { margin: 0 0 12px; font-size: clamp(34px, 6.6vw, 76px); line-height: 1.1; font-weight: 900; letter-spacing: -.02em; }
        .cr-head p { margin: 0; font-size: clamp(16px, 2vw, 20px); color: var(--text-secondary); }
        .cr-sub h3 { margin: clamp(44px, 7vw, 80px) 0 20px; text-align: center; font-size: clamp(22px, 3.2vw, 32px); font-weight: 900; }

        .cr-awards { display: grid; gap: clamp(12px, 1.8vw, 18px); grid-template-columns: 1fr; }
        .cr-award { display: flex; flex-direction: column; overflow: hidden; border-radius: clamp(26px, 3vw, 34px); background: var(--bg-card); border: 1px solid var(--border-subtle); transition: transform .7s cubic-bezier(.16,1,.3,1), box-shadow .7s ease; }
        .cr-art { position: relative; aspect-ratio: 16 / 10; overflow: hidden; isolation: isolate; background: linear-gradient(150deg, hsl(var(--h) 70% 22%), hsl(var(--h) 60% 10%)); }
        .cr-photo { object-fit: cover; object-position: 50% 55%; transform: scale(1.08); transition: transform 1.6s cubic-bezier(.16,1,.3,1); }
        .cr-award[data-in="1"] .cr-photo { transform: scale(1); }
        .cr-art::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(6,8,14,.55), transparent 55%); z-index: 1; }
        .cr-num { position: absolute; inset: 0; display: grid; place-items: center; font-size: clamp(120px, 24vw, 190px); font-weight: 900; line-height: 1; color: transparent; -webkit-text-stroke: 2px hsl(var(--h) 85% 70% / .55); }
        .cr-medal { position: absolute; z-index: 2; inset-inline-start: 14px; bottom: 14px; display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 99px; font-size: 14px; font-weight: 800; color: #111; background: rgba(255,255,255,.92); }
        .cr-body { padding: clamp(18px, 2.6vw, 26px); display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .cr-body h3 { margin: 0; font-size: 20px; font-weight: 900; line-height: 1.3; }
        .cr-by { margin: 0; font-size: 14px; color: var(--text-secondary); }
        .cr-note { margin: 8px 0 0; font-size: 15px; line-height: 1.65; }
        .cr-date { margin-top: auto; padding-top: 12px; font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

        .cr-before { display: grid; gap: clamp(12px, 1.8vw, 18px); grid-template-columns: 1fr; }
        .cr-b { padding: clamp(20px, 3vw, 28px); border-radius: clamp(24px, 3vw, 30px); background: var(--bg-card); border: 1px solid var(--border-subtle); min-width: 0; }
        .cr-when { font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .cr-b h4 { margin: 8px 0; font-size: 21px; font-weight: 900; }
        .cr-b p { margin: 0; font-size: 15px; line-height: 1.65; color: var(--text-secondary); }
        .cr-b ul { margin: 16px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
        .cr-b li { font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 99px; background: var(--bg-card-muted, rgba(0,0,0,.05)); }

        .cr-certs { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(10px, 1.6vw, 16px); grid-template-columns: 1fr 1fr; }
        .cr-cert { min-width: 0; display: flex; }
        .cr-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: clamp(22px, 2.6vw, 28px); background: var(--bg-card); border: 1px solid var(--border-subtle); transition: transform .6s cubic-bezier(.16,1,.3,1), box-shadow .6s ease; }
        .cr-banner { position: relative; overflow: hidden; display: grid; place-items: center; height: clamp(74px, 14vw, 104px); background: linear-gradient(135deg, hsl(var(--h) 75% 58%), hsl(var(--h) 70% 38%)); }
        [data-theme="dark"] .cr-banner { background: linear-gradient(135deg, hsl(var(--h) 55% 38%), hsl(var(--h) 55% 20%)); }
        .cr-banner b { font-size: clamp(26px, 5vw, 38px); font-weight: 900; color: #fff; letter-spacing: -.02em; }
        .cr-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.35) 50%, transparent 65%); transform: translateX(-120%); }
        .cr-cert[data-in="1"] .cr-shine { animation: cr-sweep 1.6s .35s cubic-bezier(.16,1,.3,1) both; }
        @keyframes cr-sweep { to { transform: translateX(120%); } }
        .cr-text { display: flex; flex-direction: column; gap: 3px; padding: 14px 16px 16px; min-width: 0; }
        .cr-text strong { font-size: 14.5px; font-weight: 800; line-height: 1.35; }
        .cr-text > span { font-size: 13px; color: var(--text-secondary); }
        .cr-dt { display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .cr-dt svg { flex: none; color: hsl(var(--h) 60% 42%); }
        .cr-member { margin-top: 32px; text-align: center; }
        .cr-member p { margin: 0; font-size: 14px; color: var(--text-secondary); }

        @media (hover: hover) and (pointer: fine) {
          .cr-award:hover, .cr-card:hover { transform: translateY(-6px); box-shadow: 0 22px 50px rgba(0,0,0,.12); }
        }
        @media (min-width: 700px) {
          .cr-awards, .cr-before { grid-template-columns: repeat(3, 1fr); }
          .cr-certs { grid-template-columns: repeat(3, 1fr); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cr-award, .cr-card, .cr-photo { transition: none; }
          .cr-shine { display: none; }
        }
      `}</style>
    </section>
  );
}
