"use client";

import "@/lib/stableViewport";
import { useState, useCallback, useSyncExternalStore } from "react";
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
/* Diagnostic switch: `/?skip=journey,work` leaves those sections out, so a slow
   phone can be tested section by section. Names: hero, journey, work, impact,
   experience, stack, credentials, mentoring, life. Without the parameter the
   page is untouched. */
const noop = () => () => {};
const readSkip = () => new URLSearchParams(window.location.search).get("skip") ?? "";
function useSkip() {
  const raw = useSyncExternalStore(noop, readSkip, () => "");
  return new Set(raw.split(",").filter(Boolean));
}

export default function HomeClient() {
  const skip = useSkip();
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
          {!skip.has("hero") && <Hero ready={!loading} />}
          {!skip.has("journey") && <FlightPath />}
          {!skip.has("work") && <Work />}
          {!skip.has("impact") && <Impact />}
          {!skip.has("experience") && <Experience />}
          {!skip.has("stack") && <Stack />}
          {!skip.has("credentials") && <Credentials />}
          {!skip.has("mentoring") && <Mentoring />}
          {!skip.has("life") && <Life />}
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
