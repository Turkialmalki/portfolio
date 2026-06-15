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
    backgroundColor: "#ffffff",
    padding: "clamp(80px, 10vw, 130px) 24px",
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
        background: "#f1f1f1",
        color: "#666",
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
        color: "#000",
      }}
    >
      Behind the Screens
    </h2>

    <p
      style={{
        fontSize: "clamp(20px, 2vw, 28px)",
        fontWeight: 600,
        lineHeight: 1.15,
        color: "#666",
        maxWidth: 620,
        margin: "22px auto 70px",
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
          text: "I am a UX designer crafting seamless digital experiences.",
        },
        {
          icon: "🧠",
          title: "My Philosophy",
          text: "Great design is clarity, usability, and effortless impact.",
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
            background: "#f3f3f3",
            borderRadius: 32,
            padding: "56px 36px",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 54, marginBottom: 28 }}>{card.icon}</div>

          <h3
            style={{
              fontSize: "clamp(28px, 2.6vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: "0 0 18px",
              color: "#000",
            }}
          >
            {card.title}
          </h3>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              color: "#666",
              maxWidth: 280,
              margin: 0,
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
