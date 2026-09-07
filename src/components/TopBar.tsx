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
 * TWO OBJECTS: A NAME ON THE LEFT, A WINDOW ON THE RIGHT
 * ────────────────────────────────────────────────────────────────────────
 * Physically left — in Arabic as much as in English — sits the identity
 * card: the portrait, the name, the role. One language at a time, whichever
 * the document is in. It is not a dropdown: asking it for more opens it
 * SIDEWAYS inside the strip it already occupies, and all it offers is the
 * two things worth offering from a header — write to me, and read me in the
 * other language. Nothing is ever laid out below the bar, which is why the
 * card cannot cover the hero's name, its copy, its buttons or the flight
 * path, and why the bar's height never changes whether it is open or shut.
 *
 * Physically right sits one cabin window, and it is the theme control. It is
 * not a button decorated with an aeroplane: pressing it pulls the shade down
 * over the glass, the sky outside changes from day to night while the glass
 * is covered, and the shade goes back up. The theme change is the view out
 * of the window, so the animation is the explanation rather than decoration
 * laid over one.
 *
 * Neither object keeps a copy of state that already exists elsewhere: the
 * theme is `data-theme` on <html>, the language is the provider's. React
 * state is for the one thing that is genuinely React's — whether the card is
 * open — and the shade is an attribute written straight to the DOM.
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
 * The card opens on hover only where hovering is a real thing the device can
 * do; a touch screen gets tap and nothing else, so the panel can never be
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
/* The identity                                                        */
/* ------------------------------------------------------------------ */

/**
 * One language at a time. The document is in Arabic or it is in English, and
 * the card says so in that language only — a header is not the place to print
 * a name twice.
 */
const IDENTITY = {
  name: { ar: "تركي", en: "Turki" },
  role: { ar: "قائد هندسة البرمجيات", en: "Engineering Leader" },
} as const;

/* ------------------------------------------------------------------ */
/* The shade's timing                                                  */
/* ------------------------------------------------------------------ */

