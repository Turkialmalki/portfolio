/**
 * THE POSTER PRESS.
 *
 *   node marketing/build-cards.mjs
 *
 * Renders every share card in `marketing/cards/` from three inputs: the copy
 * in `data.mjs`, the drawings in `sketches.mjs`, and — this is the part that
 * matters — the LIVE prices in `src/config/careerServices.ts`, which are read
 * out of the TypeScript at build time rather than copied here.
 *
 * That is the whole reason this is a script and not a folder of files someone
 * exported once from a design tool. A price change is a one-line edit in the
 * config; re-running this re-prints every poster that quotes it. A poster can
 * never advertise a figure the checkout no longer charges, and there is no
 * second copy of the prices to forget.
 *
 * Output, per language (en, ar):
 *   01-resume-review.png … 07-complete-package.png   1080 × 1350 @2×
 *   00-all-services.png                              1080 × 1350 @2×
 *   00-banner.png                                    1200 ×  630 @2×
 *
 * Requires Playwright's Chromium. If `playwright` is not resolvable from the
 * repo, point PLAYWRIGHT at an install that is:
 *   PLAYWRIGHT=$(npm root -g)/playwright node marketing/build-cards.mjs
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { BRAND, CARDS, OVERVIEW } from "./data.mjs";
import { SKETCHES, SKETCH_COPY } from "./sketches.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(HERE, "cards");
const FONTS = resolve(ROOT, "public/fonts");

/* ── prices, straight out of the config ─────────────────────────────────
   A deliberately narrow parse: it finds each `id: { … }` block in SERVICES
   and pulls the two figures out of it. If the shape of that file changes,
   this throws rather than printing a stale or missing price — a poster with
   the wrong number on it is worse than no poster. */
function readPrices() {
  const src = readFileSync(resolve(ROOT, "src/config/careerServices.ts"), "utf8");
  const table = src.slice(src.indexOf("export const SERVICES"));
  const prices = {};
  for (const { id } of CARDS) {
    const block = new RegExp(`${id}:\\s*\\{([\\s\\S]*?)\\n  \\}`).exec(table);
    if (!block) throw new Error(`no SERVICES entry for ${id}`);
    const p = /price:\s*\{\s*usd:\s*(\d+),\s*sar:\s*(\d+)\s*\}/.exec(block[1]);
    const soon = /status:\s*"coming-soon"/.test(block[1]);
    if (!p && !soon) throw new Error(`${id} is live but has no price`);
    prices[id] = p ? { usd: +p[1], sar: +p[2] } : null;
  }
  return prices;
}

const PRICES = readPrices();
/** The bundle's anchor: what the five buyable services cost separately. */
const TOTAL = CARDS.filter((c) => c.id !== "completeBundle" && PRICES[c.id]).reduce(
  (a, c) => ({ usd: a.usd + PRICES[c.id].usd, sar: a.sar + PRICES[c.id].sar }),
  { usd: 0, sar: 0 },
);

/** English prints USD, Arabic prints SAR — never both, same rule as the site. */
const money = (p, lang) =>
  !p ? OVERVIEW.soon[lang] : lang === "ar" ? `${p.sar.toLocaleString("en-US")} ريال` : `$${p.usd.toLocaleString("en-US")}`;

const font = (file) => pathToFileURL(resolve(FONTS, file)).href;

const FACE = ["Light:300", "Regular:400", "Medium:500", "Bold:700", "Black:900"]
  .map((s) => s.split(":"))
  .map(
    ([w, n]) => `@font-face{font-family:Thmanyah;src:url("${font(`thmanyahsans-${w}.woff2`)}") format("woff2");
      font-weight:${n};font-style:normal;font-display:block;}`,
  )
  .join("\n");

const PAGE = (bodyStyle, inner, dir) => `<!doctype html>
<html dir="${dir}"><head><meta charset="utf-8"><style>
${FACE}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Thmanyah,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;
  text-rendering:geometricPrecision;${bodyStyle}}
</style></head><body>${inner}</body></html>`;

/* ── the poster ─────────────────────────────────────────────────────────── */

const W = 1080;
const H = 1350;
const PAD = 74;

