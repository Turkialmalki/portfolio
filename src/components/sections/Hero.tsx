"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const MARQUEE_PROJECTS = [
  { title: "BaseBox AI SaaS", tag: "AI · SaaS", accent: "#0091FF" },
  { title: "Munaaseb Fintech", tag: "Fintech · Open Banking", accent: "#00C8A0" },
  { title: "Hala Product", tag: "Product · Innovation", accent: "#FF6B35" },
  { title: "SAP Cloud CX", tag: "Enterprise · CX", accent: "#0070D2" },
  { title: "Lean Technologies", tag: "Open Banking · API", accent: "#9B59B6" },
];
const MARQUEE_TRACK = [...MARQUEE_PROJECTS, ...MARQUEE_PROJECTS];

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
        /* Pure white in light mode (--bg-surface = #FFFFFF), deep dark in dark mode */
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
        transition: "background-color 0.45s ease",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        minHeight: 600,
      }}
    >
      {/* ── Hero grid: copy left, avatar right ── */}
      <div
        className="hero-grid"
        style={{
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "clamp(100px, 13vw, 160px) 32px 32px",
          display: "grid",
          gap: "clamp(40px, 5vw, 80px)",
          alignItems: "center",
          flex: 1,
        }}
      >
        {/* ── LEFT: Copy ── */}
        <div>
          {/* Headline line 1 */}
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={ready ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.08 }}
              style={{
                fontSize: "clamp(40px, 5.8vw, 84px)",
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

          {/* Headline line 2 */}
          <div style={{ overflow: "hidden", marginBottom: 24 }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={ready ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.14 }}
              style={{
                fontSize: "clamp(40px, 5.8vw, 84px)",
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

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.32 }}
            style={{
              fontSize: "clamp(14px, 1.1vw, 16px)",
              color: "#6B7280",
              lineHeight: 1.74,
              maxWidth: 420,
              marginBottom: 40,
              fontWeight: 400,
            }}
          >
            Software Engineering Leader focused on digital transformation,
            enterprise platforms, AI solutions, fintech innovation, and
            scalable system integrations.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.46 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            {/* Primary: blue (#0091FF) */}
            <PillButton color="#0091FF" href="/projects">
              View Portfolio
            </PillButton>
            {/* Secondary: scroll to footer contact */}
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

        {/* ── RIGHT: Avatar visual ── */}
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

      {/* ── Inline Marquee Strip — stays within 100vh ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
        style={{ paddingBottom: 110, overflow: "hidden" }}
      >
        <div className="marquee-container">
          <div className="marquee-track" style={{ gap: 0 }}>
            {MARQUEE_TRACK.map((p, i) => (
              <HeroMarqueeCard key={i} project={p} />
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

/* ── Premium mini project card inside hero viewport ── */
function HeroMarqueeCard({
  project,
}: {
  project: { title: string; tag: string; accent: string };
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRadius: 20,
        margin: "0 10px",
        cursor: "pointer",
        width: 240,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Accent gradient visual area */}
      <div
        style={{
          height: 52,
          background: `linear-gradient(135deg, ${project.accent}18 0%, ${project.accent}0a 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow circles */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: `${project.accent}20`,
            border: `1.5px solid ${project.accent}38`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: project.accent,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 8,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: `${project.accent}10`,
            border: `1px solid ${project.accent}1c`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 6,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: `${project.accent}08`,
          }}
        />
      </div>

      {/* Content footer */}
      <div
        style={{
          background: "var(--bg-surface)",
          padding: "11px 15px 13px",
          transition: "background 0.45s ease",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.018em",
            transition: "color 0.45s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {project.title}
        </p>
        <p
          style={{
            fontSize: 11,
            color: project.accent,
            marginTop: 3,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {project.tag}
        </p>
      </div>
    </motion.div>
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
    /* Shadow tinted to match button color */
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
      {/* Pulsing radial glow rings */}
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

      {/* Main circular avatar */}
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
        {/* Vignette */}
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