/** the longest a shade leg may take, when it has the whole glass to cross */
const TRAVEL_MAX_MS = 420;
/** the shortest, when the hand already did nearly all of it */
const TRAVEL_MIN_MS = 140;
/** how far the hand must carry the shade before letting go commits the change */
const COMMIT_AT = 0.42;
/** past this many pixels a press is a drag and not a tap */
const DRAG_SLOP = 3;
/** pulling down is weighted; letting go is a release */
const EASE_PULL = "cubic-bezier(.36,0,.16,1)";
const EASE_LIFT = "cubic-bezier(.16,1,.3,1)";

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

  return (
    <motion.header
      className="tb-root"
      style={{ "--doc-dir": lang === "ar" ? "rtl" : "ltr" } as CSSProperties}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {/*
        `direction: ltr` on the row, and only on the row. It is what makes
        "the name is on the left and the window is on the right" a fact of the
        layout rather than something that happens to be true in English — the
        two children are laid out in physical order in both scripts. The text
        inside the card takes the document's direction back through --doc-dir,
        so Arabic still reads right to left where it is read.
      */}
      <div className="tb-row">
        <ProfileCard t={t} lang={lang} setLang={setLang} hasHover={hasHover} />
        <CabinWindow dark={dark} label={t.topbar.toggleTheme} reduced={reduced} />
      </div>

      <style>{TOPBAR_CSS}</style>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* The identity card                                                   */
/* ------------------------------------------------------------------ */

type Dict = ReturnType<typeof useLanguage>["t"];

function ProfileCard({
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

  /* Hover peeks, press pins.
     A mouse that has already opened the card must not close it again the
     moment it is clicked — the pointer entered first, so a plain toggle would
     make the click read as "shut". The card therefore remembers WHY it is
     open: a hover-open closes itself when the pointer leaves, a press-open
     stays until it is pressed again, and pressing a hover-open promotes it
     rather than reversing it. */
  const openedBy = useRef<"hover" | "press" | null>(null);

  /* Escape has to put focus back on the trigger, and putting focus back on the
     trigger is exactly what opens the card — so without this the panel shuts
     and springs open again in the same tick. The flag lives for one microtask,
     which is long enough to cover the synchronous focus event `.focus()`
     dispatches and short enough that the next real Tab still opens it. */
  const refocusing = useRef(false);

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
      className="tb-card"
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
            src="/hero/portrait-turki-tab.jpg"
            alt={t.topbar.portraitAlt}
            width={320}
            height={320}
            sizes="(max-width: 767px) 40px, (max-width: 1023px) 50px, 54px"
            priority
          />
        </span>

        {/* one grid column of its own, so a phone can fold the words away and
            give their width to the actions — without them ever wrapping */}
        <span className="tb-idwrap">
          <span className="tb-idtext">
            <span className="tb-name">{IDENTITY.name[lang]}</span>
            <span className="tb-role">{IDENTITY.role[lang]}</span>
          </span>
        </span>

        <span className="tb-sr">
          {open ? t.topbar.closeProfile : t.topbar.openProfile}
        </span>
      </button>

      {/* The fold. Nothing here is laid out outside the card: it is one grid
          column that goes from 0fr to 1fr, so opening it is a width reveal
          inside a bar whose height never changes. `inert` is what keeps the
          clipped actions out of the tab order while it is shut. */}
      <div
        className="tb-fold"
        id={panelId}
        inert={!open}
        role="group"
        aria-label={t.topbar.panelLabel}
      >
        <div className="tb-fold-in">
          {/* An icon, not an address. The address is in the label, where a
              screen reader will read it and a tooltip will show it, and in the
              mailto the icon opens — printing it across the header only made
              the card long. */}
          <a
            className="tb-act"
            href={`mailto:${CONTACT.email}`}
            style={act(0)}
            aria-label={`${t.topbar.emailLabel} — ${CONTACT.email}`}
            title={CONTACT.email}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.6" y="4.8" width="18.8" height="14.4" rx="3" />
              <path d="m3.4 7.4 7.5 5.2a2 2 0 0 0 2.2 0l7.5-5.2" />
            </svg>
          </a>

          <span className="tb-langslot" style={act(1)}>
            <LanguagePill lang={lang} setLang={setLang} label={t.topbar.switchLanguage} />
            <LanguageFlip lang={lang} setLang={setLang} label={t.topbar.switchLanguage} />
          </span>
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
/* The cabin window — which is the theme control                       */
/* ------------------------------------------------------------------ */

/**
 * One window in the fuselage, and the theme IS the shade's position.
 *
 * Light is a window with the shade up and the sky outside. Dark is a window
 * with the shade pulled down — closed, the way a cabin window is closed when
 * the lights go off. So the control does not "play an animation and return":
 * it goes somewhere and stays there, and where it is tells you which theme you
 * are in without a single icon.
 *
 * THE SHADE IS DRAGGED. Put a finger or a cursor on it and move, and it comes
 * with you one to one, clamped to the glass, in whichever direction it has
 * room to go — down when it is up, up when it is down. Carry it past 42% and
 * letting go completes the move and changes the theme; let go short of that
 * and it returns to where it started and nothing changes. A tap toggles, and
 * so does the keyboard.
 *
 * The sky always changes under cover: on the way down it changes as the shade
 * lands, and on the way up it changes BEFORE the lift starts — the shade is
 * already covering the glass at that moment, so the day it reveals was there
 * all along.
 *
 * Nothing here is React state, and nothing animates through a CSS variable.
 * The offset is written straight to `style.transform` as pixels, which is the
 * one form a browser can hand to the compositor; a custom property inside a
 * transform cannot be composited and invalidates style on every frame, which
 * is exactly what made the earlier version stutter.
 */
function CabinWindow({
  dark,
  label,
  reduced,
}: {
  dark: boolean;
  label: string;
  reduced: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const shadeRef = useRef<HTMLSpanElement>(null);
  /* the live gesture, if there is one — never state, so a drag renders nothing */
  const drag = useRef<{
    id: number;
    startY: number;
    travel: number;
    from: number;
    moved: boolean;
  } | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** where the shade rests for a theme: covered at 0, parked one height above */
  const restFor = (isDark: boolean, travel: number) => (isDark ? 0 : -travel);

  const setY = (px: number, ms?: number, ease?: string) => {
    const shade = shadeRef.current;
    if (!shade) return;
    if (ms !== undefined) {
      shade.style.transitionDuration = `${ms}ms`;
      shade.style.transitionTimingFunction = ease ?? EASE_LIFT;
    }
    shade.style.transform = `translate3d(0, ${px}px, 0)`;
  };

  /* Hand the shade back to the stylesheet, which positions it from the theme
     alone. Clearing the inline transform is only ever done at a moment when
     the two already agree, so it is never a visible step. */
  const handBack = useCallback(() => {
    const node = btnRef.current;
    const shade = shadeRef.current;
    node?.removeAttribute("data-busy");
    if (!shade) return;
    shade.style.transform = "";
    shade.style.transitionDuration = "";
    shade.style.transitionTimingFunction = "";
  }, []);

  const legMs = (fromPx: number, toPx: number, travel: number) =>
    Math.round(
      TRAVEL_MIN_MS +
        (Math.abs(toPx - fromPx) / travel) * (TRAVEL_MAX_MS - TRAVEL_MIN_MS),
    );

  /** Finish the move from wherever the shade is, and land in the new theme. */
  const settle = useCallback(
    (fromPx: number, travel: number, toDark: boolean) => {
      const node = btnRef.current;
      if (!node || travel <= 0) return;
      clearTimers();
      node.dataset.busy = "1";
      node.removeAttribute("data-drag");

      const target = restFor(toDark, travel);
      const ms = legMs(fromPx, target, travel);

      if (toDark) {
        /* Closing. The glass is open right now, so the sky may only change once
           the shade has landed on it — which is the end of this leg. */
        requestAnimationFrame(() => setY(target, ms, EASE_PULL));
        timers.current.push(
          window.setTimeout(() => {
            applyTheme(true);
            handBack();
          }, ms + 30),
        );
      } else {
        /* Opening. The shade is covering the glass at this instant, so the sky
           changes FIRST and the lift reveals a day that was already there. The
           inline transform still holds the shade where it is, so changing the
           theme underneath it moves nothing. */
        applyTheme(false);
        requestAnimationFrame(() => setY(target, ms, EASE_LIFT));
        timers.current.push(window.setTimeout(handBack, ms + 30));
      }
    },
    [clearTimers, handBack],
  );

  /** Let go too early: back where it started, and the theme is untouched. */
  const abort = useCallback(
    (fromPx: number, travel: number, isDark: boolean) => {
      const node = btnRef.current;
      if (!node || travel <= 0) return;
      clearTimers();
      node.removeAttribute("data-drag");
      node.dataset.busy = "1";
      const target = restFor(isDark, travel);
      const ms = legMs(fromPx, target, travel);
      requestAnimationFrame(() => setY(target, ms, EASE_LIFT));
      timers.current.push(window.setTimeout(handBack, ms + 30));
    },
    [clearTimers, handBack],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const node = btnRef.current;
    const shade = shadeRef.current;
    /* Under reduced motion there is no gesture to make — the click handler
       moves the shade to the other end with no travel at all. */
    if (reduced || !node || !shade) return;
    if (drag.current || node.dataset.busy === "1") return;
    if (event.button !== undefined && event.button !== 0) return;

    clearTimers();
    /* one rectangle read, at the start of the gesture — never during it */
    const travel = shade.getBoundingClientRect().height;
    if (travel <= 0) return;

    const from = restFor(readTheme(), travel);
    node.setPointerCapture(event.pointerId);
    node.dataset.drag = "1";
    node.dataset.busy = "1";
    /* pin it where it is, so the hover peek cannot count as a head start */
    setY(from, 0);
    drag.current = { id: event.pointerId, startY: event.clientY, travel, from, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.abs(dy) > DRAG_SLOP) d.moved = true;
    /* the shade cannot leave its track at either end */
    setY(Math.max(-d.travel, Math.min(0, d.from + dy)));
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    drag.current = null;
    btnRef.current?.releasePointerCapture?.(d.id);

    const isDark = readTheme();
    const y = Math.max(-d.travel, Math.min(0, d.from + (event.clientY - d.startY)));

    if (cancelled) abort(y, d.travel, isDark);
    /* a press that never moved is a tap, and a tap goes to the other end */
    else if (!d.moved) settle(y, d.travel, !isDark);
    /* otherwise it is how far the hand carried it, from wherever it started */
    else if (Math.abs(y - d.from) / d.travel >= COMMIT_AT) settle(y, d.travel, !isDark);
    else abort(y, d.travel, isDark);
  };

  /**
   * Keyboard only. A mouse click arrives after the pointer sequence that has
   * already decided what happens, and `detail` is how the two are told apart:
   * a real click carries the click count, Enter and Space carry 0.
   */
  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced) {
      applyTheme(!readTheme());
      return;
    }
    if (event.detail !== 0) return;
    const node = btnRef.current;
    const shade = shadeRef.current;
    if (!node || !shade || node.dataset.busy === "1") return;
    const travel = shade.getBoundingClientRect().height;
    const isDark = readTheme();
    settle(restFor(isDark, travel), travel, !isDark);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className="tw"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      aria-label={label}
      aria-pressed={dark}
    >
      {/* the fuselage panel the window is cut into */}
      <span className="tw-hull" aria-hidden="true">
        {/* the recessed inner frame */}
        <span className="tw-bezel">
          <span className="tw-glass">
            {/* Day and night are both painted; only one is opaque. They swap
                instantly rather than cross-fading, because the swap happens
                under the shade where a cross-fade would be a wasted frame. */}
            <span className="tw-sky tw-day">
              <i className="tw-cloud tw-cloud-a" />
              <i className="tw-cloud tw-cloud-b" />
              <i className="tw-cloud tw-cloud-c" />
            </span>

            <span className="tw-sky tw-night">
              <i className="tw-moon" />
              <i className="tw-star tw-star-a" />
              <i className="tw-star tw-star-b" />
              <i className="tw-star tw-star-c" />
              <i className="tw-star tw-star-d" />
            </span>

            {/* the light falling across the pane */}
            <span className="tw-gloss" />

            {/* the shade, parked above the glass until it is pulled down */}
            <span ref={shadeRef} className="tw-shade">
              <i className="tw-grip" />
            </span>
          </span>

          {/* The shade's parked lip, sitting proud at the top of the glass —
              the detail that makes the frame read as a window with a blind in
              it rather than a rounded rectangle with a picture in it. */}
          <span className="tw-lip" />
        </span>
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
       same hairline, the same two depths. */
    --tb-surface:    rgba(255,255,255,.74);
    --tb-surface-hi: rgba(255,255,255,.92);
    --tb-border:     rgba(13,14,18,.10);
    --tb-border-hi:  rgba(13,14,18,.16);
    --tb-chip:       rgba(13,14,18,.055);
    --tb-chip-hi:    rgba(13,14,18,.10);
    /* the pill's own surface: opaque, so its width can animate for free */
    --tb-solid:      #ffffff;
    --tb-edge:       rgba(13,14,18,.07);
    --tb-ink:        var(--text-primary, #0d0e12);
    --tb-ink-soft:   var(--text-secondary, #626262);
    --tb-lift:       0 10px 30px -16px rgba(15,23,42,.34), 0 2px 8px -5px rgba(15,23,42,.16);
    --tb-lift-hi:    0 18px 44px -18px rgba(15,23,42,.40), 0 3px 10px -5px rgba(15,23,42,.18);
    --tb-ring:       0 0 0 3px rgba(20,149,255,.42);
    --tb-ease:       cubic-bezier(.16,1,.3,1);
    --tb-blur:       blur(12px) saturate(150%);

    /* ---- the window's own palette ---- */
    /* the fuselage: warm off-white, lit from above, exactly as a cabin wall */
    --tw-hull-a:   #fdfcfb;
    --tw-hull-b:   #e7e3de;
    --tw-hull-ring:rgba(13,14,18,.13);
    --tw-bezel-a:  #f6f3f0;
    --tw-bezel-b:  #dcd8d2;
    --tw-shade-a:  #f7f5f2;
    --tw-shade-b:  #e2ded8;
    --tw-grip:     rgba(13,14,18,.16);
    --tw-ease:     cubic-bezier(.16,1,.3,1);
  }

  [data-theme="dark"] .tb-root {
    --tb-surface:    rgba(24,26,33,.74);
    --tb-surface-hi: rgba(28,31,39,.92);
    --tb-border:     rgba(255,255,255,.11);
    --tb-border-hi:  rgba(255,255,255,.18);
    --tb-chip:       rgba(255,255,255,.07);
    --tb-chip-hi:    rgba(255,255,255,.13);
    --tb-solid:      #191c23;
    --tb-edge:       rgba(255,255,255,.09);
    --tb-ink-soft:   rgba(240,240,239,.62);
    --tb-lift:       0 12px 32px -16px rgba(0,0,0,.75), 0 2px 8px -5px rgba(0,0,0,.5);
    --tb-lift-hi:    0 20px 48px -18px rgba(0,0,0,.82), 0 3px 10px -5px rgba(0,0,0,.55);

    /* the cabin at night: the same panel, lit by the reading light instead */
    --tw-hull-a:   #333844;
    --tw-hull-b:   #1b1f28;
    --tw-hull-ring:rgba(255,255,255,.13);
    --tw-bezel-a:  #2b303b;
    --tw-bezel-b:  #171b23;
    --tw-shade-a:  #454c5b;
    --tw-shade-b:  #2d323d;
    --tw-grip:     rgba(255,255,255,.34);
  }

  .tb-row {
    /* the one rule that pins the composition to physical sides */
    direction: ltr;
    max-width: 1240px;
    margin: 0 auto;
    padding: 12px clamp(14px, 4vw, 32px);
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .tb-sr {
    position: absolute;
    width: 1px; height: 1px;
    margin: -1px; padding: 0; border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ══════════════ the identity card ══════════════ */

  .tb-card {
    pointer-events: auto;
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 auto;
    min-width: 0;
    /* fixed, so opening it can never change the strip the hero reserves */
    height: 48px;
    padding: 5px;
    /* A PILL, not a squircle. The radius is half the height at every size, so
       the card is one continuous capsule around a circular portrait rather
       than a rounded box with a rounded box inside it. */
    border-radius: 999px;
    border: 1px solid var(--tb-edge);
    /*
      Solid, not glass. Two reasons, and the second is the important one:
      the reference this is modelled on is a clean white pill, and a
      backdrop-filter on an element whose WIDTH animates forces the browser to
      re-blur everything behind it on every frame of the open. That single
      property was most of why this transition stuttered.
    */
    background: var(--tb-solid);
    box-shadow: var(--tb-lift);
    transition:
      background-color .4s ease,
      border-color .4s ease,
      box-shadow .4s var(--tb-ease),
      transform .4s var(--tb-ease);
  }

  .tb-card[data-open="1"] {
    box-shadow: var(--tb-lift-hi);
    transform: translate3d(0,-1px,0);
  }

  @media (hover: hover) and (pointer: fine) {
    .tb-card:hover { box-shadow: var(--tb-lift-hi); transform: translate3d(0,-1px,0); }
  }

  /*
    The card is pinned physically left; its CONTENTS are not.
    In Arabic the portrait moves to the trailing side so the text's right edge
    sits against it, and the chevron lands at the end of the reading order on
    the far left. That is what closes the hole this used to have between the
    portrait and a right-aligned name: the two lines are ragged on the side
    away from the photograph, in both scripts, instead of only in English.
    The card itself stays LTR, so the fold is always physically last and the
    card can only ever grow toward the middle of the screen.
  */
  .tb-id {
    position: relative;
    direction: var(--doc-dir, rtl);
    display: flex;
    align-items: center;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--tb-ink);
    font-family: inherit;
    cursor: pointer;
    text-align: start;
    -webkit-tap-highlight-color: transparent;
  }

  /* Open on a phone this button is just the portrait, so the target is the
     portrait plus the card's own padding — 44 in both directions, stopping
     short of the first action rather than overlapping it. */
  .tb-id::after {
    content: "";
    position: absolute;
    /* symmetric, because the portrait sits on the leading side in English and
       the trailing side in Arabic — the target has to be right either way */
    inset: -6px -4px;
    border-radius: 999px;
  }

  .tb-id:focus-visible { outline: none; box-shadow: var(--tb-ring); }

  .tb-portrait {
    position: relative;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    /* a circle, always — not a squircle that rounds up when the card opens */
    border-radius: 50%;
    overflow: hidden;
    background: var(--tb-chip);
    box-shadow: 0 0 0 1px var(--tb-border), inset 0 0 0 1px rgba(255,255,255,.28);
    transition: box-shadow .45s ease;
  }

  .tb-portrait-img {
    width: 100%;
    height: 100%;
    /* A real photograph, cut on purpose: the derivative is already a square
       crop of the head and shoulders off the full-resolution original, so the
       frame receives a 1:1 picture and has nothing left to decide. */
    object-fit: cover;
    object-position: 50% 50%;
    display: block;
  }

  /* the portrait is the anchor of the fold: it lifts a hair and rounds as the
     card opens, so the move starts AT the face */
  .tb-card[data-open="1"] .tb-portrait {
    box-shadow: 0 0 0 1px var(--tb-border-hi), inset 0 0 0 1px rgba(255,255,255,.34);
  }

  .tb-idwrap {
    display: grid;
    grid-template-columns: 1fr;
    min-width: 0;
    transition: grid-template-columns .5s var(--tb-ease);
  }

  .tb-idtext {
    /* direction is inherited from .tb-id, which is where it is decided */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
    min-width: 0;
    /* clips horizontally so the words can fold away on a phone — which is
       exactly why the lines below must carry their own descender room */
    overflow: hidden;
    padding-inline: 11px 18px;
    transition: opacity .28s ease;
  }

  /*
    Thmanyah Sans is 1000/-250 per em: its glyph box is 1.25em tall BEFORE any
    line-height applies. A line-height of 1.25 therefore leaves the tail of ي
    sitting exactly on the edge of the line box, and the moment an ancestor
    clips — .tb-idtext does — the descender is cut off. 1.45 is the room the
    script actually needs, and it costs nothing: these are two single lines in
    a flex column, so the extra leading is centred, not stacked.

    Neither line truncates any more either. There is one name and one role, in
    one language, and both are short — an ellipsis here only ever hid a letter.
  */
  .tb-name {
    font-size: var(--chrome-name, 15px);
    font-weight: var(--chrome-name-weight, 700);
    line-height: 1.45;
    letter-spacing: -.01em;
    white-space: nowrap;
  }

  .tb-role {
    font-size: var(--chrome-label, 11px);
    font-weight: var(--chrome-label-weight, 500);
    line-height: 1.45;
    color: var(--tb-ink-soft);
    white-space: nowrap;
    transition: color .45s ease;
  }

  /* the fold itself */
  .tb-fold {
    display: grid;
    grid-template-columns: 0fr;
    height: 100%;
    transition: grid-template-columns .55s var(--tb-ease);
  }

  .tb-card[data-open="1"] .tb-fold { grid-template-columns: 1fr; }

  .tb-fold-in {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    padding-inline-start: 6px;
  }

  /* the stagger. Each child carries its own index, so the order the actions
     arrive in is data on the element rather than a chain of nth-child rules.
     The card is pinned to the physical left, so they always unfold physically
     rightward — this offset is not mirrored by script. */
  .tb-fold-in > * {
    opacity: 0;
    transform: translate3d(-10px, 0, 0) scale(.86);
    transition: opacity .3s ease, transform .5s var(--tb-ease);
  }

  .tb-card[data-open="1"] .tb-fold-in > * {
    opacity: 1;
    transform: none;
    transition-delay: calc(80ms + var(--i, 0) * 70ms);
  }

  .tb-act {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 38px;
    min-width: 38px;
    padding: 0;
    border: 0;
    /* round chips inside a pill — one shape language, not two */
    border-radius: 50%;
    background: var(--tb-chip);
    color: var(--tb-ink);
    font-family: inherit;
    font-size: var(--chrome-action, 13px);
    font-weight: var(--chrome-action-weight, 600);
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color .3s ease, color .3s ease;
  }

  /* the visual chip is 40px and the target is 44 — the 4px gap between chips
     is spent entirely on the two targets either side of it, so every pixel of
     the row belongs to precisely one action and no seam is ambiguous */
  .tb-act::after {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 50%;
  }

  .tb-act svg { width: 17px; height: 17px; display: block; }
  .tb-act:focus-visible { outline: none; box-shadow: var(--tb-ring); }

  @media (hover: hover) and (pointer: fine) {
    .tb-act:hover { background: var(--tb-chip-hi); }
  }

  .tb-langslot { flex: 0 0 auto; display: flex; align-items: center; }

  .tb-lang {
    position: relative;
    display: none;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 999px;
    background: var(--tb-chip);
  }

  .tb-lang-knob {
    position: absolute;
    z-index: 0;
    top: 3px;
    left: 3px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--tb-ink);
    transform: translate3d(0,0,0);
    transition: transform .42s var(--tb-ease), background-color .45s ease;
  }

  /* the pill is laid out physically (the card is), so the knob travels
     physically too — no direction term to get wrong */
  :root[data-lang="en"] .tb-lang-knob { transform: translate3d(34px,0,0); }

  .tb-lang-opt {
    position: relative;
    z-index: 1;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--tb-ink);
    font-family: inherit;
    font-size: var(--chrome-action, 13px);
    font-weight: var(--chrome-action-weight, 600);
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

  .tb-langflip { font-weight: 700; letter-spacing: .02em; }

  /* ══════════════ the cabin window ══════════════ */

  .tw {
    pointer-events: auto;
    position: relative;
    flex: 0 0 auto;
    width: 36px;
    height: 50px;
    padding: 0;
    border: 0;
    background: none;
    /* it is pulled, so it says so — and it never selects the page behind it */
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    /* the browser must not steal a downward drag for scrolling: on a phone,
       that gesture IS the control */
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  .tw[data-drag="1"] { cursor: grabbing; }

  /* the visual window is 36 wide; the target around it is 44 */
  .tw::after {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 20px;
  }

  /* The ring goes on the target box, not on the hull — putting it on the hull
     would replace the frame's own five-layer shadow and flatten the window
     for as long as it had focus. */
  .tw:focus-visible { outline: none; }
  .tw:focus-visible::after { box-shadow: var(--tb-ring); }

  /* The fuselage panel. Two rounded rectangles nested inside each other with
     a highlight along the top lip and a shadow along the bottom is the whole
     illusion — no filters, no blend modes, nothing that repaints per frame. */
  .tw-hull {
    position: absolute;
    inset: 0;
    display: block;
    padding: 4px;
    border-radius: 40% / 28%;
    background: linear-gradient(172deg, var(--tw-hull-a) 0%, var(--tw-hull-b) 100%);
    box-shadow:
      inset 0 1.5px 0 rgba(255,255,255,.85),
      inset 0 -1.5px 2px rgba(13,14,18,.10),
      0 0 0 1px var(--tw-hull-ring),
      0 10px 20px -12px rgba(15,23,42,.55),
      0 2px 5px -2px rgba(15,23,42,.16);
    transition: transform .4s var(--tw-ease);
  }

  [data-theme="dark"] .tw-hull {
    box-shadow:
      inset 0 1.5px 0 rgba(255,255,255,.10),
      inset 0 -1.5px 2px rgba(0,0,0,.5),
      0 0 0 1px var(--tw-hull-ring),
      0 10px 22px -12px rgba(0,0,0,.85),
      0 2px 5px -2px rgba(0,0,0,.5);
  }

  /* the recessed inner frame — the second ring in the reference */
  .tw-bezel {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 2px;
    border-radius: 38% / 27%;
    background: linear-gradient(172deg, var(--tw-bezel-b) 0%, var(--tw-bezel-a) 100%);
    box-shadow:
      inset 0 1px 2px rgba(13,14,18,.22),
      0 1px 0 rgba(255,255,255,.6);
  }

  [data-theme="dark"] .tw-bezel {
    box-shadow:
      inset 0 1px 2px rgba(0,0,0,.6),
      0 1px 0 rgba(255,255,255,.07);
  }

  .tw-glass {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 37% / 26%;
    box-shadow: inset 0 0 0 1px rgba(13,14,18,.16);
  }

  .tw-sky {
    position: absolute;
    inset: 0;
    opacity: 0;
  }

  /* Daylight at altitude: a deep blue overhead falling to haze, with the
     cloud deck below. */
  .tw-day {
    background: linear-gradient(180deg,
      #6fb0ea 0%,
      #93c8f3 34%,
      #c4e0f8 62%,
      #e9f2fb 82%,
      #f7fbfe 100%);
  }

  /* Night at altitude: no city, no horizon glow — just the dark and the stars. */
  .tw-night {
    background: linear-gradient(180deg,
      #070c1a 0%,
      #0e1730 42%,
      #1a2747 74%,
      #24365e 100%);
  }

  html:not([data-theme="dark"]) .tw-day,
  [data-theme="light"] .tw-day,
  [data-theme="dark"] .tw-night { opacity: 1; }

  /* Clouds: soft radial puffs, which cost one gradient each. A blur filter
     here would be a per-frame repaint of the whole pane for the same look. */
  .tw-cloud {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(closest-side,
      rgba(255,255,255,.98) 0%,
      rgba(255,255,255,.82) 52%,
      rgba(255,255,255,0) 100%);
  }

  /* the deck below, then two banks standing off it — three puffs is enough
     to read as weather rather than as a white smudge */
  .tw-cloud-a { left: -24%; bottom: -6%; width: 96%; height: 40%; }
  .tw-cloud-b { right: -28%; bottom: 2%;  width: 92%; height: 36%; }
  .tw-cloud-c { left: 10%;  bottom: 20%; width: 70%; height: 24%; opacity: .78; }

  .tw-moon {
    position: absolute;
    top: 15%;
    right: 20%;
    width: 26%;
    height: 19%;
    border-radius: 50%;
    background: radial-gradient(closest-side,
      #fdfcf4 0%,
      #f2eddb 62%,
      rgba(242,237,219,.30) 82%,
      rgba(242,237,219,0) 100%);
  }

  .tw-star {
    position: absolute;
    width: 1.5px;
    height: 1.5px;
    border-radius: 50%;
    background: rgba(255,255,255,.92);
  }

  .tw-star-a { top: 22%; left: 24%; }
  .tw-star-b { top: 38%; left: 62%; opacity: .7; }
  .tw-star-c { top: 54%; left: 32%; opacity: .55; }
  .tw-star-d { top: 30%; left: 44%; opacity: .85; }

  /* the light falling across the pane, and the seal darkening its lower edge */
  .tw-gloss {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(148deg,
        rgba(255,255,255,.42) 0%,
        rgba(255,255,255,.12) 24%,
        rgba(255,255,255,0) 44%),
      linear-gradient(0deg, rgba(13,14,18,.16) 0%, rgba(13,14,18,0) 34%);
  }

  /* The shade. Parked above the glass, clipped by it, and pulled down over
     it — transform only, so the whole move is one composited layer. */
  /*
    The shade rides on ONE number: --sh, how many pixels down the glass it has
    been drawn. Parked is 0. During a drag the pointer handler writes it every
    frame; for the machine-driven legs the same property is transitioned. That
    is why a dragged shade and a tapped one cannot disagree — there is one
    position in the system, and everything writes to it.
  */
  /*
    THE SHADE'S POSITION IS THE THEME.
    Up and the sky is out there: that is light. Down and the window is closed:
    that is dark. Nothing here is a "state plus an animation" — there is one
    position, the stylesheet derives it from data-theme, and a gesture moves
    it. Both values are plain transforms with no custom property in them, so
    the browser can hand the whole move to the compositor.
  */
  .tw-shade {
    position: absolute;
    inset: -1px;
    display: block;
    border-radius: 4px;
    background: linear-gradient(178deg, var(--tw-shade-a) 0%, var(--tw-shade-b) 100%);
    box-shadow:
      /* the drop it casts onto the glass just below its edge */
      0 3px 7px -2px rgba(13,14,18,.55),
      /* and the housing's own shadow falling across its head */
      inset 0 3px 5px -3px rgba(13,14,18,.75);
    transform: translate3d(0,-100%,0);
    transition: transform 420ms cubic-bezier(.16,1,.3,1);
  }

  /* closed for the night */
  [data-theme="dark"] .tw-shade { transform: translate3d(0,0,0); }

  /* A hand on the shade beats any curve: while the pointer is down the shade
     is wherever the finger is, this frame, with nothing interpolating. */
  .tw[data-drag="1"] .tw-shade { transition: none; }

  /* the pull-grip along the shade's lower lip */
  .tw-grip {
    position: absolute;
    left: 50%;
    bottom: 4px;
    width: 42%;
    height: 2px;
    border-radius: 2px;
    background: var(--tw-grip);
    box-shadow: 0 1px 0 rgba(255,255,255,.35);
    transform: translateX(-50%);
  }

  /* The parked shade, sitting proud at the head of the glass. It is a sibling
     of the pane and declared after it, so it paints on top — which is what
     makes the shade look like it comes out from UNDER this lip rather than
     appearing at the top edge from nowhere. */
  .tw-lip {
    position: absolute;
    z-index: 2;
    top: 2px;
    left: 50%;
    width: 62%;
    height: 7%;
    min-height: 3px;
    border-radius: 0 0 3px 3px / 0 0 2px 2px;
    background: linear-gradient(178deg, var(--tw-hull-a) 0%, var(--tw-hull-b) 100%);
    box-shadow:
      0 1px 2px rgba(13,14,18,.34),
      inset 0 1px 0 rgba(255,255,255,.8);
    transform: translateX(-50%);
  }

  [data-theme="dark"] .tw-lip {
    box-shadow:
      0 1px 2px rgba(0,0,0,.6),
      inset 0 1px 0 rgba(255,255,255,.10);
  }

  /* will-change, gated: only while the shade is actually travelling */
  .tw[data-busy="1"] .tw-shade,
  .tw[data-drag="1"] .tw-shade { will-change: transform; }

  /* The affordance, and it points the way the shade can actually go: an open
     window peeks its shade down, a closed one lifts a sliver to show the night
     behind it. An inline transform from a real gesture always outranks both. */
  @media (hover: hover) and (pointer: fine) {
    .tw:hover .tw-shade { transform: translate3d(0, calc(-100% + 7px), 0); }
    [data-theme="dark"] .tw:hover .tw-shade { transform: translate3d(0,-7px,0); }
    .tw:hover .tw-hull { transform: translate3d(0,-1.5px,0); }
    .tw[data-drag="1"] .tw-hull { transform: scale(.975); }
  }

  /* ══════════════ widths ══════════════ */

  /* Below the tablet the card folds its own words away when it opens: the
     actions need that width more than the bar needs to repeat a name the hero
     is about to say in 96px type. The portrait stays, so the identity never
     disappears — it just gets out of the way of what it is offering. */
  @media (max-width: 767px) {
    .tb-root { --tb-blur: blur(8px) saturate(130%); }
    /* a phone has no hover, so the only thing these shadows ever animated for
       is a theme change — a repaint of a blurred box for no gain */
    .tb-card {
      transition: background-color .45s ease, border-color .45s ease, transform .45s var(--tb-ease);
    }
    .tb-card[data-open="1"] .tb-idwrap { grid-template-columns: 0fr; }
    .tb-card[data-open="1"] .tb-idtext { opacity: 0; }
  }

  /* The narrowest phones. The chips do not shrink — they are the one thing a
     thumb has to hit — so the width comes out of the type and the window. */
  @media (max-width: 379px) {
    .tb-row { gap: 8px; padding-inline: 12px; }
    .tw { width: 33px; height: 46px; }
    .tw::after { inset: -6px -6px; }
  }

  @media (min-width: 768px) {
    .tb-row { padding-block: 14px; padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
    .tb-card { height: 54px; padding: 6px; }
    .tb-id::after { inset: -6px -3px; }
    .tb-portrait { width: 42px; height: 42px; }
    .tb-idtext { padding-inline: 12px 20px; }
    .tb-fold-in { gap: 6px; padding-inline-start: 8px; }
    .tb-act { height: 42px; min-width: 42px; }
    /* room to spare on a pointer device, so the targets take it */
    .tb-act::after { inset: -1px; }
    .tb-act svg { width: 19px; height: 19px; }
    .tb-lang { display: flex; }
    .tb-langflip { display: none; }
    .tb-lang-knob { width: 36px; height: 36px; }
    :root[data-lang="en"] .tb-lang-knob { transform: translate3d(38px,0,0); }
    .tb-lang-opt { width: 36px; height: 36px; }
    .tw { width: 46px; height: 64px; }
    .tw::after { inset: -6px 0; }
    .tw-hull { padding: 5px; }
    .tw-bezel { padding: 2.5px; }
    .tw-star { width: 1.8px; height: 1.8px; }
  }

  /* The window at full size is 72px inside 10px of padding, which is the same
     92px strip this bar has always occupied — the hero's reserve did not have
     to move for any of this. */
  @media (min-width: 1024px) {
    .tb-row { padding-block: 10px; padding-top: calc(10px + env(safe-area-inset-top, 0px)); }
    .tb-card { height: 58px; padding: 6px; }
    .tb-portrait { width: 46px; height: 46px; }
    .tw { width: 52px; height: 72px; }
    .tw-hull { padding: 5.5px; }
    .tw-grip { bottom: 5px; }
  }

  /* ══════════════ reduced motion ══════════════ */

  /* Every pose still resolves — the card still opens, the sky is still the
     right sky — but nothing travels to get there. */
  @media (prefers-reduced-motion: reduce) {
    .tb-root { opacity: 1 !important; transform: none !important; }
    .tb-card,
    .tb-card[data-open="1"],
    .tb-portrait,
    .tb-idwrap,
    .tb-idtext,
    .tb-fold,
    .tb-fold-in > *,
    .tb-act,
    .tb-lang-knob,
    .tb-lang-opt,
    .tw-hull,
    .tw-shade {
      transition: none !important;
      animation: none !important;
      transition-delay: 0ms !important;
      will-change: auto !important;
    }
    .tb-card[data-open="1"],
    .tb-card:hover { transform: none !important; }
    .tb-card[data-open="1"] .tb-portrait { transform: none !important; }
    .tw:hover .tw-hull,
    .tw[data-drag="1"] .tw-hull { transform: none !important; }
    .tw:hover .tw-shade { --sh: 0px !important; }
  }
`;
