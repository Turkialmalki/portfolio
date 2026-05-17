"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  FiLinkedin,
  FiTwitter,
  FiInstagram,
  FiFacebook,
} from "react-icons/fi";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const SOCIAL = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/turkialmalki",
    Icon: FiLinkedin,
  },
  {
    label: "X",
    href: "https://x.com/turkialmalki",
    Icon: FiTwitter,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/turkialmalki",
    Icon: FiInstagram,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/turkialmalki",
    Icon: FiFacebook,
  },
];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer
      id="contact-footer"
      ref={ref}
      style={{ backgroundColor: "#0D0E12" }}
    >
      {/* Main CTA card */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(80px, 12vw, 160px) 32px 0",
        }}
      >
        {/* Black card */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.0, ease: EASE }}
          style={{
            background: "#111214",
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "clamp(56px, 8vw, 100px) clamp(32px, 6vw, 80px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: -100,
              left: "50%",
              transform: "translateX(-50%)",
              width: 600,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(0,145,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.28)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            Get In Touch
          </motion.p>

          {/* Hero heading */}
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 0.16 }}
            style={{
              fontSize: "clamp(44px, 7vw, 96px)",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.042em",
              lineHeight: 1.04,
              marginBottom: 40,
            }}
          >
            Lets Connect
          </motion.h2>

          {/* CTA email button */}
          <motion.a
            href="mailto:turkialmalki202200@gmail.com"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE, delay: 0.26 }}
            whileHover={{
              scale: 1.04,
              filter: "brightness(1.08)",
              transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "#0091FF",
              color: "#FFFFFF",
              padding: "16px 36px",
              borderRadius: 100,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "inherit",
              letterSpacing: "-0.015em",
              boxShadow: "0 12px 36px rgba(0,145,255,0.4)",
            }}
          >
            Send a Message
            <span style={{ fontSize: 16, fontWeight: 400 }}>→</span>
          </motion.a>

          {/* Email text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.38 }}
            style={{
              marginTop: 18,
              fontSize: 13,
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "-0.01em",
            }}
          >
            turkialmalki202200@gmail.com
          </motion.p>

          {/* Social icons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.46 }}
            style={{
              display: "flex",
              gap: 14,
              marginTop: 40,
            }}
          >
            {SOCIAL.map(({ label, href, Icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{
                  scale: 1.12,
                  background: "rgba(255,255,255,0.12)",
                  transition: { duration: 0.2 },
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.55)")
                }
              >
                <Icon size={17} />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Sub-footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 32px clamp(80px, 10vw, 112px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.2)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          Created by Turki Almalki &copy; 2026
        </p>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {SOCIAL.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.25)",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.7)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.25)")
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </motion.div>
    </footer>
  );
}
