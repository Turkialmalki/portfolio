"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiHome, FiBriefcase, FiGrid, FiMail } from "react-icons/fi";

const NAV_ITEMS = [
  { Icon: FiHome, label: "Home", section: "home" },
  { Icon: FiBriefcase, label: "Work", section: "projects" },
  { Icon: FiGrid, label: "About", section: "about" },
  { Icon: FiMail, label: "Contact", section: "contact-footer" },
];

export default function Navbar() {
  const [active, setActive] = useState("home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const targets = NAV_ITEMS.map((n) => {
      const id = n.section === "contact-footer" ? undefined : n.section;
      return id ? document.getElementById(id) : null;
    }).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (section: string) => {
    if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (section === "contact-footer") {
      document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
    } else {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!mounted) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Site navigation"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(13, 14, 18, 0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 100,
        padding: "8px 12px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {NAV_ITEMS.map(({ Icon, label, section }) => {
        const isActive = active === section || (section === "contact-footer" && active === "contact-footer");
        return (
          <motion.button
            key={label}
            onClick={() => handleClick(section)}
            title={label}
            whileTap={{ scale: 0.9 }}
            style={{
              position: "relative",
              width: 46,
              height: 46,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="dock-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <Icon
              size={17}
              style={{
                position: "relative",
                zIndex: 1,
                color: isActive ? "#0D0E12" : "rgba(255,255,255,0.45)",
                transition: "color 0.25s ease",
              }}
            />
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
