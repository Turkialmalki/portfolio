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
        <PlaneWindowToggle dark={dark} onToggle={toggleTheme} label={t.topbar.toggleTheme} />

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

        /* ══════════════════ the cabin window ══════════════════

           The theme control is the aeroplane window this site's whole story
           is told through: pull the shade down and the cabin goes dark, lift
           it and the daylight comes back.

           It is built the way the real thing is — a cabin wall, a recessed
           lip, the aperture, and a shade in a housing above it. The shade is
           a real sliding panel driven by one transform, and the sky behind it
           is two stacked gradients cross-fading, so the whole interaction is
           composited and never costs a layout.                              */

        .plane-window {
          position: relative;
          width: 56px;
          height: 78px;
          padding: 7px 8px;
          border: none;
          border-radius: 42% / 30%;
          background: linear-gradient(163deg, #fdfdfc 0%, #f1efea 46%, #e0ddd6 100%);
          box-shadow:
            0 12px 26px -14px rgba(24, 27, 34, .38),
            0 2px 5px -2px rgba(24, 27, 34, .14),
            inset 0 1.5px 0 rgba(255,255,255,.95),
            inset 0 -2px 3px rgba(24,27,34,.12);
          cursor: pointer;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          transition: background .6s ease, box-shadow .6s ease;
        }

        [data-theme="dark"] .plane-window {
          background: linear-gradient(163deg, #40434b 0%, #2e3138 46%, #212429 100%);
          box-shadow:
            0 12px 26px -14px rgba(0,0,0,.66),
            0 2px 5px -2px rgba(0,0,0,.4),
            inset 0 1.5px 0 rgba(255,255,255,.13),
            inset 0 -2px 3px rgba(0,0,0,.5);
        }

        .plane-window:focus-visible {
          outline: 3px solid rgba(20,149,255,.45);
          outline-offset: 3px;
        }

        /* the recessed lip the aperture sits inside */
        .pw-lip {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 3px;
          border-radius: 40% / 29%;
          background: linear-gradient(180deg, #e9e6e0 0%, #f6f5f2 34%, #dedad2 100%);
          box-shadow:
            inset 0 1px 2px rgba(24,27,34,.2),
            0 1px 0 rgba(255,255,255,.8);
          transition: background .6s ease;
        }

        [data-theme="dark"] .pw-lip {
          background: linear-gradient(180deg, #2b2e35 0%, #383b43 34%, #24272d 100%);
          box-shadow:
            inset 0 1px 2px rgba(0,0,0,.6),
            0 1px 0 rgba(255,255,255,.07);
        }

        /* the aperture: everything inside is clipped to it */
        .pw-glass {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 38% / 28%;
          background: #cfe4f6;
          box-shadow: inset 0 2px 7px rgba(20,38,60,.34);
        }

        [data-theme="dark"] .pw-glass { box-shadow: inset 0 2px 7px rgba(0,0,0,.7); }

        .pw-sky,
        .pw-night {
          position: absolute;
          inset: 0;
          transition: opacity .55s ease;
        }

        /* daylight: sky over a cloud deck */
        .pw-sky {
          background:
            radial-gradient(78% 30% at 26% 92%, rgba(255,255,255,.98) 0%, rgba(255,255,255,0) 72%),
            radial-gradient(72% 26% at 78% 100%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 74%),
            linear-gradient(180deg, #6faee4 0%, #9ccbef 44%, #d9e9f6 78%, #eef4fa 100%);
          opacity: 1;
        }

        /* night: the same window, hours later */
        .pw-night {
          background:
            radial-gradient(88% 34% at 44% 108%, rgba(86,124,178,.55) 0%, rgba(86,124,178,0) 70%),
            linear-gradient(180deg, #080f21 0%, #131c33 50%, #1e2b48 100%);
          opacity: 0;
        }

        [data-theme="dark"] .pw-sky { opacity: 0; }
        [data-theme="dark"] .pw-night { opacity: 1; }

        .pw-star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          transition: opacity .5s ease .14s;
        }

        [data-theme="dark"] .pw-star { opacity: .92; }

        /* the shade's housing, along the top edge of the aperture */
        .pw-housing {
          position: absolute;
          z-index: 3;
          inset-inline: 6%;
          top: 0;
          height: 13%;
          border-radius: 0 0 6px 6px;
          background: linear-gradient(180deg, #f3f1ed 0%, #e2dfd8 100%);
          box-shadow: 0 1px 2px rgba(24,27,34,.24);
        }

        [data-theme="dark"] .pw-housing {
          background: linear-gradient(180deg, #43464d 0%, #33363c 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,.5);
        }

        /* the shade itself. It rests behind the housing and slides down over
           the aperture — this is the whole interaction, and it is one
           transform. */
        .pw-shade {
          position: absolute;
          z-index: 2;
          inset-inline: 0;
          top: 0;
          height: 100%;
          border-radius: 0 0 26% 26% / 0 0 9% 9%;
          background: linear-gradient(180deg, #efede8 0%, #e5e2dc 72%, #d2cec6 100%);
          box-shadow: 0 3px 8px rgba(24,27,34,.3);
          transform: translate3d(0, -100%, 0);
          transition: transform .66s cubic-bezier(.16,1,.3,1);
        }

        [data-theme="dark"] .pw-shade {
          background: linear-gradient(180deg, #43464d 0%, #35383e 72%, #272a30 100%);
          transform: translate3d(0, 0, 0);
        }

        /* the little grab tab on the shade's bottom edge */
        .pw-tab {
          position: absolute;
          inset-inline: 36%;
          bottom: 6%;
          height: 3px;
          border-radius: 2px;
          background: rgba(24,27,34,.24);
        }

        [data-theme="dark"] .pw-tab { background: rgba(255,255,255,.32); }

        @media (prefers-reduced-motion: reduce) {
          .pw-shade,
          .pw-sky,
          .pw-night,
          .pw-star { transition: none !important; }
        }
      `}</style>
    </motion.header>
  );
}

/**
 * The theme control, as the cabin window the site's flight-path story runs on.
 *
 * The state it reflects is the document's `data-theme`, not a prop of its own,
 * so the shade, the sky and the stars are all driven by CSS from that one
 * attribute — the click handler still owns the theme, and this stays a pure
 * presentation layer that cannot drift out of sync with it.
 */
function PlaneWindowToggle({
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
        className="plane-window"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={dark}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
      >
        <span className="pw-lip">
          <span className="pw-glass">
            <span className="pw-sky" />
            <span className="pw-night">
              {/* a handful of stars, placed rather than random so they do not
                  move between renders */}
              <span className="pw-star" style={{ left: "26%", top: "26%" }} />
              <span className="pw-star" style={{ left: "62%", top: "20%" }} />
              <span className="pw-star" style={{ left: "44%", top: "38%" }} />
              <span className="pw-star" style={{ left: "76%", top: "44%" }} />
              <span className="pw-star" style={{ left: "18%", top: "50%" }} />
            </span>
            <span className="pw-shade">
              <span className="pw-tab" />
            </span>
            <span className="pw-housing" />
          </span>
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