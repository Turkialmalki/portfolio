"use client";

import Image from "next/image";

/**
 * REAL career objects for the /services campaign.
 *
 * Every object below renders genuine content — Turki's real roles, real dates,
 * real employers, real metrics, real photograph, real project screenshots.
 * Nothing here is a gray skeleton or a placeholder rectangle: at small sizes the
 * type compresses into believable document texture, at large sizes it reads.
 *
 * Sizing is container-relative (`cqw`), so a single component is convincing at
 * 90px wide in the chaos field and at 520px wide as a hero product shot.
 */

export type Lang = "ar" | "en";

/* ────────────────────────────── content ────────────────────────────── */

const P = {
  name: { ar: "تركي المالكي", en: "Turki Almalki" },
  contact: {
    ar: "الرياض، السعودية · turkialmalki.com · linkedin.com/in/turkialmalki",
    en: "Riyadh, Saudi Arabia · turkialmalki.com · linkedin.com/in/turkialmalki",
  },
  titleStrong: {
    ar: "قائد هندسة برمجيات · منتجات رقمية وابتكار",
    en: "Engineering Leader · Digital Products & Innovation",
  },
  titleWeak: { ar: "مهندس برمجيات", en: "Software Engineer" },
};

const STRONG_CV = {
  summaryLabel: { ar: "الملخص", en: "Summary" },
  summary: {
    ar: "قائد هندسي يبني منتجات رقمية قابلة للتوسع وعالية الأثر عبر القطاع المصرفي والتقنية المالية ومراكز الابتكار.",
    en: "Engineering leader building scalable, high-impact digital products across banking, fintech and government innovation.",
  },
  expLabel: { ar: "الخبرة", en: "Experience" },
  roles: [
    {
      title: { ar: "قائد هندسة برمجيات — مركز الابتكار", en: "Engineering Leader — Innovation Center" },
      dates: { ar: "أكتوبر 2024 — الآن", en: "Oct 2024 — Present" },
      bullets: [
        {
          ar: "قيادة المبادرات الرقمية وتحويل احتياجات الأعمال إلى خارطة طريق للويب والجوال.",
          en: "Lead digital initiatives, translating business needs into prioritized web and mobile roadmaps.",
        },
        {
          ar: "تقييم الأطر الحديثة وأدوات الذكاء الاصطناعي لرفع الإنتاجية والأثر الهندسي.",
          en: "Evaluate modern frameworks and AI-enabled tooling to raise productivity and engineering impact.",
        },
      ],
    },
    {
      title: { ar: "مهندس برمجيات أول — إمكان للتمويل", en: "Lead Software Engineer — Emkan Finance" },
      dates: { ar: "يوليو 2022 — أكتوبر 2024", en: "Jul 2022 — Oct 2024" },
      bullets: [
        {
          ar: "قيادة تحديث منصات التجار الأساسية عبر الويب والجوال.",
          en: "Led modernization of core digital merchant platforms across web and mobile.",
        },
        {
          ar: "تكاملات مدعومة بالذكاء الاصطناعي رفعت رضا العملاء بنسبة 150%.",
          en: "Shipped UX and AI-driven integrations that improved customer satisfaction by 150%.",
        },
      ],
    },
    {
      title: { ar: "مهندس برمجيات أول — مصرف الراجحي", en: "Senior Software Engineer — Al Rajhi Bank" },
      dates: { ar: "أغسطس 2019 — يوليو 2022", en: "Aug 2019 — Jul 2022" },
      bullets: [
        {
          ar: "قيادة تجربة جوال للعملاء بـ React Native: 95% تقييم إيجابي و+90% تحميلات.",
          en: "Led a customer-facing React Native experience: 95% positive feedback, +90% downloads.",
        },
      ],
    },
  ],
  skillsLabel: { ar: "المهارات", en: "Skills" },
  skills: {
    ar: "React · Next.js · React Native · TypeScript · Node.js · Figma",
    en: "React · Next.js · React Native · TypeScript · Node.js · Figma",
  },
  eduLabel: { ar: "التعليم", en: "Education" },
  edu: {
    ar: "بكالوريوس علوم حاسب — جامعة الملك فيصل",
    en: "BSc Computer Science — King Faisal University",
  },
  awardLabel: { ar: "الجوائز", en: "Awards" },
  award: {
    ar: "المركز الأول — مسابقة أرامكو وعد للبرمجة",
    en: "1st Place — Aramco Wa'ed Programming Competition",
  },
};

