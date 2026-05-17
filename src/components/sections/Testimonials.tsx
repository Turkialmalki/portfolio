"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const testimonials = [
  {
    quote:
      "Turki doesn't just build interfaces — he crafts experiences. His ability to balance aesthetic precision with technical depth is genuinely rare. Our product engagement metrics jumped 60% after his redesign.",
    name: "Sarah Chen",
    title: "CPO at Meridian Labs",
    index: "01",
  },
  {
    quote:
      "Working with Turki was transformative for our brand. He understood our vision before we could fully articulate it, then elevated it beyond what we imagined. The attention to detail in every micro-interaction was extraordinary.",
    name: "Marcus Williams",
    title: "Founder of Solstice",
    index: "02",
  },
  {
    quote:
      "The best creative developer I've worked with in 15 years of building products. Turki moves fast, thinks deeply, and ships work that makes competitors uncomfortable.",
    name: "Priya Nair",
    title: "Head of Design at Studio Eleven",
    index: "03",
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  const next = () => setActive((p) => (p + 1) % testimonials.length);
  const prev = () => setActive((p) => (p - 1 + testimonials.length) % testimonials.length);

  return (
    <section
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-44"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-350 mx-auto">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-gray-accent text-[10px] tracking-[0.25em] uppercase font-light mb-20 md:mb-28"
        >
          Testimonials
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-20 lg:gap-32 items-start">
          {/* Left: heading + navigation */}
          <div>
            <div className="clip-text-reveal mb-16">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: EASE }}
                className="text-white font-bold leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
              >
                What people say.
              </motion.h2>
            </div>

            {/* Counter + nav */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6"
            >
              <button
                onClick={prev}
                className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-300 text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%" }}
                data-cursor-hover
              >
                ←
              </button>

              <span className="text-gray-accent text-xs tracking-widest font-light editorial-num">
                {String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
              </span>

              <button
                onClick={next}
                className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-300 text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%" }}
                data-cursor-hover
              >
                →
              </button>
            </motion.div>

            {/* Dot indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="flex gap-1.5 mt-8"
            >
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i === active ? 20 : 4,
                    height: 4,
                    background: i === active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
                  }}
                  data-cursor-hover
                />
              ))}
            </motion.div>
          </div>

          {/* Right: open quote — no box, no border */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {/* Large open-quote mark */}
                <div
                  className="text-white/08 font-bold select-none leading-none mb-6"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "clamp(4rem, 8vw, 7rem)",
                    lineHeight: 0.8,
                    color: "rgba(255,255,255,0.07)",
                  }}
                  aria-hidden
                >
                  &ldquo;
                </div>

                {/* Quote text */}
                <p
                  className="text-white font-light leading-[1.75] mb-12"
                  style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", color: "rgba(255,255,255,0.75)" }}
                >
                  {testimonials[active].quote}
                </p>

                {/* Attribution — minimal, no avatar box */}
                <div className="flex items-center gap-5">
                  <div
                    className="w-px h-8"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  />
                  <div>
                    <p className="text-white text-sm font-medium tracking-wide">
                      {testimonials[active].name}
                    </p>
                    <p className="text-gray-accent text-xs font-light tracking-wide mt-0.5">
                      {testimonials[active].title}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
