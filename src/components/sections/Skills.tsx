"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const skillCategories = [
  {
    title: "Design",
    skills: ["Figma", "Framer", "Spline 3D", "Prototyping", "Motion Design", "Design Systems", "Brand Identity", "Typography"],
  },
  {
    title: "Development",
    skills: ["React / Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Node.js", "Three.js / WebGL", "GraphQL", "Prisma"],
  },
  {
    title: "Tools & Craft",
    skills: ["GSAP", "Lenis", "Storybook", "Git / GitHub", "Vercel", "Figma Dev Mode", "Accessibility", "Performance"],
  },
];

export default function Skills() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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
          Expertise
        </motion.p>

        {/* Headline */}
        <div className="overflow-hidden mb-20">
          <motion.h2
            initial={{ y: "100%" }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-white font-bold leading-tight"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Tools of the trade.
          </motion.h2>
        </div>

        {/* Skill categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {skillCategories.map((category, catIdx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + catIdx * 0.12 }}
            >
              <h3 className="text-white text-sm font-semibold tracking-widest uppercase mb-8 pb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {category.title}
              </h3>
              <ul className="space-y-3">
                {category.skills.map((skill, i) => (
                  <motion.li
                    key={skill}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + catIdx * 0.1 + i * 0.04 }}
                    className="group flex items-center justify-between py-1"
                    data-cursor-hover
                  >
                    <span className="text-[#A1A1AA] text-sm group-hover:text-white transition-colors duration-200">
                      {skill}
                    </span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={inView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.5, delay: 0.4 + catIdx * 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      className="h-px w-8 bg-white/10 group-hover:bg-white/30 transition-colors duration-200 origin-left"
                    />
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Technology logos row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 pt-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-8">
            Also experienced with
          </p>
          <div className="flex flex-wrap gap-3">
            {["React Native", "Svelte", "Astro", "Webflow", "Shopify", "Sanity CMS", "PostgreSQL", "Redis"].map(
              (tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.05 }}
                  className="text-xs px-4 py-2 rounded-full text-white/50 hover:text-white/80 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  data-cursor-hover
                >
                  {tech}
                </motion.span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
