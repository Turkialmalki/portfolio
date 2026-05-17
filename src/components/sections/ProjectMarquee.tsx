"use client";

import { motion } from "framer-motion";

const PROJECTS = [
  {
    title: "BaseBox",
    tag: "AI SaaS System Template",
    accent: "#0091FF",
    visual: "dashboard" as const,
  },
  {
    title: "Munaaseb",
    tag: "Fintech & Open Banking",
    accent: "#00C8A0",
    visual: "fintech" as const,
  },
  {
    title: "Hala",
    tag: "Product Innovation",
    accent: "#FF6B35",
    visual: "mobile" as const,
  },
];

const TRACK = [...PROJECTS, ...PROJECTS];

export default function ProjectMarquee() {
  return (
    <section style={{ backgroundColor: "#FAFAFA", overflowX: "clip", overflowY: "visible", padding: "64px 0 80px" }}>
      {/* Section header */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          marginBottom: 52,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Featured Work
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 800,
            color: "#0D0E12",
            letterSpacing: "-0.036em",
            lineHeight: 1.08,
          }}
        >
          Selected projects.
        </h2>
      </div>

      {/* Marquee strip — oversized premium cards */}
      <div className="marquee-container">
        <div className="marquee-track marquee-track-slow">
          {TRACK.map((project, i) => (
            <MarqueeCard key={i} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MarqueeCard({ project }: { project: (typeof PROJECTS)[number] }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="project-card"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        aspectRatio: "16 / 10",
        borderRadius: 32,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        flexShrink: 0,
        overflow: "hidden",
        margin: "0 32px",
        cursor: "pointer",
        boxShadow: "0 8px 48px rgba(0,0,0,0.09), 0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      {/* Visual fill area */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(148deg, ${project.accent}14 0%, ${project.accent}06 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle radial highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 60% 30%, ${project.accent}18 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        <MockupVisual accent={project.accent} type={project.visual} />
      </div>

      {/* Card footer */}
      <div
        style={{
          padding: "20px 34px 28px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          borderTop: `1px solid ${project.accent}14`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${project.accent}18`,
            border: `1.5px solid ${project.accent}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: project.accent,
            }}
          />
        </div>
        <div>
          <h3
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: "#0D0E12",
              letterSpacing: "-0.026em",
              lineHeight: 1.2,
            }}
          >
            {project.title}
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#6B7280",
              letterSpacing: "-0.01em",
            }}
          >
            {project.tag}
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              display: "inline-flex",
              fontSize: 11,
              fontWeight: 600,
              color: project.accent,
              background: `${project.accent}14`,
              borderRadius: 100,
              padding: "4px 12px",
              letterSpacing: "0.01em",
            }}
          >
            View →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MockupVisual({
  accent,
  type,
}: {
  accent: string;
  type: "dashboard" | "fintech" | "mobile";
}) {
  if (type === "dashboard") {
    /* Full-width browser dashboard mockup — fills the wider card format */
    return (
      <svg
        width="100%"
        viewBox="0 0 460 240"
        fill="none"
        style={{ display: "block", borderRadius: 16, overflow: "hidden" }}
      >
        {/* Browser shell */}
        <rect x="0" y="0" width="460" height="240" rx="14" fill="white" />
        <rect x="0" y="0" width="460" height="32" rx="14" fill={`${accent}14`} />
        <rect x="0" y="18" width="460" height="14" fill={`${accent}14`} />
        {/* Traffic lights */}
        {[14, 24, 34].map((x, i) => (
          <circle key={i} cx={x} cy="14" r="4" fill={["#FF5F57", "#FFBD2E", "#28CA41"][i]} />
        ))}
        {/* URL bar */}
        <rect x="80" y="7" width="200" height="14" rx="7" fill="white" fillOpacity="0.7" />
        <rect x="90" y="11" width="80" height="6" rx="3" fill={`${accent}30`} />

        {/* Left sidebar */}
        <rect x="0" y="32" width="70" height="208" fill={`${accent}08`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="12" y={50 + i * 28} width="46" height="18" rx="9" fill={i === 0 ? `${accent}28` : `${accent}10`} />
        ))}

        {/* Main content area */}
        {/* Metric cards row */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={82 + i * 120} y={42} width={108} height={52} rx={12} fill={i === 0 ? `${accent}20` : `${accent}08`} />
            <rect x={94 + i * 120} y={52} width={50} height={7} rx={3.5} fill={`${accent}35`} />
            <rect x={94 + i * 120} y={64} width={72} height={14} rx={5} fill={`${accent}${i === 0 ? "60" : "25"}`} />
            <rect x={94 + i * 120} y={82} width={36} height={5} rx={2.5} fill={`${accent}20`} />
          </g>
        ))}

        {/* Chart area */}
        <rect x="82" y="106" width="238" height="118" rx="12" fill={`${accent}06`} />
        <line x1="82" y1="200" x2="320" y2="200" stroke={`${accent}20`} strokeWidth="1" />
        {[0.32, 0.58, 0.44, 0.82, 0.66, 0.90, 0.74, 0.96].map((h, i) => (
          <rect
            key={i}
            x={96 + i * 28}
            y={200 - Math.round(78 * h)}
            width={18}
            height={Math.round(78 * h)}
            rx={5}
            fill={accent}
            fillOpacity={i === 7 ? 0.85 : 0.22 + i * 0.04}
          />
        ))}
        {/* Trend line overlay */}
        <polyline
          points="105,168 133,147 161,157 189,122 217,134 245,116 273,128 301,108"
          stroke={accent}
          strokeWidth="2.5"
          fill="none"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="301" cy="108" r="5" fill={accent} fillOpacity="0.85" />

        {/* Right panel */}
        <rect x="330" y="42" width="118" height="182" rx="12" fill={`${accent}06`} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <circle cx="348" cy={60 + i * 28} r="8" fill={`${accent}${i === 0 ? "30" : "12"}`} />
            <rect x="364" y={53 + i * 28} width={i === 0 ? 64 : 48} height="8" rx="4" fill={`${accent}${i === 0 ? "28" : "10"}`} />
            <rect x="364" y={65 + i * 28} width="40" height="5" rx="2.5" fill={`${accent}10`} />
          </g>
        ))}
      </svg>
    );
  }

  if (type === "fintech") {
    /* Two phone mockups side-by-side for the wide card format */
    return (
      <svg
        width="100%"
        viewBox="0 0 360 220"
        fill="none"
        style={{ display: "block" }}
      >
        {/* Phone 1 (left) */}
        <rect x="30" y="0" width="130" height="220" rx="24" fill="white" stroke={`${accent}20`} strokeWidth="1.5" />
        <rect x="30" y="0" width="130" height="44" rx="24" fill={`${accent}18`} />
        <rect x="30" y="26" width="130" height="18" fill={`${accent}18`} />
        <rect x="68" y="8" width="54" height="13" rx="6.5" fill={`${accent}30`} />
        {/* Balance card */}
        <rect x="42" y="56" width="106" height="60" rx="14" fill={`${accent}22`} />
        <rect x="52" y="65" width="44" height="8" rx="4" fill={`${accent}50`} />
        <rect x="52" y="78" width="66" height="16" rx="6" fill={`${accent}70`} />
        <rect x="52" y="98" width="36" height="7" rx="3.5" fill={`${accent}35`} />
        {/* Sparkline */}
        <polyline
          points="42,148 62,138 82,143 102,126 122,134 142,118 152,122"
          stroke={accent}
          strokeWidth="2.5"
          fill="none"
          strokeOpacity="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="152" cy="122" r="5" fill={accent} />
        {/* Transaction rows */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="42" y={166 + i * 18} width="106" height="13" rx="6.5" fill={`${accent}${i === 0 ? "18" : "0A"}`} />
            <rect x="42" y={166 + i * 18} width={[74, 54, 64][i]} height="13" rx="6.5" fill={`${accent}${i === 0 ? "28" : "14"}`} />
          </g>
        ))}

        {/* Phone 2 (right) */}
        <rect x="200" y="0" width="130" height="220" rx="24" fill="white" stroke={`${accent}20`} strokeWidth="1.5" />
        <rect x="200" y="0" width="130" height="44" rx="24" fill={`${accent}14`} />
        <rect x="200" y="26" width="130" height="18" fill={`${accent}14`} />
        <rect x="238" y="8" width="54" height="13" rx="6.5" fill={`${accent}24`} />
        {/* Chart area */}
        <rect x="212" y="56" width="106" height="80" rx="12" fill={`${accent}08`} />
        {[0.4, 0.7, 0.55, 0.9, 0.65, 0.85].map((h, i) => (
          <rect
            key={i}
            x={218 + i * 16}
            y={128 - Math.round(60 * h)}
            width={11}
            height={Math.round(60 * h)}
            rx={4}
            fill={accent}
            fillOpacity={i === 3 ? 0.8 : 0.28}
          />
        ))}
        {/* Action buttons */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={212 + i * 26} y={148} width={20} height={20} rx={10} fill={`${accent}${i === 0 ? "30" : "14"}`} />
          </g>
        ))}
        {/* List rows */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="222" cy={182 + i * 16} r="7" fill={`${accent}18`} />
            <rect x="234" y={177 + i * 16} width="60" height="7" rx="3.5" fill={`${accent}18`} />
            <rect x="234" y={187 + i * 16} width="38" height="5" rx="2.5" fill={`${accent}10`} />
          </g>
        ))}
      </svg>
    );
  }

  /* Hala — mobile product showcase: phone + floating UI elements */
  return (
    <svg
      width="100%"
      viewBox="0 0 360 220"
      fill="none"
      style={{ display: "block" }}
    >
      {/* Main phone */}
      <rect x="95" y="0" width="130" height="220" rx="24" fill="white" stroke={`${accent}20`} strokeWidth="1.5" />
      <rect x="95" y="0" width="130" height="44" rx="24" fill={`${accent}18`} />
      <rect x="95" y="26" width="130" height="18" fill={`${accent}18`} />
      <rect x="133" y="8" width="54" height="13" rx="6.5" fill={`${accent}30`} />

      {/* Hero image area with gradient */}
      <rect x="107" y="56" width="106" height="82" rx="16" fill={`${accent}20`} />
      <circle cx="160" cy="97" r="26" fill={`${accent}30`} />
      <circle cx="160" cy="97" r="16" fill={accent} fillOpacity="0.75" />
      <polygon points="157,91 157,103 168,97" fill="white" opacity="0.95" />

      {/* Title & CTA */}
      <rect x="107" y="148" width="76" height="10" rx="5" fill={`${accent}35`} />
      <rect x="107" y="162" width="100" height="7" rx="3.5" fill={`${accent}18`} />
      <rect x="107" y="172" width="84" height="7" rx="3.5" fill={`${accent}12`} />

      {/* CTA button */}
      <rect x="107" y="188" width="106" height="28" rx="14" fill={accent} fillOpacity="0.88" />
      <rect x="132" y="197" width="56" height="9" rx="4.5" fill="white" opacity="0.75" />

      {/* Floating card — top left */}
      <rect x="0" y="30" width="86" height="54" rx="16" fill="white"
        style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.10))" }} />
      <rect x="10" y="40" width="32" height="7" rx="3.5" fill={`${accent}28`} />
      <rect x="10" y="52" width="50" height="12" rx="5" fill={`${accent}20`} />
      <rect x="10" y="68" width="26" height="6" rx="3" fill={`${accent}14`} />

      {/* Floating card — bottom right */}
      <rect x="274" y="130" width="82" height="62" rx="16" fill="white"
        style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.10))" }} />
      <circle cx="290" cy="148" r="8" fill={`${accent}28`} />
      <circle cx="290" cy="148" r="4" fill={accent} fillOpacity="0.6" />
      <rect x="304" y="143" width="42" height="7" rx="3.5" fill={`${accent}22`} />
      <rect x="304" y="154" width="32" height="5" rx="2.5" fill={`${accent}14`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon
          key={i}
          points={`${280 + i * 14},172 ${282 + i * 14},166 ${284 + i * 14},172 ${278 + i * 14},168 ${286 + i * 14},168`}
          fill={i < 4 ? accent : `${accent}30`}
          fillOpacity={0.85}
        />
      ))}
    </svg>
  );
}
