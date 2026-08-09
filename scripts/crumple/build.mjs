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

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
/**
 * `--mobile` bakes the phone set: fewer frames, and each one resized down to
 * something a phone actually displays. It is a genuine re-bake, not a subsample
 * of the desktop set — frame.html spaces its keyframes evenly in *shape* across
 * whatever count it is given, so twelve frames are twelve correctly-spaced
 * stages of the same crumple, not every second stage of twenty-two.
 */
const MOBILE = process.argv.includes("--mobile");

const FRAMES = Number(ARGS[0] ?? (MOBILE ? 12 : 11));
const LANG = ARGS[1] ?? "ar";
/** how far toward flat the last frame goes — see frame.html */
const SMAX = Number(ARGS[2] ?? 0.8);
const DPR = 1.3;
const W = 1080, H = 1360;
/* Rendered at full size and downscaled rather than rendered small: the mesh
   shading is supersampled that way, so a 560px frame still reads as creased
   paper instead of as mush. 560 is ~1.5× the widest the sheet is ever drawn on
   a phone, which leaves the retina headroom and nothing more. */
const MOBILE_W = 560;
const PREFIX = MOBILE ? `crumple-m-${LANG}` : `crumple-${LANG}`;

mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const stale = new RegExp(`^${PREFIX}-\\d+\\.webp$`);
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

  const name = `${PREFIX}-${String(i).padStart(2, "0")}.webp`;
  const webp = resolve(OUT, name);
  execFileSync("cwebp", [
    "-q", MOBILE ? "62" : "68",
    "-alpha_q", MOBILE ? "76" : "82",
    "-m", "6", "-quiet",
    ...(MOBILE ? ["-resize", String(MOBILE_W), "0"] : []),
    png, "-o", webp,
  ]);
  const kb = statSync(webp).size / 1024;
  total += kb;
  console.log(`${name}  ${kb.toFixed(1)} KB`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(
  `\n${FRAMES} frames · ${LANG}${MOBILE ? " · mobile" : ""} · ${total.toFixed(0)} KB (what one visitor downloads)`,
);
