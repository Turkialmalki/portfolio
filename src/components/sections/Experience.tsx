"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

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
          Experience
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24">
          {/* Left: heading */}
          <div>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-white font-bold leading-tight lg:sticky lg:top-28"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                Where I&apos;ve been building.
              </motion.h2>
            </div>
          </div>

          {/* Right: experience list */}
          <div className="flex flex-col">
            {experiences.map((exp, i) => (
              <ExperienceItem key={exp.company} exp={exp} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceItem({
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
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2 + index * 0.08,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="py-8 md:py-10 transition-all duration-300"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: hovered ? "rgba(255,255,255,0.015)" : "transparent",
        paddingLeft: "0.5rem",
        paddingRight: "0.5rem",
        borderRadius: "0.5rem",
      }}
      data-cursor-hover
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#A1A1AA] text-xs tracking-widest">
              {exp.period}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full tracking-widest"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {exp.type}
            </span>
          </div>
          <h3 className="text-white text-xl md:text-2xl font-medium mb-1">
            {exp.role}
          </h3>
          <p className="text-[#A1A1AA] text-sm mb-3">{exp.company}</p>
          <motion.div
            animate={{
              opacity: hovered ? 1 : 0,
              maxHeight: hovered ? 200 : 0,
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <p className="text-white/40 text-sm leading-relaxed pt-1">
              {exp.description}
            </p>
          </motion.div>
        </div>
        <motion.div
          animate={{ opacity: hovered ? 1 : 0.2, x: hovered ? 0 : -4 }}
          transition={{ duration: 0.3 }}
          className="text-white text-sm shrink-0"
        >
          ↗
        </motion.div>
      </div>
    </motion.div>
  );
}
