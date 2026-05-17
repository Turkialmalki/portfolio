"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const fastExitRef = useRef(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("portfolio-preloader-shown");
    if (shown) {
      fastExitRef.current = true;
      setIsVisible(false);
      return;
    }

    // Lock scroll during preloader
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("portfolio-preloader-shown", "true");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      document.body.style.overflow = "";
      const delay = fastExitRef.current ? 0 : 900;
      const timer = setTimeout(onComplete, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
        >
          {/* Ambient glow behind text */}
          <motion.div
            className="absolute w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.span
            initial={{ opacity: 0, scale: 0.94, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 1.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.25,
            }}
            style={{
              fontFamily: "var(--font-great-vibes)",
              fontSize: "clamp(5rem, 15vw, 12rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              userSelect: "none",
              lineHeight: 1,
            }}
            aria-label="Hello"
          >
            Hello
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
