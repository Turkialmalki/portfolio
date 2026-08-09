"use client";

import Image from "next/image";

/**
 * Campaign visuals built from REAL assets — Turki's real positioning, his real
 * avatar photo, and real project screenshots. The CV is a genuinely designed
 * two-column résumé (header photo, dated roles, sidebar), not wireframe bars.
 * These are presentation objects, not dashboard cards.
 */

type Lang = "ar" | "en";

const CV = {
  name: { ar: "تركي المالكي", en: "Turki Almalki" },
  roleStrong: { ar: "قائد هندسة برمجيات · مطوّر منتجات", en: "Engineering Leader · Product Builder" },
  roleWeak: { ar: "مهندس برمجيات", en: "Software Engineer" },
  experience: { ar: "الخبرة", en: "Experience" },
  focus: { ar: "التقنيات", en: "Focus" },
  industries: { ar: "القطاعات", en: "Industries" },
  skills: { ar: "المهارات", en: "Skills" },
  roleTitle: { ar: "قائد هندسي — تقنية مالية وتطبيقات", en: "Engineering Lead — Fintech & Mobile" },
  dates: { ar: "٢٠١٩ — الآن", en: "2019 — Now" },
  strongBullets: [
    { ar: "قيادة هندسة المنتجات عبر منصات مصرفية وتقنية مالية.", en: "Led product engineering across banking & fintech platforms." },
    { ar: "إطلاق منتجات ويب وجوال واسعة النطاق في السعودية.", en: "Shipped large-scale web & mobile products across Saudi Arabia." },
    { ar: "توجيه المهندسين وتحديد المسار التقني.", en: "Mentored engineers and set technical direction." },
  ],
  weakBullets: [
    { ar: "عملت في بنك على تطبيقات الجوال.", en: "Worked at a bank on mobile apps." },
    { ar: "مسؤول عن فريق الجوال.", en: "Responsible for the mobile team." },
    { ar: "مهام هندسية متنوعة.", en: "Various engineering tasks." },
  ],
  industriesVal: { ar: "مصرفي · تقنية مالية\nحكومي · ابتكار", en: "Banking · Fintech\nGovernment · Innovation" },
};

