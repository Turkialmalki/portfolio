"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="home"
      ref={ref}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
          display: "grid",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
        }}
        className="hero-grid"
      >
        {/* Left: Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#F9F9FB",
              border: "1px solid #E4E7EC",
              borderRadius: 100,
              padding: "7px 14px",
              marginBottom: 28,
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>👋</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#0D0E12",
                letterSpacing: "-0.01em",
              }}
            >
              Hello! I&apos;m Turki Al-Malki
            </span>
          </div>

          {/* H1 */}
          <h1
            style={{
              fontSize: "clamp(36px, 4.5vw, 64px)",
              fontWeight: 800,
              color: "#0D0E12",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              marginBottom: 20,
            }}
          >
            Senior Creative Developer & Product Designer.
          </h1>

          {/* Sub-headline */}
          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: "#666D80",
              lineHeight: 1.65,
              marginBottom: 36,
              maxWidth: 460,
            }}
          >
            Crafting intuitive and impactful digital products that seamlessly
            bridge user needs and business goals.
          </p>

          {/* CTA */}
          <CTAButton
            onClick={() =>
              document
                .querySelector("#projects")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Portfolio
          </CTAButton>
        </motion.div>

        {/* Right: Headshot / Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid #E4E7EC",
            aspectRatio: "4/5",
            minHeight: 400,
            position: "relative",
          }}
          className="hidden md:block"
        >
          <HeadshotVisual />
        </motion.div>
      </div>

      <style>{`
        .hero-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </section>
  );
}

function CTAButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#0D0E12",
        color: "#FFFFFF",
        padding: "14px 28px",
        borderRadius: 100,
        fontSize: 15,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
        width: "fit-content",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "0.85";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {children}
      <span style={{ fontSize: 16, marginLeft: 2 }}>→</span>
    </button>
  );
}

function HeadshotVisual() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Base gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, #EEF0F7 0%, #E2E6F0 40%, #D8DDED 100%)",
        }}
      />

      {/* Soft light source top-right */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.65) 0%, transparent 70%)",
        }}
      />

      {/* Abstract presence silhouette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "62%",
          height: "72%",
          background:
            "linear-gradient(180deg, #B8C4DC 0%, #9AAAC8 50%, #7D93B8 100%)",
          borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
          opacity: 0.55,
        }}
      />

      {/* Inner glow center */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translate(-50%, 0)",
          width: 120,
          height: 140,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Top decoration lines */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <div
          style={{
            height: 3,
            width: 72,
            background: "rgba(13,14,18,0.08)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            height: 3,
            width: 48,
            background: "rgba(13,14,18,0.05)",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Status pill */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 100,
          padding: "6px 12px",
          border: "1px solid rgba(228,231,236,0.8)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#22C55E",
            display: "block",
            boxShadow: "0 0 6px rgba(34,197,94,0.6)",
          }}
        />
        <span
          style={{ fontSize: 11, fontWeight: 600, color: "#0D0E12" }}
        >
          Available
        </span>
      </div>

      {/* Name card */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "14px 16px",
          border: "1px solid rgba(228,231,236,0.7)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0D0E12",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Turki Al-Malki
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#666D80",
            margin: "3px 0 0",
            fontWeight: 400,
          }}
        >
          Creative Developer & Product Designer
        </p>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 6,
          }}
        >
          {["Next.js", "Figma", "Framer"].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#666D80",
                background: "#F9F9FB",
                border: "1px solid #E4E7EC",
                borderRadius: 100,
                padding: "2px 8px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
