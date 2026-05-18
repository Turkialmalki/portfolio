"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LuHouse, LuBriefcase, LuUserRound, LuNewspaper } from "react-icons/lu";

const NAV_ITEMS = [
  { Icon: LuHouse, label: "Home", href: "/" },
  { Icon: LuBriefcase, label: "Portfolio", href: "/projects" },
  { Icon: LuUserRound, label: "About", href: "/about" },
  { Icon: LuNewspaper, label: "Blog", href: "/blog" },
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

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
    <motion.nav
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Site navigation"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundColor: "var(--nav-bg)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        border: "1px solid var(--nav-border)",
        borderRadius: 100,
        padding: "8px 10px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.18)",
        transition: "background-color 0.45s ease, border-color 0.45s ease",
        whiteSpace: "nowrap",
      }}
    >
      {NAV_ITEMS.map(({ Icon, label, href }) => {
        const active = isActive(href);
        return (
          <motion.button
            key={label}
            onClick={() => router.push(href)}
            title={label}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            style={{
              position: "relative",
              padding: "7px 16px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexShrink: 0,
              minWidth: 56,
            }}
          >
            {active && (
              <motion.div
                layoutId="active-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 100,
                  background: "var(--nav-pill-bg, #FFFFFF)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
                }}
                transition={{ type: "spring", bounce: 0.22, duration: 0.48 }}
              />
            )}
            <Icon
              size={18}
              style={{
                position: "relative",
                zIndex: 1,
                color: active ? "var(--nav-icon-active)" : "var(--nav-icon-inactive)",
                transition: "color 0.22s ease",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.01em",
                color: active ? "var(--nav-icon-active)" : "var(--nav-icon-inactive)",
                transition: "color 0.22s ease",
                lineHeight: 1,
                fontFamily: "var(--font-inter, system-ui, sans-serif)",
                userSelect: "none",
              }}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </motion.nav>
    </div>
  );
}
