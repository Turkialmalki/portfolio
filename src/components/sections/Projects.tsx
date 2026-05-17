"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const PROJECTS = [
  {
    number: "01",
    title: "BaseBox",
    tag: "AI SaaS System Template",
    description:
      "An enterprise-grade AI SaaS boilerplate providing end-to-end system templates for rapid product innovation — from auth to deployment.",
    accent: "#0091FF",
    bg: "linear-gradient(148deg, #0A1628 0%, #0D1F3C 55%, #091422 100%)",
    highlightColor: "rgba(0,145,255,0.35)",
  },
  {
    number: "02",
    title: "Munaaseb",
    tag: "Fintech Innovation & Open Banking",
    description:
      "A fintech platform leveraging open banking APIs to deliver intelligent financial matching and personalized product recommendations.",
    accent: "#00C8A0",
    bg: "linear-gradient(148deg, #061A15 0%, #0A2820 55%, #071C18 100%)",
    highlightColor: "rgba(0,200,160,0.35)",
  },
  {
    number: "03",
    title: "Hala Product Innovation",
    tag: "Tech Vision & Integration",
    description:
      "Strategic product innovation program integrating cutting-edge technologies to reshape the digital experience and accelerate Hala's tech vision.",
    accent: "#FF6B35",
    bg: "linear-gradient(148deg, #1C0D06 0%, #2C1508 55%, #1A0B05 100%)",
    highlightColor: "rgba(255,107,53,0.35)",
  },
  {
    number: "04",
    title: "SAP Cloud CX POC",
    tag: "Full Digital Experience",
    description:
      "Proof-of-concept for SAP's Cloud CX suite — delivering a seamless end-to-end customer experience across sales, service, and commerce.",
    accent: "#0070D2",
    bg: "linear-gradient(148deg, #080E1C 0%, #0C1530 55%, #070C1A 100%)",
    highlightColor: "rgba(0,112,210,0.35)",
  },
  {
    number: "05",
    title: "Lean Technologies Integration",
    tag: "Open Banking Excellence",
    description:
      "Deep integration with Lean Technologies' open banking infrastructure, enabling real-time data access and payment initiation across Saudi banks.",
    accent: "#9B59B6",
    bg: "linear-gradient(148deg, #130C1C 0%, #1E1030 55%, #110A1A 100%)",
    highlightColor: "rgba(155,89,182,0.35)",
  },
];

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="projects"
      ref={ref}
      style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(80px, 11vw, 140px) 0",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 56,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: EASE }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Featured Work
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: EASE, delay: 0.06 }}
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 800,
                color: "#0D0E12",
                letterSpacing: "-0.036em",
                lineHeight: 1.08,
              }}
            >
              Selected projects.
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.14 }}
            style={{
              fontSize: 13,
              color: "#6B7280",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Drag to explore →
          </motion.p>
        </div>

        {/* Horizontal drag carousel */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: 0.18 }}
        >
          <motion.div
            ref={trackRef}
            drag="x"
            dragConstraints={{
              left: -(PROJECTS.length - 1) * 420,
              right: 0,
            }}
            dragElastic={0.08}
            dragTransition={{ bounceStiffness: 200, bounceDamping: 30 }}
            style={{
              display: "flex",
              gap: 20,
              paddingLeft: 32,
              paddingRight: 32,
              cursor: "grab",
              userSelect: "none",
              width: "max-content",
            }}
            whileTap={{ cursor: "grabbing" }}
          >
            {PROJECTS.map((project, i) => (
              <ProjectCard key={project.number} project={project} index={i} />
            ))}
          </motion.div>
        </motion.div>

        {/* Pagination dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 40,
            padding: "0 32px",
          }}
        >
          {PROJECTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 24 : 8,
                height: 8,
                borderRadius: 100,
                background: i === 0 ? "#0D0E12" : "rgba(0,0,0,0.12)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        boxShadow: hovered
          ? `0 40px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)`
          : "0 8px 32px rgba(0,0,0,0.12)",
        y: hovered ? -6 : 0,
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 400,
        height: 520,
        borderRadius: 32,
        background: project.bg,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: project.highlightColor,
          filter: "blur(60px)",
          opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top row: number + arrow */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          right: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
          }}
        >
          {project.number}
        </span>
        <motion.div
          animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          ↗
        </motion.div>
      </div>

      {/* Centre visual area: abstract tech pattern */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProjectVisual accent={project.accent} index={index} />
      </div>

      {/* Bottom content */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "28px 28px 32px",
        }}
      >
        {/* Tag */}
        <span
          style={{
            display: "inline-flex",
            fontSize: 11,
            fontWeight: 600,
            color: project.accent,
            background: `${project.accent}20`,
            border: `1px solid ${project.accent}35`,
            borderRadius: 100,
            padding: "4px 12px",
            marginBottom: 14,
            letterSpacing: "0.01em",
          }}
        >
          {project.tag}
        </span>

        <h3
          style={{
            fontSize: "clamp(20px, 2vw, 26px)",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
            marginBottom: 10,
          }}
        >
          {project.title}
        </h3>

        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.65,
          }}
        >
          {project.description}
        </p>
      </div>
    </motion.div>
  );
}

