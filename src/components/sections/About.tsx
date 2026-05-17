"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const stats = [
  { value: "5+", label: "Years of\npractice" },
  { value: "40+", label: "Projects\nshipped" },
  { value: "15+", label: "Happy\nclients" },
  { value: "3", label: "Awards\nearned" },
];

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="about"
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-44"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-350 mx-auto">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-gray-accent text-[10px] tracking-[0.25em] uppercase font-light mb-20 md:mb-28"
        >
          About
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-20 lg:gap-32 items-start">
          {/* Left: editorial text */}
          <div>
            {/* Statement headlines */}
            <div className="mb-12 md:mb-16">
              <div className="clip-text-reveal mb-2">
                <motion.h2
                  initial={{ y: "100%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="text-white font-bold leading-none"
                  style={{ fontSize: "clamp(2.4rem, 5.5vw, 5rem)", letterSpacing: "-0.025em" }}
                >
                  Design meets code.
                </motion.h2>
              </div>
              <div className="clip-text-reveal">
                <motion.h2
                  initial={{ y: "100%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.09 }}
                  className="font-bold leading-none"
                  style={{
                    fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
                    letterSpacing: "-0.025em",
                    color: "#A1A1AA",
                    fontStyle: "italic",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                >
                  Vision meets craft.
                </motion.h2>
              </div>
            </div>

            {/* Bio */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              className="text-gray-accent text-base md:text-lg leading-[1.9] font-light mb-5 max-w-lg"
            >
              I&apos;m a creative developer and product designer with a passion for
              building digital experiences that feel both intuitive and remarkable.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.38, ease: EASE }}
              className="text-white/30 text-sm md:text-base leading-[1.9] font-light max-w-lg mb-14"
            >
              My approach combines systematic thinking with creative intuition —
              always asking &quot;why&quot; before &quot;how&quot;. From pixel-perfect interfaces to
              complex web applications, I bring the same level of care to every project.
            </motion.p>

            {/* CTA link */}
            <motion.a
              href="#projects"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-3 text-white text-sm font-light group"
              data-cursor-hover
            >
              <motion.span
                className="block h-px bg-white/40 group-hover:bg-white transition-colors duration-400"
                style={{ width: 32 }}
                whileHover={{ width: 48 }}
              />
              <span className="group-hover:text-white text-white/70 transition-colors duration-300 tracking-wide">
                View my work
              </span>
              <motion.span
                className="text-white/40 group-hover:text-white transition-colors duration-300"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </motion.a>
          </div>

          {/* Right: stats as open typography, no boxes */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-14 lg:gap-x-16 lg:gap-y-20 pt-2">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: EASE, delay: 0.35 + i * 0.1 }}
              >
                <p
                  className="text-white font-bold leading-none mb-3 editorial-num"
                  style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-gray-accent text-xs tracking-[0.15em] uppercase font-light leading-[1.8]"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom decorative line with location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center justify-between mt-24 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-white/20 text-xs tracking-widest font-light">
            Based in Riyadh, Saudi Arabia
          </span>
          <span className="text-white/20 text-xs tracking-widest font-light">
            Open to remote
          </span>
        </motion.div>
      </div>
    </section>
  );
}
