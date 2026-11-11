"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
/* A phone: touch, and narrow. The pinned, scroll-scrubbed hero and timeline are
   the heaviest thing on the page and the one a phone cannot hold at 60fps, so a
   phone gets the still treatment by default. `?calm=0` turns that off, `?calm=1`
   turns it on for any device. */
const PHONE = "(pointer: coarse) and (max-width: 700px)";

function subscribe(onChange: () => void) {
  const media = [window.matchMedia(QUERY), window.matchMedia(PHONE)];
  media.forEach((m) => m.addEventListener("change", onChange));
  return () => media.forEach((m) => m.removeEventListener("change", onChange));
}

const getSnapshot = () => {
  const q = window.location.search;
  if (/[?&]calm=0\b/.test(q)) return window.matchMedia(QUERY).matches;
  return window.matchMedia(QUERY).matches || window.matchMedia(PHONE).matches || /[?&]calm=1\b/.test(q);
};
const getServerSnapshot = () => false;

/**
 * `prefers-reduced-motion` without the hydration mismatch.
 *
 * framer's `useReducedMotion` reads the media query immediately on the client
 * while the server always renders as if motion were allowed, so anything that
 * branches on it — conditional markup, or a `style` / `initial` prop that emits
 * different inline styles — makes the first client render disagree with the
 * server HTML and React throws the tree away.
 *
 * `useSyncExternalStore` is built for exactly this: the hydration pass uses the
 * server snapshot, then React re-renders with the real value once hydration is
 * done. Motion props read it again on that pass, so a reduced-motion visitor
 * still ends up with the static treatment; anything that cannot be undone after
 * mount (a framer `initial`) is neutralised in CSS under the same media query.
 */
export function useSafeReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useSafeReducedMotion;