const WEAK_CV = {
  objectiveLabel: { ar: "الهدف الوظيفي", en: "Objective" },
  objective: {
    ar: "مهندس برمجيات مجتهد يبحث عن فرصة جيدة في شركة مرموقة لاستخدام مهاراتي وتطوير نفسي.",
    en: "Hard working software engineer looking for a good opportunity in a reputable company where I can use my skills.",
  },
  expLabel: { ar: "الخبرة", en: "Experience" },
  roles: [
    {
      title: { ar: "مركز الابتكار", en: "Innovation Center" },
      dates: { ar: "2024 — الآن", en: "2024 — Present" },
      bullets: [
        { ar: "مسؤول عن المبادرات الرقمية.", en: "Responsible for digital initiatives." },
        { ar: "حضور اجتماعات مع فرق مختلفة.", en: "Attend meetings with different teams." },
      ],
    },
    {
      title: { ar: "إمكان", en: "Emkan Finance" },
      dates: { ar: "2022 — 2024", en: "2022 — 2024" },
      bullets: [
        { ar: "عملت على منصة التجار.", en: "Worked on the merchant platform." },
        { ar: "مسؤول عن إدارة فريق الجوال.", en: "Responsible for managing the mobile team." },
      ],
    },
    {
      title: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
      dates: { ar: "2019 — 2022", en: "2019 — 2022" },
      bullets: [
        { ar: "عملت على تطبيقات الجوال.", en: "Worked on mobile apps." },
        { ar: "مهام هندسية متنوعة.", en: "Various engineering tasks." },
      ],
    },
  ],
  skillsLabel: { ar: "المهارات", en: "Skills" },
  skills: {
    ar: "جافاسكربت، تطبيقات، عمل جماعي، مايكروسوفت أوفيس",
    en: "JavaScript, apps, teamwork, Microsoft Office",
  },
  refs: { ar: "المراجع متوفرة عند الطلب.", en: "References available upon request." },
};

/* ────────────────────────────── CV sheet ────────────────────────────── */

/**
 * A4 résumé sheet with real content.
 * `weak` is the same career written badly — no metrics, no titles, duty-speak.
 */
