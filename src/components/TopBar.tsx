"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiSun, FiMoon } from "react-icons/fi";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Language } from "@/i18n/translations";

export default function TopBar() {
  const [dark, setDark] = useState(false);
  const { t, lang, setLang } = useLanguage();

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
          padding: "20px clamp(16px, 4vw, 32px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Start: Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <Link
            href="/"
            aria-label="Turki Almalki — Home"
            className="topbar-avatar-wrapper"
            style={{ border: "1.5px solid var(--border-subtle)" }}
          >
            <Image
              src="/avatar.jpg"
              alt="Turki Almalki"
              width={52}
              height={52}
              className="topbar-avatar-img"
            />
          </Link>
        </div>

        {/* End: Theme Toggle + Language Switcher + Connect */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={toggleTheme}
            aria-label={t.topbar.toggleTheme}
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

          <LanguageSwitcher
            lang={lang}
            setLang={setLang}
            ariaLabel={t.topbar.switchLanguage}
          />

          <motion.button
            className="topbar-connect-btn"
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
              whiteSpace: "nowrap",
              transition: "background 0.45s ease, color 0.45s ease",
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            }}
          >
            {t.topbar.connect}
          </motion.button>
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .topbar-connect-btn { display: none !important; }
        }
      `}</style>
    </motion.header>
  );
}

function LanguageSwitcher({
  lang,
  setLang,
  ariaLabel,
}: {
  lang: Language;
  setLang: (l: Language) => void;
  ariaLabel: string;
}) {
  const options: { value: Language; label: string }[] = [
    { value: "ar", label: "العربية" },
    { value: "en", label: "English" },
  ];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        borderRadius: 100,
        background: "var(--topbar-toggle-bg)",
        transition: "background 0.45s ease",
      }}
    >
      {options.map(({ value, label }) => {
        const active = lang === value;
        return (
          <motion.button
            key={value}
            onClick={() => setLang(value)}
            whileTap={{ scale: 0.94 }}
            aria-pressed={active}
            lang={value}
            style={{
              position: "relative",
              padding: "6px 13px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              fontSize: 12.5,
              fontWeight: active ? 700 : 500,
              fontFamily: "inherit",
              color: active ? "var(--bg-primary)" : "var(--topbar-toggle-color)",
              whiteSpace: "nowrap",
              transition: "color 0.3s ease",
            }}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 100,
                  background: "var(--text-primary)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
