"use client";

import { useCallback, useEffect, useRef } from "react";
import { LuArrowUpRight } from "react-icons/lu";
import {
  isPlaceholderCheckout,
  checkoutUrl,
  refreshLemonButtons,
  startCheckout,
  thaw,
} from "@/lib/checkout";
import type { Lang } from "@/data/careerServices";

/* ═══════════════════════════════════════════════════════════════════════
   THE ONLY BUY BUTTON ON THE SITE.

   Three things it guarantees, in priority order:

   1. IT IS A LINK. `href` is the real hosted checkout, so the button works
      with the SDK broken, the SDK blocked, or JavaScript off entirely. The
      click handler is an enhancement layered on top of a working <a>.

   2. IT REACTS IN THE SAME FRAME. The pending state is applied by writing one
      attribute on the element inside the handler — before React is asked to do
      anything, before the checkout call, before analytics. Both labels are
      already in the DOM, so the swap is a style recalculation on one element:
      there is no render, no layout of new nodes, and nothing to wait for. A
      tap can therefore never look ignored, even if the main thread is busy.

   3. IT NEVER DOUBLE-FIRES. Once pending, further taps are dropped until the
      page either leaves or the overlay is dismissed.
   ═══════════════════════════════════════════════════════════════════════ */

const OPENING = {
  ar: "جاري فتح الدفع…",
  en: "Opening checkout…",
};

export default function CheckoutButton({
  serviceId,
  href,
  label,
  lang,
  className = "",
  size = "md",
  showArrow = true,
}: {
  serviceId: string;
  /** The service's base checkout URL, straight from the config. */
  href: string;
  label: string;
  lang: Lang;
  className?: string;
  size?: "md" | "lg";
  showArrow?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const pending = useRef(false);
  /* Development only. `NODE_ENV` is a build-time constant, so a production
     bundle contains neither the badge nor the branch that renders it — and
     because it is the same constant on both sides, there is nothing here for
     hydration to disagree about. */
  const placeholder = process.env.NODE_ENV !== "production" && isPlaceholderCheckout(serviceId);

  const clear = useCallback(() => {
    pending.current = false;
    ref.current?.removeAttribute("data-pending");
  }, []);

  /* Coming back from the hosted checkout — via the back button, or out of the
     bfcache — must not find the button still saying "Opening checkout…". */
  useEffect(() => {
    const onShow = () => {
      clear();
      thaw();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [clear]);

  // A CTA that mounts after Lemon.js executed is invisible to its own binder.
  useEffect(() => {
    refreshLemonButtons();
  }, []);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let modifier-clicks and middle-clicks behave like the link they are.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    // ── frame 0: the visitor sees the button change. Nothing precedes this.
    e.currentTarget.setAttribute("data-pending", "");
    startCheckout(href, serviceId, (route) => {
      // The overlay leaves the visitor on this page, so give the button back.
      if (route === "overlay") clear();
    });
  };

  return (
    <a
      ref={ref}
      /* Also the no-JS destination, so it must be the hosted (non-embed) URL. */
      href={checkoutUrl(href, serviceId, false)}
      onClick={onClick}
      className={`ck cta${size === "lg" ? " cta-big" : ""} ${className}`}
      data-service={serviceId}
    >
      <span className="ck-idle">
        {label}
        {showArrow && <LuArrowUpRight size={size === "lg" ? 16 : 15} className="cta-i" />}
      </span>
      <span className="ck-busy" aria-hidden>
        <i className="ck-spin" />
        {OPENING[lang]}
      </span>
      {placeholder && <b className="ck-ph">placeholder cart</b>}
    </a>
  );
}

/** Mounted once per page that uses CheckoutButton. */
export function CheckoutButtonStyles() {
  return (
    <style>{`
      /* ── the pill, defined once for the whole site ──
         Both builds of /services and every plain-button CTA share it, so it
         cannot live inside either build's own style block. */
      .cta {
        display: inline-flex; align-items: center; gap: 8px; min-height: 52px;
        padding: 14px 30px; border: none; border-radius: 999px;
        background: var(--text-primary); color: var(--bg-primary);
        font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
        text-decoration: none;
        transition: transform 260ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease;
      }
      .cta:hover { transform: translateY(-2px); opacity: 0.9; }
      .cta-big { min-height: 58px; padding: 16px 34px; font-size: 16px; }
      .cta-i { flex-shrink: 0; }
      [dir="rtl"] .cta-i { transform: scaleX(-1); }
      /* same pill height, more room for Arabic glyphs inside it */
      [dir="rtl"] .cta { line-height: 1.6; padding-block: 12px; }
      [dir="rtl"] .cta-big { padding-block: 14px; }
      @media (max-width: 480px) {
        .cta { padding: 14px 22px; font-size: 14px; }
        .cta-big { padding: 15px 24px; font-size: 15px; }
      }

      .ck {
        position: relative; isolation: isolate;
        /* kills the tap delay and the grey flash — both read as "nothing happened" */
        touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      /* type selector included so this always beats .cta:hover, whatever order
         the two style blocks end up in */
      a.ck:active { transform: scale(0.975); }
      .ck-idle, .ck-busy { display: inline-flex; align-items: center; gap: 8px; }
      .ck-busy { display: none; }
      .ck[data-pending] { pointer-events: none; opacity: 0.92; }
      .ck[data-pending] .ck-idle { display: none; }
      .ck[data-pending] .ck-busy { display: inline-flex; }
      .ck-spin {
        width: 13px; height: 13px; flex: none; border-radius: 50%;
        border: 2px solid currentColor; border-top-color: transparent;
        animation: ck-spin 620ms linear infinite;
      }
      @keyframes ck-spin { to { transform: rotate(360deg); } }
      /* development only — never rendered in a production build */
      .ck-ph {
        position: absolute; top: -9px; inset-inline-end: 8px; z-index: 2;
        padding: 2px 7px; border-radius: 999px; background: #b4530a; color: #fff;
        font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      }
      /* ── the page holds still behind a checkout ──
         Scroll is locked by the overlay, so nothing scroll-driven can run
         anyway; this stops the things that run on their own clock. Components
         that need to do more (release a canvas, drop an observer) subscribe to
         the freeze events in lib/checkout instead. */
      .checkout-open *,
      .checkout-open *::before,
      .checkout-open *::after {
        animation-play-state: paused !important;
      }
      /* …except the one thing that is ABOUT the checkout */
      .checkout-open .ck-spin { animation-play-state: running !important; }

      @media (prefers-reduced-motion: reduce) {
        a.ck:active { transform: none; }
        .ck-spin { animation-duration: 1600ms; }
      }
    `}</style>
  );
}
