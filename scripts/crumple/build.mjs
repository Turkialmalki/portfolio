/**
 * Bakes the crumpled-CV keyframe sequence.
 *
 *   node scripts/crumple/build.mjs [frames] [lang] [smax]
 *
 * Renders scripts/crumple/frame.html once per keyframe in headless Chrome and
 * writes public/cv/crumple-<lang>-NN.webp.
 *
 * One set exists per language. The print goes into the folds with the paper,
 * so an Arabic set shown to an English reader would put Arabic in the creases
 * of an English CV the moment the type becomes identifiable. Both sets ship,
 * but a visitor only ever fetches their own — the cost is repository size, not
 * bandwidth, which is why this is worth two bakes rather than an early cut.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const OUT = resolve(ROOT, "public/cv");
const TMP = resolve(HERE, ".tmp");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const FRAMES = Number(process.argv[2] ?? 11);
const LANG = process.argv[3] ?? "ar";
/** how far toward flat the last frame goes — see frame.html */
const SMAX = Number(process.argv[4] ?? 0.8);
const DPR = 1.3;
const W = 1080, H = 1360;

mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const stale = new RegExp(`^crumple-${LANG}-\\d+\\.webp$`);
for (const f of readdirSync(OUT)) if (stale.test(f)) unlinkSync(resolve(OUT, f));

let total = 0;
for (let i = 0; i < FRAMES; i++) {
  const png = resolve(TMP, `f${i}.png`);
  const url = `file://${resolve(HERE, "frame.html")}?f=${i}&n=${FRAMES}&dpr=${DPR}&lang=${LANG}&smax=${SMAX}`;
  execFileSync(CHROME, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--default-background-color=00000000",
    `--force-device-scale-factor=${DPR}`,
    `--window-size=${W},${H}`,
    `--screenshot=${png}`,
    "--virtual-time-budget=6000",
    url,
  ], { stdio: ["ignore", "ignore", "inherit"], cwd: HERE });

  const webp = resolve(OUT, `crumple-${LANG}-${String(i).padStart(2, "0")}.webp`);
  execFileSync("cwebp", ["-q", "68", "-alpha_q", "82", "-m", "6", "-quiet", png, "-o", webp]);
  const kb = statSync(webp).size / 1024;
  total += kb;
  console.log(`crumple-${LANG}-${String(i).padStart(2, "0")}.webp  ${kb.toFixed(1)} KB`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${FRAMES} frames · ${LANG} · ${total.toFixed(0)} KB (what one visitor downloads)`);
