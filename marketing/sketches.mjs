/**
 * THE SEVEN SKETCHES.
 *
 * Each function returns the still that sits at the top of a poster: a drawing
 * of what the service DOES, in the same materials the /services scenes are
 * made of — paper, a profile, a browser stack, a dashboard. They are HTML and
 * CSS, not images, so they re-render at any size and any language without a
 * source file to lose.
 *
 * Every sketch is authored inside a 936 × 470 panel and uses only layout that
 * mirrors under `direction: rtl`, which is why the Arabic posters need no
 * separate artwork.
 */

const C = {
  ink: "#0d0e12",
  paper: "#FBFBF9",
  white: "#ffffff",
  muted: "#8b8b93",
  line: "rgba(0,0,0,0.09)",
  accent: "#1495ff",
  red: "#e5484d",
  green: "#1f9d55",
};

/** A ruled line of "text" — the grey bar that stands in for body copy. */
const bar = (w, h = 9, o = 1) =>
  `<div style="width:${w};height:${h}px;border-radius:${h}px;background:rgba(13,14,18,${0.1 * o});"></div>`;

const stack = (gap, ...rows) =>
  `<div style="display:flex;flex-direction:column;gap:${gap}px;">${rows.join("")}</div>`;

/** The white sheet everything paper-ish sits on. */
const sheet = (inner, style = "") =>
  `<div style="background:${C.white};border:1px solid ${C.line};border-radius:10px;
    box-shadow:0 24px 60px -28px rgba(13,14,18,0.35);padding:34px 32px;${style}">${inner}</div>`;

const chip = (label, value, tone = C.red) => `
  <div style="display:flex;align-items:center;gap:12px;background:${C.white};border:1px solid ${C.line};
    border-radius:999px;padding:11px 20px;box-shadow:0 12px 30px -18px rgba(13,14,18,0.45);white-space:nowrap;">
    <span style="width:9px;height:9px;border-radius:50%;background:${tone};flex:none;"></span>
    <span style="font-size:17px;font-weight:800;letter-spacing:-0.01em;">${label}</span>
    <span style="font-size:17px;font-weight:500;color:${C.muted};">${value}</span>
  </div>`;

/* ── 01 · the annotated CV ─────────────────────────────────────────────── */
const review = (t) => `
<div style="display:flex;align-items:center;gap:40px;height:100%;">
  ${sheet(
    stack(
      14,
      `<div style="font-size:22px;font-weight:900;letter-spacing:-0.02em;">${t.cvName}</div>`,
      bar("62%", 9, 0.7),
      `<div style="height:10px"></div>`,
      bar("100%"),
      bar("94%"),
      bar("78%"),
      `<div style="height:10px"></div>`,
      bar("100%"),
      bar("88%"),
      bar("66%", 9, 0.6),
    ),
    "flex:0 0 330px;transform:rotate(-1.4deg);",
  )}
  <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start;">
    ${chip(t.n1[0], t.n1[1])}
    ${chip(t.n2[0], t.n2[1])}
    ${chip(t.n3[0], t.n3[1])}
    ${chip(t.n4[0], t.n4[1])}
  </div>
</div>`;

/* ── 02 · the rewrite ──────────────────────────────────────────────────── */
const rewrite = (t) => `
<div style="display:flex;flex-direction:column;justify-content:center;gap:30px;height:100%;">
  <div>
    <div style="font-size:14px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};margin-bottom:14px;">${t.before}</div>
    <div style="font-size:30px;font-weight:600;color:${C.muted};text-decoration:line-through;
      text-decoration-color:${C.red};text-decoration-thickness:3px;line-height:1.4;">${t.weak}</div>
    <div style="font-size:17px;color:${C.red};margin-top:12px;font-weight:600;">${t.weakNote}</div>
  </div>
  <div style="height:1px;background:${C.line};"></div>
  <div>
    <div style="font-size:14px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${C.accent};margin-bottom:14px;">${t.after}</div>
    <div style="font-size:34px;font-weight:900;letter-spacing:-0.025em;line-height:1.35;">${t.strong}</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;">
      ${t.tags
        .map(
          (g) => `<span style="font-size:15px;font-weight:700;color:${C.accent};background:rgba(20,149,255,0.08);
            border:1px solid rgba(20,149,255,0.22);border-radius:999px;padding:7px 15px;">${g}</span>`,
        )
        .join("")}
    </div>
  </div>
