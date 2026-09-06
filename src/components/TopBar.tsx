"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
} from "react";
import { motion } from "framer-motion";
import { CONTACT } from "@/config/contact";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Language } from "@/i18n/translations";

/**
 * ════════════════════════════════════════════════════════════════════════
 * THE HEADER IS TWO OBJECTS, AND BOTH OF THEM FOLD
 * ────────────────────────────────────────────────────────────────────────
 * At the inline start sits the identity capsule: a portrait, a name and a
 * role on one glass pill. It is not a dropdown. Asking it for more opens it
 * SIDEWAYS, inside the strip it already occupies — the actions unfold out of
 * the same pill on a stagger, and on a phone the name folds away to make room
 * for them. Nothing is ever laid out below the header, so nothing the capsule
 * does can cover the hero's artwork, its name, its copy or its buttons, and
 * the header's own height never changes: the hero reserves a strip for this
 * bar and that reserve stays true whether the capsule is open or shut.
 *
 * At the inline end sits the theme control: one round window of sky with a
 * paper plane in it. Pressing it flies the plane out of frame, changes the
 * sky underneath while it is gone, and flies it back — the theme flips at the
 * moment the frame is empty, which is what makes it read as one move rather
 * than a switch that happened to be animated.
 *
 * Neither of them keeps a copy of any state that already exists elsewhere:
 * the theme is `data-theme` on <html>, the language is the provider's, and
 * both are read through subscriptions rather than mirrored into React.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/* Theme: the document owns it, React only subscribes                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Does this pointer hover?                                            */
/* ------------------------------------------------------------------ */

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * Hover is a capability, not a width.
 *
 * The capsule opens on hover only where hovering is a real thing the device
 * can do; a touch screen gets tap and nothing else, so the panel can never be
 * opened by a stray "hover" that a tap synthesises and then never undoes.
 * Read through useSyncExternalStore so the server snapshot (false) is what
 * hydration compares against.
 */
function useHasHover() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(HOVER_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );
}

/* ------------------------------------------------------------------ */

