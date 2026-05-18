"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Bump to force the preloader to show once to returning visitors
const SESSION_KEY = "portfolio-pl-v3";

// All timing in ms unless marked _S (seconds)
const PRE_DELAY_S = 0.18;   // brief pause before the pen lifts
const HOLD_MS     = 500;    // hold after all strokes land
const SLIDE_MS    = 800;    // curtain slides to -100vh
const REVEAL_MS   = 220;    // content reveal fires this far into the slide

// Apple cubic-bezier — used for every stroke animation
const APPLE_EASE: [number, number, number, number] = [0.45, 0, 0.55, 1];

type Stroke = {
  d: string;
  at: number;   // start offset in seconds (added to PRE_DELAY_S)
  dur: number;  // individual stroke duration in seconds
  dot?: true;   // degenerate zero-length path — use opacity only
};

// Arabic "مرحبا" strokes, right-to-left draw order
// Paths live inside <g transform="scale(1,-1) translate(0,-526)">
// viewBox: "-2233 -177 2184 880"
const STROKES: Stroke[] = [
  {
    d:   "M-202,22 C-299,32 -349,105.01170349121094 -349,189 C-349,279.2278137207031 -284,351 -197,351 C-101,351 -49,282 -49,199 C-49,87 -129,20 -270.5666198730469,10.96383285522461 C-485.8713073730469,-2.779020309448242 -658.30517578125,133.63600158691406 -703,350",
    at:  0,
    dur: 0.88,
  },
  {
    d:   "M-703,350 C-686,248 -678,176 -684,85 C-692,-61 -793,-147 -918,-147 C-941,-147 -962,-144 -984,-138",
    at:  0.16,
    dur: 0.52,
  },
  {
    d:   "M-1530,-91 C-1595,156 -1525,310 -1388,310 C-1315.687744140625,310 -1262.238037109375,272.46649169921875 -1199,197 C-1130.620849609375,115.39820098876953 -1077.489990234375,84 -1021.38720703125,84 C-950.3372802734375,84 -955,140 -1035,143 C-1160,147 -1340,0 -1567.0089111328125,0 C-1721.65283203125,0 -1803.455078125,97.49241638183594 -1819,263",
    at:  0.70,
    dur: 0.84,
  },
  {
    d:   "M-1819,263 C-1802,84 -1872,0 -1998.6746826171875,0 C-2103.025634765625,0 -2159.83447265625,93.25064086914062 -2183.973388671875,245.12478637695312 C-2207,390 -2224,549 -2233,703",
    at:  1.36,
    dur: 0.58,
  },
  // Degenerate single-point path (dot diacritic) — animated via opacity only
  {
    d:   "M-1967,-177 C-1967,-177 -1967,-177 -1967,-177",
    at:  1.44,
    dur: 0.18,
    dot: true,
  },
  {
    d:   "M-1776,628 C-1834,613 -1914,589 -1975,566",
    at:  1.68,
    dur: 0.24,
  },
  {
    d:   "M-1748,512 C-1807,497 -1888,473 -1948,450",
    at:  1.82,
    dur: 0.22,
  },
];

// Last stroke ends at PRE_DELAY_S + 1.82 + 0.22 = ~2.22s ≈ Apple 2.2s spec
const LAST_STROKE_END_S = PRE_DELAY_S + 1.82 + 0.22;
const SUBTEXT_DELAY_S   = PRE_DELAY_S + 1.55; // floats in as the final strokes land

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [sliding, setSliding] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Skip on revisits within the same browser session
    if (sessionStorage.getItem(SESSION_KEY)) {
      document.body.style.overflow = "";
      setVisible(false);
      setTimeout(onComplete, 60);
      return;
    }

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";

    if (isReduced) {
      setReduced(true);
      setDrawing(true); // show all strokes instantly
      const ta = setTimeout(() => {
        document.body.style.overflow = "";
        sessionStorage.setItem(SESSION_KEY, "1");
        onComplete();
      }, 700);
      const tb = setTimeout(() => setVisible(false), 950);
      return () => {
        clearTimeout(ta);
        clearTimeout(tb);
        document.body.style.overflow = "";
      };
    }

    // Kick off the draw after the brief pre-delay
    const t0 = setTimeout(() => setDrawing(true), PRE_DELAY_S * 1000);

    const exitAt = LAST_STROKE_END_S * 1000 + HOLD_MS;
    const t1 = setTimeout(() => setSliding(true), exitAt);
    const t2 = setTimeout(() => {
      document.body.style.overflow = "";
      sessionStorage.setItem(SESSION_KEY, "1");
      onComplete();
    }, exitAt + REVEAL_MS);
    const t3 = setTimeout(() => setVisible(false), exitAt + SLIDE_MS + 200);

    return () => {
      [t0, t1, t2, t3].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: sliding ? "-100vh" : 0 }}
      transition={
        sliding
          ? { duration: SLIDE_MS / 1000, ease: [0.76, 0, 0.24, 1] }
          : { duration: 0 }
      }
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        gap: "clamp(14px, 2.5vh, 28px)",
      }}
      aria-hidden="true"
    >
      {/* Arabic مرحبا — strokes drawn via Framer Motion pathLength */}
      <svg
        viewBox="-2233 -177 2184 880"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          width: "clamp(240px, 68vw, 700px)",
          height: "auto",
          overflow: "visible",
        }}
        role="img"
        aria-label="مرحبا"
      >
        {/* scale(1,-1) flips from math-coords (y↑) to SVG-coords (y↓) */}
        <g transform="scale(1, -1) translate(0, -526)">
          {STROKES.map((s, i) =>
            s.dot ? (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke="#1D1D1F"
                strokeWidth={60}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={drawing ? { opacity: 1 } : { opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { delay: PRE_DELAY_S + s.at, duration: s.dur }
                }
              />
            ) : (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke="#1D1D1F"
                strokeWidth={60}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  drawing
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        pathLength: {
                          delay:    PRE_DELAY_S + s.at,
                          duration: s.dur,
                          ease:     APPLE_EASE,
                        },
                        opacity: {
                          delay:    PRE_DELAY_S + s.at,
                          duration: 0.01,
                        },
                      }
                }
              />
            )
          )}
        </g>
      </svg>

      {/* San Francisco system font — fades in as the last strokes land */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={drawing ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                delay:    SUBTEXT_DELAY_S,
                duration: 0.65,
                ease:     [0.25, 0.46, 0.45, 0.94],
              }
        }
        style={{
          fontFamily:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize:    "clamp(12px, 1.5vw, 16px)",
          fontWeight:  400,
          letterSpacing: "0.08em",
          color:       "#6E6E73",
          margin:      0,
          userSelect:  "none",
        }}
      >
      </motion.p>
    </motion.div>
  );
}
