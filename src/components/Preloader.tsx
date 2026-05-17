"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const BLOBS = [
  {
    gradient: "radial-gradient(circle, #6B1FA8 0%, #2D0054 60%, transparent 100%)",
    xKeys: ["-28vw", "8vw", "-18vw", "-28vw"],
    yKeys: ["-22vh", "14vh", "-6vh", "-22vh"],
    size: "78vmax",
    duration: 20,
    delay: 0,
    opacity: 0.72,
  },
  {
    gradient: "radial-gradient(circle, #1A56DB 0%, #001B44 55%, transparent 100%)",
    xKeys: ["22vw", "-12vw", "32vw", "22vw"],
    yKeys: ["18vh", "-22vh", "6vh", "18vh"],
    size: "85vmax",
    duration: 25,
    delay: 2.5,
    opacity: 0.65,
  },
  {
    gradient: "radial-gradient(circle, #E91E63 0%, #880E4F 50%, transparent 100%)",
    xKeys: ["6vw", "-24vw", "16vw", "6vw"],
    yKeys: ["-18vh", "22vh", "-28vh", "-18vh"],
    size: "52vmax",
    duration: 16,
    delay: 1,
    opacity: 0.55,
  },
];

type Stage = "draw" | "glow" | "exit";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState<Stage>("draw");

  /*
   * Motion value drives the feathered RTL mask on every frame.
   * Using useTransform avoids gradient-string interpolation in Framer Motion,
   * which is unreliable for complex multi-stop gradients.
   */
  const drawProgress = useMotionValue(0);

  /*
   * "to right" direction: pen starts at the left (W) and sweeps right.
   * p <= 0 → fully transparent (hidden before draw delay fires).
   * p = 1  → 92 % solid black + 8 % soft feather on the right trailing edge.
   */
  const maskImage = useTransform(drawProgress, (p) => {
    if (p <= 0) return "linear-gradient(to right, transparent 0%, transparent 100%)";
    const pct = p * 92;
    return `linear-gradient(to right, black 0%, black ${pct.toFixed(1)}%, rgba(0,0,0,0.4) ${(pct + 4).toFixed(1)}%, transparent ${(pct + 8).toFixed(1)}%, transparent 100%)`;
  });

  /* 5 px → 0 px vertical shift simulates pen pressure during the stroke */
  const textY = useTransform(drawProgress, [0, 1], [5, 0]);

  useEffect(() => {
    const shown = sessionStorage.getItem("portfolio-preloader-shown");

    if (shown) {
      document.body.style.overflow = "";
      setVisible(false);
      const t = setTimeout(onComplete, 60);
      return () => clearTimeout(t);
    }

    document.body.style.overflow = "hidden";

    /* Organic pen-speed curve: slow start, fast mid, slow land */
    const drawControls = animate(drawProgress, 1, {
      duration: 2.2,
      ease: [0.45, 0, 0.55, 1],
      delay: 0.35,
    });

    /* 2.4 s → text fully revealed, radiance pulse begins */
    const t1 = setTimeout(() => setStage("glow"), 2400);
    /* 2.8 s → curtain slides up revealing the page */
    const t2 = setTimeout(() => setStage("exit"), 2800);
    /* 3.3 s → release scroll & signal content reveal */
    const t3 = setTimeout(() => {
      document.body.style.overflow = "";
      sessionStorage.setItem("portfolio-preloader-shown", "true");
      onComplete();
    }, 3300);
    /* 4.2 s → remove DOM node */
    const t4 = setTimeout(() => setVisible(false), 4200);

    return () => {
      drawControls.stop();
      [t1, t2, t3, t4].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, [onComplete, drawProgress]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: stage === "exit" ? "-100%" : 0 }}
      transition={
        stage === "exit"
          ? { duration: 0.95, ease: [0.77, 0, 0.175, 1] }
          : { duration: 0 }
      }
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#060010",
      }}
    >
      {/* Animated mesh-gradient blobs */}
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          animate={{ x: blob.xKeys, y: blob.yKeys }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blob.delay,
            times: [0, 0.33, 0.66, 1],
          }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: blob.size,
            height: blob.size,
            marginTop: `calc(-${blob.size} / 2)`,
            marginLeft: `calc(-${blob.size} / 2)`,
            borderRadius: "50%",
            background: blob.gradient,
            filter: "blur(90px)",
            opacity: blob.opacity,
            willChange: "transform",
          }}
        />
      ))}

      {/* Grain texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/*
       * "Welcome to my world" — outer wrapper handles:
       *   draw stage  → no glow, normal state
       *   glow stage  → single pulse: scale + drop-shadow + color drift
       *   exit stage  → opacity fades at 0.8× curtain speed (parallax depth)
       */}
      <motion.div
        animate={
          stage === "exit"
            ? { opacity: 0 }
            : stage === "glow"
            ? {
                scale: [1, 1.03, 1.015],
                filter: [
                  "drop-shadow(0 0 0px rgba(255,255,255,0))",
                  "drop-shadow(0 0 28px rgba(255,255,255,0.72)) drop-shadow(0 0 72px rgba(210,150,255,0.48))",
                  "drop-shadow(0 0 18px rgba(255,255,255,0.48)) drop-shadow(0 0 44px rgba(190,130,255,0.3))",
                ],
              }
            : {
                scale: 1,
                filter: "drop-shadow(0 0 0px rgba(255,255,255,0))",
              }
        }
        transition={
          stage === "exit"
            ? { duration: 0.76, ease: [0.77, 0, 0.175, 1] }
            : stage === "glow"
            ? { duration: 0.84, ease: "easeInOut" }
            : {}
        }
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* Radiance bloom — blurred colour field pulsing beneath the text */}
        <motion.div
          animate={
            stage === "glow" || stage === "exit"
              ? {
                  opacity: [0, 0.9, 0.55],
                  filter: ["blur(0px)", "blur(20px)", "blur(12px)"],
                  scale: [0.85, 1.12, 1.0],
                }
              : { opacity: 0, filter: "blur(0px)", scale: 0.85 }
          }
          transition={
            stage === "glow" || stage === "exit"
              ? { duration: 0.9, ease: "easeOut" }
              : {}
          }
          style={{
            position: "absolute",
            inset: "-28px",
            background:
              "radial-gradient(ellipse at center, rgba(195,130,255,0.75) 0%, rgba(90,50,200,0.4) 45%, transparent 72%)",
            pointerEvents: "none",
            zIndex: 0,
            borderRadius: "50%",
          }}
        />

        {/*
         * Live mask-image driven by drawProgress motion value.
         * Feathered LTR reveal: pen writes left (W) → right (d).
         * textY provides a 5 px pen-pressure drop that resolves to 0.
         */}
        <motion.div
          style={{
            maskImage,
            WebkitMaskImage: maskImage,
            y: textY,
          }}
        >
          {/*
           * SVG <text> with Dancing Script — the font is loaded globally so
           * the browser resolves it in the SVG context.
           * fill="currentColor" lets the parent motion.svg animate the colour.
           * Color drifts: #FFFFFF → faint lavender #EDE8FF on glow.
           */}
          <motion.svg
            animate={{ color: stage === "draw" ? "#FFFFFF" : "#EDE8FF" }}
            transition={{ duration: 0.84, ease: "easeInOut" }}
            viewBox="0 0 820 120"
            style={{
              display: "block",
              width: "min(92vw, 820px)",
              height: "auto",
              overflow: "visible",
            }}
            aria-label="Welcome to my world"
          >
            <text
              x="410"
              y="88"
              textAnchor="middle"
              fontFamily="'Dancing Script', cursive"
              fontWeight="700"
              fontSize="82"
              fill="currentColor"
            >
              Welcome to my world
            </text>
          </motion.svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
