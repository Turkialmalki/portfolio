"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PROJECTS = [
  {
    title: "BaseBox AI SaaS",
    tag: "AI · SaaS Platform",
    accent: "#0080FF",
    cardBg: "#EEF4FF",
    image: null as string | null,
  },
  {
    title: "Munaaseb Fintech",
    tag: "Fintech · Open Banking",
    accent: "#00A87A",
    cardBg: "#EDFAF6",
    image: null as string | null,
  },
  {
    title: "Lean Technologies",
    tag: "Enterprise · Digital",
    accent: "#FFFFFF",
    cardBg: "#0F0A1A",
    image: "/1.jpg" as string | null,
  },
  {
    title: "SAP Cloud CX",
    tag: "Enterprise · CX Suite",
    accent: "#0057B8",
    cardBg: "#EEF2FF",
    image: null as string | null,
  },
  {
    title: "Hala Product",
    tag: "Product · Innovation",
    accent: "#E8541E",
    cardBg: "#FFF4EE",
    image: null as string | null,
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
          padding: "clamp(88px, 11vw, 132px) clamp(24px, 4vw, 32px) 20px",
          display: "grid",
          gap: "clamp(40px, 5vw, 80px)",
          alignItems: "center",
        }}
      >
        {/* LEFT: Copy */}
        <div>
          {/* Mobile-only avatar — hidden on md+ where the right column appears */}
          <motion.div
            className="flex justify-center mb-6 md:hidden"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2.5px solid rgba(0,145,255,0.28)",
                boxShadow: "0 8px 32px rgba(0,145,255,0.25)",
                flexShrink: 0,
              }}
            >
              <Image
                src="/avatar.jpg"
                alt="Turki Almalki"
                width={100}
                height={100}
                priority
                style={{ objectFit: "cover", objectPosition: "center 12%" }}
              />
            </div>
          </motion.div>

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

      {/* ── Two-row infinite image gallery ── */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.95, ease: EASE, delay: 0.68 }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
          paddingBottom: 100,
          overflow: "hidden",
        }}
      >
        {/* Row 1: scrolls left */}
        <div className="marquee-container marquee-edges">
          <div className="marquee-track">
            {ROW_1.map((p, i) => (
              <LargeProjectCard key={i} project={p} index={i % PROJECTS.length} />
            ))}
          </div>
        </div>

        {/* Row 2: scrolls right */}
        <div className="marquee-container marquee-edges">
          <div className="marquee-track-right">
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