</div>`;

/* ── 03 · the stage ───────────────────────────────────────────────────── */
const speaking = (t) => `
<div style="display:flex;align-items:center;gap:38px;height:100%;">
  <div style="flex:1;background:${C.ink};border-radius:12px;height:100%;position:relative;overflow:hidden;
    display:flex;flex-direction:column;justify-content:flex-end;padding:40px;">
    <div style="position:absolute;inset-inline:0;top:0;height:62%;
      background:radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%);"></div>
    <div style="position:relative;">
      <div style="font-size:15px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;
        color:rgba(255,255,255,0.55);margin-bottom:16px;">${t.kicker}</div>
      <div style="font-size:38px;font-weight:900;letter-spacing:-0.03em;line-height:1.25;color:#f0f0ef;white-space:pre-line;">${t.line}</div>
    </div>
  </div>
  <div style="flex:0 0 246px;display:flex;flex-direction:column;gap:14px;">
    ${[t.p1, t.p2, t.p3]
      .map(
        (p, i) => `<div style="background:${C.white};border:1px solid ${C.line};border-radius:10px;padding:20px 22px;
          box-shadow:0 14px 34px -22px rgba(13,14,18,0.4);">
          <div style="font-size:13px;font-weight:800;color:${C.muted};letter-spacing:0.14em;">0${i + 1}</div>
          <div style="font-size:19px;font-weight:800;letter-spacing:-0.015em;margin-top:7px;">${p}</div>
        </div>`,
      )
      .join("")}
  </div>
</div>`;

/* ── 04 · the profile that ranks first ────────────────────────────────── */
const linkedin = (t) => `
<div style="display:flex;align-items:center;gap:34px;height:100%;">
  ${sheet(
    `<div style="display:flex;align-items:center;gap:18px;margin-bottom:22px;">
      <div style="width:66px;height:66px;border-radius:50%;background:linear-gradient(140deg,#d9dde3,#f2f4f7);flex:none;"></div>
      <div style="display:flex;flex-direction:column;gap:9px;">
        <div style="font-size:23px;font-weight:900;letter-spacing:-0.02em;">${t.person}</div>
        ${bar("120px", 8, 0.7)}
      </div>
    </div>
    <div style="font-size:22px;font-weight:600;color:${C.muted};text-decoration:line-through;
      text-decoration-color:${C.red};text-decoration-thickness:2px;">${t.weak}</div>
    <div style="font-size:24px;font-weight:900;letter-spacing:-0.02em;line-height:1.35;margin-top:14px;">${t.strong}</div>`,
    "flex:1;",
  )}
  <div style="flex:0 0 300px;background:${C.white};border:1px solid ${C.line};border-radius:10px;padding:24px 22px;
    box-shadow:0 20px 48px -26px rgba(13,14,18,0.4);">
    <div style="font-size:13px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${C.muted};margin-bottom:18px;">${t.search}</div>
    <div style="display:flex;align-items:center;gap:12px;background:rgba(20,149,255,0.08);
      border:1px solid rgba(20,149,255,0.25);border-radius:8px;padding:13px 14px;">
      <span style="font-size:16px;font-weight:900;color:${C.accent};">1</span>
      <div style="display:flex;flex-direction:column;gap:7px;flex:1;">
        <div style="font-size:16px;font-weight:800;">${t.person}</div>
        ${bar("70%", 7, 0.7)}
      </div>
    </div>
    ${[2, 3, 4]
      .map(
        (n) => `<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;">
          <span style="font-size:16px;font-weight:800;color:${C.muted};">${n}</span>
          <div style="display:flex;flex-direction:column;gap:7px;flex:1;">${bar("80%", 8, 0.55)}${bar("55%", 7, 0.4)}</div>
        </div>`,
      )
      .join("")}
  </div>
