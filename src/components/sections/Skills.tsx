"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const skillCategories = [
  {
    title: "Design",
    skills: [
      "Figma",
      "Framer",
      "Spline 3D",
      "Motion Design",
      "Design Systems",
      "Brand Identity",
      "Typography",
      "Prototyping",
    ],
  },
  {
    title: "Development",
    skills: [
      "React / Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Node.js",
      "Three.js / WebGL",
      "GraphQL",
      "Prisma",
    ],
  },
  {
    title: "Craft",
    skills: [
      "GSAP",
      "Lenis Scroll",
      "Performance",
      "Accessibility",
      "Storybook",
      "Git / GitHub",
      "Vercel",
      "Figma Dev Mode",
    ],
  },
];

const MARQUEE_SKILLS = [
  "React", "Next.js", "TypeScript", "Figma", "Framer",
  "Motion Design", "Three.js", "Node.js", "Tailwind", "GSAP",
  "Lenis", "Spline", "GraphQL", "Vercel", "WebGL",
  "Design Systems", "Brand Identity", "Storybook",
];

export default function Skills() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="py-28 md:py-40"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Marquee strip ── */}
      <div className="marquee-container mb-20 md:mb-28 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="marquee-track-slow">
          {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-8 px-8 text-gray-accent text-xs tracking-[0.2em] uppercase font-light"
            >
              {skill}
              <span className="inline-block w-px h-3 bg-white/15" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 md:px-10 lg:px-16">
        <div className="max-w-350 mx-auto">

          {/* Label + heading */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-gray-accent text-[10px] tracking-[0.25em] uppercase font-light mb-8"
          >
            Expertise
          </motion.p>

          <div className="clip-text-reveal mb-20 md:mb-24">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.9, ease: EASE }}
              className="text-white font-bold leading-none"
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", letterSpacing: "-0.02em" }}
            >
              Tools of the trade.
            </motion.h2>
          </div>

          {/* Skill categories — clean list, no boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {skillCategories.map((category, catIdx) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: EASE, delay: 0.2 + catIdx * 0.1 }}
                className="py-10 md:py-0"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingRight: catIdx < 2 ? "clamp(2rem, 5vw, 5rem)" : 0,
                  borderRight: catIdx < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  paddingLeft: catIdx > 0 ? "clamp(2rem, 5vw, 5rem)" : 0,
                }}
              >
                {/* Category title */}
                <p className="text-white text-[10px] tracking-[0.25em] uppercase font-semibold mb-8 pt-8">
                  {category.title}
                </p>

                {/* Skill items */}
                <ul className="space-y-4">
                  {category.skills.map((skill, i) => (
                    <motion.li
                      key={skill}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{
                        duration: 0.4,
                        delay: 0.35 + catIdx * 0.08 + i * 0.04,
                      }}
                      className="group flex items-center justify-between"
                      data-cursor-hover
                    >
                      <span className="text-gray-accent text-sm font-light group-hover:text-white transition-colors duration-250">
                        {skill}
                      </span>
                      <motion.span
                        className="h-px bg-white/10 group-hover:bg-white/25 transition-colors duration-250"
                        initial={{ width: 0 }}
                        animate={inView ? { width: 24 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 + catIdx * 0.08 + i * 0.04, ease: EASE }}
                      />
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom: also experienced with */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-20 pt-12 flex flex-wrap items-center gap-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-gray-accent text-[10px] tracking-[0.2em] uppercase font-light shrink-0">
              Also —
            </span>
            {["React Native", "Svelte", "Astro", "Webflow", "Shopify", "Sanity CMS", "PostgreSQL", "Redis"].map(
              (tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.75 + i * 0.05 }}
                  className="text-white/30 text-xs font-light hover:text-white/60 transition-colors duration-200"
                  data-cursor-hover
                >
                  {tech}
                </motion.span>
              )
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
