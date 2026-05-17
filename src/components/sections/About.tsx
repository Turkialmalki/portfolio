"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: "5+", label: "Years Experience" },
  { value: "40+", label: "Projects Shipped" },
  { value: "15+", label: "Happy Clients" },
  { value: "3", label: "Awards Won" },
];

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="about"
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-40"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-16 md:mb-20"
        >
          About
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Text content */}
          <div>
            <div className="overflow-hidden mb-8">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-white font-bold leading-tight"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
              >
                Design meets code.
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-8">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08,
                }}
                className="text-[#A1A1AA] font-bold leading-tight"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
              >
                Vision meets craft.
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-[#A1A1AA] text-base md:text-lg leading-relaxed mb-6"
            >
              I&apos;m a creative developer and product designer with a passion
              for building digital experiences that feel both intuitive and
              remarkable. I work at the intersection of design thinking and
              modern engineering.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/40 text-sm md:text-base leading-relaxed mb-12"
            >
              My approach combines systematic thinking with creative intuition —
              always asking &quot;why&quot; before &quot;how&quot;. From pixel-perfect interfaces to
              complex web applications, I bring the same level of care and craft
              to every project.
            </motion.p>

            <motion.a
              href="#projects"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#projects")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 text-white text-sm border-b border-white/30 pb-0.5 hover:border-white transition-colors duration-300 group"
              data-cursor-hover
            >
              View my work
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                →
              </span>
            </motion.a>
          </div>

          {/* Stats + visual */}
          <div className="flex flex-col gap-8">
            {/* Avatar placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Abstract visual */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255,255,255,0.04) 0%, transparent 50%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-white/10 font-bold"
                  style={{ fontSize: "clamp(6rem, 20vw, 16rem)", letterSpacing: "-0.05em" }}
                >
                  T
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
              />
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                  className="p-5 rounded-xl"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <p
                    className="text-white font-bold mb-1"
                    style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[#A1A1AA] text-xs tracking-wide">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
