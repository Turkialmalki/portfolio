"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RiGithubLine, RiLinkedinLine, RiTwitterXLine, RiDribbbleLine } from "react-icons/ri";

type Bezier = [number, number, number, number];
const EASE: Bezier = [0.16, 1, 0.3, 1];

const socialLinks = [
  { icon: RiGithubLine, label: "GitHub", href: "https://github.com" },
  { icon: RiLinkedinLine, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: RiTwitterXLine, label: "Twitter / X", href: "https://twitter.com" },
  { icon: RiDribbbleLine, label: "Dribbble", href: "https://dribbble.com" },
];

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [emailHovered, setEmailHovered] = useState(false);

  return (
    <section
      id="contact"
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-44"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-350 mx-auto">

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-gray-accent text-[10px] tracking-[0.25em] uppercase font-light mb-20 md:mb-28"
        >
          Get In Touch
        </motion.p>

        {/* Big headline CTA */}
        <div className="mb-20 md:mb-32">
          <div className="clip-text-reveal">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 1, ease: EASE }}
              className="text-white font-bold leading-[0.88] tracking-tight"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", letterSpacing: "-0.03em" }}
            >
              Let&apos;s create
            </motion.h2>
          </div>
          <div className="clip-text-reveal">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 1, ease: EASE, delay: 0.09 }}
              className="font-bold leading-[0.88] tracking-tight"
              style={{
                fontSize: "clamp(3.5rem, 10vw, 11rem)",
                letterSpacing: "-0.03em",
                color: "#A1A1AA",
                fontStyle: "italic",
                fontFamily: "var(--font-playfair), Georgia, serif",
              }}
            >
              something great.
            </motion.h2>
          </div>
        </div>

        {/* Email link — open, no box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mb-20"
        >
          <p className="text-gray-accent text-xs tracking-[0.2em] uppercase font-light mb-5">
            Start a conversation
          </p>
          <a
            href="mailto:turkialmalki202200@gmail.com"
            onMouseEnter={() => setEmailHovered(true)}
            onMouseLeave={() => setEmailHovered(false)}
            className="inline-flex items-center gap-4 group"
            data-cursor-hover
          >
            <motion.span
              animate={{ color: emailHovered ? "#ffffff" : "rgba(161,161,170,0.8)" }}
              transition={{ duration: 0.3 }}
              className="font-light tracking-wide"
              style={{ fontSize: "clamp(1rem, 2.2vw, 1.7rem)" }}
            >
              turkialmalki202200@gmail.com
            </motion.span>
            <motion.span
              animate={{ x: emailHovered ? 5 : 0, opacity: emailHovered ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="text-white text-lg"
            >
              ↗
            </motion.span>
          </a>
        </motion.div>

        {/* Thin divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, ease: EASE, delay: 0.5 }}
          className="h-px bg-white/[0.07] origin-left mb-16"
        />

        {/* Social links — minimal, no icons box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-wrap gap-8"
        >
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-accent hover:text-white transition-colors duration-300 group"
                data-cursor-hover
              >
                <Icon className="text-base opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs tracking-[0.15em] uppercase font-light">
                  {social.label}
                </span>
              </a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
