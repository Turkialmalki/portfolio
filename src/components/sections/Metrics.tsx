"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const METRICS = [
  {
    value: "9+",
    label: "Years of Experience",
    sub: "Driving digital excellence since 2016 across MENA",
  },
  {
    value: "+25",
    label: "Successful Projects",
    sub: "Enterprise systems, fintech, and product innovation",
  },
  {
    value: "95%",
    label: "Digital Quality Increase",
    sub: "Measurable improvement in platform performance & UX",
  },
];

export default function Metrics() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ backgroundColor: "#0D0E12" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(80px, 11vw, 140px) clamp(24px, 4vw, 32px)",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 80,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              By the Numbers
            </p>
            <h2
              style={{
                fontSize: "clamp(30px, 4vw, 50px)",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.036em",
                lineHeight: 1.08,
              }}
            >
              Impact that speaks
              <br />
              for itself.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.72,
              maxWidth: 320,
            }}
          >
            9+ years building enterprise-grade products with clients across
            Saudi Arabia, the Middle East, and beyond.
          </motion.p>
        </div>

        {/* Metric columns */}
        <div
          className="metrics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: EASE, delay: 0.12 + i * 0.1 }}
              style={{
                padding: "56px 0",
                paddingRight: i < 2 ? 48 : 0,
                paddingLeft: i > 0 ? 48 : 0,
                borderRight:
                  i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 1.0,
                  ease: EASE,
                  delay: 0.25 + i * 0.1,
                }}
                style={{
                  fontSize: "clamp(64px, 8vw, 112px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.048em",
                  lineHeight: 0.95,
                  marginBottom: 22,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {metric.value}
              </motion.p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "-0.015em",
                  marginBottom: 8,
                }}
              >
                {metric.label}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.27)",
                  lineHeight: 1.6,
                }}
              >
                {metric.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
          .metrics-grid > div {
            padding-left: 0 !important;
            padding-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .metrics-grid > div:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </section>
  );
}
