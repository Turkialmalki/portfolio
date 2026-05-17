"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Easily adjustable config
const ANIMATION_DURATION = 2.5; // seconds for the full draw-in + hold phase
const TEXT_COLOR = "#FFFFFF";
const PRELOADER_BG = "#000000";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const shown = sessionStorage.getItem("portfolio-preloader-shown");

    if (shown) {
      // Return visit — exit instantly, reveal content quickly
      document.body.style.overflow = "";
      setVisible(false);
      const t = setTimeout(onComplete, 60);
      return () => clearTimeout(t);
    }

    // First visit — full cinematic sequence
    document.body.style.overflow = "hidden";

    // Start exit: draw-in takes ~1.8s, hold ~0.7s, then fade out
    const exitAt = ANIMATION_DURATION * 1000 + 700;
    const doneAt = exitAt + 900; // exit animation is 0.9s

    const exitTimer = setTimeout(() => setVisible(false), exitAt);
    const doneTimer = setTimeout(() => {
      document.body.style.overflow = "";
      sessionStorage.setItem("portfolio-preloader-shown", "true");
      onComplete();
    }, doneAt);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          exit={{
            opacity: 0,
            transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: PRELOADER_BG,
          }}
        >
          {/* Ambient radial glow — breathes in slowly */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 1 }}
            transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              width: 560,
              height: 560,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* "Hello" — blur-in container then clip-path draw-in */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.15,
            }}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <motion.span
              initial={{ clipPath: "inset(0 102% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{
                duration: ANIMATION_DURATION * 0.7,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3,
              }}
              style={{
                fontFamily: "var(--font-dancing-script)",
                fontSize: "clamp(5rem, 16vw, 13rem)",
                fontWeight: 700,
                color: TEXT_COLOR,
                userSelect: "none",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                display: "block",
              }}
              aria-label="Hello"
            >
              Hello
            </motion.span>
          </motion.div>

          {/* Thin horizontal line that draws beneath the text */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.15 }}
            transition={{
              duration: 1.4,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.6,
            }}
            style={{
              position: "absolute",
              bottom: "calc(50% - clamp(3rem, 10vw, 8rem))",
              left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(5rem, 16vw, 13rem)",
              height: 1,
              background: TEXT_COLOR,
              transformOrigin: "left",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
