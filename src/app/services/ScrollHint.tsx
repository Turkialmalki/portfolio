"use client";

import { useEffect, useRef } from "react";
import type { Lang } from "@/data/careerServices";

/* ═══════════════════════════════════════════════════════════════════════
   FIRST-LOAD GUIDANCE — one sentence, one arrow, then gone.

   The opening of /services is a picture, not a page: a crushed CV and the
   wreckage of a career, with nothing that looks like a control. A visitor who
   does not scroll never sees that it restores itself. This is the only thing
   on the page that tells them, and it earns its place by disappearing the
   instant they demonstrate they knew.

   THREE RULES, all of them about cost:

   1. IT IS CSS. One keyframe on one element — no rAF, no spring, no timer, no
      motion value. The compositor runs it and the main thread never hears
      about it, which is the only kind of permanent animation a phone should
      be asked to carry while a canvas is decoding beside it.
   2. IT LISTENS PASSIVELY, ONCE. Three passive listeners that remove
      themselves on the first sign of intent — a wheel, a touch drag, or 40px
      of scroll from any source (keyboard, trackpad, a restored position).
   3. IT NEVER COMES BACK. Dismissal is a one-way latch for the life of the
      page. Guidance that reappears is not guidance, it is a nag.

   It is `aria-hidden`: instructional, not interactive, and a screen reader
   user is not being told anything they need — the page scrolls the way every
   page scrolls.
   ═══════════════════════════════════════════════════════════════════════ */

const COPY = {
  scroll: {
    ar: "مرّر للأسفل لاكتشاف الخدمات",
    en: "Scroll to explore",
  },
  swipe: {
    ar: "مرّر لاكتشاف الخدمات",
    en: "Swipe to explore",
  },
};

/** Enough movement to be a decision, not a stray pixel of overscroll. */
const INTENT_PX = 40;

export default function ScrollHint({
  lang,
  variant,
}: {
  lang: Lang;
  /** `swipe` on the phone build, `scroll` on the film. */
  variant: "scroll" | "swipe";
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* Dismissal writes one class on one element rather than setting state.
     That is not a micro-optimisation: the dismissal happens during the first
     scroll of the page, and a React render at that moment competes with the
     scene the visitor just started. A className write is a style recalc on a
     two-node subtree, and it happens in the same frame as the gesture. */
  useEffect(() => {
    let done = false;
    /* Function declarations rather than consts: `dismiss` is called on the
       already-scrolled path below, BEFORE the listeners exist, and it calls
       `stop` — which as a const would still be in its temporal dead zone. */
    function dismiss() {
      if (done) return;
      done = true;
      ref.current?.classList.add("shint-off");
      stop();
    }
    function onScroll() {
      if (window.scrollY > INTENT_PX) dismiss();
    }
    function stop() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchmove", dismiss);
    }

    // A reload lands mid-page often enough (bfcache, restored position) that
    // the hint must check where it actually is before offering to help.
    if (window.scrollY > INTENT_PX) {
      dismiss();
      return;
    }

    const opts = { passive: true } as const;
    window.addEventListener("scroll", onScroll, opts);
    // Wheel and touch fire before the page has moved at all, so on both
    // devices the hint is already fading while the first frame scrolls.
    window.addEventListener("wheel", dismiss, opts);
    window.addEventListener("touchmove", dismiss, opts);
    return stop;
  }, []);

  return (
    <div ref={ref} className="shint" aria-hidden>
      <span className="shint-t">{COPY[variant][lang]}</span>
      <svg className="shint-a" width="16" height="22" viewBox="0 0 16 22" fill="none">
        <path
          d="M8 1.5v17M2.5 13.5 8 19.5l5.5-6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <style>{`
        .shint {
          position: fixed; z-index: 39; inset-inline: 0;
          /* clears the site's own fixed navigation pill in both builds */
          bottom: calc(104px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          pointer-events: none; color: var(--text-muted, #8b8b8b);
          /* the entrance: it should not be there before the page is */
          opacity: 0; animation: shint-in 700ms ease 500ms forwards;
        }
        .shint-t {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; text-align: center;
        }
        .shint-a {
          display: block; opacity: 0.75;
          animation: shint-fall 1600ms cubic-bezier(0.4, 0, 0.3, 1) infinite;
        }

        /* ── leaving ──
           Fast, and then genuinely absent: visibility is switched after the
           fade so the element cannot be hit-tested, read, or animated for the
           rest of the session. The forwards-filled entrance is overridden by
           "animation: none", which is what makes the fade-out win. */
        .shint-off {
          animation: none; opacity: 0; visibility: hidden;
          transition: opacity 240ms ease, visibility 0s linear 240ms;
        }
        .shint-off .shint-a { animation: none; }

        @keyframes shint-in { to { opacity: 1; } }
        /* 8px down, a slight fade at the bottom of the fall, back to rest.
           Deliberately not a bounce: it reads as a suggestion, not a demand. */
        @keyframes shint-fall {
          0%, 100% { transform: translateY(0); opacity: 0.75; }
          45% { transform: translateY(8px); opacity: 0.35; }
          70% { transform: translateY(0); opacity: 0.75; }
        }

        /* Reduced motion keeps the message and drops the movement — the hint
           is the words; the arrow only makes them quicker to read. */
        @media (prefers-reduced-motion: reduce) {
          .shint { opacity: 1; animation: none; }
          .shint-a { animation: none; }
          .shint-off { transition: none; }
        }

        [dir="rtl"] .shint-t { line-height: 1.7; letter-spacing: 0; }
        @media (max-width: 480px) { .shint-t { font-size: 10px; } }
      `}</style>
    </div>
  );
}