/* ── Premium image-forward project card ── */
function LargeProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const isPhoto = Boolean(project.image);

  return (
    <div
      className="project-card"
      style={{
        background: project.cardBg,
        boxShadow: isPhoto
          ? "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)"
          : "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        position: "relative",
      }}
    >
      {isPhoto ? (
        /* ── Full-bleed photo card ── */
        <>
          <Image
            src={project.image!}
            alt={project.title}
            fill
            sizes="560px"
            style={{ objectFit: "cover", objectPosition: "center 28%" }}
            priority={false}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.72) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.75)",
                background: "rgba(255,255,255,0.14)",
                borderRadius: 100,
                padding: "3px 10px",
                marginBottom: 7,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {project.tag}
            </span>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              {project.title}
            </h3>
          </div>
        </>
      ) : (
        /* ── Light card with inset mockup window ── */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Inset screenshot window */}
          <div
            style={{
              margin: "10px 10px 0",
              borderRadius: 18,
              overflow: "hidden",
              flex: 1,
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <ProjectMockup index={index} accent={project.accent} />
          </div>

          {/* Label strip */}
          <div style={{ padding: "14px 18px 18px", flexShrink: 0 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                color: project.accent,
                background: `${project.accent}18`,
                borderRadius: 100,
                padding: "3px 9px",
                marginBottom: 5,
              }}
            >
              {project.tag}
            </span>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0D0E12",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              {project.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Per-project light-background SVG mockups ── */
function ProjectMockup({ index, accent: a }: { index: number; accent: string }) {
  /* index 0: BaseBox AI — clean SaaS dashboard */
  if (index === 0) {
    return (
      <svg viewBox="0 0 560 218" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect width="560" height="218" fill="#FAFBFF" />

        {/* Sidebar */}
        <rect width="50" height="218" fill="#EEF0F8" />
        <rect x="13" y="13" width="24" height="24" rx="7" fill={a} />
        {[52, 84, 116, 148, 180].map((y, i) => (
          <g key={y}>
            <rect x="13" y={y} width="24" height="20" rx="5" fill={i === 0 ? `${a}20` : "transparent"} />
            <rect x="17" y={y + 7} width="16" height="6" rx="3" fill={i === 0 ? a : "#BCC4D8"} opacity={i === 0 ? 0.9 : 0.6} />
          </g>
        ))}
        <rect x="0" y="52" width="3" height="20" rx="1.5" fill={a} />
        <line x1="50" y1="0" x2="50" y2="218" stroke="#E4E8F0" strokeWidth="1" />

        {/* Top bar */}
        <rect x="50" width="510" height="42" fill="white" />
        <line x1="50" y1="42" x2="560" y2="42" stroke="#E4E8F0" strokeWidth="1" />
        <rect x="62" y="14" width="96" height="14" rx="5" fill="#111827" opacity="0.78" />
        <rect x="452" y="13" width="62" height="16" rx="8" fill={a} />
        <circle cx="534" cy="21" r="9" fill="#EEF0F8" />
        <circle cx="534" cy="21" r="5" fill="#BCC4D8" opacity="0.7" />

        {/* Stat cards */}
        {[0, 1, 2].map(i => {
          const x = 62 + i * 162;
          return (
            <g key={i}>
              <rect x={x} y="54" width="150" height="60" rx="10" fill={i === 0 ? `${a}0E` : "white"} stroke={i === 0 ? `${a}28` : "#E8ECF4"} strokeWidth="1" />
              <rect x={x + 12} y="65" width="42" height="6" rx="3" fill="#9CA3AF" />
              <rect x={x + 12} y="77" width={i === 0 ? 64 : 50} height="14" rx="4" fill={i === 0 ? a : "#111827"} opacity={i === 0 ? 0.88 : 0.72} />
              <rect x={x + 12} y="98" width="28" height="7" rx="3.5" fill="#ECFDF5" />
              <rect x={x + 17} y="101" width="16" height="1" rx="0.5" fill="#10B981" />
            </g>
          );
        })}

        {/* Area chart */}
        <rect x="62" y="126" width="486" height="80" rx="10" fill="white" stroke="#E8ECF4" strokeWidth="1" />
        {[140, 154, 168, 182, 196].map(y => (
          <line key={y} x1="76" y1={y} x2="536" y2={y} stroke="#F3F4F6" strokeWidth="1" />
        ))}
        <path
          d="M76,198 C114,186 152,192 200,176 C248,160 280,168 320,152 C360,136 400,144 440,126 C476,111 508,118 536,104"
          stroke={a} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M76,198 C114,186 152,192 200,176 C248,160 280,168 320,152 C360,136 400,144 440,126 C476,111 508,118 536,104 L536,198 Z"
          fill={`${a}10`}
        />
        <circle cx="320" cy="152" r="3.5" fill={a} />
        <circle cx="536" cy="104" r="3.5" fill={a} />
        <rect x="304" y="136" width="38" height="13" rx="5" fill={a} />
        <rect x="309" y="141" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
      </svg>
    );
  }

  /* index 1: Munaaseb Fintech — banking app */
  if (index === 1) {
    const bars = [0.44, 0.6, 0.5, 0.76, 0.64, 0.88, 0.72, 0.94, 0.82, 0.98, 0.86, 1.0];
    const barW = 30, gap = 14, startX = 20;
    return (
      <svg viewBox="0 0 560 218" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect width="560" height="218" fill="white" />

        {/* Balance card */}
        <rect x="16" y="12" width="260" height="72" rx="14" fill={`${a}10`} stroke={`${a}20`} strokeWidth="1" />
        <rect x="28" y="24" width="56" height="6" rx="3" fill="#9CA3AF" />
        <rect x="28" y="36" width="130" height="18" rx="5" fill="#111827" opacity="0.85" />
        <rect x="28" y="62" width="38" height="10" rx="5" fill="#ECFDF5" />
        <rect x="33" y="65" width="24" height="4" rx="2" fill="#10B981" />

        {/* Period tabs */}
        <rect x="16" y="96" width="40" height="14" rx="7" fill={a} />
        <rect x="62" y="96" width="48" height="14" rx="7" fill="#F3F4F6" />
        <rect x="116" y="96" width="38" height="14" rx="7" fill="#F3F4F6" />
        <rect x="21" y="100" width="28" height="5" rx="2.5" fill="white" />
        <rect x="68" y="100" width="36" height="5" rx="2.5" fill="#9CA3AF" />
        <rect x="121" y="100" width="26" height="5" rx="2.5" fill="#9CA3AF" />

        {/* Bar chart */}
        {bars.map((h, i) => (
          <rect
            key={i}
            x={startX + i * (barW + gap)}
            y={178 - h * 60}
            width={barW}
            height={h * 60}
            rx="6"
            fill={i === 11 ? a : `${a}35`}
          />
        ))}

        {/* Transactions */}
        {[["Salary", "+SAR 18,500"], ["Rent", "-SAR 3,200"], ["Transfer", "+SAR 5,000"]].map(([_name, amt], i) => (
          <g key={i}>
            <rect x="300" y={20 + i * 60} width="246" height="52" rx="10" fill={i % 2 === 0 ? "#FAFBFF" : "white"} stroke="#F0F2F8" strokeWidth="1" />
            <rect x="316" y={32 + i * 60} width="28" height="28" rx="8" fill={`${a}15`} />
            <rect x="352" y={34 + i * 60} width={60 - i * 8} height="7" rx="3.5" fill="#111827" opacity="0.7" />
            <rect x="352" y={46 + i * 60} width="40" height="5" rx="2.5" fill="#9CA3AF" />
            <rect x="468" y={36 + i * 60} width="62" height="7" rx="3.5" fill={amt.startsWith("+") ? "#10B981" : "#EF4444"} opacity="0.8" />
          </g>
        ))}
      </svg>
    );
  }

  /* index 3: SAP Cloud CX — enterprise CRM */
  if (index === 3) {
    return (
      <svg viewBox="0 0 560 218" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect width="560" height="218" fill="white" />

        {/* Top navigation */}
        <rect width="560" height="44" fill={`${a}0C`} />
        <rect x="0" y="44" width="560" height="1" fill={`${a}20`} />
        <rect x="14" y="15" width="30" height="14" rx="5" fill={a} opacity="0.9" />
        {[56, 96, 136, 176].map(x => (
          <rect key={x} x={x} y="17" width="28" height="10" rx="4" fill={`${a}30`} />
        ))}
        <rect x="460" y="14" width="60" height="16" rx="8" fill={a} />
        <circle cx="540" cy="22" r="10" fill={`${a}20`} />
        <circle cx="540" cy="22" r="6" fill={`${a}40`} />

        {/* Table header */}
        <rect x="0" y="44" width="560" height="26" fill="#F8F9FC" />
        {[16, 140, 248, 346, 436].map((x, i) => (
          <rect key={x} x={x} y="53" width={[100, 86, 72, 62, 52][i]} height="8" rx="4" fill="#9CA3AF" />
        ))}

        {/* Table rows */}
        {[0, 1, 2, 3, 4].map(row => {
          const y = 70 + row * 28;
          const statuses = ["Active", "New", "Pending", "Active", "Closed"];
          const statusColors = [a, "#10B981", "#F59E0B", a, "#6B7280"];
          const statusBgs = [`${a}15`, "#ECFDF5", "#FFFBEB", `${a}15`, "#F3F4F6"];
          return (
            <g key={row}>
              <rect x="0" y={y} width="560" height="28" fill={row % 2 === 0 ? "white" : "#FAFBFF"} />
              <circle cx="28" cy={y + 14} r="10" fill={`${a}18`} />
              <rect x="42" y={y + 10} width={80 - row * 6} height="8" rx="4" fill="#374151" opacity="0.75" />
              <rect x="148" y={y + 10} width="68" height="8" rx="4" fill="#9CA3AF" />
              <rect x="256" y={y + 10} width="60" height="8" rx="4" fill="#9CA3AF" />
              <rect x="348" y={y + 7} width="52" height="14" rx="7" fill={statusBgs[row]} />
              <rect x="356" y={y + 11} width={statuses[row].length * 4.2} height="6" rx="3" fill={statusColors[row]} opacity="0.8" />
              <rect x="444" y={y + 10} width="48" height="8" rx="4" fill="#D1D5DB" />
            </g>
          );
        })}
      </svg>
    );
  }

  /* index 4: Hala Product — marketing landing page */
  return (
    <svg viewBox="0 0 560 218" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" fill="none">
      <rect width="560" height="218" fill="white" />

      {/* Nav */}
      <rect width="560" height="40" fill="white" />
      <line x1="0" y1="40" x2="560" y2="40" stroke="#F0F2F6" strokeWidth="1" />
      <rect x="16" y="13" width="32" height="14" rx="5" fill={a} opacity="0.9" />
      {[64, 102, 140, 178].map(x => (
        <rect key={x} x={x} y="15" width="26" height="10" rx="4" fill="#E5E7EB" />
      ))}
      <rect x="474" y="12" width="70" height="16" rx="8" fill={a} />

      {/* Hero section */}
      <rect x="30" y="58" width="224" height="18" rx="6" fill="#111827" opacity="0.86" />
      <rect x="30" y="82" width="200" height="18" rx="6" fill="#111827" opacity="0.72" />
      <rect x="30" y="106" width="290" height="8" rx="4" fill="#D1D5DB" />
      <rect x="30" y="118" width="260" height="8" rx="4" fill="#E5E7EB" />

      {/* CTA buttons */}
      <rect x="30" y="134" width="100" height="22" rx="11" fill={a} />
      <rect x="138" y="134" width="84" height="22" rx="11" fill="transparent" stroke="#D1D5DB" strokeWidth="1.5" />
      <rect x="40" y="140" width="72" height="10" rx="3" fill="white" opacity="0.9" />
      <rect x="148" y="140" width="60" height="10" rx="3" fill="#6B7280" />

      {/* Feature cards */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x={30 + i * 110} y="168" width="100" height="40" rx="10" fill="#FAFBFF" stroke="#E8ECF4" strokeWidth="1" />
          <rect x={40 + i * 110} y="178" width="14" height="14" rx="4" fill={`${a}20`} />
          <rect x={59 + i * 110} y="180" width={50 - i * 6} height="6" rx="3" fill="#374151" opacity="0.7" />
          <rect x={59 + i * 110} y="190" width={38 - i * 4} height="5" rx="2.5" fill="#9CA3AF" />
        </g>
      ))}

      {/* Decorative illustration right */}
      <circle cx="450" cy="130" r="58" fill={`${a}08`} stroke={`${a}15`} strokeWidth="1" />
      <circle cx="450" cy="130" r="38" fill={`${a}12`} stroke={`${a}20`} strokeWidth="1" />
      <circle cx="450" cy="130" r="20" fill={`${a}25`} />
      <circle cx="450" cy="130" r="8" fill={`${a}60`} />
      {([[0, -38], [38, 0], [0, 38], [-38, 0]] as [number, number][]).map(([dx, dy], i) => (
        <circle key={i} cx={450 + dx} cy={130 + dy} r="7" fill={`${a}30`} stroke={`${a}40`} strokeWidth="1" />
      ))}
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
