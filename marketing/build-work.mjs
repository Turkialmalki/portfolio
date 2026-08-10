/**
 * THE WORK PRESS — proof, rather than offers.
 *
 *   node marketing/build-work.mjs
 *
 * The service posters (`build-cards.mjs`) say what you sell. These say what
 * you have already built, which is the harder thing to claim and the easier
 * thing to believe. Three kinds, all into `marketing/cards/work/`:
 *
 *   01–05 …            one poster per case study, read out of src/data/projects.ts
 *   00-selected-work   all five on one image
 *   folio-*            REAL screenshots of turkialmalki.com, captured live
 *   dashboard-*        sample dashboards, drawn — see the honesty note below
 *
 * ── WHERE EACH PIXEL COMES FROM ────────────────────────────────────────────
 * Project titles, roles, years, tools and outcome metrics are parsed out of
 * `src/data/projects.ts`, not retyped — the posters and the case-study pages
 * cannot disagree. Project imagery is the same file the site serves.
 *
 * The `folio-*` cards navigate to the live site and screenshot it, so they can
 * never show a design that has been replaced.
 *
 * The `dashboard-*` cards are the exception and the only drawn thing here:
 * they are DEMONSTRATIONS of the Report & Dashboard service, built from
 * invented figures, and each one carries a visible "Sample" mark so it cannot
 * be mistaken for a client's numbers. Do not caption them as results.
 */

import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(HERE, "cards/work");
const FONTS = resolve(ROOT, "public/fonts");
const SITE = process.env.SITE || "https://www.turkialmalki.com";

const W = 1080;
const H = 1350;
const PAD = 74;

/* ── the case studies, parsed out of the site's own data ────────────────── */