/* ── A genuinely designed premium CV (two-column, header photo) ── */
export function PremiumCV({ lang, variant = "strong", className = "" }: { lang: Lang; variant?: "strong" | "weak"; className?: string }) {
  const strong = variant === "strong";
  const bullets = strong ? CV.strongBullets : CV.weakBullets;
  return (
    <div className={`cv ${strong ? "cv-strong" : "cv-weak"} ${className}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="cv-head">
        {strong && (
          <span className="cv-photo">
            <Image src="/avatar.jpg" alt="" width={64} height={64} />
          </span>
        )}
        <div>
          <h4 className="cv-name">{CV.name[lang]}</h4>
          <p className={`cv-role ${strong ? "cv-role-strong" : ""}`}>{strong ? CV.roleStrong[lang] : CV.roleWeak[lang]}</p>
        </div>
      </div>

      <div className={`cv-cols ${strong ? "" : "cv-cols-single"}`}>
        <div className="cv-main">
          <span className="cv-label">{CV.experience[lang]}</span>
          {strong && (
            <div className="cv-role-row">
              <span className="cv-role-title">{CV.roleTitle[lang]}</span>
              <span className="cv-dates">{CV.dates[lang]}</span>
            </div>
          )}
          <ul className="cv-bullets">
            {bullets.map((b, i) => <li key={i}>{b[lang]}</li>)}
          </ul>
        </div>

        {strong && (
          <div className="cv-side">
            <span className="cv-label">{CV.focus[lang]}</span>
            <p className="cv-side-val cv-side-strong">React · Next.js · React Native · TypeScript</p>
            <span className="cv-label cv-label-mt">{CV.industries[lang]}</span>
            <p className="cv-side-val">{CV.industriesVal[lang]}</p>
          </div>
        )}
        {!strong && (
          <div className="cv-weak-skills">
            <span className="cv-label">{CV.skills[lang]}</span>
            <p className="cv-side-val">{lang === "ar" ? "جافاسكربت، تطبيقات، عمل جماعي" : "JavaScript, apps, teamwork"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const LI = {
  name: { ar: "تركي المالكي", en: "Turki Almalki" },
  headlineStrong: { ar: "قائد هندسة برمجيات | مطوّر منتجات | تقنية مالية وتحول رقمي", en: "Engineering Leader | Product Builder | Fintech & Digital Transformation" },
  headlineWeak: { ar: "مهندس برمجيات", en: "Software Engineer" },
  loc: { ar: "الرياض، السعودية", en: "Riyadh, Saudi Arabia" },
  about: { ar: "نبذة", en: "About" },
  aboutBody: { ar: "قائد هندسي يبني منتجات رقمية قابلة للتوسع وعالية الأثر عبر القطاع المصرفي والتقنية المالية.", en: "Engineering leader building scalable, high-impact digital products across banking and fintech." },
};

export function LinkedInProfile({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <div className={`li ${className}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="li-cover" />
      <span className="li-avatar"><Image src="/avatar.jpg" alt="" width={80} height={80} /></span>
      <div className="li-body">
        <h4 className="li-name">{LI.name[lang]}</h4>
        <p className="li-headline">{LI.headlineStrong[lang]}</p>
        <p className="li-loc">{LI.loc[lang]}</p>
        <span className="li-label">{LI.about[lang]}</span>
        <p className="li-about">{LI.aboutBody[lang]}</p>
      </div>
    </div>
  );
}

/* ── Portfolio showcase — real project screenshots, layered ── */
const PROJECTS = [
  { img: "/emkan2026.png", label: { ar: "إمكان", en: "Emkan" } },
  { img: "/alrajhi2026.png", label: { ar: "الراجحي", en: "Al Rajhi" } },
  { img: "/munasib2026.png", label: { ar: "مناسب", en: "Munaseb" } },
  { img: "/ithnin2026.png", label: { ar: "اثنين", en: "Ithnain" } },
];

export function PortfolioShowcase({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <div className={`pf ${className}`}>
      <div className="pf-bar">
        <span className="pf-dot" /><span className="pf-dot" /><span className="pf-dot" />
        <span className="pf-url">turkialmalki.com</span>
      </div>
      <div className="pf-body" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="pf-hero">
          <h4 className="pf-title">{lang === "ar" ? "تركي المالكي" : "Turki Almalki"}</h4>
          <p className="pf-role">{lang === "ar" ? "أعمال مختارة" : "Selected work"}</p>
        </div>
        <div className="pf-grid">
          {PROJECTS.map((p) => (
            <div key={p.img} className="pf-tile">
              <Image src={p.img} alt={p.label[lang]} fill sizes="220px" className="pf-img" />
              <span className="pf-label">{p.label[lang]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductVisualStyles() {
  return (
    <style>{`
      /* ── Premium CV ── */
      .cv {
        width: 100%; padding: clamp(22px, 2.4vw, 32px); border-radius: 14px;
        background: var(--bg-surface, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.07));
        text-align: start; --cv-line: var(--border-subtle, rgba(0,0,0,0.08));
      }
      .cv-head { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1.5px solid var(--cv-line); }
      .cv-photo { width: 52px; height: 52px; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: var(--bg-card-muted, #e8e8e8); }
      .cv-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 28%; }
      .cv-name { margin: 0 0 3px; font-size: clamp(18px, 1.7vw, 22px); font-weight: 800; letter-spacing: -0.01em; color: var(--text-primary); }
      .cv-role { margin: 0; font-size: 12.5px; font-weight: 500; color: var(--text-secondary); }
      .cv-role-strong { color: var(--accent, #1495ff); }
      .cv-cols { display: flex; gap: clamp(18px, 2.5vw, 30px); }
      .cv-cols-single { display: block; }
      .cv-main { flex: 1.5; min-width: 0; }
      .cv-side { flex: 1; min-width: 0; }
      .cv-label { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted, #aaa); margin-bottom: 8px; }
      .cv-label-mt { margin-top: 18px; }
      .cv-role-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
      .cv-role-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
      .cv-dates { font-size: 10.5px; color: var(--text-muted, #aaa); white-space: nowrap; }
      .cv-bullets { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
      .cv-bullets li { position: relative; padding-inline-start: 14px; font-size: 12.5px; line-height: 1.5; color: var(--text-secondary); }
      .cv-bullets li::before { content: ""; position: absolute; inset-inline-start: 0; top: 8px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent, #1495ff); }
      .cv-weak .cv-bullets li::before { background: var(--text-muted, #bbb); }
      .cv-side-val { margin: 0; font-size: 12px; line-height: 1.6; color: var(--text-secondary); white-space: pre-line; }
      .cv-side-strong { color: var(--text-primary); font-weight: 600; }
      .cv-weak-skills { margin-top: 16px; }
      .cv-weak { filter: none; }
      .cv-weak .cv-name, .cv-weak .cv-role, .cv-weak .cv-bullets li, .cv-weak .cv-side-val { color: var(--text-muted, #9aa0aa); }

      /* ── LinkedIn ── */
      .li { position: relative; width: 100%; border-radius: 14px; overflow: hidden; background: var(--bg-surface, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.07)); text-align: start; }
      .li-cover { height: 72px; background: linear-gradient(120deg, var(--accent, #1495ff), #0b6fc0); }
      .li-avatar { position: absolute; top: 36px; inset-inline-start: 24px; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 4px solid var(--bg-surface, #fff); background: var(--bg-card-muted, #e8e8e8); z-index: 2; }
      .li-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center 28%; }
      .li-body { padding: 48px 24px 26px; }
      .li-name { margin: 0 0 4px; font-size: 20px; font-weight: 800; color: var(--text-primary); }
      .li-headline { margin: 0 0 5px; font-size: 13px; font-weight: 500; line-height: 1.5; color: var(--text-primary); }
      .li-loc { margin: 0 0 18px; font-size: 12px; color: var(--text-muted, #999); }
      .li-label { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted, #aaa); margin-bottom: 6px; }
      .li-about { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--text-secondary); }

      /* ── Portfolio ── */
      .pf { width: 100%; border-radius: 14px; overflow: hidden; background: var(--bg-surface, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.07)); }
      .pf-bar { display: flex; align-items: center; gap: 6px; padding: 12px 15px; background: var(--bg-card, #f3f3f3); }
      .pf-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-subtle, rgba(0,0,0,0.18)); }
      .pf-url { margin-inline-start: 12px; padding: 3px 14px; border-radius: 6px; background: var(--bg-surface, #fff); font-size: 11px; color: var(--text-muted, #999); }
      .pf-body { padding: 24px; }
      .pf-hero { margin-bottom: 20px; }
      .pf-title { margin: 0 0 3px; font-size: 21px; font-weight: 800; letter-spacing: -0.01em; color: var(--text-primary); }
      .pf-role { margin: 0; font-size: 12.5px; color: var(--text-secondary); }
      .pf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .pf-tile { position: relative; aspect-ratio: 16 / 10; border-radius: 12px; overflow: hidden; background: var(--bg-card-muted, #e8e8e8); }
      .pf-img { object-fit: cover; }
      .pf-label { position: absolute; bottom: 9px; inset-inline-start: 9px; padding: 3px 10px; border-radius: 999px; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); color: #fff; font-size: 10.5px; font-weight: 600; }

      @media (max-width: 520px) {
        .cv-cols { flex-direction: column; gap: 16px; }
      }
    `}</style>
  );
}
