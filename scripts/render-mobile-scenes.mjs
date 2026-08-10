/* ═══════════════════════════════════════════════════════════════════════
   BAKE THE DESKTOP FILM INTO PHONE-SIZED VIDEO.

   The phone is not asked to animate eighty DOM elements, six browser
   mockups, two raw data tables, a dashboard and a set of SVG filters. It is
   asked to play one hardware-decoded H.264 stream per service. This script
   is what makes those streams, and it makes them FROM THE APPROVED DESKTOP
   FILM ITSELF — the same components, the same from/to vectors, the same
   easing — so the phone shows the same visual idea rather than a redrawn
   approximation of it. Re-run it whenever a desktop scene changes.

   HOW
   ───
   1. Open /services in headless Chrome, which is a pointer device, so the
      real film is what renders — at a viewport shaped like the plate the
      phone will show. Every composition in the film is expressed as
      fractions of its stage, so a differently-shaped stage recomposes the
      same objects into that frame for free.
   2. Hide the page chrome and the copy block. The copy stays real DOM on the
      phone — headline, price, CTA and alt text are never baked into a
      picture — so the plate must contain the VISUAL only.
   3. Drive window.scrollY to the exact offsets that correspond to the slice
      of the scene's progress carrying its transformation, and screenshot
      each step.
   4. ffmpeg the steps into an ~800ms H.264 file, plus a WebP poster.

   Chrome is driven over CDP rather than through a browser-automation
   dependency, matching scripts/crumple/shots.mjs — this repo bakes its
   assets with the tools already on the machine, and adds no library to do
   it.

     node scripts/render-mobile-scenes.mjs [baseUrl]
   ═══════════════════════════════════════════════════════════════════════ */

