"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="projects"
      ref={ref}
      style={{
        backgroundColor: "var(--bg-primary)",
        overflow: "hidden",
        padding: "clamp(80px, 10vw, 130px) 24px",
        transition: "background-color 0.35s ease",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          style={{
            display: "inline-flex",
            padding: "8px 18px",
            borderRadius: 999,
            background: "var(--bg-pill)",
            color: "var(--text-secondary)",
            fontSize: 15,
            marginBottom: 26,
          }}
        >
          Value
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
          style={{
            fontSize: "clamp(42px, 5vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.055em",
            lineHeight: 1,
            color: "var(--text-primary)",
            margin: 0,
            transition: "color 0.35s ease",
          }}
        >
          Why Work With Me?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          style={{
            fontSize: "clamp(20px, 2vw, 28px)",
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: "20px auto 66px",
            lineHeight: 1.2,
            transition: "color 0.35s ease",
          }}
        >
          Backed by experience, driven by purpose.
        </motion.p>

        <div className="value-grid-top">
          <ValueCard
            title="Over 9+ years of experience"
            image="/h1.jpg"
            variant="photo"
          />

          <ToolsCard />

          <ValueCard
            title="Led fast-moving product teams"
            image="/1.jpg"
            variant="photo"
          />
        </div>

        <div className="value-grid-bottom">
          <ValueCard
            large
            title="Solves problems with designs"
            image="/design1.png"
            variant="mockup"
          />

          <ValueCard
            large
            title="Turning ideas into milestones"
            image="/screenshot.jpg"
            variant="photo"
          />
        </div>
      </div>

      <style>{`
        .value-grid-top {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .value-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .value-grid-top,
          .value-grid-bottom {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function ValueCard({
  title,
  image,
  large = false,
  variant = "photo",
}: {
  title: string;
  image: string;
  large?: boolean;
  variant?: "photo" | "mockup";
}) {
  const isPhoto = variant === "photo";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        background: "var(--bg-card)",
        borderRadius: 32,
        height: large ? 340 : 280,
        padding: large ? 32 : 28,
        transition: "background-color 0.35s ease",
      }}
    >
      <h3
        style={{
          fontSize: large ? "34px" : "28px",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 1.05,
          color: "var(--text-primary)",
          textAlign: "left",
          transition: "color 0.35s ease",
          margin: 0,
          flexShrink: 0,
          maxWidth: large ? 560 : 320,
        }}
      >
        {title}
      </h3>

      {/* image now sits in a smaller, rounded, framed box — not full-bleed */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          borderRadius: 18,
          overflow: "hidden",
          background: isPhoto ? "var(--bg-card-muted)" : "transparent",
          transition: "background-color 0.35s ease",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: isPhoto ? "cover" : "contain",
            objectPosition: "center top", // shows faces instead of cropping to torsos
            display: "block",
          }}
        />
      </div>
    </motion.div>
  );
}

function ToolsCard() {
  const tools = [
    { name: "Figma", img: "/tools/figma.png" },
    { name: "React", img: "/tools/react.png" },
    { name: "Next.js", img: "/tools/framer.png" },
    { name: "Slack", img: "/tools/slack.png" },
    { name: "Node.js", img: "/tools/node-js.png" },
    { name: "TypeScript", img: "/tools/typescript.png" },
  ];

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card)",
        borderRadius: 32,
        overflow: "hidden",
        height: 280,
        padding: 28,
        transition: "background-color 0.35s ease",
      }}
    >
      {/* tool cluster fills the upper area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 64px)",
          justifyContent: "center",
          alignContent: "center",
          gap: 14,
        }}
      >
        {tools.map((tool) => (
          <div
            key={tool.name}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-soft)",
              transition: "background-color 0.35s ease",
            }}
          >
            <img
              src={tool.img}
              alt={tool.name}
              style={{ width: 38, height: 38, objectFit: "contain" }}
            />
          </div>
        ))}
      </div>

      {/* title anchored to the bottom — matches the reference layout */}
      <h3
        style={{
          fontSize: "30px",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 1.05,
          color: "var(--text-primary)",
          textAlign: "left",
          transition: "color 0.35s ease",
          margin: 0,
          maxWidth: 300,
        }}
      >
        Skilled in modern design tools
      </h3>
    </motion.div>
  );
}