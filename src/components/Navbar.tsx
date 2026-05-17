"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiHome, FiBriefcase, FiUser, FiBook } from "react-icons/fi";

const NAV_ITEMS = [
  { Icon: FiHome, label: "Home", href: "/" },
  { Icon: FiBriefcase, label: "Portfolio", href: "/projects" },
  { Icon: FiUser, label: "About", href: "/about" },
  { Icon: FiBook, label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleClick = (href: string) => {
    router.push(href);
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
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: "var(--nav-bg)",
        backdropFilter: "blur(60px) saturate(200%)",
        WebkitBackdropFilter: "blur(60px) saturate(200%)",
        border: "1px solid var(--nav-border)",
        borderRadius: 100,
        padding: "8px 12px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.18)",
        transition: "background-color 0.45s ease, border-color 0.45s ease",
      }}
    >
      {NAV_ITEMS.map(({ Icon, label, href }) => {
        const active = isActive(href);
        return (
          <motion.button
            key={label}
            onClick={() => handleClick(href)}
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
            {active && (
              <motion.div
                layoutId="active-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                }}
                transition={{
                  type: "spring",
                  bounce: 0.3,
                }}
              />
            )}
            <Icon
              size={17}
              style={{
                position: "relative",
                zIndex: 1,
                color: active
                  ? "var(--nav-icon-active)"
                  : "var(--nav-icon-inactive)",
                transition: "color 0.25s ease",
              }}
            />
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
