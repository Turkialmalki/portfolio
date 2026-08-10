"use client";

import { useEffect, useRef } from "react";
import type { Lang } from "./CareerObjects";
import { PLATES, PLATE_ORDER, type SceneId } from "./mobilePlates";

/* ═══════════════════════════════════════════════════════════════════════
   THE PHONE'S RENDERER.

   SAME STORY. SAME ART DIRECTION. DIFFERENT RENDERER.

   Every service below the hero shows the same visual transformation the
   laptop shows — because the file it plays was BAKED FROM THAT EXACT FILM
   (`scripts/render-mobile-scenes.mjs` drives the real desktop scene and
   screenshots it frame by frame). What the phone does not do is rebuild that
   film out of live DOM: no six browser mockups, no LinkedIn surfaces, no
   20×14 data table rendered twice, no DashboardCard, no SVG filter graph, no
   masks, no clip-path scrubbed per frame.

   One <video>. One hardware decode. Nothing animated per scroll pixel.

   WHAT STAYS REAL DOM
   ───────────────────
   The headline, the description, the price, the CTA and the alt text. None
   of those are ever baked into a picture — they are selectable,
   translatable, searchable and reachable by a screen reader, and the plate
   carries an `aria-label` describing the transformation it shows.

   THE PLAYBACK CONTRACT
   ─────────────────────
   · ONE animation plays at a time, enforced here rather than hoped for.
   · It starts when a sentinel at the TOP EDGE OF THE PLATE crosses ~68% of
     the viewport — not when the ~100vh section technically intersects, which
     is what made these scenes finish off-screen and read as static.
   · It plays ONCE, never loops, and holds its final frame.
   · `preload="none"` until approached, so a visitor who never scrolls past
     the hero downloads no video at all — and only the NEXT scene's file is
     fetched ahead, never all five.
   · The poster is the RESOLVED state, so a plate that never plays — data
     saver, low power mode, reduced motion, a decode failure — still shows
     the outcome the service sells rather than the problem it fixes.
   · Nothing here is in the hit test: the plate and the video are
     `pointer-events: none` in the stylesheet, so a decorative surface can
     never be between a thumb and a buy button.
   ═══════════════════════════════════════════════════════════════════════ */

/* NOT `/services/…`. A folder in `public/` becomes a real directory in the
   static export, and a directory named `services` shadows the `/services`
   ROUTE: the host resolves /services to the directory (301 to /services/,
   then 404 for a missing index.html) instead of to services.html. Verified
   against the built export before it could reach production. */
const srcOf = (id: SceneId, lang: Lang) => `/scenes/${id}-${lang}`;

/* ── the one-at-a-time registry ──
   A module-level current-player. Starting a plate stops whatever was
   playing, so two decoders are never live at once however fast the page is
   flung. */
let playing: HTMLVideoElement | null = null;

function playOnly(v: HTMLVideoElement) {
  if (playing && playing !== v) playing.pause();
  playing = v;
  /* A muted, playsInline, gesture-free play() can still be rejected (low
     power mode, data saver). The poster is already the resolved state, so a
     rejection degrades to a still of the outcome — never to a blank box. */
  void v.play().catch(() => {});
}

/**
 * One service's pre-rendered visual.
 *
 * The plate's aspect ratio comes from `PLATES`, which is the same table the
 * bake script sizes the file from — so the box is reserved at exactly the
 * file's shape before a byte of it arrives. No letterboxing, no crop, and no
 * reflow when it decodes.
 */
export function MobilePlate({
  id,
  lang,
  label,
  reduced,
}: {
  id: SceneId;
  lang: Lang;
  /** what the transformation shows, for anyone who cannot see it */
  label: string;
  reduced: boolean;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const stem = srcOf(id, lang);
  const { w, h } = PLATES[id];

  useEffect(() => {
    const v = vidRef.current;
    const mark = markRef.current;
    /* Reduced motion gets the poster and nothing else: no fetch, no decoder,
       no observer. The poster is the resolved state, so the scene still
       says what it is for. */
    if (!v || !mark || reduced) return;

    let started = false;

    /* ~68% of the viewport. The marker is at the plate's own top edge, so
       this fires when the visual is genuinely entering the frame — the
       animation is watched rather than merely triggered. */
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        playOnly(v);
        prefetchNext(id);
      },
      { rootMargin: "0px 0px -32% 0px" },
    );
    io.observe(mark);

    /* Well behind: hand the decoder back. The poster keeps the plate looking
       identical, and a visitor scrolling back up sees the resolved state,
       which is where the animation left it anyway. */
    const away = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting || !started) return;
        v.pause();
        if (playing === v) playing = null;
      },
      { rootMargin: "150% 0px" },
    );
    away.observe(v);

    return () => {
      io.disconnect();
      away.disconnect();
      if (playing === v) playing = null;
    };
  }, [id, lang, reduced]);

  return (
    <div className="sv-plate" style={{ ["--ar" as string]: `${w} / ${h}` }}>
      <span ref={markRef} className="sv-trigger" aria-hidden />
      <video
        ref={vidRef}
        className="sv-plate-v"
        data-plate={id}
        /* Frame 0 while it waits, so the hand-off from poster to playback is
           invisible — and the resolved frame instead when motion is not
           wanted, because nothing will ever play to reach it. */
        poster={`${stem}${reduced ? "-still" : ""}.webp`}
        aria-label={label}
        role="img"
        width={w}
        height={h}
        playsInline
        muted
        // no `loop`, no `autoPlay`: playback is granted by the sentinel above
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src={`${stem}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}

/**
 * The next service's file, and only the next one.
 *
 * Fetching all five up front is five downloads a visitor may never reach;
 * fetching none means every plate starts by waiting. One ahead is the whole
 * optimisation — and it is done by promoting that plate's own `preload`, so
 * the bytes land in the media cache the element will actually read from.
 */
function prefetchNext(id: SceneId) {
  const next = PLATE_ORDER[PLATE_ORDER.indexOf(id) + 1];
  if (!next) return;
  const el = document.querySelector<HTMLVideoElement>(`video[data-plate="${next}"]`);
  if (!el || el.preload !== "none") return;
  el.preload = "auto";
  /* Raising `preload` after resource selection has already concluded with
     "none" does not always restart the fetch on its own; `load()` re-runs it.
     Safe here because this element has never played — it is still at frame
     zero, which is exactly where load() leaves it. */
  el.load();
}

export type { SceneId };
