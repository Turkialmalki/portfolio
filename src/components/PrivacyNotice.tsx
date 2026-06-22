"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "analytics-notice-dismissed";

export default function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      role="banner"
      aria-label="Analytics notice"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "rgba(14, 14, 18, 0.97)",
        color: "#a1a1aa",
        borderRadius: 14,
        padding: "14px 16px 14px 20px",
        maxWidth: 600,
        width: "calc(100% - 48px)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 13,
        lineHeight: 1.55,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <p style={{ margin: 0, flex: 1 }}>
        This website uses privacy-friendly analytics to understand visits,
        traffic sources, and site performance. No personal information such as
        your name, email, or phone number is collected unless you choose to
        submit it through a form.
      </p>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          background: "#1495ff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 15px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        Got it
      </button>
    </div>
  );
}
