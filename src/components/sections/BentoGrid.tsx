"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const TECH_ICONS = [
  { name: "Java", bg: "#E76F00", fg: "#FFFFFF", symbol: "☕" },
  { name: "Go", bg: "#00ADD8", fg: "#FFFFFF", symbol: "Go" },
  { name: "K8s", bg: "#326CE5", fg: "#FFFFFF", symbol: "⚙" },
  { name: "React", bg: "#20232A", fg: "#61DAFB", symbol: "⚛" },
  { name: "SAP", bg: "#0070D2", fg: "#FFFFFF", symbol: "S" },
];

export default function BentoGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" ref={ref} style={{ backgroundColor: "#F5F5F3" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(80px, 11vw, 140px) 32px",
        }}
      >
        {/* Header */}
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
            marginBottom: 14,
          }}
        >
          About Me
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
            marginBottom: 52,
          }}
        >
          Engineering at the edge of design.
        </motion.h2>

        {/* 5-card bento grid */}
        <div className="bento-grid-outer">
          {/* Row 1 */}
          <div className="bento-row-1">
            {/* Card 1: 6+ years */}
            <BentoCard inView={inView} delay={0.1} className="bento-card-experience">
              <ExperienceCard />
            </BentoCard>

            {/* Card 2: Tech skills */}
            <BentoCard inView={inView} delay={0.18} className="bento-card-tech">
              <TechCard />
            </BentoCard>
          </div>

          {/* Row 2 */}
          <div className="bento-row-2">
            {/* Card 3: Engineering Leader */}
            <BentoCard inView={inView} delay={0.26} className="bento-card-leader">
              <LeaderCard />
            </BentoCard>

            {/* Card 4: 95% Quality */}
            <BentoCard inView={inView} delay={0.32} className="bento-card-quality">
              <QualityCard />
            </BentoCard>

            {/* Card 5: Stats */}
            <BentoCard inView={inView} delay={0.38} className="bento-card-stats">
              <StatsCard />
            </BentoCard>
          </div>
        </div>
      </div>

      <style>{`
        .bento-grid-outer {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bento-row-1 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        .bento-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        .bento-card-experience { min-height: 320px; }
        .bento-card-tech { min-height: 320px; }
        .bento-card-leader { min-height: 260px; }
        .bento-card-quality { min-height: 260px; }
        .bento-card-stats { min-height: 260px; }

        @media (max-width: 900px) {
          .bento-row-1 {
            grid-template-columns: 1fr;
          }
          .bento-row-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 580px) {
          .bento-row-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

function BentoCard({
  children,
  inView,
  delay,
  className,
}: {
  children: React.ReactNode;
  inView: boolean;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{
        scale: 1.015,
        boxShadow: "0 28px 56px rgba(0,0,0,0.07)",
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      }}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Card 1: 6+ Years of Experience ── */
function ExperienceCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "44px 44px 40px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Background number */}
      <div
        style={{
          position: "absolute",
          right: -20,
          bottom: -40,
          fontSize: 200,
          fontWeight: 800,
          color: "rgba(0,145,255,0.05)",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        6
      </div>

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Experience
        </p>
        <h3
          style={{
            fontSize: "clamp(24px, 2.8vw, 36px)",
            fontWeight: 800,
            color: "#0D0E12",
            letterSpacing: "-0.034em",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Over 6+ years of experience
        </h3>
        <p
          style={{
            fontSize: 15,
            color: "#6B7280",
            lineHeight: 1.7,
            maxWidth: 480,
          }}
        >
          Driving digital transformation and building enterprise-grade systems
          across fintech, enterprise, and product innovation sectors in Saudi Arabia
          and the broader MENA region.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
        {[
          { n: "6+", label: "Years" },
          { n: "25+", label: "Projects" },
          { n: "3", label: "Industries" },
        ].map(({ n, label }) => (
          <div key={label}>
            <p
              style={{
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 800,
                color: "#0091FF",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {n}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card 2: Tech skills ── */
function TechCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(148deg, #EEF7FF 0%, #E4F0FF 100%)",
        border: "1px solid rgba(0,145,255,0.12)",
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle circle */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,145,255,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(0,145,255,0.7)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Tech Stack
        </p>
        <h3
          style={{
            fontSize: "clamp(18px, 2vw, 24px)",
            fontWeight: 800,
            color: "#0D0E12",
            letterSpacing: "-0.03em",
            lineHeight: 1.18,
            marginBottom: 28,
          }}
        >
          Skilled in modern design &amp; tech
        </h3>
      </div>

      {/* Floating tech icons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {TECH_ICONS.map((tech, i) => (
          <motion.div
            key={tech.name}
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 2.8 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.35,
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: tech.bg,
              borderRadius: 12,
              padding: "8px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <span style={{ fontSize: 14 }}>{tech.symbol}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: tech.fg,
                letterSpacing: "-0.01em",
              }}
            >
              {tech.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Card 3: Engineering Leader ── */
function LeaderCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0D0E12",
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Leadership
        </p>
        <h3
          style={{
            fontSize: "clamp(19px, 2vw, 24px)",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.18,
            marginBottom: 14,
          }}
        >
          Engineering Leader
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.65,
          }}
        >
          Guiding teams, shaping architecture, and enforcing engineering
          governance across enterprise digital programs.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
        {["Team Growth", "Architecture", "Governance"].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 100,
              padding: "5px 12px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Card 4: 95% Quality Improvement ── */
function QualityCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "36px 32px",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mobile mockup visual */}
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: -8,
          width: 90,
          height: 150,
          borderRadius: 16,
          background: "linear-gradient(160deg, #0091FF 0%, #0066CC 100%)",
          boxShadow: "0 12px 32px rgba(0,145,255,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Screen content */}
        <div style={{ position: "absolute", inset: 0, padding: 10 }}>
          <div
            style={{
              height: 3,
              width: "60%",
              background: "rgba(255,255,255,0.4)",
              borderRadius: 2,
              margin: "8px auto 6px",
            }}
          />
          {[0.9, 0.65, 0.8].map((w, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: `${w * 100}%`,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                marginBottom: 5,
              }}
            />
          ))}
          <div
            style={{
              marginTop: 8,
              height: 50,
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Quality
        </p>
        <p
          style={{
            fontSize: "clamp(44px, 5vw, 64px)",
            fontWeight: 800,
            color: "#0091FF",
            letterSpacing: "-0.045em",
            lineHeight: 1,
            marginBottom: 10,
          }}
        >
          95%
        </p>
        <h3
          style={{
            fontSize: "clamp(15px, 1.5vw, 18px)",
            fontWeight: 700,
            color: "#0D0E12",
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
            maxWidth: 140,
          }}
        >
          Quality Improvement
        </h3>
      </div>
    </div>
  );
}

/* ── Card 5: Turning Vision into Reality ── */
function StatsCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(148deg, #0091FF 0%, #0066CC 100%)",
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Impact
        </p>
        <h3
          style={{
            fontSize: "clamp(18px, 2vw, 22px)",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.028em",
            lineHeight: 1.2,
          }}
        >
          Turning Vision into Reality
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { n: "+25", label: "Successful Projects" },
          { n: "95%", label: "Increase in Digital Quality" },
        ].map(({ n, label }) => (
          <div key={label}>
            <p
              style={{
                fontSize: "clamp(28px, 3vw, 38px)",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {n}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
