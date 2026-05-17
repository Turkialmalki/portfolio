"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.16, 1, 0.3, 1];
const EASE_IN_OUT: Bezier = [0.76, 0, 0.24, 1];

const reveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
  show: (i: number) => ({
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: {
      delay: i * 0.12,
      duration: 1,
      ease: EASE_OUT,
    },
  }),
};

const fadeUp: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.5 + i * 0.1,
      duration: 0.8,
      ease: EASE_OUT,
    },
  }),
};

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden px-6 md:px-10 lg:px-16 pt-24 pb-16"
    >
      {/* Background radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 60%)",
        }}
      />

      {/* Parallax ambient */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 65%)",
          translateX: "-50%",
          translateY: "-50%",
          x: mousePos.x * 2,
          y: mousePos.y * 2,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />

      <div className="relative max-w-[1400px] mx-auto w-full">
        {/* Available badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 mb-12 md:mb-16"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#A1A1AA] text-xs tracking-widest uppercase">
            Available for work
          </span>
        </motion.div>

        {/* Main heading */}
        <div className="mb-6 md:mb-8">
          <motion.h1
            custom={0}
            initial="hidden"
            animate="show"
            variants={reveal}
            className="text-white font-bold leading-[0.88] tracking-tight"
            style={{ fontSize: "clamp(4.5rem, 13vw, 13rem)", display: "block" }}
          >
            TURKI
          </motion.h1>
          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={reveal}
            className="text-white font-bold leading-[0.88] tracking-tight"
            style={{ fontSize: "clamp(4.5rem, 13vw, 13rem)", display: "block" }}
          >
            AL-MALKI
          </motion.h1>
        </div>

        {/* Role and description */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-0 mt-10 md:mt-16">
          <div>
            <motion.p
              custom={0}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-[#A1A1AA] text-base md:text-lg tracking-wide mb-1"
            >
              Creative Developer & Product Designer
            </motion.p>
            <motion.p
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-white/60 text-sm md:text-base max-w-md leading-relaxed"
            >
              Crafting digital experiences at the intersection
              <br className="hidden md:block" /> of design and technology.
            </motion.p>
          </div>

          <motion.div
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex items-center gap-6"
          >
            <MagneticButton
              onClick={() => {
                document
                  .querySelector("#projects")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Work
            </MagneticButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-0 right-6 md:right-0 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-px h-12 md:h-16 bg-gradient-to-b from-transparent to-white/30"
          />
          <span
            className="text-[#A1A1AA] text-[10px] tracking-widest uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            Scroll
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function MagneticButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
    setOffset({ x, y });
  };

  const onMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="group relative inline-flex items-center gap-3 px-7 py-3.5 text-white text-sm tracking-wide rounded-full overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.2)" }}
      whileHover={{ borderColor: "rgba(255,255,255,0.5)" }}
      data-cursor-hover
    >
      <motion.span
        className="absolute inset-0 bg-white rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 2.5, opacity: 0.07 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      />
      <span className="relative z-10">{children}</span>
      <motion.span
        className="relative z-10 text-[#A1A1AA]"
        whileHover={{ x: 3, color: "#ffffff" }}
        transition={{ duration: 0.3 }}
      >
        ↗
      </motion.span>
    </motion.button>
  );
}
