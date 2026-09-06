"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Language } from "@/i18n/translations";

/**
 * The theme lives on the document, not in this component.
 *
 * `data-theme` on <html> is what every stylesheet on the site reads, so that
 * attribute is the single source of truth and React subscribes to it rather
 * than keeping a second copy that can drift out of sync with it. Reading it
 * through useSyncExternalStore also keeps the server render honest: the
 * server snapshot is "light", which is what the server actually emits.
 */
const themeListeners = new Set<() => void>();

function subscribeToTheme(notify: () => void) {
  themeListeners.add(notify);
  return () => {
    themeListeners.delete(notify);
  };
}

const readTheme = () =>
  document.documentElement.getAttribute("data-theme") === "dark";

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem("portfolio-theme", dark ? "dark" : "light");
  themeListeners.forEach((notify) => notify());
}

export default function TopBar() {
  const { t, lang, setLang } = useLanguage();
  const dark = useSyncExternalStore(subscribeToTheme, readTheme, () => false);

  /* Restore the visitor's saved preference. This writes to the DOM — an
     external system — rather than to React state, which is exactly what an
     effect is for. */
  useEffect(() => {
    if (localStorage.getItem("portfolio-theme") === "dark") applyTheme(true);
  }, []);

  const toggleTheme = () => applyTheme(!dark);

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
        {/* <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <Link
            href="/"
            aria-label="Turki Almalki — Home"
            className="topbar-avatar-wrapper"
            style={{ border: "1.5px solid var(--border-subtle)" }}
          >
            <Image
              src="/newlogo.png"
              alt="Turki Almalki"
              width={160}
              height={64}
              className="topbar-avatar-img"
              priority
            />
          </Link>
        </div> */}
        {/* The wordmark is gone from the header — the site's identity is the
            name in the hero, and the corner belongs to the one control that
            changes how the whole page looks. */}
        <ThemeToggle dark={dark} onToggle={toggleTheme} label={t.topbar.toggleTheme} />

        {/* End: Theme Toggle + Language Switcher + Connect */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "auto",
          }}
        >
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
              document
                .querySelector("footer")
                ?.scrollIntoView({ behavior: "smooth" })
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

        /* ══════════════════ the theme control ══════════════════

           It used to be a drawn aeroplane window — a cabin wall, a lip, an
           aperture and a sliding shade — and at 56x78 in the corner of a phone
           it read as a piece of decoration somebody had left in the safe area
           rather than as the control it is. What replaced it says what it does:
           one pill, the two states side by side, the live one carried on a
           filled knob. It is the same shape and the same weight as the language
           switcher opposite it, so the two corners of the header finally read
           as one set of controls.

           The state is still the document's data-theme attribute and the move is
           still one transform, so nothing about this costs a layout.          */

        .theme-toggle {
          position: relative;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 3px;
          border: none;
          border-radius: 100px;
          background: var(--topbar-toggle-bg);
          color: var(--topbar-toggle-color);
          cursor: pointer;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          transition: background .45s ease;
        }

        .theme-toggle:focus-visible {
          outline: 3px solid rgba(20,149,255,.45);
          outline-offset: 3px;
        }

        /* the filled knob, slid under whichever half is live. One transform,
           composited, and the only thing in the control that moves. */
        .tt-knob {
          position: absolute;
          z-index: 0;
          top: 3px;
          left: 3px;
          width: 32px;
          height: 32px;
          border-radius: 100px;
          background: var(--text-primary);
          transform: translate3d(0,0,0);
          transition: transform .42s cubic-bezier(.16,1,.3,1);
        }

        [data-theme="dark"] .tt-knob { transform: translate3d(34px,0,0); }

        .tt-face {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 100px;
          color: var(--topbar-toggle-color);
          opacity: .55;
          transition: color .42s ease, opacity .42s ease;
        }

        .tt-face svg { width: 16px; height: 16px; display: block; }

        /* the live half sits on the knob, so it takes the page's own
           background as its colour — the same inversion the language switcher
           uses for its active option */
        [data-theme="light"] .tt-face-sun,
        html:not([data-theme="dark"]) .tt-face-sun,
        [data-theme="dark"] .tt-face-moon { color: var(--bg-primary); opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
          .tt-knob,
          .tt-face { transition: none !important; }
        }
      `}</style>
    </motion.header>
  );
}

/**
 * The theme control.
 *
 * The state it reflects is the document's `data-theme`, not a prop of its own,
 * so the knob and both faces are driven by CSS from that one attribute — the
 * click handler still owns the theme, and this stays a pure presentation layer
 * that cannot drift out of sync with it. `dark` is used only for aria-pressed,
 * which is the one thing CSS cannot say.
 */
function ThemeToggle({
  dark,
  onToggle,
  label,
}: {
  dark: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", pointerEvents: "auto" }}>
      <motion.button
        type="button"
        className="theme-toggle"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={dark}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
      >
        <span className="tt-knob" aria-hidden="true" />

        <span className="tt-face tt-face-sun" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
          </svg>
        </span>

        <span className="tt-face tt-face-moon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.4 14.3A8.6 8.6 0 0 1 9.7 3.6a8.6 8.6 0 1 0 10.7 10.7Z" />
          </svg>
        </span>
      </motion.button>
    </div>
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
    { value: "ar", label: "ع" },
    { value: "en", label: "E" },
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
              color: active
                ? "var(--bg-primary)"
                : "var(--topbar-toggle-color)",
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