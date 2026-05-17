"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Work", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-10 lg:px-16"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      <div
        className="flex items-center justify-between h-16 md:h-20 transition-all duration-500"
        style={{
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          background: scrolled ? "rgba(0,0,0,0.6)" : "transparent",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-white font-semibold text-sm tracking-widest uppercase opacity-90 hover:opacity-100 transition-opacity"
          data-cursor-hover
        >
          T.A
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="text-[#A1A1AA] hover:text-white text-sm tracking-wide transition-colors duration-300"
              data-cursor-hover
            >
              {link.label}
            </button>
          ))}
          <a
            href="mailto:turkialmalki202200@gmail.com"
            className="text-sm px-5 py-2 border border-white/20 text-white/70 hover:border-white/60 hover:text-white rounded-full transition-all duration-300 tracking-wide"
            data-cursor-hover
          >
            Hire Me
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          data-cursor-hover
        >
          <motion.span
            className="block w-5 h-px bg-white"
            animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 4 : 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="block w-5 h-px bg-white"
            animate={{ opacity: menuOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block w-5 h-px bg-white"
            animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -4 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden absolute left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/08 px-6 py-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ top: "100%" }}
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-2xl font-light text-white/80 hover:text-white transition-colors"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  data-cursor-hover
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.a
                href="mailto:turkialmalki202200@gmail.com"
                className="text-[#A1A1AA] text-sm mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                turkialmalki202200@gmail.com
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
