"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Preloader from "./Preloader";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import Hero from "./sections/Hero";
import FlightPath from "./sections/FlightPath";
import FAQ from "./sections/FAQ";
import BlogPreview from "./sections/BlogPreview";
import Footer from "./sections/Footer";

/**
 * The homepage is one continuous story: the hero hands the reader to the
 * flight-path timeline, which carries the career, the proof and the numbers in
 * a single pass, and lands on the FAQ and the contact CTA in the footer.
 *
 * The old standalone "Featured Work", "Behind the Screens" and "Why Me?"
 * sections are deliberately absent — their content now lives inside the
 * timeline. Their components stay in the tree for the other routes.
 */
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
          <FlightPath />
          <FAQ />
          <BlogPreview />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