import { spawn, execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";

const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.argv[2] ?? "http://localhost:3000";
/* `public/scenes`, deliberately not `public/services` — that directory name
   collides with the /services route in the static export. */
const OUT = resolve("public/scenes");
const TMP = resolve(".mobile-scene-frames");
/* A fresh port and a fresh profile per run. A reused pair silently attaches
   this script to a Chrome left over from a previous run — which binds
   nothing, prints nothing and captures nothing. */
const PORT = 9300 + (process.pid % 600);
const PROFILE = `/tmp/mobile-scene-profile-${process.pid}`;

const FPS = 30;
const FRAMES = 24; // 24 / 30fps = 800ms

/* Each scene declares:

   · the SHAPE of its own composition. A rewritten A4 page is portrait; a
     dashboard is landscape; the bundle is a row. Forcing all five into one
     plate ratio would either crop the wide ones or shrink the tall ones
     until nothing in them could be read on a 390px screen. `PLATES` in
     src/app/services/mobilePlates.ts restates these numbers, and the phone
     stylesheet reserves each plate's box from them.

   · the slice of its own progress that IS the transformation. The film uses
     the head and tail of every scene to bring copy in and out, and on the
     phone the copy is real DOM that needs no runway.

   Source widths are 620–700px, captured at 2x and delivered at 1x. */
const SCENES = [
  { id: "rewrite", section: ".sv-rw", w: 620, h: 720, from: 0.06, to: 0.78 },
  { id: "linkedin", section: ".sv-li", w: 640, h: 620, from: 0.14, to: 0.8 },
  { id: "work", section: ".sv-wk", w: 660, h: 620, from: 0.02, to: 0.72 },
  { id: "dashboard", section: ".sv-db", w: 680, h: 560, from: 0.06, to: 0.88 },
  { id: "bundle", section: ".sv-bd", w: 700, h: 320, from: 0.36, to: 0.95 },
];

const LANGS = ["ar", "en"];

/** `node scripts/render-mobile-scenes.mjs <url> bundle,work` re-bakes a subset. */
const ONLY = (process.argv[3] ?? "").split(",").filter(Boolean);
const WANTED = ONLY.length ? SCENES.filter((s) => ONLY.includes(s.id)) : SCENES;

/* Everything that is not the visual.

   `display: none`, not `visibility: hidden`, for the copy: the two-column
   scenes lay it out as a grid track, and a merely invisible column still
   holds half the frame — the document would be baked hard against one edge.
   With the copy gone those scenes collapse to the single centred column the
   plate wants. */
const HIDE = `
  nextjs-portal, header, nav, footer, [role="banner"],
  .sv-copy, .sv-chap, .shint, .rail,
  .sv-fx, .sv-db-tag, .sv-wk-kick, .sv-bd-foot { display: none !important; }
  /* the theme toggle and any other fixed island the site floats over a page */
  body > div[style*="fixed"], body > button { display: none !important; }
  .sv .sv-rw .sv-pin, .sv .sv-li .sv-pin {
    grid-template-columns: minmax(0, 1fr) !important;
    width: 100% !important; padding: 0 !important; gap: 0 !important;
  }
  .sv .sv-rw .sv-rwdoc { width: 74% !important; }
  .sv .sv-li .sv-lk-stage { width: 92% !important; margin-inline: auto !important; }
  /* the plate is opaque and light in both themes - see MobileScenes.tsx */
  html, body, .sv { background: #FBFBF9 !important; }
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new", "--hide-scrollbars",
    // no --disable-gpu: without a compositor a headless page stops firing
    // requestAnimationFrame, and every scrubbed value on this page is
    // published from one.
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws;
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const m = ++id;
    pending.set(m, { res, rej });
    ws.send(JSON.stringify({ id: m, method, params }));
  });

/** Evaluate in the page and return the value, throwing on a page exception. */
async function evalPage(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500));
  }
  return r.result.value;
}

try {
  mkdirSync(OUT, { recursive: true });
  rmSync(TMP, { recursive: true, force: true });

  let list;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  const target = list.find((t) => t.type === "page");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    }
  };

  await send("Page.enable");
  await send("Network.enable");
  // the profile is reused between runs; a stale film must never be re-baked
  await send("Network.setCacheDisabled", { cacheDisabled: true });

  for (const lang of LANGS) {
    for (const scene of WANTED) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: scene.w, height: scene.h, deviceScaleFactor: 2, mobile: false,
      });
      await send("Page.navigate", { url: `${BASE}/services` });
      await sleep(1500);
      // the site persists its language choice; set it the way a visitor would
      await evalPage(`localStorage.setItem('portfolio-lang', ${JSON.stringify(lang)})`);
      await send("Page.navigate", { url: `${BASE}/services` });
      // fonts, every screenshot decoded, and the film's first frame settled
      await sleep(6000);
      await evalPage(
        `(() => { const s = document.createElement('style');
                  s.textContent = ${JSON.stringify(HIDE)};
                  document.head.appendChild(s); return 1; })()`,
      );
      await sleep(700);

      const dir = resolve(TMP, `${scene.id}-${lang}`);
      mkdirSync(dir, { recursive: true });

      /* ── WARM-UP ──
         The scroll driver only evaluates a section while its
         IntersectionObserver says it is on screen, and that callback lands a
         frame or two after a navigation. Scrolling straight into the capture
         loop therefore screenshots frame 0 against whatever the previous
         scene left on screen. So: park at the start of the range, let the
         observer and the driver catch up, and only then start capturing. */
      await evalPage(`(() => {
        const sec = document.querySelector(${JSON.stringify(scene.section)});
        const top = sec.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top + ${scene.from} * Math.max(1, sec.offsetHeight - window.innerHeight));
        return 1;
      })()`);
      await sleep(1600);

      /* Page.captureScreenshot hands back the last COMMITTED frame. Straight
         after a navigation and a fresh scroll that is still the previous
         scene's paint, which is why frame 0 used to show the END of the
         story. One throwaway capture flushes it. */
      await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });

      for (let i = 0; i < FRAMES; i++) {
        const p = scene.from + ((scene.to - scene.from) * i) / (FRAMES - 1);
        const got = await evalPage(`(async () => {
          const sec = document.querySelector(${JSON.stringify(scene.section)});
          const top = sec.getBoundingClientRect().top + window.scrollY;
          const y = top + ${p} * Math.max(1, sec.offsetHeight - window.innerHeight);
          window.scrollTo(0, y);
          /* Three frames: the scroll listener coalesces to one rAF, the
             MotionValues write on the next, the compositor paints on the
             one after that. Raced against a timer because a headless page
             that is not being composited can stop firing rAF entirely —
             which hangs the capture instead of merely slowing it. */
          const frame = () => Promise.race([
            new Promise(r => requestAnimationFrame(r)),
            new Promise(r => setTimeout(r, 120)),
          ]);
          for (let k = 0; k < 3; k++) await frame();
          await new Promise(r => setTimeout(r, 80));
          return Math.round(window.scrollY);
        })()`);
        if (i === 0) process.stdout.write(`${scene.id}-${lang} @${got} `);
        const shot = await send("Page.captureScreenshot", {
          format: "png", captureBeyondViewport: false,
        });
        writeFileSync(
          resolve(dir, `${String(i).padStart(3, "0")}.png`),
          Buffer.from(shot.data, "base64"),
        );
      }

      const stem = resolve(OUT, `${scene.id}-${lang}`);
      /* H.264 High, yuv420p, even dimensions, faststart — the combination
         every iOS Safari decodes in hardware. No audio track at all. */
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-framerate", String(FPS),
        "-i", resolve(dir, "%03d.png"),
        "-vf", `scale=${scene.w}:${scene.h}:flags=lanczos`,
        "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", "26", "-preset", "slow", "-movflags", "+faststart", "-an",
        `${stem}.mp4`,
      ]);
      /* TWO stills, because they answer two different questions.

         `<id>.webp` is the video's FIRST frame and is the element's poster.
         A poster showing the end state would mean the plate displays the
         resolved profile while it waits, then visibly rewinds to the problem
         the moment playback starts. Matching the poster to frame 0 makes the
         hand-off from poster to video invisible.

         `<id>-still.webp` is the LAST frame, and is what a visitor who has
         asked for reduced motion sees instead of a video: no playback, so
         the plate should rest on the outcome the service sells rather than
         on the problem it fixes. */
      for (const [frame, suffix] of [[0, ""], [FRAMES - 1, "-still"]]) {
        execFileSync("ffmpeg", [
          "-y", "-loglevel", "error",
          "-i", resolve(dir, `${String(frame).padStart(3, "0")}.png`),
          "-vf", `scale=${scene.w}:${scene.h}:flags=lanczos`,
          "-quality", "72", `${stem}${suffix}.webp`,
        ]);
      }

      const kb = (f) => (statSync(f).size / 1024).toFixed(0);
      console.log(`→ mp4 ${kb(`${stem}.mp4`)}kb  poster ${kb(`${stem}.webp`)}kb`);
    }
  }
} catch (err) {
  console.error("\nrender-mobile-scenes failed:", err);
  process.exitCode = 1;
} finally {
  ws?.close();
  chrome.kill();
  rmSync(TMP, { recursive: true, force: true });
  rmSync(PROFILE, { recursive: true, force: true });
}
