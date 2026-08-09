import { LuArrowUpRight } from "react-icons/lu";
import type { ServiceId } from "@/config/careerServices";

/* ═══════════════════════════════════════════════════════════════════════
   THE ONLY BUY BUTTON ON THE SITE — and it is just a link.

   Note what is NOT in this file: no "use client", no state, no ref, no
   effect, no click handler. It is a server component that renders an <a> with
   a real, absolute Lemon Squeezy product URL in its href. That URL is in the
   first byte of HTML, it is in View Source, and it is what the browser
   navigates to.

   WHY THIS IS THE WHOLE DESIGN
   ────────────────────────────
   A purchase is the one interaction on this site that must not be able to
   fail. Every mechanism that used to sit between the tap and the checkout —
   an overlay SDK, a readiness state machine, a grace-period race against a
   CDN, a pending label, a page freeze — was a mechanism that could hang. On a
   phone, on a slow connection, the failure mode of all of them looks
   identical and looks like nothing happening: tap, spinner, stay.

   So none of them exist. The browser's own navigation is the mechanism:

   · The href needs no React, no hydration, no effect, no media query and no
     third-party script to become correct. If every script on the page fails,
     checkout still works.
   · No preventDefault. No promise before navigation. Nothing is awaited.
   · Same tab. A purchase is the destination, not a detour.
   · Feedback is `:active { transform: scale(.975) }` — a compositor-only
     style the browser applies on touch-down, before any JavaScript runs and
     regardless of how busy the main thread is.
   · Analytics is a single delegated listener elsewhere on the page
     (`CheckoutAnalytics`), not a handler on this element. It cannot delay a
     navigation it is not on the path of.

   Modifier-clicks, middle-clicks, "open in new tab" and "copy link address"
   all behave correctly for free, because there is nothing overriding them.

   `data-service` is how the delegated listener knows what was bought. It is
   the only attribute here that exists for anything other than the visitor.
   ═══════════════════════════════════════════════════════════════════════ */

export default function CheckoutButton({
  serviceId,
  href,
  label,
  className = "",
  size = "md",
  showArrow = true,
}: {
  serviceId: ServiceId;
  /** The service's exact `/checkout/buy/...` URL, straight from the config. */
  href: string;
  label: string;
  className?: string;
  size?: "md" | "lg";
  showArrow?: boolean;
}) {
  return (
    <a
      href={href}
      className={`ck cta${size === "lg" ? " cta-big" : ""} ${className}`}
      data-service={serviceId}
    >
      {label}
      {showArrow && <LuArrowUpRight size={size === "lg" ? 16 : 15} className="cta-i" />}
    </a>
  );
}

/** Mounted once per page that uses CheckoutButton. */
export function CheckoutButtonStyles() {
  return (
    <style>{`
      /* ── the pill, defined once for the whole site ── */
      .cta {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        min-height: 52px; padding: 14px 30px; border: none; border-radius: 999px;
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

      /* ── the buy link ──
         touch-action kills the 300ms tap delay; the transparent tap highlight
         removes the grey flash that reads as "something went wrong". The
         :active transform is the ONLY feedback, and the compositor applies it
         on touch-down without waiting for script. */
      .ck { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      /* type selector so this always beats .cta:hover, whatever order the two
         style blocks end up in */
      a.ck:active { transform: scale(0.975); }

      @media (prefers-reduced-motion: reduce) { a.ck:active { transform: none; } }
    `}</style>
  );
}
