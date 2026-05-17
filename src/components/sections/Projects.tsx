"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const projects = [
  {
    id: "01",
    title: "Luminary OS",
    tags: ["Product Design", "UI/UX", "Design System"],
    description: "Next-generation OS interface concept built for creative professionals.",
    visual: <LuminaryVisual />,
  },
  {
    id: "02",
    title: "Aria Finance",
    tags: ["Web App", "Fintech", "Data Viz"],
    description: "Reinventing personal finance through intelligent data visualization.",
    visual: <AriaVisual />,
  },
  {
    id: "03",
    title: "Solstice Brand",
    tags: ["Brand Identity", "Motion Design", "Strategy"],
    description: "Complete brand system and digital presence for a sustainable luxury brand.",
    visual: <SolsticeVisual />,
  },
  {
    id: "04",
    title: "Nexus Platform",
    tags: ["Creative Dev", "TypeScript", "Framer Motion"],
    description: "A collaborative design platform bridging design and engineering.",
    visual: <NexusVisual />,
  },
];

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="projects"
      ref={ref}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 48,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#666D80",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Featured Work
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 800,
                color: "#0D0E12",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Selected projects.
            </motion.h2>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: "none",
              border: "1px solid #E4E7EC",
              color: "#0D0E12",
              padding: "10px 20px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            whileHover={{
              backgroundColor: "#0D0E12",
              color: "#FFFFFF",
              borderColor: "#0D0E12",
            }}
          >
            View all work →
          </motion.button>
        </div>

        {/* 2×2 Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}
          className="projects-grid"
        >
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              inView={inView}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .projects-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  inView,
}: {
  project: (typeof projects)[0];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0], delay: 0.1 + index * 0.07 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
        transition: { duration: 0.25 },
      }}
      style={{
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid #E4E7EC",
        cursor: "pointer",
        background: "#FFFFFF",
      }}
    >
      {/* Image container */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/10",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {project.visual}
      </div>

      {/* Metadata */}
      <div style={{ padding: "22px 24px 24px" }}>
        <h3
          style={{
            fontSize: "clamp(18px, 1.8vw, 22px)",
            fontWeight: 700,
            color: "#0D0E12",
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          {project.title}
        </h3>

        <p
          style={{
            fontSize: 14,
            color: "#666D80",
            lineHeight: 1.55,
            marginBottom: 14,
          }}
        >
          {project.description}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {project.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#666D80",
                background: "#F9F9FB",
                border: "1px solid #E4E7EC",
                borderRadius: 100,
                padding: "4px 10px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Project visuals (light-theme redesigns) ── */

function LuminaryVisual() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #F0EDF8 0%, #E4DEF4 60%, #D9D2EF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            "linear-gradient(rgba(90,70,160,1) 1px, transparent 1px), linear-gradient(90deg, rgba(90,70,160,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          height: 32,
          background: "rgba(255,255,255,0.6)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 6,
        }}
      >
        {[0.6, 0.4, 0.25].map((o, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: `rgba(90,70,160,${o})`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -45%)",
          width: 90,
          height: 90,
          borderRadius: "50%",
          border: "1.5px solid rgba(90,70,160,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(90,70,160,0.12)",
            border: "1.5px solid rgba(90,70,160,0.2)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          gap: 6,
          justifyContent: "center",
        }}
      >
        {[1, 1.4, 1, 0.7, 1].map((h, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: h * 14,
              background: "rgba(90,70,160,0.18)",
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AriaVisual() {
  const pts = "40,110 70,82 100,96 130,54 160,70 190,34 220,48 250,26 280,42";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #EAF4FD 0%, #D9ECFA 60%, #C8E3F7 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {[0.25, 0.5, 0.75].map((t) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: `${t * 100}%`,
            height: 1,
            background: "rgba(30,100,200,0.07)",
          }}
        />
      ))}
      <svg
        viewBox="0 0 320 140"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaFillLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(30,100,200,0.15)" />
            <stop offset="100%" stopColor="rgba(30,100,200,0)" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pts} 280,130 40,130`}
          fill="url(#areaFillLight)"
        />
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(30,100,200,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.split(" ").map((pt, i) => {
          const [x, y] = pt.split(",").map(Number);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#FFFFFF"
              stroke="rgba(30,100,200,0.5)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

function SolsticeVisual() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #FDF4EC 0%, #FAE9D6 60%, #F7DFC4 100%)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[130, 90, 56, 30].map((size, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1.5px solid rgba(180,100,30,${0.15 - i * 0.02})`,
          }}
        />
      ))}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "rgba(180,100,30,0.2)",
          position: "absolute",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 150,
          height: 1,
          background: "rgba(180,100,30,0.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 150,
          background: "rgba(180,100,30,0.1)",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 16,
          right: 20,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(180,100,30,0.4)",
        }}
      >
        Solstice
      </span>
    </div>
  );
}

function NexusVisual() {
  const filled = new Set([0, 1, 2, 3, 4, 5, 7, 10, 12, 15, 17, 18, 19]);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #EBF2F0 0%, #DCE9E5 60%, #CDE0DA 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          background: "rgba(255,255,255,0.5)",
          borderBottom: "1px solid rgba(30,120,80,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: 12,
        }}
      >
        {[1, 1.8, 1].map((w, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: w * 22,
              background: "rgba(30,120,80,0.15)",
              borderRadius: 3,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 16,
          right: 16,
          bottom: 16,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: 6,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 4,
              background: filled.has(i)
                ? "rgba(30,120,80,0.14)"
                : "rgba(30,120,80,0.04)",
              border: "1px solid rgba(30,120,80,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