export default function TopBar() {
  const { t, lang, setLang } = useLanguage();
  const dark = useSyncExternalStore(subscribeToTheme, readTheme, () => false);
  const reduced = useSafeReducedMotion();
  const hasHover = useHasHover();

  /* Restore the visitor's saved preference. This writes to the DOM — an
     external system — rather than to React state, which is exactly what an
     effect is for. */
  useEffect(() => {
    if (localStorage.getItem("portfolio-theme") === "dark") applyTheme(true);
  }, []);

  const toggleTheme = useCallback(() => applyTheme(!readTheme()), []);

  return (
    <motion.header
      className="tb-root"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="tb-row">
        <ProfileCapsule
          t={t}
          lang={lang}
          setLang={setLang}
          hasHover={hasHover}
        />

        <div className="tb-end">
          <ThemePlane
            dark={dark}
            onToggle={toggleTheme}
            label={t.topbar.toggleTheme}
            reduced={reduced}
          />

          <motion.button
            type="button"
            className="topbar-connect-btn"
            whileHover={reduced ? undefined : { scale: 1.04 }}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() =>
              document
                .querySelector("footer")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t.topbar.connect}
          </motion.button>
        </div>
      </div>

      <style>{TOPBAR_CSS}</style>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* The identity capsule                                                */
/* ------------------------------------------------------------------ */

type Dict = ReturnType<typeof useLanguage>["t"];

function ProfileCapsule({
  t,
  lang,
  setLang,
  hasHover,
}: {
  t: Dict;
  lang: Language;
  setLang: (l: Language) => void;
  hasHover: boolean;
}) {
  const panelId = `tb-panel-${useId()}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  /* Hover peeks, press pins.
     A mouse that has already opened the capsule must not close it again the
     moment it is clicked — the pointer entered first, so a plain toggle would
     make the click read as "shut". The capsule therefore remembers WHY it is
     open: a hover-open closes itself when the pointer leaves, a press-open
     stays until it is pressed again, and pressing a hover-open promotes it
     rather than reversing it. */
  const openedBy = useRef<"hover" | "press" | null>(null);

  /* Escape has to put focus back on the trigger, and putting focus back on the
     trigger is exactly what opens the capsule — so without this the panel shuts
     and springs open again in the same tick. The flag lives for one microtask,
     which is long enough to cover the synchronous focus event `.focus()`
     dispatches and short enough that the next real Tab still opens it. */
  const refocusing = useRef(false);


  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  /* Escape and tap-outside, listened for only while there is something open
     to close — an idle header adds no listeners to the document at all. */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      openedBy.current = null;
      refocusing.current = true;
      setOpen(false);
      triggerRef.current?.focus();
      queueMicrotask(() => {
        refocusing.current = false;
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && wrapRef.current?.contains(target)) return;
      openedBy.current = null;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const copyEmail = useCallback(() => {
    const write = navigator.clipboard?.writeText(CONTACT.email);
    const done = () => {
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    };
    if (write) write.then(done, done);
    else done();
  }, []);

  /* Keyboard opens it; a mouse click does not, because the click handler
     already owns that and two owners is how a control ends up reopening
     itself the moment it is dismissed. `:focus-visible` is the only honest
     way to tell those two arrivals apart. */
  const onFocusIn = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (refocusing.current) return;
    const target = event.target as HTMLElement;
    if (typeof target.matches === "function" && target.matches(":focus-visible")) {
      openedBy.current = "press";
      setOpen(true);
    }
  };

  const onFocusOut = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && wrapRef.current?.contains(next)) return;
    openedBy.current = null;
    setOpen(false);
  };

  const enter = () => {
    if (open) return;
    openedBy.current = "hover";
    setOpen(true);
  };

  const leave = () => {
    if (openedBy.current === "press") return;
    const wrap = wrapRef.current;
    if (wrap && wrap.contains(document.activeElement)) return;
    openedBy.current = null;
    setOpen(false);
  };

  const press = () => {
    if (open && openedBy.current === "hover") {
      openedBy.current = "press";
      return;
    }
    if (open) {
      openedBy.current = null;
      setOpen(false);
      return;
    }
    openedBy.current = "press";
    setOpen(true);
  };

  const act = (index: number) => ({ "--i": index }) as CSSProperties;

  return (
    <div
      ref={wrapRef}
      className="tb-capsule"
      data-open={open ? "1" : "0"}
      onPointerEnter={hasHover ? enter : undefined}
      onPointerLeave={hasHover ? leave : undefined}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <button
        ref={triggerRef}
        type="button"
        className="tb-id"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={press}
      >
        <span className="tb-portrait">
          <Image
            className="tb-portrait-img"
            src="/hero/portrait-turki.webp"
            alt=""
            width={224}
            height={224}
            sizes="44px"
            priority
          />
        </span>

        <span className="tb-idwrap">
          <span className="tb-idtext">
            <span className="tb-name">{t.topbar.fullName}</span>
            <span className="tb-role">{t.topbar.role}</span>
          </span>
        </span>

        <span className="tb-caret" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>

        <span className="tb-sr">
          {open ? t.topbar.closeProfile : t.topbar.openProfile}
        </span>
      </button>

      {/* The fold. Absolutely nothing here is laid out outside the capsule:
          it is one grid column that goes from 0fr to 1fr, so opening it is a
          width reveal inside a bar whose height never changes. `inert` is what
          keeps the clipped actions out of the tab order while it is shut. */}
      <div className="tb-fold" id={panelId} inert={!open} role="group" aria-label={t.topbar.panelLabel}>
        <div className="tb-fold-in">
          <span className="tb-sep" aria-hidden="true" />

          <a
            className="tb-act tb-act-mail"
            href={`mailto:${CONTACT.email}`}
            style={act(0)}
            aria-label={`${t.topbar.emailLabel} — ${CONTACT.email}`}
            title={CONTACT.email}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.6" y="4.8" width="18.8" height="14.4" rx="3" />
              <path d="m3.4 7.4 7.5 5.2a2 2 0 0 0 2.2 0l7.5-5.2" />
            </svg>
            <span className="tb-act-text">{CONTACT.email}</span>
          </a>

          <button
            type="button"
            className="tb-act"
            style={act(1)}
            onClick={copyEmail}
            aria-label={copied ? t.topbar.copied : t.topbar.copyEmail}
            data-done={copied ? "1" : "0"}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4.8 12.6 4.6 4.6 9.8-10.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8.6" y="8.6" width="11.8" height="11.8" rx="2.6" />
                <path d="M15.4 5.6a2.6 2.6 0 0 0-2.6-2h-6a3 3 0 0 0-3 3v6a2.6 2.6 0 0 0 2 2.6" />
              </svg>
            )}
          </button>

          <span className="tb-langslot" style={act(2)}>
            <LanguagePill lang={lang} setLang={setLang} label={t.topbar.switchLanguage} />
            <LanguageFlip lang={lang} setLang={setLang} label={t.topbar.switchLanguage} />
          </span>

          {CONTACT.linkedinUrl && (
            <a
              className="tb-act"
              style={act(3)}
              href={CONTACT.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.topbar.linkedin}
              title={t.topbar.linkedin}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.2 8.9H3.1V21h3.1V8.9ZM4.65 3.2A1.85 1.85 0 1 0 4.65 6.9a1.85 1.85 0 0 0 0-3.7ZM21 14.1c0-3.4-1.82-4.98-4.24-4.98-1.96 0-2.83 1.08-3.32 1.83V8.9H10.3c.04.9 0 12.1 0 12.1h3.14v-6.76c0-.3.02-.6.11-.82.24-.6.79-1.23 1.72-1.23 1.21 0 1.7.93 1.7 2.28V21H21v-6.9Z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Language: one control, two densities                                */
/* ------------------------------------------------------------------ */

/**
 * The wide one: both options side by side, the live one carried on a filled
 * knob. The knob is positioned from `data-lang` on <html>, not from a prop,
 * so it cannot disagree with the document it is describing.
 */
function LanguagePill({
  lang,
  setLang,
  label,
}: {
  lang: Language;
  setLang: (l: Language) => void;
  label: string;
}) {
  const options: { value: Language; label: string }[] = [
    { value: "ar", label: "ع" },
    { value: "en", label: "E" },
  ];

  return (
    <span className="tb-lang" role="group" aria-label={label}>
      <span className="tb-lang-knob" aria-hidden="true" />
      {options.map(({ value, label: mark }) => (
        <button
          key={value}
          type="button"
          className="tb-lang-opt"
          lang={value}
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
        >
          {mark}
        </button>
      ))}
    </span>
  );
}

/**
 * The narrow one: a single button showing the language it would switch TO.
 * Both are always rendered and CSS picks which is on screen, so there is no
 * width read in JavaScript and nothing to get wrong at hydration.
 */
function LanguageFlip({
  lang,
  setLang,
  label,
}: {
  lang: Language;
  setLang: (l: Language) => void;
  label: string;
}) {
  const next: Language = lang === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      className="tb-act tb-langflip"
      onClick={() => setLang(next)}
      aria-label={label}
      title={label}
    >
      <span lang={next} aria-hidden="true">
        {next === "en" ? "EN" : "ع"}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The theme control                                                   */
/* ------------------------------------------------------------------ */

const FLY_MS = 760;
const FLIP_AT = 285;

/**
 * A round window of sky with a paper plane in it.
 *
 * Pressing it starts one CSS animation on the plane and one timer. The plane
 * banks, folds along its own axis and leaves the frame; at 270ms — the point
 * the keyframes have it fully out and invisible — the timer flips the theme,
 * so the sky and the orb change while nothing is there to see them change;
 * then the plane comes back in from the other side, unfolds and settles.
 *
 * The running flag is an attribute set through a ref, not React state: this
 * plays 60 times a second and there is no reason for the tree to re-render
 * for any of them. Under reduced motion there is no flight at all — the theme
 * changes on the press, which is what the control was for.
 */
function ThemePlane({
  dark,
  onToggle,
  label,
  reduced,
}: {
  dark: boolean;
  onToggle: () => void;
  label: string;
  reduced: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const flipTimer = useRef<number | null>(null);
  const landTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
      if (landTimer.current !== null) window.clearTimeout(landTimer.current);
    },
    [],
  );

  const fly = () => {
    const node = btnRef.current;
    if (reduced || !node) {
      onToggle();
      return;
    }
    if (node.dataset.flying === "1") return;

    node.dataset.flying = "1";
    flipTimer.current = window.setTimeout(onToggle, FLIP_AT);
    landTimer.current = window.setTimeout(() => {
      node.removeAttribute("data-flying");
    }, FLY_MS);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className="tb-plane"
      onClick={fly}
      aria-label={label}
      aria-pressed={dark}
    >
      <span className="tb-sky tb-sky-day" aria-hidden="true" />
      <span className="tb-sky tb-sky-night" aria-hidden="true" />

      <span className="tb-orb tb-orb-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.6" />
          <path d="M12 1.6v2.4M12 20v2.4M1.6 12h2.4M20 12h2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7" />
        </svg>
      </span>

      <span className="tb-orb tb-orb-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.6 14.6A8.9 8.9 0 0 1 9.4 3.4a8.9 8.9 0 1 0 11.2 11.2Z" />
        </svg>
      </span>

      <span className="tb-plane-mark" aria-hidden="true">
        {/* Two folds of one sheet: the upper wing lies back at half weight, the
            body carries the tip. Drawn as two triangles rather than one outline
            so the crease is real geometry — it is what the fold animation
            collapses along. */}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.9 2.1 2.4 10.1l8 3.5 11.5-11.5Z" opacity=".5" />
          <path d="M21.9 2.1 10.4 13.6l3.5 8 8-19.5Z" />
        </svg>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const TOPBAR_CSS = `
  .tb-root {
    position: fixed;
    top: 0;
    inset-inline: 0;
    z-index: 100;
    pointer-events: none;

    /* ONE surface system for both objects in the bar: the same glass, the
       same hairline, the same two depths. What separates the capsule from
       the theme window is what they do, never how they are painted. */
    --tb-surface:    rgba(255,255,255,.72);
    --tb-surface-hi: rgba(255,255,255,.90);
    --tb-border:     rgba(13,14,18,.10);
    --tb-border-hi:  rgba(13,14,18,.16);
    --tb-chip:       rgba(13,14,18,.055);
    --tb-chip-hi:    rgba(13,14,18,.10);
    --tb-ink:        var(--text-primary, #0d0e12);
    --tb-ink-soft:   var(--text-secondary, #626262);
    --tb-lift:       0 10px 30px -16px rgba(15,23,42,.34), 0 2px 8px -5px rgba(15,23,42,.16);
    --tb-lift-hi:    0 18px 44px -18px rgba(15,23,42,.40), 0 3px 10px -5px rgba(15,23,42,.18);
    --tb-ring:       0 0 0 3px rgba(20,149,255,.42);
    --tb-ease:       cubic-bezier(.16,1,.3,1);
    /* +1 reading left-to-right, -1 reading right-to-left. Every horizontal
       motion in this file is multiplied by it, so the actions unfold and the
       plane departs in the direction the script is read. */
    --tb-dir: 1;
  }

  :root[dir="rtl"] .tb-root { --tb-dir: -1; }

  [data-theme="dark"] .tb-root {
    --tb-surface:    rgba(24,26,33,.72);
    --tb-surface-hi: rgba(28,31,39,.90);
    --tb-border:     rgba(255,255,255,.11);
    --tb-border-hi:  rgba(255,255,255,.18);
    --tb-chip:       rgba(255,255,255,.07);
    --tb-chip-hi:    rgba(255,255,255,.13);
    --tb-ink-soft:   rgba(240,240,239,.62);
    --tb-lift:       0 12px 32px -16px rgba(0,0,0,.75), 0 2px 8px -5px rgba(0,0,0,.5);
    --tb-lift-hi:    0 20px 48px -18px rgba(0,0,0,.82), 0 3px 10px -5px rgba(0,0,0,.55);
  }

  .tb-row {
    max-width: 1200px;
    margin: 0 auto;
    padding: 13px clamp(14px, 4vw, 32px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .tb-end {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    pointer-events: auto;
  }

  .tb-sr {
    position: absolute;
    width: 1px; height: 1px;
    margin: -1px; padding: 0; border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ══════════════ the identity capsule ══════════════ */

  .tb-capsule {
    pointer-events: auto;
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 auto;
    min-width: 0;
    /* fixed, so opening it can never change the strip the hero reserves */
    height: 48px;
    padding: 5px;
    border: 1px solid var(--tb-border);
    border-radius: 100px;
    background: var(--tb-surface);
    -webkit-backdrop-filter: blur(14px) saturate(170%);
    backdrop-filter: blur(14px) saturate(170%);
    box-shadow: var(--tb-lift);
    transition:
      background-color .45s ease,
      border-color .45s ease,
      box-shadow .45s var(--tb-ease),
      transform .45s var(--tb-ease);
  }

  .tb-capsule[data-open="1"] {
    background: var(--tb-surface-hi);
    border-color: var(--tb-border-hi);
    box-shadow: var(--tb-lift-hi);
    transform: translate3d(0,-1px,0);
  }

  @media (hover: hover) and (pointer: fine) {
    .tb-capsule:hover { box-shadow: var(--tb-lift-hi); transform: translate3d(0,-1px,0); }
  }

  .tb-id {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 100px;
    background: none;
    color: var(--tb-ink);
    font-family: inherit;
    cursor: pointer;
    text-align: start;
    -webkit-tap-highlight-color: transparent;
  }

  .tb-id:focus-visible { outline: none; box-shadow: var(--tb-ring); }

  .tb-portrait {
    position: relative;
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--tb-chip);
    box-shadow: 0 0 0 1px var(--tb-border), inset 0 0 0 1px rgba(255,255,255,.28);
    transition: transform .5s var(--tb-ease), box-shadow .45s ease;
  }

  .tb-portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 46%;
    display: block;
  }

  /* the portrait is the anchor of the fold: it lifts a hair and tightens its
     ring as the capsule opens, so the move starts AT the face */
  .tb-capsule[data-open="1"] .tb-portrait {
    transform: scale(1.045);
    box-shadow: 0 0 0 1px var(--tb-border-hi), inset 0 0 0 1px rgba(255,255,255,.34);
  }

  /* the name is a grid column of its own so a phone can fold it away and give
     its width to the actions — without it ever wrapping or reflowing */
  .tb-idwrap {
    display: grid;
    grid-template-columns: 1fr;
    min-width: 0;
    transition: grid-template-columns .5s var(--tb-ease);
  }

  .tb-idtext {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    min-width: 0;
    overflow: hidden;
    padding-inline: 9px 2px;
    transition: opacity .28s ease;
  }

  .tb-name {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tb-role {
    font-size: 10px;
    font-weight: 500;
    line-height: 1.25;
    color: var(--tb-ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color .45s ease;
  }

  .tb-caret {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    margin-inline: 3px 4px;
    color: var(--tb-ink-soft);
    opacity: .85;
    transition: transform .5s var(--tb-ease), opacity .3s ease, width .5s var(--tb-ease), margin .5s var(--tb-ease);
  }

  .tb-caret svg { width: 100%; height: 100%; }
  .tb-capsule[data-open="1"] .tb-caret { transform: rotate(180deg); }

  /* the fold itself */
  .tb-fold {
    display: grid;
    grid-template-columns: 0fr;
    height: 100%;
    transition: grid-template-columns .55s var(--tb-ease);
  }

  .tb-capsule[data-open="1"] .tb-fold { grid-template-columns: 1fr; }

  .tb-fold-in {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    height: 100%;
    overflow: hidden;
  }

  .tb-sep {
    flex: 0 0 auto;
    width: 1px;
    height: 20px;
    margin-inline-start: 2px;
    background: var(--tb-border-hi);
  }

  /* the stagger. Every child carries its own index, so the order the actions
     arrive in is data on the element rather than a chain of nth-child rules */
  .tb-fold-in > * {
    opacity: 0;
    transform: translate3d(calc(var(--tb-dir) * -10px), 0, 0) scale(.86);
    transition: opacity .3s ease, transform .5s var(--tb-ease);
  }

  .tb-capsule[data-open="1"] .tb-fold-in > * {
    opacity: 1;
    transform: none;
    transition-delay: calc(80ms + var(--i, 0) * 55ms);
  }

  .tb-act {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    border: 0;
    border-radius: 100px;
    background: var(--tb-chip);
    color: var(--tb-ink);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color .3s ease, color .3s ease;
  }

  /* the visual chip is 36px; the thing a thumb has to hit is the full height
     of the capsule and the gap on either side of it — comfortably past 44 */
  .tb-act::after {
    content: "";
    position: absolute;
    inset: -6px -3px;
    border-radius: 100px;
  }

  .tb-act svg { width: 16px; height: 16px; display: block; }
  .tb-act:focus-visible { outline: none; box-shadow: var(--tb-ring); }
  .tb-act[data-done="1"] { background: rgba(20,149,255,.16); color: var(--accent, #1495ff); }

  @media (hover: hover) and (pointer: fine) {
    .tb-act:hover { background: var(--tb-chip-hi); }
  }

  .tb-act-text { display: none; }

  .tb-langslot { flex: 0 0 auto; display: flex; align-items: center; }

  .tb-lang {
    position: relative;
    display: none;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 100px;
    background: var(--tb-chip);
  }

  .tb-lang-knob {
    position: absolute;
    z-index: 0;
    top: 3px;
    inset-inline-start: 3px;
    width: 30px;
    height: 30px;
    border-radius: 100px;
    background: var(--tb-ink);
    transform: translate3d(0,0,0);
    transition: transform .42s var(--tb-ease), background-color .45s ease;
  }

  :root[data-lang="en"] .tb-lang-knob { transform: translate3d(32px,0,0); }

  .tb-lang-opt {
    position: relative;
    z-index: 1;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 100px;
    background: none;
    color: var(--tb-ink);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    opacity: .58;
    -webkit-tap-highlight-color: transparent;
    transition: color .3s ease, opacity .3s ease;
  }

  .tb-lang-opt[aria-pressed="true"] {
    color: var(--bg-primary, #fff);
    opacity: 1;
    font-weight: 700;
  }

  .tb-lang-opt:focus-visible { outline: none; box-shadow: var(--tb-ring); }

  .tb-langflip { font-size: 11.5px; font-weight: 700; letter-spacing: .02em; }

  /* ══════════════ the theme control ══════════════ */

  .tb-plane {
    position: relative;
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--tb-border);
    border-radius: 50%;
    background: var(--tb-surface);
    -webkit-backdrop-filter: blur(14px) saturate(170%);
    backdrop-filter: blur(14px) saturate(170%);
    box-shadow: var(--tb-lift);
    color: var(--tb-ink);
    cursor: pointer;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transition:
      border-color .45s ease,
      background-color .45s ease,
      box-shadow .45s var(--tb-ease),
      transform .35s var(--tb-ease);
  }

  .tb-plane:focus-visible { outline: none; box-shadow: var(--tb-lift), var(--tb-ring); }
  .tb-plane:active { transform: scale(.94); }

  @media (hover: hover) and (pointer: fine) {
    .tb-plane:hover { box-shadow: var(--tb-lift-hi); transform: translate3d(0,-1px,0); }
  }

  /* the sky: two flat gradients cross-fading, so nothing has to interpolate a
     gradient and nothing is ever blurred per frame */
  .tb-sky {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    opacity: 0;
    transition: opacity .3s ease;
  }

  .tb-sky-day   { background: radial-gradient(120% 120% at 30% 18%, #e8f3ff 0%, #ffffff 72%); }
  .tb-sky-night { background: radial-gradient(120% 120% at 30% 18%, #222c46 0%, #0e1220 74%); }

  html:not([data-theme="dark"]) .tb-sky-day,
  [data-theme="light"] .tb-sky-day,
  [data-theme="dark"] .tb-sky-night { opacity: 1; }

  .tb-orb {
    position: absolute;
    top: 6px;
    inset-inline-start: 6px;
    width: 11px;
    height: 11px;
    opacity: 0;
    transform: scale(.5);
    transition: opacity .28s ease, transform .45s var(--tb-ease);
  }

  .tb-orb svg { width: 100%; height: 100%; display: block; }
  .tb-orb-sun  { color: #f0a500; }
  .tb-orb-moon { color: #cdd7f2; }

  html:not([data-theme="dark"]) .tb-orb-sun,
  [data-theme="light"] .tb-orb-sun,
  [data-theme="dark"] .tb-orb-moon { opacity: 1; transform: none; }

  /* The mark fills the window and centres its own glyph, so the box the
     keyframes rotate and fold is concentric with the circle it flies in — no
     margin arithmetic, and nothing to mirror when the script flips. The
     resting bank and the offset that keeps the plane clear of the orb live on
     the glyph inside it, where the animation cannot disturb them. */
  .tb-plane-mark {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--tb-ink);
    transition: color .45s ease;
  }

  /* scaleX(-1) in Arabic: the plane must point the way the page is read, or it
     departs backwards. The mirror is outermost so it flips the already-banked
     glyph rather than the angle it is banked at. */
  .tb-plane-mark svg {
    width: 15px;
    height: 15px;
    display: block;
    transform: translate(calc(var(--tb-dir) * 3px), 3px) scaleX(var(--tb-dir)) rotate(-12deg);
  }

  /* fold · glide · (theme changes here) · unfold · settle */
  /* Nine frames, played linearly, because the shape of the move is in WHERE
     the plane is at each moment rather than in an easing curve laid over two
     endpoints. It banks and folds along its crease on the way out, is gone
     between 37% and 40% — 285ms, which is when the timer flips the theme —
     and comes back in from the far side still folded, opening out as it
     settles. Every value that has a direction is multiplied by --tb-dir, so
     Arabic gets the same flight read the other way. */
  @keyframes tb-plane-fly {
    0%   { transform: translate3d(0,0,0) rotate(0deg) scaleX(1);                                                        opacity: 1; }
    16%  { transform: translate3d(calc(var(--tb-dir) *  6px), -2px,0) rotate(calc(var(--tb-dir) * -14deg)) scaleX(.82);  opacity: 1; }
    30%  { transform: translate3d(calc(var(--tb-dir) * 22px), -8px,0) rotate(calc(var(--tb-dir) * -30deg)) scaleX(.32);  opacity: .38; }
    37%  { transform: translate3d(calc(var(--tb-dir) * 32px),-12px,0) rotate(calc(var(--tb-dir) * -34deg)) scaleX(.2);   opacity: 0; }
    40%  { transform: translate3d(calc(var(--tb-dir) *-30px), 12px,0) rotate(calc(var(--tb-dir) *  28deg)) scaleX(.2);   opacity: 0; }
    52%  { transform: translate3d(calc(var(--tb-dir) *-16px),  7px,0) rotate(calc(var(--tb-dir) *  18deg)) scaleX(.46);  opacity: .55; }
    70%  { transform: translate3d(calc(var(--tb-dir) * -5px),  2px,0) rotate(calc(var(--tb-dir) *   6deg)) scaleX(.86);  opacity: 1; }
    86%  { transform: translate3d(calc(var(--tb-dir) *  1px),  0,   0) rotate(calc(var(--tb-dir) *  -2deg)) scaleX(1.03); opacity: 1; }
    100% { transform: translate3d(0,0,0) rotate(0deg) scaleX(1);                                                        opacity: 1; }
  }

  .tb-plane[data-flying="1"] .tb-plane-mark {
    will-change: transform, opacity;
    animation: tb-plane-fly ${FLY_MS}ms linear both;
  }

  /* ══════════════ the connect button ══════════════ */

  .topbar-connect-btn {
    flex: 0 0 auto;
    padding: 11px 22px;
    border: 0;
    border-radius: 100px;
    background: var(--text-primary);
    color: var(--bg-primary);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,.18);
    transition: background-color .45s ease, color .45s ease;
  }

  .topbar-connect-btn:focus-visible { outline: none; box-shadow: var(--tb-ring); }

  /* ══════════════ widths ══════════════ */

  /* Below the tablet the capsule folds its own name away when it opens: the
     actions need that width more than the bar needs to repeat a name the hero
     is about to say in 96px type. The portrait stays, so the identity never
     disappears — it just gets out of the way of what it is offering. */
  @media (max-width: 767px) {
    .tb-capsule[data-open="1"] .tb-idwrap { grid-template-columns: 0fr; }
    .tb-capsule[data-open="1"] .tb-idtext { opacity: 0; }
    .tb-capsule[data-open="1"] .tb-caret { width: 0; margin-inline: 0 2px; opacity: 0; }
    .tb-sep { display: none; }
  }

  @media (max-width: 559px) {
    .topbar-connect-btn { display: none; }
  }

  /* The narrowest phones. Every chip gives back 2px and the row gives back
     its gaps, which is what keeps four actions, a portrait and the theme
     window inside 320 without a scrollbar. */
  @media (max-width: 379px) {
    .tb-row { gap: 6px; }
    .tb-fold-in { gap: 4px; }
    .tb-act { height: 34px; min-width: 34px; }
    .tb-act svg { width: 15px; height: 15px; }
    .tb-name { font-size: 12.5px; }
    .tb-role { font-size: 9.5px; }
  }

  @media (min-width: 768px) {
    .tb-row { padding-block: 18px; }
    .tb-capsule { height: 56px; padding: 6px; }
    .tb-portrait { width: 44px; height: 44px; }
    .tb-idtext { padding-inline: 10px 2px; }
    .tb-name { font-size: 14.5px; }
    .tb-role { font-size: 11px; }
    .tb-caret { width: 16px; height: 16px; margin-inline: 4px 6px; }
    .tb-fold-in { gap: 6px; }
    .tb-sep { margin-inline-start: 4px; height: 24px; }
    .tb-act { height: 40px; min-width: 40px; }
    .tb-act svg { width: 17px; height: 17px; }
    .tb-plane { width: 46px; height: 46px; }
    .tb-plane-mark svg { width: 16px; height: 16px; }
    .tb-orb { width: 12px; height: 12px; top: 7px; inset-inline-start: 7px; }
    .tb-end { gap: 10px; }
    .tb-lang { display: flex; }
    .tb-langflip { display: none; }
    .tb-lang-knob { width: 34px; height: 34px; }
    :root[data-lang="en"] .tb-lang-knob { transform: translate3d(36px,0,0); }
    .tb-lang-opt { width: 34px; height: 34px; font-size: 13px; }
  }

  /* Wide enough to say the address out loud rather than draw an envelope. */
  @media (min-width: 1000px) {
    .tb-act-mail { padding-inline: 13px 15px; }
    .tb-act-text { display: inline; }
  }

  /* ══════════════ reduced motion ══════════════ */

  @media (prefers-reduced-motion: reduce) {
    .tb-root { opacity: 1 !important; transform: none !important; }
    .tb-capsule,
    .tb-capsule[data-open="1"],
    .tb-portrait,
    .tb-idwrap,
    .tb-idtext,
    .tb-caret,
    .tb-fold,
    .tb-fold-in > *,
    .tb-act,
    .tb-lang-knob,
    .tb-lang-opt,
    .tb-sky,
    .tb-orb,
    .tb-plane,
    .tb-plane-mark,
    .topbar-connect-btn {
      transition: none !important;
      animation: none !important;
      transition-delay: 0ms !important;
    }
    .tb-capsule[data-open="1"],
    .tb-capsule:hover,
    .tb-plane:hover { transform: none !important; }
    .tb-capsule[data-open="1"] .tb-portrait { transform: none !important; }
  }
`;