function poster(card, lang) {
  const dark = card.id === "completeBundle";
  const ink = dark ? "#f0f0ef" : "#0d0e12";
  const paper = dark ? "#0d0e12" : "#FBFBF9";
  const muted = dark ? "rgba(240,240,239,0.56)" : "#626262";
  const rule = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)";
  const price = PRICES[card.id];
  const sketch = SKETCHES[card.sketch](SKETCH_COPY[lang][card.sketch]);

  const priceBlock = card.comingSoon
    ? `<div style="font-size:44px;font-weight:900;letter-spacing:-0.03em;color:${muted};">${OVERVIEW.soon[lang]}</div>`
    : `<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;">
         <span style="font-size:74px;font-weight:900;letter-spacing:-0.045em;line-height:1;">${money(price, lang)}</span>
         ${
           dark
             ? `<s style="font-size:26px;font-weight:600;color:${muted};text-decoration-thickness:1.5px;">${money(TOTAL, lang)}</s>`
             : ""
         }
       </div>`;

  return PAGE(
    `width:${W}px;height:${H}px;background:${paper};color:${ink};overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;">

      <!-- masthead -->
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="font-size:15px;font-weight:900;letter-spacing:0.02em;background:${ink};color:${paper};
            border-radius:6px;padding:7px 11px;">${card.index}</span>
          <span style="font-size:16px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">${card.name[lang]}</span>
        </div>
        <span style="font-size:16px;font-weight:600;color:${muted};">${BRAND.site}</span>
      </div>

      <!-- the sketch -->
      <div style="margin-top:40px;height:430px;">${sketch}</div>

      <!-- the words -->
      <div style="margin-top:44px;">
        <div style="font-size:82px;font-weight:900;letter-spacing:-0.045em;line-height:1.04;white-space:pre-line;">${card.headline[lang]}</div>
        <div style="font-size:27px;font-weight:500;line-height:1.5;color:${muted};margin-top:24px;max-width:88%;">${card.outcome[lang]}</div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:30px;">
        ${card.bullets[lang]
          .map(
            (b) => `<span style="font-size:19px;font-weight:700;border:1px solid ${rule};border-radius:999px;
              padding:11px 20px;color:${dark ? "#f0f0ef" : "#0d0e12"};">${b}</span>`,
          )
          .join("")}
      </div>

      <!-- price + where to get it -->
      <div style="margin-top:auto;padding-top:38px;border-top:1px solid ${rule};
        display:flex;align-items:flex-end;justify-content:space-between;gap:24px;">
        <div>
          ${priceBlock}
          <div style="font-size:19px;font-weight:600;color:${muted};margin-top:12px;">${card.delivery[lang]}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:${ink};color:${paper};
          border-radius:999px;padding:19px 30px;font-size:20px;font-weight:800;white-space:nowrap;">
          ${BRAND.site}
        </div>
      </div>
    </div>`,
    lang === "ar" ? "rtl" : "ltr",
  );
}

/* ── the overview poster: the whole menu on one image ───────────────────── */

function overview(lang) {
  const rows = CARDS.map(
    (c) => `<div style="display:flex;align-items:baseline;gap:20px;padding:21px 0;border-bottom:1px solid rgba(0,0,0,0.08);">
      <span style="font-size:17px;font-weight:800;color:#8b8b93;width:38px;flex:none;">${c.index}</span>
      <span style="font-size:29px;font-weight:800;letter-spacing:-0.02em;flex:1;">${c.name[lang]}</span>
      <span style="font-size:29px;font-weight:900;letter-spacing:-0.03em;white-space:nowrap;
        color:${PRICES[c.id] ? "#0d0e12" : "#8b8b93"};">${money(PRICES[c.id], lang)}</span>
    </div>`,
  ).join("");

  return PAGE(
    `width:${W}px;height:${H}px;background:#FBFBF9;color:#0d0e12;overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:${PAD}px;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:16px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">${OVERVIEW.eyebrow[lang]}</span>
        <span style="font-size:16px;font-weight:600;color:#626262;">${BRAND.site}</span>
      </div>

      <div style="margin-top:64px;">
        <div style="font-size:108px;font-weight:900;letter-spacing:-0.05em;line-height:0.98;white-space:pre-line;">${OVERVIEW.headline[lang]}</div>
        <div style="font-size:29px;font-weight:500;color:#626262;margin-top:26px;">${OVERVIEW.sub[lang]}</div>
      </div>

      <div style="margin-top:52px;">${rows}</div>

      <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:20px;">
        <div>
          <div style="font-size:26px;font-weight:900;letter-spacing:-0.02em;">${BRAND.name[lang]}</div>
          <div style="font-size:19px;font-weight:500;color:#626262;margin-top:8px;">${BRAND.role[lang]}</div>
        </div>
        <div style="background:#0d0e12;color:#FBFBF9;border-radius:999px;padding:19px 30px;font-size:20px;font-weight:800;">
          ${BRAND.site}
        </div>
      </div>
    </div>`,
    lang === "ar" ? "rtl" : "ltr",
  );
}

/* ── the wide banner: link previews, X, LinkedIn header ─────────────────── */

function banner(lang) {
  return PAGE(
    `width:1200px;height:630px;background:#0d0e12;color:#f0f0ef;overflow:hidden;`,
    `<div style="width:100%;height:100%;padding:66px 72px;display:flex;flex-direction:column;justify-content:space-between;
      background:radial-gradient(120% 90% at 78% 8%, rgba(20,149,255,0.18) 0%, rgba(20,149,255,0) 62%);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:15px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(240,240,239,0.6);">${OVERVIEW.eyebrow[lang]}</span>
        <span style="font-size:15px;font-weight:600;color:rgba(240,240,239,0.6);">${BRAND.site}</span>
      </div>
      <div>
        <div style="font-size:92px;font-weight:900;letter-spacing:-0.05em;line-height:0.98;white-space:pre-line;">${OVERVIEW.headline[lang]}</div>
        <div style="font-size:27px;font-weight:500;color:rgba(240,240,239,0.66);margin-top:22px;">${OVERVIEW.sub[lang]}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        ${CARDS.map(
          (c) => `<span style="font-size:17px;font-weight:700;border:1px solid rgba(255,255,255,0.16);
            border-radius:999px;padding:10px 18px;color:${PRICES[c.id] ? "#f0f0ef" : "rgba(240,240,239,0.5)"};">
            ${c.name[lang]}</span>`,
        ).join("")}
      </div>
    </div>`,
    lang === "ar" ? "rtl" : "ltr",
  );
}