</div>`;

/* ── 05 · the shipped stack ───────────────────────────────────────────── */
const browser = (url, inner, style = "") => `
  <div style="background:${C.white};border:1px solid ${C.line};border-radius:12px;overflow:hidden;
    box-shadow:0 30px 70px -34px rgba(13,14,18,0.45);${style}">
    <div style="display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid ${C.line};background:#f6f6f4;">
      <span style="width:9px;height:9px;border-radius:50%;background:#e5e5e2;"></span>
      <span style="width:9px;height:9px;border-radius:50%;background:#e5e5e2;"></span>
      <span style="width:9px;height:9px;border-radius:50%;background:#e5e5e2;"></span>
      <span style="margin-inline-start:12px;font-size:13px;font-weight:600;color:${C.muted};">${url}</span>
    </div>
    <div style="padding:26px 24px;">${inner}</div>
  </div>`;

const work = (t) => `
<div style="position:relative;height:100%;">
  ${browser(t.u3, stack(12, bar("60%"), bar("90%", 9, 0.6)), `position:absolute;inset-inline-end:0;top:0;width:60%;opacity:0.66;transform:rotate(1.6deg);`)}
  ${browser(t.u2, stack(12, bar("50%"), bar("84%", 9, 0.6)), `position:absolute;inset-inline-end:52px;top:46px;width:62%;opacity:0.86;transform:rotate(-0.8deg);`)}
  ${browser(
    t.u1,
    `<div style="font-size:30px;font-weight:900;letter-spacing:-0.03em;line-height:1.25;white-space:pre-line;">${t.line}</div>
     <div style="display:flex;gap:10px;margin-top:20px;">
       <span style="background:${C.ink};color:${C.paper};font-size:15px;font-weight:800;border-radius:999px;padding:10px 20px;">${t.cta}</span>
       <span style="border:1px solid ${C.line};color:${C.muted};font-size:15px;font-weight:700;border-radius:999px;padding:10px 20px;">${t.alt}</span>
     </div>`,
    `position:absolute;inset-inline-start:0;bottom:0;width:64%;`,
  )}
</div>`;

/* ── 06 · raw data → one screen ───────────────────────────────────────── */
const kpi = (label, value, delta) => `
  <div style="flex:1;background:${C.white};border:1px solid ${C.line};border-radius:10px;padding:18px 18px;">
    <div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">${label}</div>
    <div style="font-size:30px;font-weight:900;letter-spacing:-0.03em;margin-top:9px;">${value}</div>
    <div style="font-size:14px;font-weight:700;color:${C.green};margin-top:5px;">${delta}</div>
  </div>`;

const data = (t) => `
<div style="display:flex;align-items:center;gap:28px;height:100%;">
  <div style="flex:0 0 210px;display:flex;flex-direction:column;gap:9px;opacity:0.72;">
    <div style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${C.muted};margin-bottom:6px;">${t.raw}</div>
    ${Array.from({ length: 9 })
      .map(
        (_, i) => `<div style="display:flex;gap:7px;">
          ${bar("34%", 8, i % 3 ? 0.5 : 0.75)}${bar("26%", 8, 0.45)}${bar("30%", 8, 0.6)}
        </div>`,
      )
      .join("")}
  </div>
  <div style="flex:none;font-size:26px;color:${C.muted};">→</div>
  <div style="flex:1;background:${C.white};border:1px solid ${C.line};border-radius:12px;padding:24px;
    box-shadow:0 26px 60px -30px rgba(13,14,18,0.4);">
    <div style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};margin-bottom:16px;">${t.out}</div>
    <div style="display:flex;gap:12px;">${kpi(t.k1, t.v1, "▲ 12%")}${kpi(t.k2, t.v2, "▲ 4.8%")}${kpi(t.k3, t.v3, "▲ 31%")}</div>
    <div style="display:flex;align-items:flex-end;gap:11px;height:118px;margin-top:22px;">
      ${[38, 52, 44, 66, 58, 79, 71, 92]
        .map(
          (h, i) => `<div style="flex:1;height:${h}%;border-radius:5px 5px 2px 2px;
            background:${i > 5 ? C.accent : "rgba(20,149,255,0.28)"};"></div>`,
        )
        .join("")}
    </div>
  </div>
</div>`;

/* ── 07 · the package ─────────────────────────────────────────────────── */
const bundle = (t) => `
<div style="display:flex;flex-direction:column;justify-content:center;gap:22px;height:100%;">
  <div style="display:flex;gap:14px;">
    ${t.parts
      .map(
        (p, i) => `<div style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);
          border-radius:11px;padding:20px 16px;display:flex;flex-direction:column;gap:12px;min-height:150px;">
          <span style="font-size:12px;font-weight:800;letter-spacing:0.14em;color:rgba(255,255,255,0.45);">0${i + 1}</span>
          <span style="font-size:19px;font-weight:900;letter-spacing:-0.02em;color:#f0f0ef;line-height:1.25;">${p}</span>
          <span style="margin-top:auto;width:26px;height:3px;border-radius:3px;background:${C.accent};"></span>
        </div>`,
      )
      .join("")}
  </div>
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="flex:1;height:1px;background:rgba(255,255,255,0.16);"></div>
    <div style="font-size:15px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.5);">${t.joins}</div>
    <div style="flex:1;height:1px;background:rgba(255,255,255,0.16);"></div>
  </div>
  <div style="text-align:center;font-size:34px;font-weight:900;letter-spacing:-0.03em;color:#f0f0ef;line-height:1.3;">${t.line}</div>
