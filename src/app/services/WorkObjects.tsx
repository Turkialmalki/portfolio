"use client";

import Image from "next/image";
import type { Lang } from "./CareerObjects";

/* ═══════════════════════════════════════════════════════════════════════
   WORK OBJECTS — the product and data half of the story.

   Everything below renders REAL work:

   · WindowCard — screenshots of shipped products (Emkan, Al Rajhi, Munaseb,
     Ithnain, Wijhut, BaseBox), each under its own address.
   · DataSheet + DashboardCard — the actual Film Accelerator portfolio report
     built for the Saudi Film Commission's 20-company accelerator batch
     (turkialmalki.github.io/film-accelerator-dashboard). Every figure here is
     taken from that report: 20 companies, 64% average readiness, 12 of 20
     revenue-generating, SAR 5.6M floor, 118 direct jobs, health index 56.

   The two are the same information in two states: DataSheet is the raw table
   a client hands over, DashboardCard is what they get back.
   ═══════════════════════════════════════════════════════════════════════ */

export const DASHBOARD_URL = "https://turkialmalki.github.io/film-accelerator-dashboard/";

/* ───────────────────────── device frames ───────────────────────── */

/** A browser window wrapped around a real screenshot. */
export function WindowCard({
  src,
  alt,
  url,
  className = "",
}: {
  src: string;
  alt: string;
  url: string;
  className?: string;
}) {
  return (
    <figure className={`wn ${className}`}>
      <div className="wn-bar">
        <span className="wn-dot" />
        <span className="wn-dot" />
        <span className="wn-dot" />
        <span className="wn-url">{url}</span>
      </div>
      <div className="wn-shot">
        <Image src={src} alt={alt} fill sizes="(max-width: 900px) 84vw, 52vw" className="wn-img" />
      </div>
    </figure>
  );
}

/* ───────────────────────── raw data ───────────────────────── */

/** Twelve real rows out of the twenty, as they arrive: a flat table. */
const RAW_ROWS: [string, string, string, string][] = [
  ["Specter Production", "Series A", "68%", "1,000,000+"],
  ["Scenariohat", "Pre-Seed", "81%", "100,000–500,000"],
  ["Blacklight Films", "Pre-A", "68%", "1,000,000+"],
  ["Story Tailors", "Pre-Seed", "68%", "< 100,000"],
  ["Whitelens Academy", "Pre-Seed", "68%", "100,000–500,000"],
  ["Meem Cinema", "Seed", "68%", "100,000–500,000"],
  ["Fateel Film Fund", "Seed", "68%", "500,000–1,000,000"],
  ["Athar Studio", "Seed", "62%", "100,000–500,000"],
  ["Expanse Media", "Pre-A", "74%", "1,000,000+"],
  ["Tashbeek", "MVP", "61%", "< 100,000"],
  ["Namnam Studio", "Pre-Seed", "68%", "< 100,000"],
  ["Busr Platform", "MVP", "53%", "100,000–500,000"],
];

const RAW_HEAD = {
  ar: ["الشركة", "المرحلة", "الجاهزية", "الإيراد (ر.س)"],
  en: ["company", "stage", "readiness", "revenue (SAR)"],
};

