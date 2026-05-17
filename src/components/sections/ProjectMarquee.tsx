"use client";

import { motion } from "framer-motion";

const PROJECTS = [
  {
    title: "BaseBox",
    tag: "AI SaaS System Template",
    accent: "#0091FF",
    bg: "linear-gradient(148deg, #EAF4FF 0%, #D0E9FF 100%)",
    darkBg: "linear-gradient(148deg, #061222 0%, #091A30 100%)",
    visual: "dashboard" as const,
  },
  {
    title: "Munaaseb",
    tag: "Fintech & Open Banking",
    accent: "#00C8A0",
    bg: "linear-gradient(148deg, #E6FAF6 0%, #C8F0E6 100%)",
    darkBg: "linear-gradient(148deg, #06181A 0%, #09201E 100%)",
    visual: "fintech" as const,
  },
  {
    title: "Hala",
    tag: "Product Innovation",
    accent: "#FF6B35",
    bg: "linear-gradient(148deg, #FFF1EC 0%, #FFE2D4 100%)",
    darkBg: "linear-gradient(148deg, #1C0D06 0%, #261208 100%)",
    visual: "mobile" as const,
  },
  {
    title: "SAP Cloud CX",
    tag: "Enterprise · Full Digital CX",
    accent: "#0070D2",
    bg: "linear-gradient(148deg, #EAF0FD 0%, #D4E2F9 100%)",
    darkBg: "linear-gradient(148deg, #060D1C 0%, #091228 100%)",
    visual: "enterprise" as const,
  },
  {
    title: "Lean Technologies",
    tag: "Open Banking Excellence",
    accent: "#9B59B6",
    bg: "linear-gradient(148deg, #F3EEFA 0%, #E8D8F5 100%)",
    darkBg: "linear-gradient(148deg, #110C1A 0%, #180F24 100%)",
    visual: "network" as const,
  },
];

const TRACK = [...PROJECTS, ...PROJECTS];

export default function ProjectMarquee() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-surface)",
        overflowX: "clip",
        overflowY: "visible",
        padding: "48px 0 72px",
        transition: "background-color 0.45s ease",
      }}
    >
    </section>
  );
}

type Project = (typeof PROJECTS)[number];