</div>`;

export const SKETCHES = { review, rewrite, speaking, linkedin, work, data, bundle };

/** The words that live INSIDE the sketches, per language. */
export const SKETCH_COPY = {
  en: {
    review: {
      cvName: "Your CV",
      n1: ["ATS", "38% compatible"],
      n2: ["Clarity", "three different stories"],
      n3: ["Impact", "not one number"],
      n4: ["Positioning", "targeting which role?"],
    },
    rewrite: {
      before: "Before",
      after: "After",
      weak: "Responsible for managing the technical team.",
      weakNote: "A duty. No leadership, no scale, no impact.",
      strong: "Led an engineering team and contributed to launching large-scale digital products.",
      tags: ["Stronger verb", "Clear leadership", "Specific contribution", "Product impact"],
    },
    speaking: {
      kicker: "Literature, Publishing & Translation Commission",
      line: "A talk they quote\nafter you sit down.",
      p1: "Structure",
      p2: "Delivery",
      p3: "Slides",
    },
    linkedin: {
      person: "You",
      weak: "Software Engineer",
      strong: "Engineering Leader | Product Builder | Fintech & Digital Transformation",
      search: "Recruiter search",
    },
    work: {
      u1: "yourname.com",
      u2: "yourproduct.app",
      u3: "case-study",
      line: "Your idea,\nlive on the internet.",
      cta: "Get started",
      alt: "See the work",
    },
    data: {
      raw: "Raw data",
      out: "Executive decision",
      k1: "Revenue",
      v1: "1.4M",
      k2: "Conversion",
      v2: "5.2%",
      k3: "Retention",
      v3: "68%",
    },
    bundle: {
      parts: ["CV", "LinkedIn", "Speaking", "Product", "Dashboard"],
      joins: "become",
      line: "One professional story.",
    },
  },
  ar: {
    review: {
      cvName: "سيرتك الذاتية",
      n1: ["ATS", "التوافق 38%"],
      n2: ["الوضوح", "ثلاث قصص مختلفة"],
      n3: ["الأثر", "ولا رقم واحد"],
      n4: ["التموضع", "أي وظيفة بالضبط؟"],
    },
    rewrite: {
      before: "قبل",
      after: "بعد",
      weak: "مسؤول عن إدارة الفريق التقني.",
      weakNote: "واجب وظيفي. بلا قيادة، بلا حجم، بلا أثر.",
      strong: "قدت فريقًا هندسيًا، وأسهمت في إطلاق منتجات رقمية واسعة النطاق.",
      tags: ["فعل أقوى", "قيادة واضحة", "مساهمة محددة", "أثر على المنتج"],
    },
    speaking: {
      kicker: "هيئة الأدب والنشر والترجمة",
      line: "عرض يتذكرونه\nبعد ما تجلس.",
      p1: "البناء",
      p2: "الإلقاء",
      p3: "الشرائح",
    },
    linkedin: {
      person: "أنت",
      weak: "مهندس برمجيات",
      strong: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية وتحول رقمي",
      search: "بحث الموظِّف",
    },
    work: {
      u1: "yourname.com",
      u2: "yourproduct.app",
      u3: "case-study",
      line: "فكرتك،\nمنشورة على الإنترنت.",
      cta: "ابدأ الآن",
      alt: "شوف الأعمال",
    },
    data: {
      raw: "بيانات خام",
      out: "قرار واضح",
      k1: "الإيرادات",
      v1: "1.4M",
      k2: "التحويل",
      v2: "5.2%",
      k3: "الاحتفاظ",
      v3: "68%",
    },
    bundle: {
      parts: ["السيرة", "لينكدإن", "العرض", "المنتج", "اللوحة"],
      joins: "تصير",
      line: "قصة مهنية واحدة.",
    },
  },
};
