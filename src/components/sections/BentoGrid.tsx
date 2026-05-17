"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const techTags = [
  "React / Next.js",
  "TypeScript",
  "Framer Motion",
  "Figma",
  "Tailwind CSS",
  "Node.js",
  "Three.js",
  "GSAP",
  "Spline 3D",
  "GraphQL",
  "Vercel",
  "Design Systems",
];

export default function BentoGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="about"
      ref={ref}
      style={{ backgroundColor: "#F9F9FB" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
        }}
      >
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#666D80",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          My Essence
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
            marginBottom: 40,
          }}
        >
          The story behind the craft.
        </motion.h2>

        {/* Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "auto auto",
            gap: 24,
          }}
          className="bento-grid"
        >
          {/* Card 1: Who am I — double-width */}
          <BentoCard
            inView={inView}
            delay={0.1}
            style={{
              gridColumn: "span 2",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E7EC",
            }}
          >
            <WhoAmICard />
          </BentoCard>

          {/* Card 2: My Philosophy — dark */}
          <BentoCard
            inView={inView}
            delay={0.15}
            style={{
              gridColumn: "span 1",
              backgroundColor: "#0D0E12",
              border: "1px solid #0D0E12",
            }}
          >
            <PhilosophyCard />
          </BentoCard>

          {/* Card 3: My Distinct Edge — full width below */}
          <BentoCard
            inView={inView}
            delay={0.2}
            style={{
              gridColumn: "span 3",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E7EC",
            }}
          >
            <DistinctEdgeCard tags={techTags} />
          </BentoCard>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .bento-grid > * {
            grid-column: span 1 !important;
          }
          .bento-grid {
            grid-template-columns: 1fr !important;
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
  style,
}: {
  children: React.ReactNode;
  inView: boolean;
  delay: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0], delay }}
      whileHover={{
        scale: 1.015,
        boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] },
      }}
      style={{
        borderRadius: 24,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function WhoAmICard() {
  return (
    <div
      style={{
        padding: "40px 40px 36px",
        position: "relative",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Abstract wireframe decoration */}
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -20,
          width: 260,
          height: 260,
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="220" height="36" rx="8" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="20" y="72" width="140" height="20" rx="4" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="20" y="104" width="180" height="20" rx="4" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="20" y="136" width="110" height="20" rx="4" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="20" y="172" width="220" height="60" rx="12" stroke="#0D0E12" strokeWidth="1.5" />
          <circle cx="50" cy="202" r="16" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="76" y="192" width="80" height="8" rx="4" stroke="#0D0E12" strokeWidth="1.5" />
          <rect x="76" y="208" width="60" height="6" rx="3" stroke="#0D0E12" strokeWidth="1.5" />
        </svg>
      </div>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#666D80",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Who am I?
      </p>

      <h3
        style={{
          fontSize: "clamp(22px, 2.5vw, 30px)",
          fontWeight: 800,
          color: "#0D0E12",
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
          marginBottom: 18,
          maxWidth: 420,
        }}
      >
        Designer who codes. Developer who designs.
      </h3>

      <p
        style={{
          fontSize: 15,
          color: "#666D80",
          lineHeight: 1.7,
          maxWidth: 500,
          marginBottom: 12,
        }}
      >
        I&apos;m a creative developer and product designer based in Riyadh, Saudi Arabia,
        with 5+ years building digital products at the intersection of engineering and
        design. My journey started with a fascination for how interfaces feel —
        not just how they look.
      </p>

      <p
        style={{
          fontSize: 15,
          color: "#9BA3B5",
          lineHeight: 1.7,
          maxWidth: 500,
        }}
      >
        I combine systematic thinking with aesthetic intuition, always asking
        &ldquo;why&rdquo; before &ldquo;how.&rdquo; From pixel-perfect interfaces to complex
        web applications, I bring the same level of care to every project.
      </p>
    </div>
  );
}

function PhilosophyCard() {
  const values = [
    {
      icon: "◆",
      title: "Intention first",
      desc: "Every pixel, interaction, and line of code must have a purpose.",
    },
    {
      icon: "◇",
      title: "Systems thinking",
      desc: "Build for scale — design tokens, component libraries, clean architecture.",
    },
    {
      icon: "○",
      title: "Craft over speed",
      desc: "Ship with pride. Quality is the only metric that compounds.",
    },
  ];

  return (
    <div
      style={{
        padding: "40px 36px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        My Philosophy
      </p>

      <h3
        style={{
          fontSize: "clamp(20px, 2vw, 26px)",
          fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          marginBottom: 32,
        }}
      >
        Principles I build by.
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 1,
        }}
      >
        {values.map((v) => (
          <div key={v.title} style={{ display: "flex", gap: 14 }}>
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                flexShrink: 0,
                marginTop: 3,
              }}
            >
              {v.icon}
            </span>
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  marginBottom: 4,
                }}
              >
                {v.title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.55,
                }}
              >
                {v.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistinctEdgeCard({ tags }: { tags: string[] }) {
  return (
    <div
      style={{
        padding: "36px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#666D80",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        My Distinct Edge
      </p>

      <p
        style={{
          fontSize: "clamp(18px, 2vw, 22px)",
          fontWeight: 700,
          color: "#0D0E12",
          letterSpacing: "-0.02em",
          marginBottom: 24,
        }}
      >
        Full-stack design-to-code fluency.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#0D0E12",
              background: "#F9F9FB",
              border: "1px solid #E4E7EC",
              borderRadius: 100,
              padding: "7px 14px",
              letterSpacing: "-0.01em",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#0D0E12";
              (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
              (e.currentTarget as HTMLElement).style.borderColor = "#0D0E12";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F9F9FB";
              (e.currentTarget as HTMLElement).style.color = "#0D0E12";
              (e.currentTarget as HTMLElement).style.borderColor = "#E4E7EC";
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
