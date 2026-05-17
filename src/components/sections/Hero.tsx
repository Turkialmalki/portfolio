"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PROJECTS = [
  {
    title: "BaseBox AI SaaS",
    tag: "AI · SaaS Platform",
    accent: "#0091FF",
    bg: "linear-gradient(148deg, #060E1E 0%, #0A1B38 60%, #070F20 100%)",
    glow: "rgba(0,145,255,0.38)",
  },
  {
    title: "Munaaseb Fintech",
    tag: "Fintech · Open Banking",
    accent: "#00C8A0",
    bg: "linear-gradient(148deg, #051310 0%, #092418 60%, #051110 100%)",
    glow: "rgba(0,200,160,0.38)",
  },
  {
    title: "Hala Product",
    tag: "Product · Innovation",
    accent: "#FF6B35",
    bg: "linear-gradient(148deg, #160A04 0%, #251006 60%, #140904 100%)",
    glow: "rgba(255,107,53,0.38)",
  },
  {
    title: "SAP Cloud CX",
    tag: "Enterprise · CX Suite",
    accent: "#0070D2",
    bg: "linear-gradient(148deg, #050C16 0%, #091020 60%, #050A14 100%)",
    glow: "rgba(0,112,210,0.38)",
  },
  {
    title: "Lean Technologies",
    tag: "Open Banking · API",
    accent: "#9B59B6",
    bg: "linear-gradient(148deg, #0C0814 0%, #150B22 60%, #0B0712 100%)",
    glow: "rgba(155,89,182,0.38)",
  },
];

const ROW_1 = [...PROJECTS, ...PROJECTS];
const ROW_2 = [...[...PROJECTS].reverse(), ...[...PROJECTS].reverse()];

