"use client";

import { motion } from "framer-motion";

const links = [
  { label: "Work", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      className="px-6 md:px-10 lg:px-16 py-12 md:py-16"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-white font-bold text-sm tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity"
            data-cursor-hover
          >
            Turki Al-Malki
          </button>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-6">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="text-[#A1A1AA] hover:text-white text-xs tracking-widest uppercase transition-colors duration-300"
                data-cursor-hover
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-white/20 text-xs tracking-wide">
            © {new Date().getFullYear()} — All rights reserved
          </p>
        </div>

        {/* Bottom big text */}
        <div className="mt-12 md:mt-20 overflow-hidden">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/04 font-bold leading-none tracking-tight select-none"
            style={{
              fontSize: "clamp(4rem, 15vw, 16rem)",
              color: "rgba(255,255,255,0.03)",
              letterSpacing: "-0.04em",
            }}
          >
            TURKI
          </motion.p>
        </div>
      </div>
    </footer>
  );
}
