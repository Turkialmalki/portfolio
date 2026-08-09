"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type LemonCheckoutButtonProps = {
  href: string;
  children: React.ReactNode;
  serviceId: string;
  clickEvent: string;
  variant?: "solid" | "outline";
  className?: string;
};

/**
 * Opens a Lemon Squeezy checkout link. When the Lemon.js SDK (loaded once in
 * ServicesClient via next/script) has initialized, it intercepts the click
 * and renders the checkout as an in-page overlay instead of a full
 * navigation — the visitor never feels like they left the site. Falls back
 * to a normal link (opens Lemon Squeezy's hosted page) if the SDK hasn't
 * loaded yet, so the button always works.
 */
export default function LemonCheckoutButton({
  href,
  children,
  serviceId,
  clickEvent,
  variant = "solid",
  className,
}: LemonCheckoutButtonProps) {
  const handleClick = () => {
    trackEvent(clickEvent, { service: serviceId });
    trackEvent("checkout_started", { service: serviceId });
  };

  const solidStyle: React.CSSProperties = {
    background: "var(--text-primary)",
    color: "var(--bg-primary)",
    border: "1px solid var(--text-primary)",
  };

  const outlineStyle: React.CSSProperties = {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1.5px solid var(--border-subtle, rgba(0,0,0,0.14))",
  };

  return (
    <motion.a
      href={href}
      className={`lemonsqueezy-button ${className ?? ""}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 48,
        width: "100%",
        padding: "13px 22px",
        borderRadius: 999,
        fontSize: 14.5,
        fontWeight: 700,
        lineHeight: 1,
        textDecoration: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "background-color 250ms ease, border-color 250ms ease, color 250ms ease",
        ...(variant === "solid" ? solidStyle : outlineStyle),
      }}
    >
      {children}
    </motion.a>
  );
}
