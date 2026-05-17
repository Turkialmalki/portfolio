"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Projects from "@/components/sections/Projects";
import ProjectMarquee from "@/components/sections/ProjectMarquee";
import Footer from "@/components/sections/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function ProjectsPage() {
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
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
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
              Portfolio
            </motion.p>

            <div style={{ overflow: "hidden" }}>
              <motion.h1
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.0, ease: EASE, delay: 0.06 }}
                style={{
                  fontSize: "clamp(44px, 6vw, 88px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  marginBottom: 24,
                  transition: "color 0.45s ease",
                }}
              >
                Selected Work.
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              style={{
                fontSize: "clamp(15px, 1.2vw, 17px)",
                color: "#6B7280",
                lineHeight: 1.72,
                maxWidth: 520,
              }}
            >
              A curated collection of products, platforms, and systems built
              across fintech, enterprise, and government sectors in Saudi Arabia
              and the MENA region.
            </motion.p>
          </div>
        </section>

        <ProjectMarquee />
        <Projects />
      </main>
      <Footer />
    </>
  );
}
