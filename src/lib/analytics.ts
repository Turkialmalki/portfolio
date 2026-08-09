declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Push one event onto the GTM dataLayer.
 *
 * Wrapped, because this is called from click handlers on links that are about
 * to navigate. A `dataLayer` that a tag manager has replaced with a frozen
 * object, a getter that throws, or a blocked script leaving something
 * unexpected on `window` must never surface as an exception inside a purchase.
 * Nothing here is awaited and nothing here returns a value a caller waits on.
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } catch {
    /* measurement is never worth a broken interaction */
  }
}
