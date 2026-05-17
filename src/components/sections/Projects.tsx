"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const projects = [
  {
    id: "01",
    title: "Luminary OS",
    category: "Product Design",
    year: "2024",
    description: "A next-generation operating system interface concept built for creative professionals.",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    accent: "rgba(100, 150, 255, 0.3)",
  },
  {
    id: "02",
    title: "Aria Finance",
    category: "Web Application",
    year: "2024",
    description: "Reinventing personal finance through intelligent data visualization and clean UX.",
    gradient: "linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 40%, #2d1515 100%)",
    accent: "rgba(255, 100, 100, 0.3)",
  },
  {
    id: "03",
    title: "Solstice Brand",
    category: "Brand Identity",
    year: "2023",
    description: "Complete brand system and digital presence for a sustainable luxury brand.",
    gradient: "linear-gradient(135deg, #0a0a1a 0%, #0d1a0d 40%, #1a2d0d 100%)",
    accent: "rgba(100, 200, 100, 0.3)",
  },
  {
    id: "04",
    title: "Nexus Platform",
    category: "Creative Development",
    year: "2023",
    description: "A collaborative design platform that bridges the gap between design and engineering.",
    gradient: "linear-gradient(135deg, #1a0d1a 0%, #2d0d2d 40%, #1a0a2d 100%)",
    accent: "rgba(180, 100, 255, 0.3)",
  },
];

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="projects"
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-40"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-16 md:mb-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-4"
            >
              Featured Work
            </motion.p>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-white font-bold leading-tight"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
              >
                Selected Projects
              </motion.h2>
            </div>
          </div>
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="hidden md:inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white text-sm transition-colors group"
            data-cursor-hover
          >
            All projects
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </motion.a>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  inView,
}: {
  project: typeof projects[0];
  index: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2 + index * 0.1,
      }}
      className="project-card group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-cursor-hover
    >
      {/* Image area */}
      <div className="relative overflow-hidden rounded-2xl mb-4" style={{ aspectRatio: "16/10" }}>
        {/* Gradient background (simulates image) */}
        <motion.div
          className="project-image absolute inset-0"
          style={{ background: project.gradient }}
          animate={{ scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Accent glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${project.accent} 0%, transparent 65%)`,
          }}
          animate={{ opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.5 }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* View overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="px-5 py-2.5 text-white text-xs tracking-widest uppercase rounded-full"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            View Case Study
          </div>
        </motion.div>

        {/* Top-right year */}
        <div className="absolute top-4 right-4 text-white/40 text-xs tracking-wide">
          {project.year}
        </div>
      </div>

      {/* Card info */}
      <div className="flex items-start justify-between px-1">
        <div>
          <p className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-1.5">
            {project.id} — {project.category}
          </p>
          <h3 className="text-white text-xl md:text-2xl font-medium group-hover:text-white/80 transition-colors">
            {project.title}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: hovered ? 45 : 0, opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="text-white text-lg mt-1 shrink-0"
        >
          ↗
        </motion.div>
      </div>
    </motion.div>
  );
}
