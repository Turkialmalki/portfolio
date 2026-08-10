"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════
   ONE SCROLL LISTENER AND ONE rAF, FOR THE WHOLE PAGE.

   Every scrubbed scene subscribes here rather than installing its own
   listener, its own measurement and its own frame loop. What that buys:

   · ONE passive `scroll` listener. Passive means the browser never has to
     wait to find out whether we intend to preventDefault, so the scroll is
     never blocked by us — on touch that is the difference between a page that
     moves with the finger and one that stutters behind it.

   · GEOMETRY IS CACHED. `offsetTop` and `offsetHeight` are read on mount, on
     resize, and when a section re-enters the viewport — never inside the
     scroll handler. A handler that calls getBoundingClientRect() forces a
     synchronous layout on every scroll event, which is the single most
     common cause of a page that feels heavy under a thumb.

   · AT MOST ONE FRAME IS EVER OUTSTANDING. Several scroll events routinely
     fire between two repaints; they collapse into one render.

   ── THIS IS COALESCING, NOT SMOOTHING ──────────────────────────────────
   There is no lerp here. No spring, no easing over time, no damping, no
   "target vs current" pair. `render()` reads `window.scrollY` at the instant
   it runs and writes that value. The rAF exists only to pick the moment —
   once per repaint — at which the newest known scroll position is published.
   The paper is never a frame behind the finger, because there is no state
   between the two: progress is a pure function of where the page is now.

   · OFFSCREEN SECTIONS ARE SKIPPED. A section outside the viewport band has
     its subscription retained but is not evaluated, so a seven-scene page
     costs one section's worth of work per frame, not seven.
   ═══════════════════════════════════════════════════════════════════════ */

type Track = {
  el: HTMLElement;
  mv: MotionValue<number>;
  top: number;
  travel: number;
  /** inside the viewport band — the only tracks `render` evaluates */
  live: boolean;
};

const tracks = new Set<Track>();
let frame = 0;

function measure(t: Track) {
  // offsetTop walks offsetParents rather than forcing a full layout flush the
  // way getBoundingClientRect does, and this page's sections are all direct
  // children of a static <main>.
  let top = 0;
  let node: HTMLElement | null = t.el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  t.top = top;
  /* A pinned scene's progress runs from the moment its top reaches the top of
     the viewport to the moment its bottom does — i.e. across everything above
     the final viewport-height of it, which is the part that is pin. */
  t.travel = Math.max(1, t.el.offsetHeight - window.innerHeight);
}

function render() {
  frame = 0;
  const y = window.scrollY;
  for (const t of tracks) {
    if (!t.live) continue;
    const p = (y - t.top) / t.travel;
    t.mv.set(p < 0 ? 0 : p > 1 ? 1 : p);
  }
}

/** Publish the NEWEST scroll position on the next repaint. Never queues two. */
function schedule() {
  if (!frame) frame = requestAnimationFrame(render);
}

function remeasureAll() {
  for (const t of tracks) measure(t);
  schedule();
}

let attached = false;
function attach() {
  if (attached) return;
  attached = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasureAll, { passive: true });
}
function detach() {
  if (!attached || tracks.size) return;
  attached = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", remeasureAll);
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

/**
 * A section's own 0→1 scroll progress, as a MotionValue.
 *
 * `active` is how a scene says whether it is scrubbed at all. On a phone only
 * the hero is; every other scene passes `false`, gets a value parked at its
 * resting state, and installs nothing — no listener, no observer, no frame.
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): MotionValue<number> {
  const mv = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) {
      /* Not scrubbed: park the value at the end of the timeline. Anything that
         still reads it — a shared child written for the film — renders its
         settled state rather than its entrance state. */
      mv.set(1);
      return;
    }

    const track: Track = { el, mv, top: 0, travel: 1, live: false };
    measure(track);
    tracks.add(track);
    attach();

    /* The band is generous on purpose: a scene must already be at the right
       frame BEFORE it scrolls into view, or the first thing the visitor sees
       is a jump to the correct position. */
    const io = new IntersectionObserver(
      ([e]) => {
        track.live = e.isIntersecting;
        if (track.live) {
          measure(track);
          schedule();
        }
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(el);

    schedule();

    return () => {
      io.disconnect();
      tracks.delete(track);
      detach();
    };
  }, [ref, active, mv]);

  return mv;
}

/**
 * Adds `sv-in` to a SECTION exactly once, triggered by a small SENTINEL that
 * sits immediately before that section's visual.
 *
 * ── WHY A SENTINEL AND NOT THE SECTION ─────────────────────────────────────
 * These sections are 90–110vh tall. Observing the section itself fires the
 * moment its top edge clears the bottom of the viewport — which, for a scene
 * whose visual sits in its middle, is most of a screen-height BEFORE the
 * visual is anywhere near the eye. The 600–1000ms animation then runs and
 * finishes against an off-screen element, and by the time the visitor
 * actually arrives they are looking at a still frame that never moved. That
 * is the "some mobile sections appear static" bug, and it is a timing bug,
 * not a missing animation.
 *
 * So the trigger is a zero-height marker rendered directly above the visual,
 * and the threshold is a bottom rootMargin of -32%: it fires when the marker
 * has crossed ~68% of the viewport height, i.e. when the visual below it is
 * genuinely entering the frame. The animation then plays where it can be
 * seen, finishes, and holds its final state forever.
 *
 * `sentinel` is optional: pass nothing and the section observes itself, which
 * is right for a section with no separate visual.
 */
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  onReveal?: () => void,
  sentinel?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const watch = sentinel?.current ?? el;
    /* -32% bottom margin => "has this crossed 68% of the viewport?" A section
       already on screen at load (a deep link, a restored scroll position)
       satisfies it on the observer's first callback, so it reveals at once
       rather than waiting for a scroll that may never come. */
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("sv-in");
        onReveal?.();
        io.disconnect();
      },
      { rootMargin: "0px 0px -32% 0px" },
    );
    io.observe(watch);
    return () => io.disconnect();
    // `onReveal` is a fire-once analytics ping; re-running on identity change
    // would re-observe a section that has already been counted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, sentinel]);
}