export default function Hero({ ready = true }: { ready?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const avatarY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);

  return (
    <section
      id="home"
      ref={sectionRef}
      style={{
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
        transition: "background-color 0.45s ease",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Hero grid: copy left, avatar right ── */}
      <div
        className="hero-grid"
        style={{
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "clamp(88px, 11vw, 132px) 32px 20px",
          display: "grid",
          gap: "clamp(40px, 5vw, 80px)",
          alignItems: "center",
        }}
      >
        {/* LEFT: Copy */}
        <div>
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={ready ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.08 }}
              style={{
                fontSize: "clamp(38px, 5.6vw, 82px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                display: "block",
                transition: "color 0.45s ease",
              }}
            >
              Hello! 👋
            </motion.h1>
          </div>

          <div style={{ overflow: "hidden", marginBottom: 20 }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={ready ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.14 }}
              style={{
                fontSize: "clamp(38px, 5.6vw, 82px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                display: "block",
                transition: "color 0.45s ease",
              }}
            >
              I&apos;m Turki Almalki
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.32 }}
            style={{
              fontSize: "clamp(14px, 1.1vw, 16px)",
              color: "#6B7280",
              lineHeight: 1.74,
              maxWidth: 420,
              marginBottom: 36,
              fontWeight: 400,
            }}
          >
            Software Engineering Leader focused on digital transformation,
            enterprise platforms, AI solutions, fintech innovation, and
            scalable system integrations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.46 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <PillButton color="#0091FF" href="/projects">
              View Portfolio
            </PillButton>
            <PillButton
              color="transparent"
              onClick={() =>
                document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" })
              }
              outline
            >
              Let&apos;s Connect
            </PillButton>
          </motion.div>
        </div>

        {/* RIGHT: Avatar */}
        <motion.div
          className="hidden md:flex"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
          style={{
            y: avatarY,
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <AvatarVisual />
        </motion.div>
      </div>

      {/* ── Two-row large card gallery ── */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.95, ease: EASE, delay: 0.68 }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
          paddingBottom: 108,
          overflow: "hidden",
        }}
      >
        {/* Row 1: left-scrolling */}
        <div className="marquee-container marquee-edges">
          <div
            className="marquee-track marquee-track-slow"
            style={{ gap: 0, alignItems: "stretch" }}
          >
            {ROW_1.map((p, i) => (
              <LargeProjectCard key={i} project={p} index={i % PROJECTS.length} />
            ))}
          </div>
        </div>

        {/* Row 2: right-scrolling */}
        <div className="marquee-container marquee-edges">
          <div
            className="marquee-track-right"
            style={{ gap: 0, alignItems: "stretch" }}
          >
            {ROW_2.map((p, i) => (
              <LargeProjectCard key={i} project={p} index={i % PROJECTS.length} />
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        .hero-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }
      `}</style>
    </section>
  );
}

/* ── Large premium project preview card ── */
function LargeProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="project-card"
      style={{
        flexShrink: 0,
        height: 298,
        borderRadius: 24,
        background: project.bg,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        margin: "0 12px",
        boxShadow:
          "0 12px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.055)",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -30,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: project.glow,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* Mockup visual area */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          height: 186,
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            height: 24,
            background: "rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            gap: 5,
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            flexShrink: 0,
          }}
        >
          <div
            style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,95,87,0.72)" }}
          />
          <div
            style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,189,46,0.72)" }}
          />
          <div
            style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(40,202,65,0.72)" }}
          />
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              height: 5,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 3,
            }}
          />
          <div
            style={{ width: 28, height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}
          />
        </div>

        {/* Project-specific mockup */}
        <div style={{ width: "100%", height: "calc(100% - 24px)", overflow: "hidden" }}>
          <ProjectMockup index={index} accent={project.accent} />
        </div>
      </div>

      {/* Bottom gradient + info */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.44) 55%, transparent 100%)",
          padding: "36px 22px 20px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            color: project.accent,
            background: `${project.accent}22`,
            border: `1px solid ${project.accent}44`,
            borderRadius: 100,
            padding: "3px 10px",
            marginBottom: 7,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {project.tag}
        </span>
        <h3
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          {project.title}
        </h3>
      </div>
    </motion.div>
  );
}

/* ── Per-project SVG mockups ── */
function ProjectMockup({ index, accent: a }: { index: number; accent: string }) {
  if (index === 0) {
    /* BaseBox AI — dashboard with sidebar + stat cards + chart */
    return (
      <svg
        viewBox="0 0 548 162"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sidebar */}
        <rect x="0" y="0" width="46" height="162" fill="rgba(0,0,0,0.32)" />
        <rect x="0" y="28" width="3" height="20" rx="1.5" fill={a} />
        {[10, 34, 58, 84, 110, 136].map((y, i) => (
          <rect
            key={y}
            x="12"
            y={y}
            width="22"
            height="7"
            rx="3.5"
            fill={i === 1 ? `${a}70` : "rgba(255,255,255,0.1)"}
          />
        ))}

        {/* Header */}
        <rect x="56" y="8" width="88" height="7" rx="3.5" fill="rgba(255,255,255,0.45)" />
        <rect x="56" y="20" width="54" height="4" rx="2" fill="rgba(255,255,255,0.18)" />

        {/* Stat cards */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={56 + i * 164}
              y="34"
              width="154"
              height="46"
              rx="8"
              fill={i === 0 ? `${a}18` : "rgba(255,255,255,0.04)"}
              stroke={i === 0 ? `${a}40` : "rgba(255,255,255,0.08)"}
              strokeWidth="1"
            />
            <rect
              x={66 + i * 164}
              y="42"
              width={i === 0 ? 52 : 40}
              height="4"
              rx="2"
              fill={i === 0 ? `${a}90` : "rgba(255,255,255,0.2)"}
            />
            <rect
              x={66 + i * 164}
              y="52"
              width={76 - i * 8}
              height="9"
              rx="4"
              fill="rgba(255,255,255,0.58)"
            />
            <rect
              x={66 + i * 164}
              y="67"
              width="32"
              height="4"
              rx="2"
              fill={i === 0 ? "rgba(0,220,110,0.62)" : "rgba(255,255,255,0.14)"}
            />
          </g>
        ))}

        {/* Chart */}
        <rect
          x="56"
          y="88"
          width="488"
          height="70"
          rx="8"
          fill="rgba(255,255,255,0.03)"
        />
        {[96, 110, 124, 138, 152].map((y) => (
          <line
            key={y}
            x1="64"
            y1={y}
            x2="540"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        <path
          d="M64,148 L120,134 L176,139 L232,122 L288,127 L344,112 L400,117 L456,103 L512,108 L540,98"
          stroke={a}
          strokeWidth="2.2"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M64,148 L120,134 L176,139 L232,122 L288,127 L344,112 L400,117 L456,103 L512,108 L540,98 L540,155 L64,155 Z"
          fill={`${a}28`}
        />
        <circle cx="344" cy="112" r="4" fill={a} />
        <circle cx="540" cy="98" r="4" fill={a} />
        <rect x="330" y="94" width="42" height="14" rx="4" fill={`${a}ee`} />
        <rect x="334" y="99" width="28" height="4" rx="2" fill="rgba(255,255,255,0.9)" />
      </svg>
    );
  }

  if (index === 1) {
    /* Munaaseb — fintech balance + chart + transactions */
    const bars = [0.44, 0.62, 0.52, 0.78, 0.66, 0.88, 0.74, 0.92, 0.84, 0.98, 0.88, 1.0];
    return (
      <svg
        viewBox="0 0 548 162"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Balance display */}
        <rect x="16" y="8" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
        <rect x="16" y="18" width="140" height="14" rx="5" fill="rgba(255,255,255,0.72)" />
        <rect x="164" y="22" width="48" height="6" rx="3" fill="rgba(0,220,110,0.62)" />

        {/* Tabs */}
        <rect x="16" y="38" width="36" height="6" rx="3" fill={`${a}cc`} />
        <rect x="58" y="38" width="28" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
        <rect x="92" y="38" width="28" height="6" rx="3" fill="rgba(255,255,255,0.15)" />

        {/* Area chart */}
        {bars.map((h, i) => (
          <rect
            key={i}
            x={16 + i * 44}
            y={112 - h * 62}
            width="32"
            height={h * 62}
            rx="5"
            fill={i === 11 ? a : `${a}38`}
          />
        ))}
        <path
          d={`M32,112 ${bars.map((h, i) => `L${32 + i * 44},${112 - h * 62}`).join(" ")} L${32 + 11 * 44},112 Z`}
          fill={`${a}12`}
        />

        {/* Transaction rows */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x="16"
              y={120 + i * 14}
              width="8"
              height="8"
              rx="2"
              fill={`${a}40`}
            />
            <rect
              x="30"
              y={121 + i * 14}
              width={64 - i * 10}
              height="5"
              rx="2.5"
              fill="rgba(255,255,255,0.3)"
            />
            <rect
              x="380"
              y={121 + i * 14}
              width="40"
              height="5"
              rx="2.5"
              fill={i === 0 ? "rgba(0,220,110,0.5)" : "rgba(255,255,255,0.18)"}
            />
            <line
              x1="16"
              y1={133 + i * 14}
              x2="532"
              y2={133 + i * 14}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>
    );
  }

  if (index === 2) {
    /* Hala Product — marketing landing page mockup */
    return (
      <svg
        viewBox="0 0 548 162"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nav bar */}
        <rect x="0" y="0" width="548" height="22" fill="rgba(0,0,0,0.2)" />
        <rect x="16" y="7" width="36" height="8" rx="3" fill={`${a}90`} />
        {[70, 110, 148, 186].map((x) => (
          <rect key={x} x={x} y="9" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />
        ))}
        <rect x="492" y="7" width="40" height="8" rx="4" fill={a} />

        {/* Hero headline lines */}
        <rect x="80" y="34" width="240" height="12" rx="5" fill="rgba(255,255,255,0.65)" />
        <rect x="80" y="52" width="200" height="12" rx="5" fill="rgba(255,255,255,0.55)" />
        <rect x="80" y="70" width="300" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
        <rect x="80" y="82" width="260" height="8" rx="4" fill="rgba(255,255,255,0.14)" />

        {/* CTA buttons */}
        <rect x="80" y="96" width="96" height="18" rx="9" fill={a} />
        <rect x="182" y="96" width="80" height="18" rx="9" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* Feature cards row */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect
              x={80 + i * 116}
              y="122"
              width="106"
              height="36"
              rx="8"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1"
            />
            <rect
              x={90 + i * 116}
              y="130"
              width="12"
              height="12"
              rx="3"
              fill={`${a}50`}
            />
            <rect
              x={108 + i * 116}
              y="132"
              width={52 - i * 6}
              height="4"
              rx="2"
              fill="rgba(255,255,255,0.35)"
            />
            <rect
              x={108 + i * 116}
              y="140"
              width={38 - i * 4}
              height="4"
              rx="2"
              fill="rgba(255,255,255,0.15)"
            />
          </g>
        ))}

        {/* Decorative illustration right side */}
        <circle cx="440" cy="72" r="44" fill={`${a}12`} stroke={`${a}20`} strokeWidth="1" />
        <circle cx="440" cy="72" r="28" fill={`${a}18`} stroke={`${a}28`} strokeWidth="1" />
        <circle cx="440" cy="72" r="12" fill={`${a}50`} />
        {[[-28, 0], [0, -28], [28, 0], [0, 28]].map(([dx, dy], i) => (
          <circle key={i} cx={440 + dx} cy={72 + dy} r="5" fill={`${a}60`} />
        ))}
      </svg>
    );
  }

  if (index === 3) {
    /* SAP Cloud CX — CRM table with sidebar */
    return (
      <svg
        viewBox="0 0 548 162"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top nav */}
        <rect x="0" y="0" width="548" height="22" fill="rgba(0,0,0,0.3)" />
        <rect x="12" y="7" width="32" height="8" rx="3" fill={`${a}90`} />
        {[64, 96, 130, 164].map((x) => (
          <rect key={x} x={x} y="9" width="24" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        ))}
        <rect x="488" y="8" width="24" height="7" rx="3.5" fill={`${a}80`} />
        <circle cx="524" cy="11" r="6" fill="rgba(255,255,255,0.12)" />

        {/* Sidebar */}
        <rect x="0" y="22" width="54" height="140" fill="rgba(0,0,0,0.25)" />
        {[30, 56, 82, 108, 134].map((y, i) => (
          <rect key={y} x="12" y={y} width="30" height="6" rx="3" fill={i === 0 ? `${a}70` : "rgba(255,255,255,0.1)"} />
        ))}
        <rect x="0" y="46" width="3" height="20" rx="1.5" fill={a} />

        {/* Table header */}
        <rect x="62" y="26" width="480" height="16" rx="0" fill="rgba(255,255,255,0.05)" />
        {[62, 178, 278, 368, 448].map((x, i) => (
          <rect key={x} x={x + 6} y="31" width={[88, 80, 70, 60, 50][i]} height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
        ))}

        {/* Table rows */}
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            <rect
              x="62"
              y={44 + row * 22}
              width="480"
              height="20"
              fill={row % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"}
            />
            <circle cx="78" cy={54 + row * 22} r="6" fill={`${a}30`} />
            <rect x="90" y={51 + row * 22} width={70 - row * 4} height="5" rx="2.5" fill="rgba(255,255,255,0.38)" />
            <rect x="190" y={51 + row * 22} width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
            <rect x="290" y={51 + row * 22} width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
            {/* Status pill */}
            <rect
              x="374"
              y={47 + row * 22}
              width="44"
              height="12"
              rx="6"
              fill={row < 2 ? `${a}30` : row < 4 ? "rgba(0,220,110,0.22)" : "rgba(255,255,255,0.08)"}
            />
            <rect
              x="380"
              y={51 + row * 22}
              width={row < 2 ? 28 : 24}
              height="4"
              rx="2"
              fill={row < 2 ? `${a}cc` : row < 4 ? "rgba(0,220,110,0.8)" : "rgba(255,255,255,0.3)"}
            />
          </g>
        ))}
      </svg>
    );
  }

  /* index === 4: Lean Technologies — API banking node diagram */
  const bankNodes: [number, number, string][] = [
    [274, 48, "SNB"],
    [380, 88, "ANB"],
    [350, 148, "BSF"],
    [198, 148, "ARJ"],
    [168, 88, "NCB"],
  ];
  return (
    <svg
      viewBox="0 0 548 162"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid dots background */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 12 }, (_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={22 + col * 48}
            cy={14 + row * 28}
            r="1.5"
            fill="rgba(255,255,255,0.06)"
          />
        ))
      )}

      {/* Connection lines hub → nodes */}
      {bankNodes.map(([x, y], i) => (
        <line
          key={i}
          x1="274"
          y1="108"
          x2={x}
          y2={y}
          stroke={`${a}50`}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      ))}

      {/* Bank node circles */}
      {bankNodes.map(([x, y, label], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="22" fill={`${a}18`} stroke={`${a}40`} strokeWidth="1.5" />
          <circle cx={x} cy={y} r="14" fill={`${a}28`} />
          <circle
            cx={x + 14}
            cy={y - 14}
            r="5"
            fill="rgba(0,220,110,0.8)"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
          />
          <rect x={x - 14} y={y - 4} width="28" height="8" rx="4" fill="rgba(255,255,255,0)" />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="rgba(255,255,255,0.75)"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Central API hub */}
      <circle cx="274" cy="108" r="30" fill={`${a}22`} stroke={`${a}60`} strokeWidth="2" />
      <circle cx="274" cy="108" r="20" fill={`${a}30`} />
      <circle cx="274" cy="108" r="10" fill={a} />
      <text
        x="274"
        y="146"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="rgba(255,255,255,0.5)"
        fontFamily="system-ui, sans-serif"
      >
        LEAN API HUB
      </text>

      {/* Stats strip */}
      <rect x="16" y="8" width="80" height="14" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="22" y="12" width="20" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
      <rect x="46" y="12" width="28" height="4" rx="2" fill={`${a}80`} />

      <rect x="104" y="8" width="80" height="14" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="110" y="12" width="20" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
      <rect x="134" y="12" width="28" height="4" rx="2" fill="rgba(0,220,110,0.7)" />

      {/* Pulse ring on hub */}
      <circle cx="274" cy="108" r="38" stroke={`${a}25`} strokeWidth="1" fill="none" />
      <circle cx="274" cy="108" r="48" stroke={`${a}12`} strokeWidth="1" fill="none" />
    </svg>
  );
}

/* ── Pill CTA button ── */
function PillButton({
  children,
  href,
  color,
  outline,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  color: string;
  outline?: boolean;
  onClick?: () => void;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: outline ? "transparent" : color,
    color: outline ? "var(--text-primary)" : "#FFFFFF",
    padding: "13px 28px",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 600,
    border: outline ? "1.5px solid var(--border-subtle)" : "none",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.012em",
    whiteSpace: "nowrap",
    textDecoration: "none",
    boxShadow: outline ? "none" : `0 8px 28px ${color}48`,
    transition: "opacity 0.2s ease",
  };

  return (
    <motion.a
      href={href}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{ ...style, cursor: "pointer" }}
    >
      {children}
    </motion.a>
  );
}

/* ── Profile image with multi-layer glow + floating badges ── */
function AvatarVisual() {
  return (
    <div style={{ position: "relative", width: 380, height: 380 }}>
      {([1.55, 1.32, 1.12] as const).map((scale, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [scale, scale * 1.06, scale],
            opacity: [0.14, 0.28, 0.14],
          }}
          transition={{
            duration: 3.5 + i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(0,145,255,${0.28 - i * 0.07}) 0%, rgba(0,200,220,${0.13 - i * 0.03}) 45%, transparent 70%)`,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(0,145,255,0.44), 0 10px 36px rgba(0,145,255,0.20)",
          border: "3px solid rgba(0,145,255,0.28)",
        }}
      >
        <Image
          src="/avatar.jpg"
          alt="Turki Almalki"
          fill
          priority
          sizes="380px"
          style={{ objectFit: "cover", objectPosition: "center 12%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.12) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Floating badge — location */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, ease: EASE, delay: 1.05 }}
        style={{
          position: "absolute",
          bottom: 20,
          right: -28,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 18,
          padding: "12px 16px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 36px rgba(0,0,0,0.09)",
          minWidth: 155,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0D0E12", letterSpacing: "-0.02em" }}>
          Turki Almalki
        </p>
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 3, fontWeight: 400 }}>
          📍 Riyadh, Saudi Arabia
        </p>
      </motion.div>

      {/* Floating badge — experience */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, ease: EASE, delay: 1.25 }}
        style={{
          position: "absolute",
          top: 24,
          left: -32,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 18,
          padding: "12px 16px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 36px rgba(0,0,0,0.09)",
        }}
      >
        <p
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0091FF",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          9+
        </p>
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, fontWeight: 400 }}>
          Years Experience
        </p>
      </motion.div>
    </div>
  );
}
