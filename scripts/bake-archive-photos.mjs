/* ═══════════════════════════════════════════════════════════════════════
   BAKE THE HERO ARCHIVE PHOTOGRAPHY.

   next.config.ts sets `images: { unoptimized: true }` — this site is a static
   export, so whatever is in public/ is exactly what a phone downloads. The
   originals behind the hero collage are camera files (turki.jpg alone is 2MB
   at 7008×4672), and four of them in the hero would be tens of megabytes on a
   slow connection.

   So the collage is fed from CROPS baked here: the same photographs, framed
   for the tile they sit in, at the size they are actually drawn. No upscaling,
   no filters, no generated imagery — just a crop and a resize of a real photo.
   Re-run after replacing any source photograph.

     node scripts/bake-archive-photos.mjs
   ═══════════════════════════════════════════════════════════════════════ */

import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const PUB = resolve(process.cwd(), "public");
const OUT = resolve(PUB, "hero/archive");
mkdirSync(OUT, { recursive: true });

const sips = (args) => execFileSync("sips", args, { stdio: ["ignore", "pipe", "pipe"] });

const size = (file) => {
  const out = sips(["-g", "pixelWidth", "-g", "pixelHeight", file]).toString();
  return {
    w: Number(/pixelWidth:\s*(\d+)/.exec(out)[1]),
    h: Number(/pixelHeight:\s*(\d+)/.exec(out)[1]),
  };
};

/**
 * One baked tile.
 *
 * `focus` is the point of the ORIGINAL frame the crop is centred on, as
 * fractions of its width and height — the subject, not the middle of the
 * photograph. `edge` is the longest edge the tile is ever drawn at (2× its
 * CSS size, so it stays sharp on a retina phone).
 */
const TILES = [
  { src: "screenshot.jpg",        out: "room.jpg",     ar: 3 / 2, edge: 1200, focus: [0.42, 0.5] },
  { src: "speaking-portrait.jpg", out: "stage.jpg",    ar: 4 / 5, edge: 900,  focus: [0.46, 0.52] },
];

/**
 * Product screens cropped out of a wider render, for the drawn phone bodies in
 * the hero showcase.
 *
 * `box` is the region of the source to keep, in source pixels: x, y, width.
 * The height follows from `ar` so every screen matches the phone body it sits
 * in (538 × 1200, the same aspect as the Emkan render) — a screen cropped to a
 * different aspect would be stretched or letterboxed inside the bezel.
 */
const SCREENS = [
  {
    src: "alrajhi123.png",
    out: "alrajhi-screen.jpg",
    /* the right-hand phone of the Al Rajhi pair: the flattest, cleanest
       straight-on render of the home screen in the repository */
    box: { x: 599, y: 80, w: 330 },
    ar: 538 / 1200,
    edge: 660,
  },
  {
    src: "munasib.png",
    out: "window-munaseb.jpg",
    /* The Munaseb landing page lifted straight out of the laptop render it
       ships in: the box is the screen's own lit area, inset far enough to
       leave no bezel, no camera notch and no reflection. That is what lets
       the hero draw its OWN browser chrome around it — a page still wearing
       a device frame inside a second frame reads as a mockup of a mockup.
       The timeline keeps the laptop shot, so the same product is framed two
       different ways rather than pasted in twice. */
    box: { x: 1026, y: 243, w: 1250 },
    /* 16:9 rather than the screen's own 1.66 — the render's page runs a little
       taller than the fold it is showing, and trimming to a real browser
       viewport takes the dead band off the bottom instead of framing it. */
    ar: 16 / 9,
    edge: 1250,
    quality: 88,
  },
];

/**
 * Organisation marks, trimmed from the official logo files.
 *
 * Both files are square with a lot of baked-in whitespace, so dropped into a
 * fixed-height chip the artwork would render at roughly half the size of the
 * marks beside it. `box` is the artwork's own ink bounding box inside the
 * file, measured by scanning the decoded pixels rather than eyeballed —
 * trimming to it lets every logo in the row sit at the same optical weight.
 */
