"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isClarityExcludedPath } from "@/config/careerPrivacySurfaces";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

function loadGtm() {
  if (!GTM_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

/**
 * Command 02 §17: Career pages carry sensitive resume/personal data.
 * Session recording is never started for them at all — not just masked.
 *
 * Two layers, because this is a client-side-routed app and a script tag
 * can only be injected once:
 *  1. If the FIRST page the visitor loads is an excluded route, the
 *     Clarity script is never injected in the first place — no recording
 *     session exists for that page to begin with.
 *  2. If Clarity was already loaded on an earlier, non-excluded page and
 *     the visitor then navigates client-side into an excluded route,
 *     `window.clarity("stop")` pauses recording for the rest of that
 *     route; `window.clarity("start")` resumes it on leaving. This is
 *     Clarity's own documented pause/resume API — see
 *     docs/career-privacy.md for the full audit of this strategy,
 *     including what it does NOT guarantee (a few frames captured between
 *     the route changing and this effect running).
 */
function syncClarityForRoute(pathname: string) {
  if (!CLARITY_PROJECT_ID) return;
  const excluded = isClarityExcludedPath(pathname);

  if (!document.getElementById("ms-clarity-script")) {
    if (excluded) return; // never even load it if we start on a sensitive route
    const s = document.createElement("script");
    s.id = "ms-clarity-script";
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(s);
    return;
  }

  window.clarity?.(excluded ? "stop" : "start");
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Defer analytics until browser is idle so it never competes with page render
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadGtm, { timeout: 4000 });
    } else {
      setTimeout(loadGtm, 3000);
    }
  }, []);

  useEffect(() => {
    syncClarityForRoute(pathname ?? window.location.pathname);
  }, [pathname]);

  return null;
}