function MarqueeCard({ project }: { project: Project }) {
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -10 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="project-card"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        aspectRatio: "16 / 10",
        borderRadius: 28,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        flexShrink: 0,
        overflow: "hidden",
        margin: "0 16px",
        cursor: "pointer",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        transition: "background 0.45s ease",
        position: "relative",
      }}
    >
      {/* Colored top accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${project.accent} 0%, ${project.accent}88 100%)`,
        }}
      />

      {/* Visual fill area */}
      <div
        style={{
          flex: 1,
          background: project.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Radial highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 60% 30%, ${project.accent}22 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        <MockupVisual accent={project.accent} type={project.visual} />
      </div>

      {/* Card footer */}
      <div
        style={{
          padding: "18px 28px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          borderTop: `1px solid ${project.accent}18`,
          flexShrink: 0,
          backgroundColor: "var(--bg-surface)",
          transition: "background-color 0.45s ease",
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

        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.026em",
              lineHeight: 1.2,
              transition: "color 0.45s ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.title}
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary)",
              letterSpacing: "-0.01em",
              transition: "color 0.45s ease",
            }}
          >
            {project.tag}
          </span>
        </div>

        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
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
              whiteSpace: "nowrap",
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
  type: "dashboard" | "fintech" | "mobile" | "enterprise" | "network";
}) {
  if (type === "dashboard") {
    return (
      <svg
        width="100%"
        viewBox="0 0 460 240"
        fill="none"
        style={{ display: "block", borderRadius: 16, overflow: "hidden" }}
      >
        <rect x="0" y="0" width="460" height="240" rx="14" fill="white" fillOpacity="0.85" />
        <rect x="0" y="0" width="460" height="32" rx="14" fill={`${accent}18`} />
        <rect x="0" y="18" width="460" height="14" fill={`${accent}18`} />
        {[14, 24, 34].map((x, i) => (
          <circle key={i} cx={x} cy="14" r="4" fill={["#FF5F57", "#FFBD2E", "#28CA41"][i]} />
        ))}
        <rect x="80" y="7" width="200" height="14" rx="7" fill="white" fillOpacity="0.7" />
        <rect x="90" y="11" width="80" height="6" rx="3" fill={`${accent}30`} />
        <rect x="0" y="32" width="70" height="208" fill={`${accent}08`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="12" y={50 + i * 28} width="46" height="18" rx="9" fill={i === 0 ? `${accent}28` : `${accent}10`} />
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={82 + i * 120} y={42} width={108} height={52} rx={12} fill={i === 0 ? `${accent}22` : `${accent}0A`} />
            <rect x={94 + i * 120} y={52} width={50} height={7} rx={3.5} fill={`${accent}35`} />
            <rect x={94 + i * 120} y={64} width={72} height={14} rx={5} fill={`${accent}${i === 0 ? "60" : "25"}`} />
            <rect x={94 + i * 120} y={82} width={36} height={5} rx={2.5} fill={`${accent}20`} />
          </g>
        ))}
        <rect x="82" y="106" width="238" height="118" rx="12" fill={`${accent}06`} />
        <line x1="82" y1="200" x2="320" y2="200" stroke={`${accent}20`} strokeWidth="1" />
        {[0.32, 0.58, 0.44, 0.82, 0.66, 0.90, 0.74, 0.96].map((h, i) => (
          <rect key={i} x={96 + i * 28} y={200 - Math.round(78 * h)} width={18} height={Math.round(78 * h)} rx={5}
            fill={accent} fillOpacity={i === 7 ? 0.85 : 0.22 + i * 0.04} />
        ))}
        <polyline points="105,168 133,147 161,157 189,122 217,134 245,116 273,128 301,108"
          stroke={accent} strokeWidth="2.5" fill="none" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="301" cy="108" r="5" fill={accent} fillOpacity="0.85" />
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
    return (
      <svg width="100%" viewBox="0 0 360 220" fill="none" style={{ display: "block" }}>
        <rect x="30" y="0" width="130" height="220" rx="24" fill="white" fillOpacity="0.9" stroke={`${accent}20`} strokeWidth="1.5" />
        <rect x="30" y="0" width="130" height="44" rx="24" fill={`${accent}22`} />
        <rect x="30" y="26" width="130" height="18" fill={`${accent}22`} />
        <rect x="68" y="8" width="54" height="13" rx="6.5" fill={`${accent}40`} />
        <rect x="42" y="56" width="106" height="60" rx="14" fill={`${accent}22`} />
        <rect x="52" y="65" width="44" height="8" rx="4" fill={`${accent}50`} />
        <rect x="52" y="78" width="66" height="16" rx="6" fill={`${accent}70`} />
        <rect x="52" y="98" width="36" height="7" rx="3.5" fill={`${accent}35`} />
        <polyline points="42,148 62,138 82,143 102,126 122,134 142,118 152,122"
          stroke={accent} strokeWidth="2.5" fill="none" strokeOpacity="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="152" cy="122" r="5" fill={accent} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="42" y={166 + i * 18} width="106" height="13" rx="6.5" fill={`${accent}${i === 0 ? "18" : "0A"}`} />
            <rect x="42" y={166 + i * 18} width={[74, 54, 64][i]} height="13" rx="6.5" fill={`${accent}${i === 0 ? "28" : "14"}`} />
          </g>
        ))}
        <rect x="200" y="0" width="130" height="220" rx="24" fill="white" fillOpacity="0.9" stroke={`${accent}20`} strokeWidth="1.5" />
        <rect x="200" y="0" width="130" height="44" rx="24" fill={`${accent}14`} />
        <rect x="200" y="26" width="130" height="18" fill={`${accent}14`} />
        <rect x="238" y="8" width="54" height="13" rx="6.5" fill={`${accent}24`} />
        <rect x="212" y="56" width="106" height="80" rx="12" fill={`${accent}08`} />
        {[0.4, 0.7, 0.55, 0.9, 0.65, 0.85].map((h, i) => (
          <rect key={i} x={218 + i * 16} y={128 - Math.round(60 * h)} width={11} height={Math.round(60 * h)} rx={4}
            fill={accent} fillOpacity={i === 3 ? 0.8 : 0.28} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={212 + i * 26} y={148} width={20} height={20} rx={10} fill={`${accent}${i === 0 ? "30" : "14"}`} />
        ))}
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

  if (type === "mobile") {
    return (
      <svg width="100%" viewBox="0 0 360 220" fill="none" style={{ display: "block" }}>
        <rect x="95" y="0" width="130" height="220" rx="24" fill="white" fillOpacity="0.9" stroke={`${accent}20`} strokeWidth="1.5" />
        <rect x="95" y="0" width="130" height="44" rx="24" fill={`${accent}22`} />
        <rect x="95" y="26" width="130" height="18" fill={`${accent}22`} />
        <rect x="133" y="8" width="54" height="13" rx="6.5" fill={`${accent}40`} />
        <rect x="107" y="56" width="106" height="82" rx="16" fill={`${accent}20`} />
        <circle cx="160" cy="97" r="26" fill={`${accent}30`} />
        <circle cx="160" cy="97" r="16" fill={accent} fillOpacity="0.75" />
        <polygon points="157,91 157,103 168,97" fill="white" opacity="0.95" />
        <rect x="107" y="148" width="76" height="10" rx="5" fill={`${accent}35`} />
        <rect x="107" y="162" width="100" height="7" rx="3.5" fill={`${accent}18`} />
        <rect x="107" y="172" width="84" height="7" rx="3.5" fill={`${accent}12`} />
        <rect x="107" y="188" width="106" height="28" rx="14" fill={accent} fillOpacity="0.88" />
        <rect x="132" y="197" width="56" height="9" rx="4.5" fill="white" opacity="0.75" />
        <rect x="0" y="30" width="86" height="54" rx="16" fill="white" fillOpacity="0.95"
          style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.10))" }} />
        <rect x="10" y="40" width="32" height="7" rx="3.5" fill={`${accent}28`} />
        <rect x="10" y="52" width="50" height="12" rx="5" fill={`${accent}20`} />
        <rect x="10" y="68" width="26" height="6" rx="3" fill={`${accent}14`} />
        <rect x="274" y="130" width="82" height="62" rx="16" fill="white" fillOpacity="0.95"
          style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.10))" }} />
        <circle cx="290" cy="148" r="8" fill={`${accent}28`} />
        <circle cx="290" cy="148" r="4" fill={accent} fillOpacity="0.6" />
        <rect x="304" y="143" width="42" height="7" rx="3.5" fill={`${accent}22`} />
        <rect x="304" y="154" width="32" height="5" rx="2.5" fill={`${accent}14`} />
      </svg>
    );
  }

  if (type === "enterprise") {
    /* SAP-style: layered cloud architecture diagram */
    return (
      <svg width="100%" viewBox="0 0 460 240" fill="none" style={{ display: "block", borderRadius: 16 }}>
        <rect x="0" y="0" width="460" height="240" rx="14" fill="white" fillOpacity="0.85" />
        {/* Top bar */}
        <rect x="0" y="0" width="460" height="32" rx="14" fill={`${accent}14`} />
        <rect x="0" y="18" width="460" height="14" fill={`${accent}14`} />
        <rect x="16" y="10" width="80" height="12" rx="6" fill={`${accent}30`} />
        <rect x="108" y="10" width="60" height="12" rx="6" fill={`${accent}18`} />
        <rect x="180" y="10" width="60" height="12" rx="6" fill={`${accent}18`} />
        {/* Cloud hub */}
        <ellipse cx="230" cy="130" rx="52" ry="38" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" />
        <ellipse cx="230" cy="130" rx="30" ry="22" fill={`${accent}28`} />
        <text x="230" y="135" textAnchor="middle" fontSize="12" fontWeight="700" fill={accent} fillOpacity="0.85">CX</text>
        {/* Satellite nodes */}
        {[
          { cx: 80, cy: 90, label: "Sales" },
          { cx: 80, cy: 160, label: "Service" },
          { cx: 380, cy: 90, label: "Commerce" },
          { cx: 380, cy: 160, label: "Marketing" },
          { cx: 230, cy: 48, label: "Data" },
        ].map(({ cx, cy, label }, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={230} y2={130} stroke={accent} strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 3" />
            <rect x={cx - 30} y={cy - 16} width={60} height={32} rx={10} fill={`${accent}14`} stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="10" fontWeight="600" fill={accent} fillOpacity="0.75">{label}</text>
          </g>
        ))}
        {/* Bottom legend */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={62 + i * 120} y={210} width={100} height={14} rx={7} fill={`${accent}${i === 0 ? "20" : "0C"}`} />
          </g>
        ))}
      </svg>
    );
  }

  /* network — Lean Technologies: connected nodes graph */
  const nodes: [number, number][] = [[230, 70], [120, 130], [340, 130], [160, 200], [300, 200], [230, 160]];
  const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
  return (
    <svg width="100%" viewBox="0 0 460 240" fill="none" style={{ display: "block", borderRadius: 16 }}>
      <rect x="0" y="0" width="460" height="240" rx="14" fill="white" fillOpacity="0.85" />
      <rect x="0" y="0" width="460" height="32" rx="14" fill={`${accent}10`} />
      <rect x="0" y="18" width="460" height="14" fill={`${accent}10`} />
      <rect x="16" y="10" width="90" height="12" rx="6" fill={`${accent}28`} />
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={accent} strokeWidth="1.5" strokeOpacity="0.22" />
      ))}
      {nodes.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={i === 0 ? 22 : i === 5 ? 18 : 14}
            fill={`${accent}${i === 0 ? "28" : "14"}`}
            stroke={accent} strokeWidth="1.5" strokeOpacity={i === 0 ? 0.7 : 0.3} />
          <circle cx={cx} cy={cy} r={i === 0 ? 10 : 6}
            fill={accent} fillOpacity={i === 0 ? 0.7 : 0.35} />
        </g>
      ))}
      {/* Pulse ring on hub */}
      <circle cx="230" cy="70" r="34" stroke={accent} strokeWidth="1" strokeOpacity="0.15" fill="none" />
      {/* Labels */}
      {[
        [230, 218, "Saudi Banks"],
        [62, 218, "Open API"],
        [370, 218, "Real-time Data"],
      ].map(([x, y, label], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" fontSize="10" fontWeight="500" fill={accent} fillOpacity="0.55">
          {label}
        </text>
      ))}
    </svg>
  );
}