function readProjects() {
  const src = readFileSync(resolve(ROOT, "src/data/projects.ts"), "utf8");
  const blocks = src.split(/\n  \{\n/).slice(1);
  const one = (b, key) => new RegExp(`${key}: "(.*?)"`).exec(b)?.[1] ?? "";
  const list = (b, key) =>
    (new RegExp(`${key}: \\[(.*?)\\]`).exec(b)?.[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);

  const projects = blocks.map((b) => ({
    slug: one(b, "slug"),
    number: one(b, "number"),
    title: one(b, "title"),
    subtitle: one(b, "subtitle"),
    category: one(b, "category"),
    industry: one(b, "industry"),
    year: one(b, "year"),
    duration: one(b, "duration"),
    role: one(b, "role"),
    tools: list(b, "tools"),
    accent: one(b, "accent"),
    image: one(b, "image"),
    outcomes: [...(/outcomes: \[([\s\S]*?)\n    \]/.exec(b)?.[1] ?? "").matchAll(
      /metric: "(.*?)", value: "(.*?)"/g,
    )].map((m) => ({ metric: m[1], value: m[2] })),
  }));

  if (!projects.length || projects.some((p) => !p.title || !p.number)) {
    throw new Error("src/data/projects.ts did not parse — refusing to print half a poster");
  }
  return projects;
}

const PROJECTS = readProjects();

/* ── page furniture ─────────────────────────────────────────────────────── */

const font = (f) => pathToFileURL(resolve(FONTS, f)).href;
const FACE = ["Light:300", "Regular:400", "Medium:500", "Bold:700", "Black:900"]
  .map((s) => s.split(":"))
  .map(
    ([w, n]) => `@font-face{font-family:Thmanyah;src:url("${font(`thmanyahsans-${w}.woff2`)}") format("woff2");
      font-weight:${n};font-style:normal;font-display:block;}`,
  )
  .join("\n");

const PAGE = (bodyStyle, inner) => `<!doctype html>
<html dir="ltr"><head><meta charset="utf-8"><style>
${FACE}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Thmanyah,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;${bodyStyle}}
</style></head><body>${inner}</body></html>`;

/** A local file as a data: URI — the render has no network at all. */
const dataUri = (absPath) =>
  `data:image/png;base64,${readFileSync(absPath).toString("base64")}`;

const masthead = (left, right, tone = "rgba(255,255,255,0.55)") => `
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:16px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">${left}</span>
    <span style="font-size:16px;font-weight:600;color:${tone};">${right}</span>
  </div>`;

const sitePill = (bg, fg) => `
  <span style="background:${bg};color:${fg};border-radius:999px;padding:18px 30px;
    font-size:20px;font-weight:800;white-space:nowrap;">turkialmalki.com</span>`;

/** The browser chrome every screenshot sits in. */
const frame = (url, imgSrc, style = "", dark = false) => `
  <div style="border-radius:14px;overflow:hidden;border:1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"};
    box-shadow:0 40px 90px -40px rgba(0,0,0,0.6);background:${dark ? "#14151a" : "#fff"};${style}">
    <div style="display:flex;align-items:center;gap:8px;padding:14px 18px;
      background:${dark ? "#1b1d23" : "#f3f3f1"};border-bottom:1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"};">
      <span style="width:10px;height:10px;border-radius:50%;background:${dark ? "#3a3d45" : "#dedede"}"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:${dark ? "#3a3d45" : "#dedede"}"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:${dark ? "#3a3d45" : "#dedede"}"></span>
      <span style="margin-left:14px;font-size:13px;font-weight:600;
        color:${dark ? "rgba(240,240,239,0.55)" : "#8b8b93"};">${url}</span>
    </div>
    <div style="height:calc(100% - 46px);overflow:hidden;">
      <img src="${imgSrc}" style="width:100%;display:block;">
    </div>
  </div>`;

/* ── 1 · one poster per case study ──────────────────────────────────────── */

/**
 * OUTCOME FIGURES ARE OFF BY DEFAULT — and this is deliberate.
 *
 * `src/data/projects.ts` does not currently line up: the entry titled "Alrajhi
 * Bank" carries BaseBox's outcomes ("Setup Time −78%", "Teams Onboarded 12+").
 * On a case-study page, surrounded by its own text, that is a data bug. On a
 * poster it would be a numeric claim printed under a real bank's name, sent to
 * strangers, with nothing around it to qualify it.
 *
 * So the posters print what is unambiguous — the project, the role, the year,
 * the tools, the real screenshot — and no figures. Once the outcomes in that
 * file are verified per project, print them with:
 *
 *   SHOW_OUTCOMES=1 node marketing/build-work.mjs
 */
const SHOW_OUTCOMES = process.env.SHOW_OUTCOMES === "1";

function projectPoster(p) {
  const img = p.image ? dataUri(resolve(ROOT, "public", p.image.replace(/^\//, ""))) : null;
  const metrics = SHOW_OUTCOMES ? p.outcomes.slice(0, 4) : [];

  return PAGE(
    `width:${W}px;height:${H}px;background:#0d0e12;color:#f0f0ef;overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;
      background:radial-gradient(115% 80% at 82% 0%, ${p.accent}2e 0%, rgba(0,0,0,0) 62%);">

      ${masthead(`${p.number} · ${p.category}`, "turkialmalki.com/projects")}

      <div style="margin-top:40px;height:520px;border-radius:14px;overflow:hidden;
        border:1px solid rgba(255,255,255,0.10);box-shadow:0 40px 90px -44px rgba(0,0,0,0.8);
        background:${img ? "#0a0b0e" : `linear-gradient(148deg, ${p.accent}55, #0d0e12 70%)`};">
        ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;">` : ""}
      </div>

      <div style="margin-top:auto;padding-top:40px;">
        <div style="font-size:70px;font-weight:900;letter-spacing:-0.045em;line-height:1.02;">${p.title}</div>
        <div style="font-size:27px;font-weight:500;color:rgba(240,240,239,0.6);margin-top:16px;">${p.subtitle}</div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;">
        ${[p.role, p.year, p.industry, p.duration]
          .filter(Boolean)
          .map(
            (v) => `<span style="font-size:18px;font-weight:700;border:1px solid rgba(255,255,255,0.16);
              border-radius:999px;padding:10px 18px;">${v}</span>`,
          )
          .join("")}
      </div>

      ${
        metrics.length
          ? `<div style="display:flex;gap:12px;margin-top:28px;">
              ${metrics
                .map(
                  (m) => `<div style="flex:1;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:20px 18px;
                    background:rgba(255,255,255,0.03);">
                    <div style="font-size:34px;font-weight:900;letter-spacing:-0.04em;color:${p.accent};">${m.value}</div>
                    <div style="font-size:15px;font-weight:600;color:rgba(240,240,239,0.55);margin-top:8px;line-height:1.3;">${m.metric}</div>
                  </div>`,
                )
                .join("")}
            </div>`
          : ""
      }

      <div style="margin-top:34px;padding-top:28px;border-top:1px solid rgba(255,255,255,0.12);
        display:flex;align-items:center;justify-content:space-between;gap:20px;">
        <span style="font-size:17px;font-weight:600;color:rgba(240,240,239,0.55);">${p.tools.join(" · ")}</span>
        ${sitePill("#f0f0ef", "#0d0e12")}
      </div>
    </div>`,
  );
}

/* ── 2 · all five on one image ──────────────────────────────────────────── */

function selectedWork() {
  const tile = (p) => {
    const img = p.image ? dataUri(resolve(ROOT, "public", p.image.replace(/^\//, ""))) : null;
    return `<div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);
      background:${img ? "#0a0b0e" : `linear-gradient(148deg, ${p.accent}66, #0d0e12 72%)`};position:relative;height:100%;">
      ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;opacity:0.9;">` : ""}
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(13,14,18,0) 40%, rgba(13,14,18,0.92) 100%);"></div>
      <div style="position:absolute;left:20px;right:20px;bottom:18px;">
        <div style="font-size:13px;font-weight:800;letter-spacing:0.16em;color:${p.accent};">${p.number}</div>
        <div style="font-size:24px;font-weight:900;letter-spacing:-0.025em;margin-top:6px;">${p.title}</div>
        <div style="font-size:15px;font-weight:500;color:rgba(240,240,239,0.6);margin-top:4px;">${p.industry} · ${p.year}</div>
      </div>
    </div>`;
  };

  return PAGE(
    `width:${W}px;height:${H}px;background:#0d0e12;color:#f0f0ef;overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;
      background:radial-gradient(110% 70% at 80% 0%, rgba(20,149,255,0.20) 0%, rgba(0,0,0,0) 60%);">
      ${masthead("Selected work", "turkialmalki.com/projects")}

      <div style="margin-top:44px;">
        <div style="font-size:84px;font-weight:900;letter-spacing:-0.05em;line-height:0.99;">Shipped,<br>not mocked up.</div>
        <div style="font-size:26px;font-weight:500;color:rgba(240,240,239,0.6);margin-top:20px;">
          Banking, fintech, open banking and enterprise — ${PROJECTS.length} case studies, in the open.
        </div>
      </div>

      <div style="margin-top:36px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:14px;flex:1;min-height:0;">
        ${PROJECTS.slice(0, 4).map(tile).join("")}
      </div>
      ${PROJECTS[4] ? `<div style="flex:none;height:158px;margin-top:14px;">${tile(PROJECTS[4])}</div>` : ""}

      <div style="flex:none;margin-top:26px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.12);
        display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:24px;font-weight:900;letter-spacing:-0.02em;">Turki Almalki</div>
          <div style="font-size:18px;font-weight:500;color:rgba(240,240,239,0.55);margin-top:6px;">Engineering leader · Product builder</div>
        </div>
        ${sitePill("#f0f0ef", "#0d0e12")}
      </div>
    </div>`,
  );
}

/* ── 3 · the portfolio itself, captured live ────────────────────────────── */

function folioPoster({ title, blurb, url, desktop, phone }) {
  return PAGE(
    `width:${W}px;height:${H}px;background:#FBFBF9;color:#0d0e12;overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;">
      ${masthead(title, url.replace(/^https?:\/\//, ""), "#626262")}

      <div style="position:relative;margin-top:40px;height:620px;">
        ${frame(url.replace(/^https?:\/\//, ""), desktop, "position:absolute;inset-inline-start:0;top:0;width:84%;height:100%;")}
        ${
          phone
            ? `<div style="position:absolute;inset-inline-end:0;bottom:-26px;width:210px;border-radius:26px;overflow:hidden;
                 border:8px solid #14151a;box-shadow:0 40px 80px -30px rgba(13,14,18,0.55);background:#000;">
                 <img src="${phone}" style="width:100%;display:block;">
               </div>`
            : ""
        }
      </div>

      <div style="margin-top:auto;padding-top:66px;">
        <div style="font-size:78px;font-weight:900;letter-spacing:-0.05em;line-height:1.02;white-space:pre-line;">${blurb.head}</div>
        <div style="font-size:26px;font-weight:500;color:#626262;margin-top:20px;max-width:90%;">${blurb.sub}</div>
      </div>

      <div style="margin-top:34px;padding-top:30px;border-top:1px solid rgba(0,0,0,0.09);
        display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${blurb.chips
            .map(
              (c) => `<span style="font-size:18px;font-weight:700;border:1px solid rgba(0,0,0,0.10);
                border-radius:999px;padding:10px 18px;">${c}</span>`,
            )
            .join("")}
        </div>
        ${sitePill("#0d0e12", "#FBFBF9")}
      </div>
    </div>`,
  );
}

/* ── 4 · sample dashboards ──────────────────────────────────────────────── */

const SAMPLE = `<span style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;
  border:1px solid currentColor;border-radius:999px;padding:6px 12px;opacity:0.55;">Sample data</span>`;

const bars = (values, accent, faded) => `
  <div style="display:flex;align-items:flex-end;gap:9px;height:100%;">
    ${values
      .map(
        (v, i) => `<div style="flex:1;height:${v}%;border-radius:5px 5px 2px 2px;
          background:${i >= values.length - 2 ? accent : faded};"></div>`,
      )
      .join("")}
  </div>`;

const sparkline = (accent) => `
  <svg viewBox="0 0 300 90" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
    <path d="M0 74 L38 62 L76 68 L114 44 L152 52 L190 30 L228 34 L266 14 L300 8"
      fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M0 74 L38 62 L76 68 L114 44 L152 52 L190 30 L228 34 L266 14 L300 8 L300 90 L0 90 Z"
      fill="${accent}" opacity="0.12"/>
  </svg>`;

const donut = (accent, ring) => `
  <svg viewBox="0 0 42 42" style="width:132px;height:132px;">
    <circle cx="21" cy="21" r="15.9" fill="none" stroke="${ring}" stroke-width="6"/>
    <circle cx="21" cy="21" r="15.9" fill="none" stroke="${accent}" stroke-width="6"
      stroke-dasharray="68 32" stroke-dashoffset="25" stroke-linecap="round"/>
  </svg>`;

/**
 * One dashboard, two skins. `dark` is the executive/ops look, light is the
 * report look — both are the same information architecture, which is the
 * point being demonstrated: sidebar, KPI row, trend, breakdown, table.
 */
function dashboardUI({ dark, accent, title, tabs, kpis, tableRows, tableHead }) {
  const bg = dark ? "#111318" : "#ffffff";
  const panel = dark ? "#171a21" : "#ffffff";
  const ink = dark ? "#f0f0ef" : "#0d0e12";
  const muted = dark ? "rgba(240,240,239,0.5)" : "#7b7b85";
  const line = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const faded = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)";

  return `<div style="display:flex;height:100%;background:${bg};color:${ink};">
    <!-- sidebar -->
    <div style="width:172px;flex:none;border-inline-end:1px solid ${line};padding:22px 18px;display:flex;flex-direction:column;gap:22px;">
      <div style="display:flex;align-items:center;gap:9px;">
        <span style="width:22px;height:22px;border-radius:7px;background:${accent};"></span>
        <span style="font-size:15px;font-weight:900;letter-spacing:-0.02em;">${title}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${tabs
          .map(
            (t, i) => `<div style="display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;
              background:${i === 0 ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.045)") : "transparent"};">
              <span style="width:7px;height:7px;border-radius:2px;background:${i === 0 ? accent : faded};"></span>
              <span style="font-size:13.5px;font-weight:${i === 0 ? 800 : 600};color:${i === 0 ? ink : muted};">${t}</span>
            </div>`,
          )
          .join("")}
      </div>
    </div>

    <!-- body -->
    <div style="flex:1;padding:22px 24px;display:flex;flex-direction:column;gap:16px;min-width:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:22px;font-weight:900;letter-spacing:-0.03em;">${tabs[0]}</div>
          <div style="font-size:13px;font-weight:600;color:${muted};margin-top:4px;">Last 30 days · updated hourly</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;color:${muted};">${SAMPLE}</div>
      </div>

      <div style="display:flex;gap:12px;">
        ${kpis
          .map(
            (k) => `<div style="flex:1;border:1px solid ${line};border-radius:11px;padding:15px 16px;background:${panel};">
              <div style="font-size:11.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${muted};">${k.label}</div>
              <div style="font-size:29px;font-weight:900;letter-spacing:-0.035em;margin-top:8px;">${k.value}</div>
              <div style="font-size:13px;font-weight:700;color:${k.down ? "#e5484d" : "#1f9d55"};margin-top:4px;">
                ${k.down ? "▼" : "▲"} ${k.delta}</div>
            </div>`,
          )
          .join("")}
      </div>

      <div style="display:flex;gap:12px;flex:1;min-height:0;">
        <div style="flex:1.6;border:1px solid ${line};border-radius:11px;padding:16px;background:${panel};display:flex;flex-direction:column;">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${muted};">Trend</div>
          <div style="flex:1;margin-top:12px;">${sparkline(accent)}</div>
          <div style="height:64px;margin-top:10px;">${bars([44, 58, 50, 71, 63, 82, 76, 95], accent, faded)}</div>
        </div>
        <div style="flex:1;border:1px solid ${line};border-radius:11px;padding:16px;background:${panel};
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${muted};align-self:flex-start;">Breakdown</div>
          ${donut(accent, faded)}
          <div style="font-size:13px;font-weight:600;color:${muted};">68% of target reached</div>
        </div>
      </div>

      <div style="border:1px solid ${line};border-radius:11px;background:${panel};overflow:hidden;">
        <div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid ${line};">
          ${tableHead
            .map(
              (h, i) => `<span style="flex:${i === 0 ? 2 : 1};font-size:11.5px;font-weight:800;letter-spacing:0.12em;
                text-transform:uppercase;color:${muted};">${h}</span>`,
            )
            .join("")}
        </div>
        ${tableRows
          .map(
            (r) => `<div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid ${line};">
              ${r
                .map(
                  (c, i) => `<span style="flex:${i === 0 ? 2 : 1};font-size:14px;
                    font-weight:${i === 0 ? 700 : 600};color:${i === 0 ? ink : muted};">${c}</span>`,
                )
                .join("")}
            </div>`,
          )
          .join("")}
      </div>
    </div>
  </div>`;
}

function dashboardPoster({ head, sub, chips, dark, ui }) {
  const paper = dark ? "#0d0e12" : "#FBFBF9";
  const ink = dark ? "#f0f0ef" : "#0d0e12";
  const muted = dark ? "rgba(240,240,239,0.6)" : "#626262";
  const rule = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)";

  return PAGE(
    `width:${W}px;height:${H}px;background:${paper};color:${ink};overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;">
      ${masthead("06 · Report & Dashboard", "turkialmalki.com/services", muted)}

      <div style="margin-top:40px;height:680px;border-radius:14px;overflow:hidden;border:1px solid ${rule};
        box-shadow:0 44px 100px -46px rgba(0,0,0,${dark ? 0.9 : 0.45});">${ui}</div>

      <div style="margin-top:auto;padding-top:46px;">
        <div style="font-size:76px;font-weight:900;letter-spacing:-0.05em;line-height:1.02;white-space:pre-line;">${head}</div>
        <div style="font-size:26px;font-weight:500;color:${muted};margin-top:20px;max-width:92%;">${sub}</div>
      </div>

      <div style="margin-top:34px;padding-top:30px;border-top:1px solid ${rule};
        display:flex;align-items:center;justify-content:space-between;gap:20px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${chips
            .map(
              (c) => `<span style="font-size:18px;font-weight:700;border:1px solid ${rule};
                border-radius:999px;padding:10px 18px;">${c}</span>`,
            )
            .join("")}
        </div>
        ${sitePill(ink, paper)}
      </div>
    </div>`,
  );
}

const DASHBOARDS = [
  {
    file: "dashboard-executive.png",
    dark: true,
    head: "Your whole business,\none screen.",
    sub: "Revenue, pipeline and retention in the same view — so the weekly meeting starts at the decision, not at the spreadsheet.",
    chips: ["Executive view", "Live figures", "Export to PDF"],
    ui: {
      dark: true,
      accent: "#249cff",
      title: "Overview",
      tabs: ["Executive", "Revenue", "Customers", "Pipeline", "Reports"],
      kpis: [
        { label: "Revenue", value: "1.42M", delta: "12.4%" },
        { label: "Gross margin", value: "63%", delta: "2.1%" },
        { label: "Churn", value: "1.8%", delta: "0.4%", down: true },
        { label: "Pipeline", value: "3.1M", delta: "18%" },
      ],
      tableHead: ["Segment", "Revenue", "Share", "Change"],
      tableRows: [
        ["Enterprise", "812K", "57%", "+14%"],
        ["Mid-market", "394K", "28%", "+9%"],
        ["Self-serve", "214K", "15%", "+21%"],
      ],
    },
  },
  {
    file: "dashboard-product.png",
    dark: false,
    head: "Which feature\nactually gets used.",
    sub: "Activation, engagement and drop-off per surface — the numbers a product decision is normally made without.",
    chips: ["Product analytics", "Funnels", "Cohorts"],
    ui: {
      dark: false,
      accent: "#1495ff",
      title: "Product",
      tabs: ["Engagement", "Activation", "Funnels", "Cohorts", "Events"],
      kpis: [
        { label: "Weekly active", value: "24.8K", delta: "6.2%" },
        { label: "Activation", value: "41%", delta: "5.0%" },
        { label: "D30 retention", value: "68%", delta: "3.4%" },
        { label: "Time to value", value: "9m", delta: "22%", down: true },
      ],
      tableHead: ["Surface", "Users", "Adoption", "Trend"],
      tableRows: [
        ["Onboarding", "24.8K", "100%", "+6%"],
        ["Dashboard", "18.1K", "73%", "+11%"],
        ["Reports", "9.4K", "38%", "+27%"],
      ],
    },
  },
  {
    file: "dashboard-operations.png",
    dark: true,
    head: "The report that\nwrites itself.",
    sub: "Operational reporting built on your real data, refreshed on a schedule — no one rebuilds it by hand every month.",
    chips: ["Ops reporting", "Scheduled refresh", "Arabic & English"],
    ui: {
      dark: true,
      accent: "#00C8A0",
      title: "Operations",
      tabs: ["Delivery", "SLA", "Capacity", "Costs", "Incidents"],
      kpis: [
        { label: "On-time", value: "96%", delta: "3.8%" },
        { label: "Avg cycle", value: "2.4d", delta: "11%", down: true },
        { label: "Utilisation", value: "84%", delta: "5.2%" },
        { label: "Cost / unit", value: "18.40", delta: "6.1%", down: true },
      ],
      tableHead: ["Team", "Volume", "On-time", "SLA"],
      tableRows: [
        ["Fulfilment", "1,284", "97%", "Met"],
        ["Support", "3,912", "94%", "Met"],
        ["Field ops", "642", "91%", "At risk"],
      ],
    },
  },
];

/* ── press it ───────────────────────────────────────────────────────────── */

const SLUG = {
  basebox: "01-alrajhi-bank",
  munaaseb: "02-munaaseb",
  hala: "03-emkan",
  "sap-cloud-cx": "04-wijhut",
  "lean-technologies": "05-lean-technologies",
};

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

const browser = await chromium.launch().catch(() => chromium.launch({ channel: "chrome" }));
mkdirSync(OUT, { recursive: true });
const made = [];

const shot = async (html, file, width = W, height = H) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(OUT, file), type: "png" });
  await page.close();
  made.push(file);
};

/**
 * Navigate to the real site and bring back a PNG data URI.
 *
 * `lang` writes the same localStorage key the site's own boot script reads
 * (`portfolio-lang`), BEFORE any page script runs — so an English capture is
 * the English site, not the Arabic one with a toggle clicked after paint. The
 * site defaults to Arabic, which is why the default capture is Arabic.
 */
const capture = async (path, { width, height, wait = 2600, lang }) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  if (lang) {
    await page.addInitScript((l) => {
      try {
        localStorage.setItem("portfolio-lang", l);
      } catch {}
    }, lang);
  }
  await page.goto(SITE + path, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  // The site opens with a preloader and a scroll-driven hero; give it a beat
  // to settle so the capture is the page, not its first frame.
  await page.waitForTimeout(wait);
  const buf = await page.screenshot({ type: "png" });
  await page.close();
  return `data:image/png;base64,${buf.toString("base64")}`;
};

for (const p of PROJECTS) await shot(projectPoster(p), `${SLUG[p.slug] ?? p.slug}.png`);
await shot(selectedWork(), "00-selected-work.png");

const FOLIO = [
  {
    file: "folio-home.png",
    path: "/",
    title: "The portfolio",
    blurb: {
      head: "The site is\nthe portfolio.",
      sub: "Built, not templated — every animation, layout and word on turkialmalki.com is mine.",
      chips: ["Next.js", "Framer Motion", "Arabic & English", "Static, fast"],
    },
  },
  {
    file: "folio-projects.png",
    path: "/projects",
    title: "Case studies",
    blurb: {
      head: "Five case studies,\nin the open.",
      sub: "Problem, research, decisions and outcomes — the full working, not a gallery of screenshots.",
      chips: ["Banking", "Fintech", "Open banking", "Enterprise"],
    },
  },
  {
    file: "folio-services.png",
    path: "/services",
    title: "Services",
    blurb: {
      head: "Everything I do,\nwith prices.",
      sub: "Six services you can buy in two taps, and one conversation if none of them fit.",
      chips: ["CV", "LinkedIn", "MVP", "Dashboards"],
    },
  },
];

// Both languages of the same three pages: the site is bilingual and the
// audience is too. Arabic keeps the plain filename because it is the site's
// default; English is suffixed.
for (const f of FOLIO) {
  for (const lang of ["ar", "en"]) {
    const desktop = await capture(f.path, { width: 1440, height: 900, lang });
    const phone = await capture(f.path, { width: 390, height: 780, lang });
    const file = lang === "ar" ? f.file : f.file.replace(/\.png$/, "-en.png");
    await shot(folioPoster({ ...f, url: SITE, desktop, phone }), file);
  }
}

for (const d of DASHBOARDS) {
  await shot(dashboardPoster({ ...d, ui: dashboardUI(d.ui) }), d.file);
}

await browser.close();
console.log(`${made.length} work cards → marketing/cards/work/\n${made.join("\n")}`);
