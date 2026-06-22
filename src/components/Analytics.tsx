"use client";

import { useEffect } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

function loadScripts() {
  if (GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(s);
  }

  if (CLARITY_PROJECT_ID) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(s);
  }
}

export default function Analytics() {
  useEffect(() => {
    // Defer analytics until browser is idle so it never competes with page render
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadScripts, { timeout: 4000 });
    } else {
      setTimeout(loadScripts, 3000);
    }
  }, []);

  return null;
}