const MARKS = [
  {
    src: "hero/monshaat.png",
    out: "mark-monshaat.png",
    /* Measured ink box of the whole lockup is x56 y201 968×678; this stops
       above the two-line descriptor, which is illegible at chip size and is
       not part of the mark. */
    box: { x: 56, y: 201, w: 968, h: 516 },
    edge: 640,
    keepAlpha: true,
  },
  {
    src: "hero/aramco.png",
    out: "mark-aramco.png",
    box: { x: 60, y: 164, w: 327, h: 119 },
    edge: 400,
    keepAlpha: true,
  },
];

for (const mark of MARKS) {
  const src = resolve(PUB, mark.src);
  const dst = resolve(OUT, mark.out);
  const { w, h } = size(src);

  sips([
    "-c", String(mark.box.h), String(mark.box.w),
    "--cropOffset", String(mark.box.y), String(mark.box.x),
    src, "--out", dst,
  ]);
  /* never enlarged: the crop is only ever resampled down */
  if (mark.box.w > mark.edge) sips(["--resampleWidth", String(mark.edge), dst]);
  if (!mark.keepAlpha) {
    sips(["-s", "format", "jpeg", "-s", "formatOptions", "88", dst, "--out", dst]);
  }

  const out = size(dst);
  console.log(
    `${mark.out.padEnd(20)} ${w}×${h} → ${out.w}×${out.h}  ` +
      `${(statSync(dst).size / 1024).toFixed(0)}KB  (from ${mark.src})`,
  );
}

for (const screen of SCREENS) {
  const src = resolve(PUB, screen.src);
  const dst = resolve(OUT, screen.out);
  const { w, h } = size(src);
  const cw = Math.min(screen.fixedWidth ?? screen.box.w, w - screen.box.x);
  const ch = Math.min(Math.round(cw / screen.ar), h - screen.box.y);

  sips([
    "-c", String(ch), String(cw),
    "--cropOffset", String(screen.box.y), String(screen.box.x),
    src, "--out", dst,
  ]);
  sips(["--resampleWidth", String(Math.min(screen.edge, cw))]. concat([dst]));
  sips(["-s", "format", "jpeg", "-s", "formatOptions", String(screen.quality ?? 80), dst, "--out", dst]);

  const out = size(dst);
  console.log(
    `${screen.out.padEnd(20)} ${w}×${h} → ${out.w}×${out.h}  ` +
      `${(statSync(dst).size / 1024).toFixed(0)}KB  (from ${screen.src})`,
  );
}

for (const tile of TILES) {
  const src = resolve(PUB, tile.src);
  const dst = resolve(OUT, tile.out);
  const { w, h } = size(src);

  /* the largest box of the wanted aspect that fits inside the original —
     a crop only ever removes pixels, so nothing is ever enlarged */
  let cw = w;
  let ch = Math.round(w / tile.ar);
  if (ch > h) {
    ch = h;
    cw = Math.round(h * tile.ar);
  }

  /* centre it on the subject, then clamp so the box stays inside the frame */
  const cx = Math.min(Math.max(Math.round(w * tile.focus[0] - cw / 2), 0), w - cw);
  const cy = Math.min(Math.max(Math.round(h * tile.focus[1] - ch / 2), 0), h - ch);

  sips(["-c", String(ch), String(cw), "--cropOffset", String(cy), String(cx), src, "--out", dst]);

  const long = tile.ar >= 1 ? "--resampleWidth" : "--resampleHeight";
  sips([long, String(tile.edge), dst]);
  sips(["-s", "format", "jpeg", "-s", "formatOptions", "72", dst, "--out", dst]);

  const { w: fw, h: fh } = size(dst);
  console.log(
    `${tile.out.padEnd(14)} ${w}×${h} → ${fw}×${fh}  ` +
      `${(statSync(dst).size / 1024).toFixed(0)}KB  (from ${tile.src})`,
  );
}
