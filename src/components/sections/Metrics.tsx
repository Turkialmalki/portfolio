"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const metrics = [
  { value: "5+", label: "Years of Experience", sub: "Building digital products since 2019" },
  { value: "40+", label: "Successful Projects", sub: "Shipped across web, mobile & brand" },
  { value: "15+", label: "Happy Clients", sub: "From startups to global brands" },
];

export default function Metrics() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{ backgroundColor: "#0D0E12" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
        }}
      >
        {/* Top row: label + description */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 72,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              By the numbers
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Impact that speaks for itself.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.08 }}
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.65,
              maxWidth: 340,
            }}
          >
            Five years of building products with clients across the Middle East,
            Europe, and North America.
          </motion.p>
        </div>

        {/* Metrics grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
          className="metrics-grid"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 + i * 0.08 }}
              style={{
                padding: "48px 0",
                paddingRight: i < 2 ? 48 : 0,
                paddingLeft: i > 0 ? 48 : 0,
                borderRight:
                  i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <p
                style={{
                  fontSize: "clamp(52px, 6vw, 72px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  marginBottom: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {metric.value}
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "-0.01em",
                  marginBottom: 6,
                }}
              >
                {metric.label}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: 1.5,
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
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .metrics-grid > div:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </section>
  );
}
