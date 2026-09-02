"use client";

import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LuHouse,
  LuBriefcase,
  LuSparkles,
  LuUserRound,
  LuNewspaper,
  LuMail,
} from "react-icons/lu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { SHOW_PROJECTS } from "@/config/siteFlags";

/* Mounted-only render, without a setState-in-effect: the server snapshot is
   false, the client snapshot true, and React swaps them after hydration. */
const NEVER = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    NEVER,
    () => true,
    () => false,
  );

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { Icon: LuHouse, label: t.nav.home, href: "/" },
    // Dropped entirely — not merely hidden — when the portfolio is not public.
    ...(SHOW_PROJECTS
      ? [{ Icon: LuBriefcase, label: t.nav.portfolio, href: "/projects" }]
      : []),
    { Icon: LuSparkles, label: t.nav.services, href: "/services" },
    { Icon: LuUserRound, label: t.nav.about, href: "/about" },
    { Icon: LuNewspaper, label: t.nav.blog, href: "/blog" },
    { Icon: LuMail, label: t.nav.contact, href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <div
      className="site-dock-wrap"
      style={{
        position: "fixed",
        bottom: "calc(var(--dock-gap) + env(safe-area-inset-bottom, 0px))",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
    <motion.nav
      className="site-dock"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Site navigation"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "var(--dock-gap-x)",
        backgroundColor: "var(--nav-bg)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        border: "1px solid var(--nav-border)",
        borderRadius: 100,
        padding: "var(--dock-pad-y) var(--dock-pad-x)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.18)",
        transition: "background-color 0.45s ease, border-color 0.45s ease",
        whiteSpace: "nowrap",
        maxWidth: "calc(100vw - 24px)",
        /* No horizontal scroller. It silently hid whichever tab did not fit —
           on every phone width that was the last one. The dock now shares the
           width it has between the tabs instead. */
        overflow: "visible",
      }}
    >
      {NAV_ITEMS.map(({ Icon, label, href }) => {
        const active = isActive(href);
        return (
          <motion.button
            key={href}
            className="site-dock-item"
            onClick={() => router.push(href)}
            title={label}
            aria-label={label}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            style={{
              position: "relative",
              /* a fixed box height keeps the dock exactly as tall whatever the
                 label metrics do — nothing downstream has to guess it */
              height: 52,
              padding: "0 var(--dock-item-pad)",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexShrink: 1,
              minWidth: 0,
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
              className="site-dock-label"
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "var(--dock-label-size)",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--nav-icon-active)" : "var(--nav-icon-inactive)",
                transition: "color 0.22s ease",
                // 1 clips Arabic descenders (the font's glyph box is 1.25em);
                // the dock item is centred, so a taller line box costs nothing.
                lineHeight: 1.45,
                fontFamily: "inherit",
                userSelect: "none",
              }}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </motion.nav>

      {/* The dock's metrics (--dock-h, --dock-gap, --dock-item-pad,
          --dock-label-size) are declared once in globals.css, so the hero,
          the timeline and the footer can reserve exactly the space it takes
          instead of each hard-coding a guess at its height. */}
      <style>{`
        .site-dock { min-height: var(--dock-h); }

        /* Phones: the dock spans the safe width and the six tabs share it,
           rather than one of them being scrolled out of sight. */
        @media (max-width: 767px) {
          .site-dock-wrap { padding-inline: 8px; }

          .site-dock {
            width: 100%;
            max-width: 440px !important;
            justify-content: space-between;
          }

          .site-dock-item { flex: 1 1 0; }

          .site-dock-label {
            max-width: 100%;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}