export function CVSheet({
  lang,
  variant = "strong",
  className = "",
}: {
  lang: Lang;
  variant?: "strong" | "weak";
  className?: string;
}) {
  const rtl = lang === "ar";
  if (variant === "weak") {
    return (
      <div className={`sheet sheet-weak ${className}`} dir={rtl ? "rtl" : "ltr"}>
        <div className="sh-paper" />
        <div className="sh-body">
          <div className="wk-head">
            <h4 className="wk-name">{P.name[lang]}</h4>
            <p className="wk-sub">{P.titleWeak[lang]}</p>
            <p className="wk-sub wk-contact">{P.contact[lang]}</p>
          </div>
          <p className="wk-label">{WEAK_CV.objectiveLabel[lang]}</p>
          <p className="wk-text">{WEAK_CV.objective[lang]}</p>
          <p className="wk-label">{WEAK_CV.expLabel[lang]}</p>
          {WEAK_CV.roles.map((r, i) => (
            <div key={i} className="wk-role">
              <span className="wk-role-t">
                {r.title[lang]} <span className="wk-dates">({r.dates[lang]})</span>
              </span>
              <ul className="wk-list">
                {r.bullets.map((b, j) => (
                  <li key={j}>{b[lang]}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="wk-label">{WEAK_CV.skillsLabel[lang]}</p>
          <p className="wk-text">{WEAK_CV.skills[lang]}</p>
          <p className="wk-text wk-refs">{WEAK_CV.refs[lang]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sheet sheet-strong ${className}`} dir={rtl ? "rtl" : "ltr"}>
      <div className="sh-paper" />
      <div className="sh-body">
        <header className="st-head">
          <span className="st-photo">
            <Image src="/avatar.jpg" alt="" width={160} height={160} />
          </span>
          <div className="st-id">
            <h4 className="st-name">{P.name[lang]}</h4>
            <p className="st-title">{P.titleStrong[lang]}</p>
            <p className="st-contact">{P.contact[lang]}</p>
          </div>
        </header>

        <section className="st-block">
          <span className="st-label">{STRONG_CV.summaryLabel[lang]}</span>
          <p className="st-summary">{STRONG_CV.summary[lang]}</p>
        </section>

        <section className="st-block">
          <span className="st-label">{STRONG_CV.expLabel[lang]}</span>
          {STRONG_CV.roles.map((r, i) => (
            <div key={i} className="st-role">
              <div className="st-role-row">
                <span className="st-role-t">{r.title[lang]}</span>
                <span className="st-dates">{r.dates[lang]}</span>
              </div>
              <ul className="st-list">
                {r.bullets.map((b, j) => (
                  <li key={j}>{b[lang]}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="st-foot">
          <div>
            <span className="st-label">{STRONG_CV.skillsLabel[lang]}</span>
            <p className="st-small">{STRONG_CV.skills[lang]}</p>
          </div>
          <div className="st-foot-2">
            <div>
              <span className="st-label">{STRONG_CV.eduLabel[lang]}</span>
              <p className="st-small">{STRONG_CV.edu[lang]}</p>
            </div>
            <div>
              <span className="st-label">{STRONG_CV.awardLabel[lang]}</span>
              <p className="st-small">{STRONG_CV.award[lang]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The crumple. Facet highlights + shadows + hard crease lines over a real sheet.
 * Parent animates the wrapper's opacity from 1 → 0 to physically flatten it,
 * so the *same* document unfolds instead of being swapped out.
 */
export function CrumpleOverlay() {
  return (
    <div className="cr-layer" aria-hidden>
      <span className="cf cf1" />
      <span className="cf cf2" />
      <span className="cf cf3" />
      <span className="cf cf4" />
      <span className="cf cf5" />
      <span className="cf cf6" />
      <span className="cf cf7" />
      <span className="cf cf8" />
      <span className="cf cf9" />
      <span className="cf cf10" />
      <span className="cl cl1" />
      <span className="cl cl2" />
      <span className="cl cl3" />
      <span className="cl cl4" />
    </div>
  );
}

/** Red review marks — the "someone already rejected this" pass. */
export function ReviewMarks({ lang }: { lang: Lang }) {
  return (
    <div className="mk" aria-hidden>
      <span className="mk-strike mk-s1" />
      <span className="mk-strike mk-s2" />
      <span className="mk-circle" />
      <span className="mk-note mk-n1">{lang === "ar" ? "غير واضح" : "unclear"}</span>
      <span className="mk-note mk-n2">?</span>
      <span className="mk-note mk-n3">{lang === "ar" ? "أين الأثر؟" : "impact?"}</span>
    </div>
  );
}

/* ───────────────────────────── LinkedIn ───────────────────────────── */

const LI = {
  headlineStrong: {
    ar: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية وابتكار",
    en: "Engineering Leader | Product Builder | Fintech & Digital Innovation",
  },
  headlineWeak: { ar: "مهندس برمجيات", en: "Software Engineer" },
  loc: { ar: "الرياض، السعودية", en: "Riyadh, Saudi Arabia" },
  about: { ar: "نبذة", en: "About" },
  aboutStrong: {
    ar: "أقود فرق الهندسة لبناء منتجات مصرفية وتقنية مالية يستخدمها الملايين — من الفكرة إلى الإطلاق.",
    en: "I lead engineering teams building banking and fintech products used at national scale — from concept to launch.",
  },
  aboutWeak: {
    ar: "مهندس برمجيات لدي خبرة في تطوير التطبيقات وأبحث عن فرص جديدة.",
    en: "Software engineer with experience in app development. Open to new opportunities.",
  },
  connections: { ar: "أكثر من 500 متابع", en: "500+ connections" },
  viewsStrong: { ar: "1,284 ظهور في البحث هذا الأسبوع", en: "1,284 search appearances this week" },
  viewsWeak: { ar: "6 ظهور في البحث هذا الأسبوع", en: "6 search appearances this week" },
  open: { ar: "متاح للعمل", en: "Open to work" },
};

export function LinkedInCard({
  lang,
  variant = "strong",
  className = "",
}: {
  lang: Lang;
  variant?: "strong" | "weak";
  className?: string;
}) {
  const strong = variant === "strong";
  return (
    <div className={`li ${strong ? "li-strong" : "li-weak"} ${className}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="li-bar">
        <span className="li-logo">in</span>
        <span className="li-search" />
      </div>
      <div className="li-cover" />
      <span className="li-avatar">
        <Image src="/avatar.jpg" alt="" width={220} height={220} />
      </span>
      <div className="li-body">
        <h4 className="li-name">{P.name[lang]}</h4>
        <p className="li-headline">{strong ? LI.headlineStrong[lang] : LI.headlineWeak[lang]}</p>
        <p className="li-meta">
          {LI.loc[lang]} · <span className="li-conn">{LI.connections[lang]}</span>
        </p>
        {strong && <span className="li-badge">{LI.open[lang]}</span>}
        <span className="li-label">{LI.about[lang]}</span>
        <p className="li-about">{strong ? LI.aboutStrong[lang] : LI.aboutWeak[lang]}</p>
        <p className={`li-views ${strong ? "li-views-up" : ""}`}>
          {strong ? LI.viewsStrong[lang] : LI.viewsWeak[lang]}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────── Portfolio / browser ─────────────────────── */

export function BrowserCard({
  lang,
  variant = "strong",
  className = "",
}: {
  lang: Lang;
  variant?: "strong" | "weak";
  className?: string;
}) {
  const strong = variant === "strong";
  return (
    <div className={`bw ${strong ? "" : "bw-weak"} ${className}`}>
      <div className="bw-bar">
        <span className="bw-dot" />
        <span className="bw-dot" />
        <span className="bw-dot" />
        <span className="bw-url">{strong ? "turkialmalki.com" : "drive.google.com/…/cv_final_v3.pdf"}</span>
      </div>
      {strong ? (
        <div className="bw-body" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="bw-hero">
            <h5 className="bw-title">{P.name[lang]}</h5>
            <p className="bw-role">{P.titleStrong[lang]}</p>
          </div>
          <div className="bw-grid">
            {[
              { img: "/emkan2026.png", l: { ar: "إمكان", en: "Emkan" } },
              { img: "/alrajhi2026.png", l: { ar: "الراجحي", en: "Al Rajhi" } },
              { img: "/munasib2026.png", l: { ar: "مناسب", en: "Munaseb" } },
              { img: "/wijhut2026.png", l: { ar: "وجهات", en: "Wijhut" } },
            ].map((p) => (
              <div key={p.img} className="bw-tile">
                <Image src={p.img} alt={p.l[lang]} fill sizes="240px" className="bw-img" />
                <span className="bw-tag">{p.l[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bw-body bw-empty" dir={lang === "ar" ? "rtl" : "ltr"}>
          <span className="bw-404">404</span>
          <p className="bw-empty-t">
            {lang === "ar" ? "لا يوجد شيء لعرضه هنا." : "There is nothing here to show."}
          </p>
          <p className="bw-empty-s">
            {lang === "ar" ? "آخر تحديث: 2019" : "Last updated: 2019"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────── chaos-only fragments ────────────────────── */

export function RejectionEmail({ lang }: { lang: Lang }) {
  const rtl = lang === "ar";
  return (
    <div className="em" dir={rtl ? "rtl" : "ltr"}>
      <div className="em-head">
        <span className="em-from">{rtl ? "فريق التوظيف" : "Talent Acquisition"}</span>
        <span className="em-date">{rtl ? "قبل 3 أيام" : "3 days ago"}</span>
      </div>
      <p className="em-subj">
        {rtl ? "بخصوص طلب التوظيف — مهندس برمجيات" : "Re: Your application — Software Engineer"}
      </p>
      <p className="em-body">
        {rtl
          ? "شكرًا لاهتمامك. بعد مراجعة طلبك، قررنا المضي قدمًا مع مرشحين آخرين تتوافق ملفاتهم بشكل أقرب مع متطلبات الدور."
          : "Thank you for your interest. After reviewing your application, we have decided to move forward with other candidates whose profiles more closely match the requirements of this role."}
      </p>
      <p className="em-sig">{rtl ? "نتمنى لك التوفيق." : "We wish you the best in your search."}</p>
    </div>
  );
}

export function ATSCard({ lang }: { lang: Lang }) {
  const rtl = lang === "ar";
  return (
    <div className="ats" dir={rtl ? "rtl" : "ltr"}>
      <span className="ats-label">{rtl ? "فحص التوافق مع ATS" : "ATS compatibility scan"}</span>
      <span className="ats-score">38%</span>
      <ul className="ats-list">
        <li>{rtl ? "لم يتم العثور على كلمات مفتاحية" : "Target keywords not found"}</li>
        <li>{rtl ? "تنسيق غير قابل للقراءة" : "Unparsable layout / columns"}</li>
        <li>{rtl ? "لا توجد نتائج قابلة للقياس" : "No measurable outcomes"}</li>
      </ul>
    </div>
  );
}

/**
 * A recruiter's search for an engineering leader.
 * `weak` buries Turki at result 47 under three identical strangers; `strong`
 * is the same search after the profile has been positioned — he is result 1.
 */
export function RecruiterSearch({ lang, variant = "weak" }: { lang: Lang; variant?: "weak" | "strong" }) {
  const rtl = lang === "ar";
  const strong = variant === "strong";
  const others = rtl
    ? ["مهندس برمجيات — الرياض", "مهندس برمجيات — جدة", "مهندس برمجيات — الرياض"]
    : ["Software Engineer — Riyadh", "Software Engineer — Jeddah", "Software Engineer — Riyadh"];
  const me = (
    <div className={`rs-row ${strong ? "rs-me" : "rs-you"}`}>
      <span className={`rs-av ${strong ? "rs-av-me" : "rs-av-you"}`} />
      <span className="rs-txt">
        {P.name[lang]} — {strong ? (rtl ? "النتيجة 1" : "result 1") : rtl ? "النتيجة 47" : "result 47"}
      </span>
    </div>
  );
  return (
    <div className="rs" dir={rtl ? "rtl" : "ltr"}>
      <span className="rs-q">{rtl ? "بحث: قائد هندسة برمجيات" : "Search: engineering leader"}</span>
      <div className="rs-rows">
        {strong && me}
        {others.map((r, i) => (
          <div key={i} className="rs-row">
            <span className="rs-av" />
            <span className="rs-txt">{r}</span>
          </div>
        ))}
        {!strong && me}
      </div>
    </div>
  );
}

export function StickyNote({ lang }: { lang: Lang }) {
  return (
    <div className="sn" dir={lang === "ar" ? "rtl" : "ltr"}>
      <span>{lang === "ar" ? "حدّث السيرة!!" : "update CV!!"}</span>
    </div>
  );
}

/** Loose paper — a real printed page seen from far enough that type is texture. */
export function ScrapSheet({ tone = 0 }: { tone?: number }) {
  return (
    <div className={`sc sc-t${tone}`} aria-hidden>
      <div className="sh-paper" />
      <div className="sc-lines">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ width: `${52 + ((i * 37) % 46)}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Turki's real photograph, framed as a physical print. */
export function PhotoCard({ src = "/1.jpg", alt }: { src?: string; alt: string }) {
  return (
    <div className="ph">
      <Image src={src} alt={alt} fill sizes="(max-width: 900px) 50vw, 420px" className="ph-img" />
    </div>
  );
}

/* ────────────────────────────── styles ────────────────────────────── */

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function CareerObjectStyles() {
  return (
    <style>{`
      /* ══ shared paper ══ */
      .sheet, .sc {
        position: relative; width: 100%; aspect-ratio: 1 / 1.414;
        container-type: inline-size;
        background: #FCFBF8; border-radius: 3px; overflow: hidden;
        box-shadow: 0 1px 2px rgba(28,25,20,0.10), 0 26px 54px -18px rgba(28,25,20,0.34);
        color: #1b1a17; text-align: start;
      }
      .sh-paper {
        position: absolute; inset: 0; pointer-events: none; z-index: 2;
        background-image: ${GRAIN}; background-size: 140px 140px;
        opacity: 0.10; mix-blend-mode: multiply;
      }
      .sh-body { position: absolute; inset: 0; padding: 7cqw 6.6cqw; font-size: 2.55cqw; line-height: 1.5; }

      /* ══ strong CV ══ */
      .st-head { display: flex; align-items: center; gap: 1.4em; padding-bottom: 1.1em; border-bottom: 1px solid rgba(28,25,20,0.18); }
      .st-photo { width: 4.4em; height: 4.4em; flex: 0 0 auto; border-radius: 50%; overflow: hidden; background: #e9e6df; }
      .st-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 26%; }
      .st-id { min-width: 0; }
      .st-name { margin: 0 0 0.18em; font-size: 2.05em; font-weight: 900; letter-spacing: -0.02em; line-height: 1.05; }
      .st-title { margin: 0 0 0.3em; font-size: 0.98em; font-weight: 700; color: #1495ff; }
      .st-contact { margin: 0; font-size: 0.78em; color: #6d6a63; }
      .st-block { margin-top: 1.5em; }
      .st-label { display: block; margin-bottom: 0.55em; font-size: 0.7em; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #a09b91; }
      .st-summary { margin: 0; font-size: 0.95em; line-height: 1.55; color: #3a3833; }
      .st-role { margin-bottom: 1.05em; }
      .st-role-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.8em; margin-bottom: 0.3em; }
      .st-role-t { font-size: 0.98em; font-weight: 800; letter-spacing: -0.01em; }
      .st-dates { flex: 0 0 auto; font-size: 0.76em; color: #8d8981; white-space: nowrap; }
      .st-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.32em; }
      .st-list li { position: relative; padding-inline-start: 0.95em; font-size: 0.88em; line-height: 1.5; color: #4a4842; }
      .st-list li::before { content: ""; position: absolute; inset-inline-start: 0; top: 0.62em; width: 0.28em; height: 0.28em; border-radius: 50%; background: #1495ff; }
      .st-foot { position: absolute; inset-inline: 6.6cqw; bottom: 6cqw; display: flex; flex-direction: column; gap: 0.9em; padding-top: 1em; border-top: 1px solid rgba(28,25,20,0.13); }
      .st-foot-2 { display: flex; gap: 2em; }
      .st-foot-2 > div { flex: 1; min-width: 0; }
      .st-small { margin: 0; font-size: 0.82em; line-height: 1.45; color: #4a4842; }

      /* ══ weak CV — same career, badly written ══ */
      .sheet-weak { background: #FAF9F5; }
      .sheet-weak .sh-body { font-family: "Times New Roman", Times, serif; font-size: 2.5cqw; color: #3d3b37; }
      .wk-head { text-align: center; margin-bottom: 1.2em; }
      .wk-name { margin: 0 0 0.1em; font-size: 1.6em; font-weight: 700; }
      .wk-sub { margin: 0; font-size: 0.92em; color: #55524c; }
      .wk-contact { font-size: 0.76em; color: #7d7a73; margin-top: 0.2em; }
      .wk-label { margin: 1.1em 0 0.35em; font-size: 0.95em; font-weight: 700; text-decoration: underline; }
      .wk-text { margin: 0; font-size: 0.9em; line-height: 1.45; }
      .wk-role { margin-bottom: 0.7em; }
      .wk-role-t { font-size: 0.92em; font-weight: 700; }
      .wk-dates { font-weight: 400; color: #6f6c66; }
      .wk-list { margin: 0.2em 0 0; padding-inline-start: 1.2em; }
      .wk-list li { font-size: 0.88em; line-height: 1.42; }
      .wk-refs { margin-top: 1.2em; font-style: italic; color: #7d7a73; }

      /* ══ crumple ══ */
      .cr-layer { position: absolute; inset: 0; z-index: 4; pointer-events: none; overflow: hidden; border-radius: 3px; }
      .cr-layer .cf { position: absolute; inset: 0; }
      .cf1 { background: rgba(255,255,255,0.72); clip-path: polygon(0 0, 46% 0, 30% 34%, 0 22%); }
      .cf2 { background: rgba(90,84,70,0.16); clip-path: polygon(46% 0, 100% 0, 100% 18%, 62% 30%, 30% 34%); }
      .cf3 { background: rgba(90,84,70,0.10); clip-path: polygon(0 22%, 30% 34%, 22% 62%, 0 52%); }
      .cf4 { background: rgba(255,255,255,0.60); clip-path: polygon(30% 34%, 62% 30%, 70% 58%, 40% 66%, 22% 62%); }
      .cf5 { background: rgba(90,84,70,0.17); clip-path: polygon(62% 30%, 100% 18%, 100% 50%, 70% 58%); }
      .cf6 { background: rgba(255,255,255,0.50); clip-path: polygon(0 52%, 22% 62%, 16% 86%, 0 80%); }
      .cf7 { background: rgba(90,84,70,0.13); clip-path: polygon(22% 62%, 40% 66%, 46% 90%, 16% 86%); }
      .cf8 { background: rgba(255,255,255,0.66); clip-path: polygon(40% 66%, 70% 58%, 78% 84%, 46% 90%); }
      .cf9 { background: rgba(90,84,70,0.19); clip-path: polygon(70% 58%, 100% 50%, 100% 78%, 78% 84%); }
      .cf10 { background: rgba(90,84,70,0.12); clip-path: polygon(0 80%, 16% 86%, 46% 90%, 78% 84%, 100% 78%, 100% 100%, 0 100%); }
      .cr-layer .cl { position: absolute; height: 1px; background: linear-gradient(90deg, transparent, rgba(60,55,44,0.30), rgba(255,255,255,0.7), transparent); transform-origin: 0 0; }
      .cl1 { top: 32%; left: -6%; width: 116%; transform: rotate(-4.5deg); }
      .cl2 { top: 62%; left: -6%; width: 116%; transform: rotate(3.2deg); }
      .cl3 { top: -10%; left: 30%; width: 130%; transform: rotate(74deg); }
      .cl4 { top: -6%; left: 68%; width: 122%; transform: rotate(96deg); }

      /* ══ red review marks ══ */
      .mk { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
      .mk-strike { position: absolute; height: 2px; background: #e0392f; opacity: 0.85; border-radius: 2px; }
      .mk-s1 { top: 47%; left: 12%; width: 52%; transform: rotate(-1.6deg); }
      .mk-s2 { top: 66%; left: 14%; width: 44%; transform: rotate(1.2deg); }
      .mk-circle { position: absolute; top: 20%; left: 8%; width: 62%; height: 12%; border: 2px solid #e0392f; border-radius: 50%; opacity: 0.8; transform: rotate(-2deg); }
      .mk-note { position: absolute; color: #e0392f; font-size: 3cqw; font-weight: 700; font-style: italic; opacity: 0.9; }
      .mk-n1 { top: 17%; right: 5%; transform: rotate(-7deg); }
      .mk-n2 { top: 44%; right: 7%; font-size: 5cqw; }
      .mk-n3 { top: 70%; right: 5%; transform: rotate(5deg); }

      /* ══ LinkedIn ══ */
      .li {
        position: relative; width: 100%; container-type: inline-size;
        border-radius: 2.2cqw; overflow: hidden; background: #fff;
        border: 1px solid rgba(0,0,0,0.07); text-align: start; font-size: 3.4cqw;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 30px 60px -20px rgba(20,22,30,0.28);
      }
      .li-bar { display: flex; align-items: center; gap: 0.6em; padding: 0.55em 0.9em; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06); }
      .li-logo { display: inline-flex; align-items: center; justify-content: center; width: 1.5em; height: 1.5em; border-radius: 0.25em; background: #0a66c2; color: #fff; font-size: 0.85em; font-weight: 900; line-height: 1; }
      .li-search { flex: 1; height: 1.35em; border-radius: 0.2em; background: #eef3f8; }
      .li-cover { height: 3.4em; background: linear-gradient(115deg, #0a66c2, #063f78); }
      .li-weak .li-cover { background: linear-gradient(115deg, #b9c3ce, #98a4b1); }
      .li-avatar { position: absolute; top: 3.1em; inset-inline-start: 1em; width: 3.4em; height: 3.4em; border-radius: 50%; overflow: hidden; border: 0.16em solid #fff; background: #e6e9ee; z-index: 2; }
      .li-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 26%; }
      .li-weak .li-avatar img { filter: grayscale(1) contrast(0.85); }
      .li-body { padding: 2.1em 1.1em 1.2em; }
      .li-name { margin: 0 0 0.12em; font-size: 1.35em; font-weight: 800; letter-spacing: -0.015em; color: #17181a; }
      .li-headline { margin: 0 0 0.24em; font-size: 0.86em; font-weight: 600; line-height: 1.4; color: #17181a; min-height: 1.2em; }
      .li-weak .li-headline { color: #85898f; font-weight: 500; }
      .li-meta { margin: 0 0 0.6em; font-size: 0.72em; color: #86888d; }
      .li-conn { color: #0a66c2; font-weight: 600; }
      .li-weak .li-conn { color: #86888d; font-weight: 400; }
      .li-badge { display: inline-flex; margin-bottom: 0.7em; padding: 0.22em 0.7em; border-radius: 999px; background: rgba(10,102,194,0.10); color: #0a66c2; font-size: 0.66em; font-weight: 700; }
      .li-label { display: block; margin-bottom: 0.3em; font-size: 0.62em; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #a4a7ac; }
      .li-about { margin: 0 0 0.7em; font-size: 0.8em; line-height: 1.5; color: #4a4d52; }
      .li-views { margin: 0; padding-top: 0.55em; border-top: 1px solid rgba(0,0,0,0.06); font-size: 0.7em; color: #9b9ea3; }
      .li-views-up { color: #0a7d43; font-weight: 700; }

      /* ══ browser ══ */
      .bw {
        width: 100%; container-type: inline-size; border-radius: 1.4cqw; overflow: hidden;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); font-size: 2.6cqw;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 32px 64px -22px rgba(20,22,30,0.30);
      }
      .bw-bar { display: flex; align-items: center; gap: 0.45em; padding: 0.75em 0.9em; background: #f4f4f2; }
      .bw-dot { width: 0.62em; height: 0.62em; border-radius: 50%; background: rgba(0,0,0,0.16); }
      .bw-url { margin-inline-start: 0.9em; padding: 0.22em 1.1em; border-radius: 0.4em; background: #fff; font-size: 0.82em; color: #8b8b8b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bw-body { padding: 1.4em; }
      .bw-hero { margin-bottom: 1.1em; }
      .bw-title { margin: 0 0 0.1em; font-size: 1.7em; font-weight: 900; letter-spacing: -0.025em; color: #0d0e12; }
      .bw-role { margin: 0; font-size: 0.85em; color: #6b6b6b; }
      .bw-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7em; }
      .bw-tile { position: relative; aspect-ratio: 16 / 10; border-radius: 0.55em; overflow: hidden; background: #f0f0ee; }
      .bw-img { object-fit: cover; }
      .bw-tag { position: absolute; bottom: 0.45em; inset-inline-start: 0.45em; padding: 0.12em 0.6em; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 0.62em; font-weight: 600; }
      .bw-weak { filter: saturate(0.4); }
      .bw-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3em; min-height: 9em; text-align: center; }
      .bw-404 { font-size: 3.2em; font-weight: 900; color: #d8d8d6; letter-spacing: -0.03em; }
      .bw-empty-t { margin: 0; font-size: 0.95em; color: #8b8b8b; }
      .bw-empty-s { margin: 0; font-size: 0.78em; color: #b5b5b3; }

      /* ══ rejection email ══ */
      .em {
        width: 100%; container-type: inline-size; padding: 5cqw; border-radius: 1.6cqw;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); font-size: 3.1cqw; text-align: start;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 28px 56px -20px rgba(20,22,30,0.26);
      }
      .em-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; margin-bottom: 0.5em; }
      .em-from { font-size: 0.88em; font-weight: 800; color: #17181a; }
      .em-date { font-size: 0.72em; color: #a0a3a8; }
      .em-subj { margin: 0 0 0.55em; font-size: 0.95em; font-weight: 700; color: #17181a; }
      .em-body { margin: 0 0 0.5em; font-size: 0.85em; line-height: 1.55; color: #5a5d63; }
      .em-sig { margin: 0; font-size: 0.8em; color: #9b9ea3; }

      /* ══ ATS ══ */
      .ats {
        width: 100%; container-type: inline-size; padding: 6cqw; border-radius: 2cqw;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); font-size: 4cqw; text-align: start;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 26px 52px -20px rgba(20,22,30,0.26);
      }
      .ats-label { display: block; font-size: 0.62em; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #a4a7ac; }
      .ats-score { display: block; margin: 0.1em 0 0.4em; font-size: 2.6em; font-weight: 900; letter-spacing: -0.04em; color: #e0392f; line-height: 1; }
      .ats-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.28em; }
      .ats-list li { position: relative; padding-inline-start: 0.9em; font-size: 0.72em; line-height: 1.45; color: #6a6d73; }
      .ats-list li::before { content: "×"; position: absolute; inset-inline-start: 0; color: #e0392f; font-weight: 700; }

      /* ══ recruiter search ══ */
      .rs {
        width: 100%; container-type: inline-size; padding: 5cqw; border-radius: 1.8cqw;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); font-size: 3.6cqw; text-align: start;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 26px 52px -20px rgba(20,22,30,0.26);
      }
      .rs-q { display: block; margin-bottom: 0.7em; padding-bottom: 0.55em; border-bottom: 1px solid rgba(0,0,0,0.07); font-size: 0.78em; color: #86888d; }
      .rs-rows { display: flex; flex-direction: column; gap: 0.55em; }
      .rs-row { display: flex; align-items: center; gap: 0.6em; }
      .rs-av { width: 1.5em; height: 1.5em; flex: 0 0 auto; border-radius: 50%; background: #e6e9ee; }
      .rs-av-you { background: #f2d7d5; }
      .rs-txt { font-size: 0.76em; color: #4a4d52; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rs-you { padding-top: 0.55em; border-top: 1px dashed rgba(0,0,0,0.12); opacity: 0.55; }
      .rs-you .rs-txt { color: #a0a3a8; }
      .rs-me { padding-bottom: 0.55em; border-bottom: 1px solid rgba(10,102,194,0.22); }
      .rs-me .rs-txt { color: #0a66c2; font-weight: 700; }
      .rs-av-me { background: #cfe2f7; }

      /* ══ sticky note ══ */
      .sn {
        width: 100%; container-type: inline-size; aspect-ratio: 1 / 0.92; display: flex;
        align-items: center; justify-content: center; padding: 8cqw; text-align: center;
        background: linear-gradient(160deg, #FFE9A8, #FFDC7A);
        box-shadow: 0 1px 2px rgba(28,25,20,0.10), 0 20px 40px -14px rgba(28,25,20,0.32);
        font-size: 11cqw; font-weight: 700; color: #6a5410; transform: rotate(0deg);
      }

      /* ══ scrap paper ══ */
      .sc { aspect-ratio: 1 / 1.28; }
      .sc-t1 { aspect-ratio: 1 / 1.05; }
      .sc-t2 { aspect-ratio: 1 / 1.5; }
      .sc-lines { position: absolute; inset: 0; padding: 12cqw 10cqw; display: flex; flex-direction: column; gap: 4.4cqw; }
      .sc-lines span { height: 1.7cqw; border-radius: 1px; background: rgba(40,37,30,0.16); }

      /* ══ photo print ══ */
      .ph {
        position: relative; width: 100%; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 4px;
        background: #eae7e1; box-shadow: 0 2px 4px rgba(20,22,30,0.08), 0 34px 68px -22px rgba(20,22,30,0.36);
      }
      .ph-img { object-fit: cover; object-position: 52% 26%; }
    `}</style>
  );
}
