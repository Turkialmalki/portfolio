/**
 * Screenshots the résumé scene at fixed points of its scroll.
 *
 *   node scripts/crumple/shots.mjs <outDir> [p ...]
 *
 * Drives a headless Chrome over CDP because the page's progress is a function
 * of real scroll position — Lenis owns it, so it has to be scrolled, not faked.
 */
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = resolve(process.argv[2] ?? ".");
const POINTS = (process.argv.slice(3).length ? process.argv.slice(3) : ["0", "0.25", "0.5", "0.75", "1"]).map(Number);
const URL_ = process.env.URL ?? "http://localhost:3000/services";
const PORT = 9333;

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/crumple-shots-profile",
  "--window-size=1440,900",
  "about:blank",
], { stdio: "ignore" });

let ws, id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const m = ++id;
    pending.set(m, { res, rej });
    ws.send(JSON.stringify({ id: m, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

try {
  let list;
  for (let i = 0; i < 60; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; }
    catch { await sleep(250); }
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
  // the profile is reused between runs; freshly baked frames must not be cached
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 2, mobile: false,
  });

  // one load, then scrub — re-navigating between points is what a scroll story
  // makes expensive, and the page has to settle again each time
  await send("Page.navigate", { url: URL_ });
  await sleep(2500);
  // the site persists its language choice; set it the way a visitor would have
  if (process.env.LANG_ARG) {
    await send("Runtime.evaluate", {
      expression: `localStorage.setItem('portfolio-lang', ${JSON.stringify(process.env.LANG_ARG)})`,
    });
    await send("Page.navigate", { url: URL_ });
  }
  await sleep(5000);

  for (const p of POINTS) {
    const res = await send("Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const sec = document.querySelector('.act1');
        if (!sec) return { err: 'no .act1' };
        const top = sec.getBoundingClientRect().top + window.scrollY;
        const y = top + ${p} * (sec.offsetHeight - window.innerHeight);
        for (let i = 0; i < 40; i++) {
          window.scrollTo(0, y);
          document.scrollingElement.scrollTop = y;
          await new Promise(r => requestAnimationFrame(r));
        }
        await new Promise(r => setTimeout(r, 900));
        return { want: Math.round(y), got: Math.round(window.scrollY) };
      })()`,
    });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 400));
    const result = res.result;
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const name = `p${String(Math.round(p * 100)).padStart(3, "0")}.png`;
    writeFileSync(resolve(OUT, name), Buffer.from(shot.data, "base64"));
    console.log(`${name}  ${JSON.stringify(result.value)}`);
  }
} finally {
  ws?.close();
  chrome.kill();
}
