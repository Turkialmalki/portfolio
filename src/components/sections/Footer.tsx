"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Twitter / X", href: "https://twitter.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
  { label: "GitHub", href: "https://github.com" },
];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer ref={ref} style={{ backgroundColor: "#0D0E12" }}>
      {/* CTA block */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px clamp(48px, 8vw, 96px)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Let&apos;s Connect
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.06 }}
          style={{
            fontSize: "clamp(28px, 4.5vw, 56px)",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 680,
          }}
        >
          Have an idea? Let&apos;s bring it to life.
        </motion.h2>

        <motion.a
          href="mailto:turkialmalki202200@gmail.com"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.14 }}
          whileHover={{
            opacity: 0.85,
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            color: "#0D0E12",
            padding: "16px 32px",
            borderRadius: 100,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          Get In Touch
          <span style={{ fontSize: 16 }}>→</span>
        </motion.a>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
          style={{
            width: "100%",
            maxWidth: 1200,
            height: 1,
            background: "rgba(255,255,255,0.08)",
            marginTop: "clamp(48px, 8vw, 80px)",
            transformOrigin: "left",
          }}
        />

        {/* Sub-footer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.4 }}
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.3)",
              fontWeight: 400,
            }}
          >
            © {new Date().getFullYear()} Turki Al-Malki. All rights reserved.
          </p>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)")
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </motion.div>
      </div>
    </footer>
  );
}
