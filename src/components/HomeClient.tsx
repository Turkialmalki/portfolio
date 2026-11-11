"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Preloader from "./Preloader";
import TopBar from "./TopBar";
import Hero from "./sections/Hero";
import FlightPath from "./sections/FlightPath";
import Impact from "./story/Impact";
import Stack from "./story/Stack";
import Life from "./story/Life";
import Experience from "./story/Experience";
import Credentials from "./story/Credentials";
import Mentoring from "./story/Mentoring";
import Work from "./work/Work";
import Footer from "./sections/Footer";

/**
 * The homepage is one continuous story: the hero hands the reader to the
 * flight-path timeline, which carries the career, the proof and the numbers in
 * a single pass, and lands on the FAQ and the contact CTA in the footer.
 *
 * This is the whole site: there are no other routes. The timeline tells the
 * career; the Work section lets a visitor open any product as a full case
 * study in a pop-up without leaving the page.
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
        <main>
          <Hero ready={!loading} />
          <FlightPath />
          <Work />
          <Impact />
          <Experience />
          <Stack />
          <Credentials />
          <Mentoring />
          <Life />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