/* ── press it ───────────────────────────────────────────────────────────── */

const SLUG = {
  resumeReview: "01-resume-review",
  resumeWriting: "02-resume-writing",
  publicSpeaking: "03-public-speaking",
  linkedinOptimization: "04-linkedin-optimization",
  mvpPortfolio: "05-mvp-portfolio",
  dashboardReporting: "06-dashboard-reporting",
  completeBundle: "07-complete-package",
};

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

const shot = async (browser, html, file, width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  // Fonts are the one asset that can land after layout. Waiting on the real
  // signal beats waiting on a timer.
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, type: "png" });
  await page.close();
  return file;
};

/* Playwright's own Chromium if it is downloaded, otherwise the Chrome that is
   already on the machine. Either renders these cards identically — they are
   plain CSS with local fonts — and the fallback means a fresh clone does not
   need a 150MB browser download to reprint a poster. */
const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: "chrome" }));
const made = [];

for (const lang of ["en", "ar"]) {
  const dir = resolve(OUT, lang);
  mkdirSync(dir, { recursive: true });
  for (const card of CARDS) {
    made.push(await shot(browser, poster(card, lang), resolve(dir, `${SLUG[card.id]}.png`), W, H));
  }
  made.push(await shot(browser, overview(lang), resolve(dir, "00-all-services.png"), W, H));
  made.push(await shot(browser, banner(lang), resolve(dir, "00-banner.png"), 1200, 630));
}

await browser.close();

// A machine-readable index, so a scheduler or a post queue can pick a card
// without knowing this script's naming scheme.
writeFileSync(
  resolve(OUT, "index.json"),
  JSON.stringify(
    {
      generated: new Date().toISOString().slice(0, 10),
      cards: CARDS.map((c) => ({
        id: c.id,
        name: c.name,
        price: PRICES[c.id],
        comingSoon: !!c.comingSoon,
        files: { en: `en/${SLUG[c.id]}.png`, ar: `ar/${SLUG[c.id]}.png` },
      })),
    },
    null,
    2,
  ) + "\n",
);

console.log(`${made.length} cards → marketing/cards/`);
