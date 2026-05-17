"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    quote:
      "Turki doesn't just build interfaces — he crafts experiences. His ability to balance aesthetic precision with technical depth is genuinely rare. Our product engagement metrics jumped 60% after his redesign.",
    name: "Sarah Chen",
    title: "CPO at Meridian Labs",
    initial: "SC",
  },
  {
    quote:
      "Working with Turki was transformative for our brand. He understood our vision before we could fully articulate it, then elevated it beyond what we imagined. The attention to detail in every micro-interaction was extraordinary.",
    name: "Marcus Williams",
    title: "Founder of Solstice",
    initial: "MW",
  },
  {
    quote:
      "The best creative developer I've worked with in 15 years of building products. Turki moves fast, thinks deeply, and ships work that makes competitors uncomfortable.",
    name: "Priya Nair",
    title: "Head of Design at Studio Eleven",
    initial: "PN",
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
      className="px-6 md:px-10 lg:px-16 py-28 md:py-40"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-16 md:mb-20"
        >
          Testimonials
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24 items-start">
          {/* Left */}
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-bold leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              What people say.
            </motion.h2>
          </div>

          {/* Right: Testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 md:p-12 rounded-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              >
                {/* Quote mark */}
                <div
                  className="text-5xl text-white/10 font-bold leading-none mb-6 select-none"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  &ldquo;
                </div>

                <p className="text-white/80 text-base md:text-xl leading-relaxed mb-8 font-light">
                  {testimonials[active].quote}
                </p>

                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {testimonials[active].initial}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {testimonials[active].name}
                    </p>
                    <p className="text-[#A1A1AA] text-xs">
                      {testimonials[active].title}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                data-cursor-hover
              >
                ←
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 24 : 6,
                      height: 6,
                      background: i === active ? "#ffffff" : "rgba(255,255,255,0.2)",
                    }}
                    data-cursor-hover
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                data-cursor-hover
              >
                →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
