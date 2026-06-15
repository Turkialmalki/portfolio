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
    <section
  id="about"
  style={{
    backgroundColor: "var(--bg-primary)",
    padding: "clamp(80px, 10vw, 130px) 24px",
    transition: "background-color 0.35s ease",
  }}
>
  <div
    style={{
      maxWidth: 1180,
      margin: "0 auto",
      textAlign: "center",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        padding: "8px 18px",
        borderRadius: 999,
        background: "var(--bg-pill)",
        color: "var(--text-secondary)",
        fontSize: 16,
        marginBottom: 28,
      }}
    >
      Essence
    </div>

    <h2
      style={{
        fontSize: "clamp(42px, 5vw, 72px)",
        fontWeight: 800,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        margin: 0,
        color: "var(--text-primary)",
        transition: "color 0.35s ease",
      }}
    >
      Behind the Screens
    </h2>

    <p
      style={{
        fontSize: "clamp(20px, 2vw, 28px)",
        fontWeight: 600,
        lineHeight: 1.15,
        color: "var(--text-secondary)",
        maxWidth: 620,
        margin: "22px auto 70px",
        transition: "color 0.35s ease",
      }}
    >
      A glimpse into my mindset, style, and design edge.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 28,
      }}
    >
      {[
        {
          icon: "🤔",
          title: "Who am I?",
          text: "An engineering leader and product innovator building scalable web and mobile experiences that create meaningful business impact.",
        },
        {
          icon: "🧠",
          title: "My Philosophy",
          text: "Great engineering begins with clarity, strong collaboration, and technology designed around real user and business needs.",
        },
        {
          icon: "✨",
          title: "My Distinct Edge",
          text: "I bridge design and development to craft engaging, impactful solutions.",
        },
      ].map((card) => (
        <div
          key={card.title}
          style={{
            background: "var(--bg-card)",
            borderRadius: 32,
            padding: "56px 36px",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.35s ease",
          }}
        >
          <div style={{ fontSize: 54, marginBottom: 28 }}>{card.icon}</div>

          <h3
            style={{
              fontSize: "clamp(28px, 2.6vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: "0 0 18px",
              color: "var(--text-primary)",
              transition: "color 0.35s ease",
            }}
          >
            {card.title}
          </h3>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              maxWidth: 280,
              margin: 0,
              transition: "color 0.35s ease",
            }}
          >
            {card.text}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
  );
}
