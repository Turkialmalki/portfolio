"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiSun, FiMoon } from "react-icons/fi";

export default function TopBar() {
  const [dark, setDark] = useState(false);

  // Sync state with any persisted preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("portfolio-theme", next ? "dark" : "light");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Avatar + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: "1.5px solid var(--border-subtle)",
            }}
          >
            <Image
              src="/avatar.jpg"
              alt="Turki Almalki"
              width={34}
              height={34}
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--topbar-name-color)",
              letterSpacing: "-0.018em",
              fontFamily: "inherit",
              transition: "color 0.45s ease",
            }}
          >
            Turki Almalki
          </span>
        </div>

        {/* Right: Theme Toggle + Connect */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "var(--topbar-toggle-bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--topbar-toggle-color)",
              flexShrink: 0,
              transition: "background 0.45s ease, color 0.45s ease",
            }}
          >
            {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() =>
              document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
              padding: "10px 22px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.012em",
              whiteSpace: "nowrap",
              transition: "background 0.45s ease, color 0.45s ease",
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            }}
          >
            Connect
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
