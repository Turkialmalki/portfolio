"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
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
