"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Preloader from "./Preloader";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import Hero from "./sections/Hero";
import BentoGrid from "./sections/BentoGrid";
import Projects from "./sections/Projects";
import ProjectMarquee from "./sections/ProjectMarquee";
import Metrics from "./sections/Metrics";
import Footer from "./sections/Footer";

export default function HomeClient() {
  const [loading, setLoading] = useState(true);
  const handleComplete = useCallback(() => setLoading(false), []);

  return (
    <>
      <Preloader onComplete={handleComplete} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={loading ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: loading ? "none" : "auto" }}
      >
        <TopBar />
        <Navbar />
        <main>
          <Hero ready={!loading} />
          <ProjectMarquee />
          <BentoGrid />
          <Projects />
          <Metrics />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
