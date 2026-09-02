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
import { copyFileSync, mkdirSync, statSync } from "node:fs";
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
 *
 * `small` is the same crop again at the longest edge a PHONE ever draws it at.
 * The site is a static export with `images.unoptimized`, so next/image builds
 * no srcset of its own and whatever is in public/ is exactly what comes down
 * the wire — a phone was therefore downloading and decoding a 1120px print to
 * show it 155px wide. The hero picks between the two with a `<picture>`
 * source, which is resolved by the browser before any JavaScript runs, so the
 * right file is the only one fetched.
 */
const TILES = [
  { src: "screenshot.jpg",        out: "room.jpg",     ar: 3 / 2, edge: 1120, focus: [0.42, 0.5], small: 620 },
  { src: "speaking-portrait.jpg", out: "stage.jpg",    ar: 4 / 5, edge: 760,  focus: [0.46, 0.52], small: 400 },
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
    /* The right-hand phone of the Al Rajhi pair: the flattest, cleanest
       straight-on render of the home screen in the repository.

       The box is the WHOLE of that render's screen, top edge to bottom edge —
       589..942 across and 50..838 down, measured off the mockup's own card.
       It used to be a 330×736 window cut out of the middle of it, and the cost
       was the bottom: the crop landed inside the "My dream car" card, so the
       hero's front phone ended on a row of half-sentences. Taking the card
       whole ends the screen where the screen ends, and hands the bezel 7% more
       pixels while it is at it — the corners the card rounds are inside the
       drawn screen's own larger radius, so nothing of the mockup's frame
       survives into the composition. */
    box: { x: 589, y: 50, w: 353 },
    /* 353/788 — within a thousandth of the Emkan screen's 538/1200, which is
       what lets the two handsets carry the same bezel at two sizes */
    ar: 353 / 788,
    edge: 353,
    quality: 88,
  },
  {
    src: "hero/emkan-screen.png",
    out: "emkan-screen.jpg",
    /* Not cropped: the file is already one full-bleed app screen at the
       handset aspect. What it needed was SIZE. It was shipping as a 538×1200
       PNG — 164KB, decoded on every phone — to be drawn 52px wide. This is the
       same screen at the width the largest of the two handsets is ever drawn
       at on a 3× display, which is a fifth of the bytes and pixel-for-pixel
       identical everywhere it is actually seen. */
    box: { x: 0, y: 0, w: 538 },
    ar: 538 / 1200,
    edge: 420,
    quality: 88,
  },
  {
    src: "hero/fba.jpg",
    out: "window-fba.jpg",
    /* The Film Business Accelerator sign-in, whole.

       This one is NOT cropped, and that is the point: the source is already a
       full browser viewport at 1700×1012 (≈1.68, the shape of a real window),
       with nothing running off any edge — the mark top left, the form centred
       in the cream panel, the bilingual lockup on the still from set, the
       Film Commission footer. Trimming it to make the type bigger would cut
       the nav or the footer and turn a complete page into a fragment, which
       is exactly what the hero's window used to look like.

       It also survives the size it is actually drawn at better than anything
       else in the repository: at a 324px column "Sign in", the two fields,
       the orange button and the whole Film Business Accelerator lockup all
       still read. */
    box: { x: 0, y: 0, w: 1700 },
    ar: 1700 / 1012,
    /* 1120 is 2.5× the 450px the window is drawn at on the widest desktop
       this composition is capped at. It was 1400, which bought nothing at any
       size and is the one hero artifact that is preloaded — so its weight is
       paid before anything else on the page. */
    edge: 1120,
    quality: 86,
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
    /* The mark is three bands of ink: the Arabic wordmark (y 278-559 under
       its madda at 201-257), the latin "monsha'at" (596-736), and then the
       two-line descriptor from 765 down, which is illegible at chip size and
       is not part of the mark.

       This box takes the first two whole and stops 25px short of the third.
       It used to end at 717, which is 19px INSIDE the latin band — the reason
       "monsha'at" was sitting on the floor of its chip with its feet cut off.
       If this logo is ever replaced, re-measure the bands before touching
       these numbers rather than nudging the height until it looks right. */
    box: { x: 53, y: 198, w: 974, h: 542 },
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

  /* the phone's copy of the same crop — never a different picture, only a
     smaller one, so art direction here can change no composition */
  if (!tile.small) continue;
  const sm = resolve(OUT, tile.out.replace(/\.jpg$/, "@sm.jpg"));
  copyFileSync(dst, sm);
  sips([long, String(tile.small), sm]);
  sips(["-s", "format", "jpeg", "-s", "formatOptions", "74", sm, "--out", sm]);
  const { w: sw, h: sh } = size(sm);
  console.log(
    `${tile.out.replace(/\.jpg$/, "@sm.jpg").padEnd(14)} ${fw}×${fh} → ${sw}×${sh}  ` +
      `${(statSync(sm).size / 1024).toFixed(0)}KB`,
  );
}
