"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import BentoGrid from "@/components/sections/BentoGrid";
import Metrics from "@/components/sections/Metrics";
import Footer from "@/components/sections/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />
      <main>
        {/* Page hero */}
        <section
          style={{
            backgroundColor: "var(--bg-primary)",
            transition: "background-color 0.45s ease",
            paddingTop: "clamp(120px, 14vw, 180px)",
            paddingBottom: "clamp(60px, 8vw, 100px)",
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 48,
              alignItems: "center",
            }}
            className="about-hero-grid"
          >
            {/* Left: text */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  marginBottom: 18,
                }}
              >
                About
              </motion.p>

              <div style={{ overflow: "hidden" }}>
                <motion.h1
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.0, ease: EASE, delay: 0.06 }}
                  style={{
                    fontSize: "clamp(40px, 5.5vw, 80px)",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.05,
                    marginBottom: 28,
                    transition: "color 0.45s ease",
                  }}
                >
                  Engineering at
                  <br />
                  the edge of design.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
                style={{
                  fontSize: "clamp(15px, 1.15vw, 17px)",
                  color: "#6B7280",
                  lineHeight: 1.74,
                  maxWidth: 520,
                  marginBottom: 36,
                }}
              >
                I&apos;m Turki Almalki — a Software Engineering Leader at
                Monsha&apos;at with 9+ years crafting enterprise-grade systems
                and driving digital transformation across fintech, government,
                and product innovation in Saudi Arabia and the MENA region.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
                style={{ display: "flex", gap: 20, flexWrap: "wrap" }}
              >
                {[
                  { n: "9+", label: "Years" },
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
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>
                      {label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: avatar */}
            <motion.div
              className="about-avatar"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid rgba(0,145,255,0.2)",
                  boxShadow: "0 24px 64px rgba(0,145,255,0.3)",
                  position: "relative",
                }}
              >
                <Image
                  src="/avatar.jpg"
                  alt="Turki Almalki"
                  fill
                  sizes="280px"
                  style={{ objectFit: "cover", objectPosition: "center 12%" }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        <BentoGrid />
        <Metrics />

        <style>{`
          @media (min-width: 768px) {
            .about-hero-grid {
              grid-template-columns: 1.3fr 0.7fr !important;
            }
          }
          @media (max-width: 767px) {
            .about-avatar { display: none !important; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