/* Abstract visual per project */
function ProjectVisual({
  accent,
  index,
}: {
  accent: string;
  index: number;
}) {
  if (index === 0) {
    // BaseBox — grid of squares (SaaS dashboard)
    return (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={col * 54 + 2}
              y={row * 54 + 2}
              width={row === 0 && col === 0 ? 100 : 44}
              height={44}
              rx={8}
              fill={accent}
              fillOpacity={row === 0 && col === 0 ? 0.5 : 0.15}
              stroke={accent}
              strokeWidth={1}
              strokeOpacity={0.3}
            />
          ))
        )}
      </svg>
    );
  }
  if (index === 1) {
    // Munaaseb — chart bars (fintech)
    const bars = [0.4, 0.7, 0.55, 0.9, 0.65, 0.8];
    return (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        {bars.map((h, i) => (
          <rect
            key={i}
            x={i * 26 + 4}
            y={120 - h * 100}
            width={18}
            height={h * 100}
            rx={5}
            fill={accent}
            fillOpacity={i === 3 ? 0.7 : 0.25}
          />
        ))}
        <polyline
          points={bars
            .map((h, i) => `${i * 26 + 13},${120 - h * 100}`)
            .join(" ")}
          stroke={accent}
          strokeWidth="2"
          fill="none"
          strokeOpacity={0.6}
        />
      </svg>
    );
  }
  if (index === 2) {
    // Hala — concentric rings (innovation)
    return (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
        {[70, 50, 30, 14].map((r, i) => (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={r}
            stroke={accent}
            strokeWidth={i === 0 ? 1.5 : 1}
            strokeOpacity={0.15 + i * 0.12}
            fill="none"
          />
        ))}
        <circle cx="80" cy="80" r="8" fill={accent} fillOpacity={0.7} />
        <line x1="80" y1="10" x2="80" y2="40" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
        <line x1="150" y1="80" x2="120" y2="80" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
        <line x1="80" y1="150" x2="80" y2="120" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
        <line x1="10" y1="80" x2="40" y2="80" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
      </svg>
    );
  }
  if (index === 3) {
    // SAP Cloud — hexagon grid (enterprise)
    const pts = (cx: number, cy: number, r: number) =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
    const positions = [
      [80, 55], [55, 80], [105, 80], [80, 105],
    ] as [number, number][];
    return (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
        {positions.map(([cx, cy], i) => (
          <polygon
            key={i}
            points={pts(cx, cy, 24)}
            stroke={accent}
            strokeWidth="1.5"
            strokeOpacity={i === 0 ? 0.7 : 0.25}
            fill={accent}
            fillOpacity={i === 0 ? 0.2 : 0.06}
          />
        ))}
      </svg>
    );
  }
  // Lean — connected nodes (network)
  const nodes = [[80, 60], [40, 100], [120, 100], [60, 130], [100, 130]] as [number, number][];
  const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [1, 2]];
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={accent} strokeWidth="1.5" strokeOpacity="0.3"
        />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={i === 0 ? 10 : 7}
          fill={accent} fillOpacity={i === 0 ? 0.6 : 0.25}
        />
      ))}
    </svg>
  );
}