export function DataSheet({ lang }: { lang: Lang }) {
  return (
    <div className="ds" dir="ltr">
      <div className="ds-tab">
        <span>portfolio_raw.csv</span>
        <span className="ds-tab-n">20 rows · 14 cols</span>
      </div>
      <div className="ds-grid">
        <div className="ds-row ds-head">
          {RAW_HEAD[lang].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {RAW_ROWS.map((r) => (
          <div key={r[0]} className="ds-row">
            {r.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── the dashboard ───────────────────────── */

const KPIS = [
  { v: "20", l: { ar: "شركة في الدفعة", en: "companies in batch" } },
  { v: "64%", l: { ar: "متوسط الجاهزية", en: "avg. readiness" } },
  { v: "12/20", l: { ar: "لديها إيرادات", en: "revenue-generating" } },
  { v: "118", l: { ar: "وظيفة مباشرة", en: "direct jobs" } },
  // No parenthetical: "(ر.س)" is a bidi-neutral run that wraps onto its own
  // line inside a KPI tile and reads as a stray fragment in Arabic.
  { v: "5.6M", l: { ar: "أقل إيراد بالريال", en: "revenue floor (SAR)" } },
  { v: "3/20", l: { ar: "جاهزة للاستثمار", en: "investment-ready" } },
];

const STAGES: [string, number][] = [
  ["MVP", 7],
  ["Pre-Seed", 5],
  ["Seed", 5],
  ["Pre-A", 2],
  ["Series A", 1],
];

const TOP_READY: [string, number][] = [
  ["Scenariohat", 81],
  ["Prodexa", 81],
  ["Expanse Media", 74],
  ["Mishkat AI", 69],
  ["Specter", 68],
  ["Blacklight", 68],
];

const DASH_COPY = {
  ar: {
    title: "لوحة متابعة مسرعة أعمال الأفلام",
    sub: "هيئة الأفلام · دفعة من 20 شركة",
    s1: "الملخص التنفيذي",
    s2: "الشركات حسب مرحلة الاستثمار",
    s3: "الأقرب لجولة استثمارية",
    s4: "مؤشر صحة المحفظة",
    risk: "85% من الشركات في الرياض · 6 شركات تعتمد على شخص واحد",
  },
  en: {
    title: "Film Accelerator — portfolio dashboard",
    sub: "Saudi Film Commission · 20-company batch",
    s1: "Executive summary",
    s2: "Companies by investment stage",
    s3: "Closest to a funding round",
    s4: "Portfolio health index",
    risk: "85% concentrated in Riyadh · 6 companies carry single-person risk",
  },
};

/**
 * The executive dashboard. Growth is expressed through CSS custom properties
 * so a scroll-driven parent can assemble it without this component knowing
 * anything about motion:
 *   --kpi   0→1  KPI tiles settle in
 *   --bars  0→1  every chart grows from its baseline
 *   --ring  0→1  the health ring fills
 */
export function DashboardCard({ lang }: { lang: Lang }) {
  const c = DASH_COPY[lang];
  const max = Math.max(...STAGES.map((s) => s[1]));
  return (
    <div className="db" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="db-top">
        <div>
          <h4 className="db-title">{c.title}</h4>
          <p className="db-sub">{c.sub}</p>
        </div>
        <span className="db-live">01 — {c.s1}</span>
      </header>

      <div className="db-kpis">
        {KPIS.map((k, i) => (
          <div key={k.v + i} className="db-kpi" style={{ ["--i" as string]: i }}>
            <b>{k.v}</b>
            <span>{k.l[lang]}</span>
          </div>
        ))}
      </div>

      <div className="db-charts">
        <section className="db-panel">
          <span className="db-lab">{c.s2}</span>
          <div className="db-cols">
            {STAGES.map(([name, n]) => (
              <div key={name} className="db-col">
                <span className="db-colv">{n}</span>
                <span className="db-colbar" style={{ height: `${(n / max) * 100}%` }} />
                <span className="db-colk">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="db-panel">
          <span className="db-lab">{c.s3}</span>
          <div className="db-rows">
            {TOP_READY.map(([name, v]) => (
              <div key={name} className="db-rank">
                <span className="db-rankn">{name}</span>
                <span className="db-track">
                  <span className="db-fill" style={{ width: `${v}%` }} />
                </span>
                <span className="db-rankv">{v}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="db-panel db-panel-ring">
          <span className="db-lab">{c.s4}</span>
          <div className="db-ring">
            <span className="db-ring-v">56</span>
          </div>
          <p className="db-risk">{c.risk}</p>
        </section>
      </div>
    </div>
  );
}

/* ────────────────────────────── styles ────────────────────────────── */

export function WorkObjectStyles() {
  return (
    <style>{`
      /* ══ browser window ══ */
      .wn {
        margin: 0; width: 100%; container-type: inline-size; border-radius: 1.3cqw; overflow: hidden;
        background: #fff; border: 1px solid rgba(0,0,0,0.08); font-size: 2.4cqw;
        box-shadow: 0 2px 6px rgba(20,22,30,0.06), 0 44px 80px -30px rgba(20,22,30,0.42);
      }
      .wn-bar { display: flex; align-items: center; gap: 0.45em; padding: 0.75em 0.95em; background: #f4f4f2; }
      .wn-dot { width: 0.62em; height: 0.62em; border-radius: 50%; background: rgba(0,0,0,0.16); }
      .wn-url { margin-inline-start: 0.9em; padding: 0.22em 1.2em; border-radius: 0.4em; background: #fff; font-size: 0.82em; color: #8b8b8b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .wn-shot { position: relative; aspect-ratio: 16 / 10; background: #eeeeec; }
      .wn-img { object-fit: cover; }

      /* ══ raw data ══ */
      .ds {
        width: 100%; container-type: inline-size; border-radius: 1.2cqw; overflow: hidden;
        background: #fdfdfc; border: 1px solid rgba(0,0,0,0.09); font-size: 2.5cqw;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 34px 66px -26px rgba(20,22,30,0.3);
      }
      .ds-tab { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; padding: 0.7em 1em; background: #f1f1ee; border-bottom: 1px solid rgba(0,0,0,0.07); font-size: 0.78em; color: #6f6f6a; }
      .ds-tab-n { color: #a6a6a1; }
      .ds-grid { display: flex; flex-direction: column; }
      .ds-row { display: grid; grid-template-columns: 1.5fr 0.85fr 0.7fr 1.25fr; gap: 0.6em; padding: 0.46em 1em; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.74em; color: #4c4c48; }
      .ds-row span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ds-head { background: #f7f7f5; color: #97978f; letter-spacing: 0.02em; }
      .ds-row:nth-child(even) { background: rgba(0,0,0,0.015); }
      /* The sheet is monospace because it is a CSV — but the header row is the
         one part that gets localised, and no system mono covers Arabic, so in
         Arabic it fell through to a default face. The rows stay mono; only the
         translated header returns to the brand font. */
      .ds-head:lang(ar) { font-family: var(--font-thmanyah), sans-serif; line-height: 1.6; }

      /* ══ executive dashboard ══ */
      /* The three channels a parent assembles this card with. Registering
         them does two things a plain custom property cannot:

         · THEY INHERIT FROM A PARENT. They used to be re-declared on .db
           itself, which shadowed whatever the scene set on the wrapper above
           — so the assembly silently never ran. An initial-value carries the
           same "fully built" default without standing in the way.
         · THEY CAN BE TRANSITIONED. An unregistered custom property is an
           untyped token and CSS will only ever flip it. Typed as <number>,
           it interpolates, which is what lets the phone play the KPI → charts
           → ring sequence with three CSS transitions and no JavaScript. */
      @property --kpi { syntax: "<number>"; inherits: true; initial-value: 1; }
      @property --bars { syntax: "<number>"; inherits: true; initial-value: 1; }
      @property --ring { syntax: "<number>"; inherits: true; initial-value: 1; }
      .db {
        width: 100%; container-type: inline-size; padding: 3.4cqw; border-radius: 1.4cqw;
        background: linear-gradient(168deg, #12141b 0%, #0b0d12 62%);
        border: 1px solid rgba(255,255,255,0.09); color: #e9ecf2; font-size: 2.15cqw; text-align: start;
        box-shadow: 0 2px 6px rgba(6,8,14,0.4), 0 48px 90px -30px rgba(6,8,14,0.62);
      }
      .db-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.2em; padding-bottom: 1em; border-bottom: 1px solid rgba(255,255,255,0.09); }
      .db-title { margin: 0 0 0.22em; font-size: 1.25em; font-weight: 800; letter-spacing: -0.015em; }
      .db-sub { margin: 0; font-size: 0.78em; color: #8b93a3; }
      .db-live { flex: 0 0 auto; padding: 0.3em 0.9em; border-radius: 999px; background: rgba(20,149,255,0.14); color: #6cb8ff; font-size: 0.66em; font-weight: 700; letter-spacing: 0.06em; white-space: nowrap; }

      .db-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.55em; margin-top: 1.1em; }
      .db-kpi {
        display: flex; flex-direction: column; gap: 0.22em; padding: 0.8em 0.7em; border-radius: 0.55em;
        background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.06);
        opacity: clamp(0, calc((var(--kpi) * 6) - var(--i)), 1);
        transform: translateY(calc((1 - clamp(0, calc((var(--kpi) * 6) - var(--i)), 1)) * 10px));
      }
      .db-kpi b { font-size: 1.5em; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
      .db-kpi span { font-size: 0.64em; line-height: 1.3; color: #8b93a3; }

      .db-charts { display: grid; grid-template-columns: 0.95fr 1.15fr 0.8fr; gap: 0.6em; margin-top: 0.6em; }
      .db-panel { padding: 0.9em; border-radius: 0.55em; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.06); }
      .db-lab { display: block; margin-bottom: 0.85em; font-size: 0.62em; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7d859a; }

      .db-cols { display: flex; align-items: flex-end; gap: 0.45em; height: 7.4em; }
      .db-col { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
      .db-colv { font-size: 0.66em; font-weight: 800; color: #c9d1e2; margin-bottom: 0.25em; opacity: var(--bars); }
      .db-colbar { width: 100%; border-radius: 0.25em 0.25em 0 0; background: linear-gradient(180deg, #4aa8ff, #1a6fd4); transform: scaleY(var(--bars)); transform-origin: bottom; }
      .db-colk { margin-top: 0.4em; font-size: 0.56em; color: #7d859a; white-space: nowrap; }

      .db-rows { display: flex; flex-direction: column; gap: 0.52em; }
      .db-rank { display: grid; grid-template-columns: 4.6em 1fr 2em; align-items: center; gap: 0.55em; }
      .db-rankn { font-size: 0.62em; color: #aeb6c6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .db-track { height: 0.5em; border-radius: 999px; background: rgba(255,255,255,0.07); overflow: hidden; }
      .db-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #26d07c, #14a05c); transform: scaleX(var(--bars)); transform-origin: left center; }
      [dir="rtl"] .db-fill { transform-origin: right center; }
      .db-rankv { font-size: 0.6em; font-weight: 800; color: #d3dae7; text-align: end; }

      .db-panel-ring { display: flex; flex-direction: column; align-items: center; }
      .db-ring {
        position: relative; width: 5.4em; height: 5.4em; border-radius: 50%;
        background: conic-gradient(#f0a92c calc(var(--ring) * 56%), rgba(255,255,255,0.08) 0);
        display: grid; place-items: center;
      }
      .db-ring::after { content: ""; position: absolute; inset: 0.62em; border-radius: 50%; background: #101219; }
      .db-ring-v { position: relative; z-index: 2; font-size: 1.5em; font-weight: 900; letter-spacing: -0.03em; }
      .db-risk { margin: 0.8em 0 0; font-size: 0.6em; line-height: 1.45; color: #8b93a3; text-align: center; }

      @container (max-width: 520px) {
        .db-kpis { grid-template-columns: repeat(3, 1fr); }
        .db-charts { grid-template-columns: 1fr; }
        .db-live { display: none; }
      }

      /* ══ Arabic pass over the dashboard ══
         Every label here is small and sits inside a fixed-height tile, which
         is exactly where a 1.0–1.45 line-height eats Arabic descenders. The
         tiles keep their size; only the text rhythm inside them changes. */
      [dir="rtl"] .db-title { line-height: 1.35; }
      [dir="rtl"] .db-sub { line-height: 1.5; }
      [dir="rtl"] .db-live { line-height: 1.5; }
      [dir="rtl"] .db-kpi span { line-height: 1.55; }
      [dir="rtl"] .db-lab { line-height: 1.6; }
      [dir="rtl"] .db-risk { line-height: 1.7; }
      /* The chapter figure and the label are one string ("01 — الملخص") —
         isolate it so the Latin digits stay on the correct side. */
      [dir="rtl"] .db-live { unicode-bidi: isolate; }
    `}</style>
  );
}
