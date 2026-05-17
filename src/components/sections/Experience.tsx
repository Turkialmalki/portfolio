"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const experiences = [
  {
    period: "2023 — Present",
    role: "Senior Creative Developer",
    company: "Studio Eleven",
    type: "Full-time",
    description:
      "Lead the design and development of award-winning digital experiences for global brands. Drive creative direction across web, motion, and brand identity projects.",
  },
  {
    period: "2021 — 2023",
    role: "Product Designer",
    company: "Meridian Labs",
    type: "Full-time",
    description:
      "Shaped the product vision and UX strategy for a Series B fintech startup. Reduced user onboarding time by 40% through systematic design improvements.",
  },
  {
    period: "2020 — 2021",
    role: "UI/UX Designer",
    company: "Apex Creative Agency",
    type: "Contract",
    description:
      "Delivered pixel-perfect interfaces for 15+ client projects across e-commerce, SaaS, and mobile applications.",
  },
  {
    period: "2019 — 2020",
    role: "Frontend Developer",
    company: "Freelance",
    type: "Self-employed",
    description:
      "Built custom web experiences for independent clients while developing expertise in interaction design and animation engineering.",
  },
];

export default function Experience() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="experience"
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-44"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-350 mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-gray-accent text-[10px] tracking-[0.25em] uppercase font-light mb-20 md:mb-28"
        >
          Experience
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 lg:gap-32">

          {/* Left: sticky heading */}
          <div>
            <div className="clip-text-reveal lg:sticky lg:top-32">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: EASE }}
                className="text-white font-bold leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
              >
                Where I&apos;ve been building.
              </motion.h2>
            </div>
          </div>

          {/* Right: experience list */}
          <div>
            {/* Top rule */}
            <motion.div
              className="rule"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              style={{ transformOrigin: "left" }}
            />

            {experiences.map((exp, i) => (
              <ExperienceRow key={exp.company} exp={exp} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceRow({
  exp,
  index,
  inView,
}: {
  exp: (typeof experiences)[0];
  index: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.09 }}
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="py-8 md:py-10 cursor-pointer"
        data-cursor-hover
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          {/* Left: period + type */}
          <div className="md:w-44 shrink-0">
            <p className="text-gray-accent text-xs tracking-widest font-light editorial-num">
              {exp.period}
            </p>
            <p
              className="text-[10px] tracking-[0.15em] uppercase font-light mt-1"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {exp.type}
            </p>
          </div>

          {/* Center: role + company + description */}
          <div className="flex-1 min-w-0">
            <motion.h3
              animate={{ x: hovered ? 6 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-medium mb-1"
              style={{ fontSize: "clamp(1.05rem, 2vw, 1.3rem)", letterSpacing: "-0.01em" }}
            >
              {exp.role}
            </motion.h3>
            <p className="text-gray-accent text-sm font-light mb-0">{exp.company}</p>

            {/* Expandable description */}
            <motion.div
              animate={{
                opacity: hovered ? 1 : 0,
                height: hovered ? "auto" : 0,
                marginTop: hovered ? 10 : 0,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="text-white/35 text-sm font-light leading-[1.8]">
                {exp.description}
              </p>
            </motion.div>
          </div>

          {/* Arrow */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0.18, x: hovered ? 0 : -5 }}
            transition={{ duration: 0.3 }}
            className="text-white text-sm shrink-0 md:mt-0.5"
          >
            ↗
          </motion.div>
        </div>
      </motion.div>

      <div className="rule" />
    </motion.div>
  );
}
