"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Hero() {
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
      style={{ backgroundColor: "#F5F5F3", overflow: "hidden" }}
    >
      <div
        className="hero-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding:
            "clamp(130px, 15vw, 200px) 32px clamp(100px, 12vw, 160px)",
          display: "grid",
          gap: "clamp(56px, 7vw, 100px)",
          alignItems: "center",
        }}
      >
        {/* ── LEFT: Copy ── */}
        <div>
          {/* Availability badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 40,
              background: "rgba(0,0,0,0.05)",
              borderRadius: 100,
              padding: "7px 16px",
              border: "1px solid rgba(0,0,0,0.07)",
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22C55E",
                boxShadow: "0 0 9px rgba(34,197,94,0.55)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#6B7280",
                letterSpacing: "-0.01em",
              }}
            >
              Available for work
            </span>
          </motion.div>

          {/* Headline line 1 */}
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.08 }}
              style={{
                fontSize: "clamp(44px, 6.2vw, 88px)",
                fontWeight: 800,
                color: "#0D0E12",
                lineHeight: 1.05,
                letterSpacing: "-0.042em",
                display: "block",
              }}
            >
              Hello! 👋
            </motion.h1>
          </div>

          {/* Headline line 2 */}
          <div style={{ overflow: "hidden", marginBottom: 32 }}>
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.14 }}
              style={{
                fontSize: "clamp(44px, 6.2vw, 88px)",
                fontWeight: 800,
                color: "#0D0E12",
                lineHeight: 1.05,
                letterSpacing: "-0.042em",
                display: "block",
              }}
            >
              I&apos;m Turki Almalki
            </motion.h1>
          </div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.32 }}
            style={{
              fontSize: "clamp(15px, 1.15vw, 17px)",
              color: "#6B7280",
              lineHeight: 1.74,
              maxWidth: 430,
              marginBottom: 52,
              fontWeight: 400,
            }}
          >
            An engineering leader and designer based in Riyadh, SA. With over
            6+ years of experience driving digital excellence and system
            integrations.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.46 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <PillButton
              color="#0091FF"
              onClick={() =>
                document
                  .querySelector("#projects")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Portfolio
            </PillButton>
            <PillButton
              color="#0D0E12"
              onClick={() =>
                document
                  .querySelector("footer")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Let&apos;s Connect
            </PillButton>
          </motion.div>
        </div>

        {/* ── RIGHT: Avatar visual ── */}
        <motion.div
          className="hidden md:flex"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
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

      <style>{`
        .hero-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1.12fr 0.88fr;
          }
        }
      `}</style>
    </section>
  );
}

/* ── Pill CTA button ── */
function PillButton({
  children,
  onClick,
  color,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, filter: "brightness(1.08)" }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: color,
        color: "#FFFFFF",
        padding: "14px 30px",
        borderRadius: 100,
        fontSize: 14,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: "-0.012em",
        whiteSpace: "nowrap",
        boxShadow:
          color === "#0091FF"
            ? "0 8px 24px rgba(0,145,255,0.35)"
            : "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ── Memoji-style avatar with teal/blue glow ── */
function AvatarVisual() {
  return (
    <div style={{ position: "relative", width: 340, height: 340 }}>
      {/* Pulsing outer glow rings */}
      {([1.55, 1.32, 1.12] as const).map((scale, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [scale, scale * 1.05, scale],
            opacity: [0.12, 0.2, 0.12],
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
            background: `radial-gradient(circle, rgba(0,145,255,${0.22 - i * 0.05}) 0%, rgba(0,200,200,${0.1 - i * 0.02}) 45%, transparent 70%)`,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        />
      ))}

      {/* Main avatar circle — real photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow:
            "0 28px 72px rgba(0,145,255,0.4), 0 8px 32px rgba(0,145,255,0.18)",
          border: "3px solid rgba(0,145,255,0.25)",
        }}
      >
        <Image
          src="/avatar.jpg"
          alt="Turki Almalki"
          fill
          priority
          sizes="340px"
          style={{
            objectFit: "cover",
            objectPosition: "center 12%",
          }}
        />
        {/* Subtle vignette to blend edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.18) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Floating card — name + role */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, ease: EASE, delay: 1.05 }}
        style={{
          position: "absolute",
          bottom: 12,
          right: -24,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 18,
          padding: "14px 18px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 36px rgba(0,0,0,0.09)",
          minWidth: 160,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0D0E12",
            letterSpacing: "-0.02em",
          }}
        >
          Turki Almalki
        </p>
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 3, fontWeight: 400 }}>
          📍 Riyadh, Saudi Arabia
        </p>
      </motion.div>

      {/* Floating card — experience */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, ease: EASE, delay: 1.25 }}
        style={{
          position: "absolute",
          top: 20,
          left: -28,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 18,
          padding: "14px 18px",
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
          6+
        </p>
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, fontWeight: 400 }}>
          Years Experience
        </p>
      </motion.div>
    </div>
  );
}
