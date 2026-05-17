"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RiGithubLine, RiLinkedinLine, RiTwitterXLine, RiDribbbleLine } from "react-icons/ri";

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
      className="px-6 md:px-10 lg:px-16 py-28 md:py-40"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-16 md:mb-24"
        >
          Get In Touch
        </motion.p>

        {/* Big CTA */}
        <div className="mb-20 md:mb-28">
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-bold leading-[0.9] tracking-tight"
              style={{ fontSize: "clamp(3rem, 9vw, 10rem)" }}
            >
              Let&apos;s create
            </motion.h2>
          </div>
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              className="text-[#A1A1AA] font-bold leading-[0.9] tracking-tight"
              style={{ fontSize: "clamp(3rem, 9vw, 10rem)" }}
            >
              something great.
            </motion.h2>
          </div>
        </div>

        {/* Email link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <p className="text-[#A1A1AA] text-sm mb-4">Start a conversation</p>
          <a
            href="mailto:turkialmalki202200@gmail.com"
            onMouseEnter={() => setEmailHovered(true)}
            onMouseLeave={() => setEmailHovered(false)}
            className="inline-flex items-center gap-4 group"
            data-cursor-hover
          >
            <motion.span
              animate={{ color: emailHovered ? "#ffffff" : "#A1A1AA" }}
              transition={{ duration: 0.3 }}
              className="text-lg md:text-2xl font-light tracking-wide"
            >
              turkialmalki202200@gmail.com
            </motion.span>
            <motion.span
              animate={{ x: emailHovered ? 4 : 0, opacity: emailHovered ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
              className="text-white text-xl"
            >
              ↗
            </motion.span>
          </a>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="h-px bg-white/08 origin-left mb-16"
        />

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-wrap gap-6"
        >
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors duration-300 text-sm group"
                data-cursor-hover
              >
                <Icon className="text-base group-hover:scale-110 transition-transform" />
                <span>{social.label}</span>
              </a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
