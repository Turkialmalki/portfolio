/**
 * CHECKOUT — one path in, always a working path out.
 *
 * The rule this file exists to enforce: **a tap must never be able to do
 * nothing.** Everything else here is an optimisation on top of that.
 *
 *   coarse pointer  →  navigate straight to Lemon Squeezy's hosted checkout.
 *                      No overlay, no iframe composited over an animated page,
 *                      nothing to wait for. `location.assign` is the fastest
 *                      thing a phone can do and it is also the most reliable.
 *   fine pointer    →  the on-site overlay IF Lemon.js is ready, otherwise a
 *                      short race (`OVERLAY_GRACE_MS`) against the script
 *                      finishing, and if it loses, the hosted page. A visitor
 *                      who wants to pay is never held hostage to a CDN.
 *   script failed   →  no race at all; straight to the hosted page.
 *
 * Nothing on the critical path is async: analytics is fired AFTER the open
 * decision, in a callback, so a slow dataLayer can never sit between the tap
 * and the checkout.
 */

import { ANALYTICS_ID, LEMON_STORE_ORIGIN, type ServiceId } from "@/config/careerServices";
import { trackEvent } from "@/lib/analytics";

type LemonEvent = { event?: string };

declare global {
  interface Window {
    /** Re-scans the DOM for `.lemonsqueezy-button` elements and re-binds. */
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup?: (opts: { eventHandler?: (event: LemonEvent) => void }) => void;
      Url?: { Open?: (url: string) => void; Close?: () => void };
      Refresh?: () => void;
    };
  }
}

export const LEMON_SCRIPT_SRC = "https://assets.lemonsqueezy.com/lemon.js";

/** Origins the checkout actually touches, in the order it touches them. */
export const CHECKOUT_ORIGINS = [
  "https://assets.lemonsqueezy.com",
  "https://app.lemonsqueezy.com",
  LEMON_STORE_ORIGIN,
];

/** How long a desktop tap will wait for the overlay before giving up on it. */
const OVERLAY_GRACE_MS = 600;

type State = "loading" | "ready" | "failed";
let state: State = "loading";
let waiters: (() => void)[] = [];

function settle(next: State) {
  if (state !== "loading") return;
  state = next;
  const queued = waiters;
  waiters = [];
  for (const fn of queued) fn();
}

/**
 * Called from the `<Script onLoad>`. Lemon.js binds its click listeners when it
 * executes, which in a React tree is routinely BEFORE the buttons exist — so
 * `createLemonSqueezy()` is called explicitly here and again whenever a mount
 * adds new CTAs (`refreshLemonButtons`). The overlay path below never relies on
 * that binding having worked; it opens the URL itself. This only keeps any
 * plain `.lemonsqueezy-button` markup elsewhere on the site behaving.
 */
export function onLemonLoaded() {
  try {
    window.createLemonSqueezy?.();
    window.LemonSqueezy?.Setup?.({ eventHandler: handleLemonEvent });
  } catch {
    /* a broken SDK must not break the fallback path */
  }
  settle("ready");
}

export function onLemonError() {
  settle("failed");
}

export function refreshLemonButtons() {
  if (state !== "ready") return;
  try {
    window.createLemonSqueezy?.();
  } catch {
    /* ignore */
  }
}

function handleLemonEvent(event: LemonEvent) {
  const name = event?.event;
  if (name === "Checkout.Success") {
    trackEvent("checkout_success", {});
    return;
  }
  // Anything that puts the page back in front of the visitor un-freezes it.
  if (name === "Checkout.Closed" || name === "Checkout.Close") thaw();
}

/* ────────────────────────── freeze / thaw ──────────────────────────
   A checkout is not a scene. When one starts, the page underneath it stops
   doing work: the canvas stops painting, scroll observers stop animating,
   entrance transitions stop being scheduled. Consumers subscribe to the two
   events below rather than importing anything, so nothing on the page has to
   know the checkout exists.                                                  */

export const FREEZE_EVENT = "checkout:freeze";
export const THAW_EVENT = "checkout:thaw";

let frozen = false;

export function isFrozen() {
  return frozen;
}

export function freeze() {
  if (frozen) return;
  frozen = true;
  document.documentElement.classList.add("checkout-open");
  window.dispatchEvent(new Event(FREEZE_EVENT));
}

export function thaw() {
  if (!frozen) return;
  frozen = false;
  document.documentElement.classList.remove("checkout-open");
  window.dispatchEvent(new Event(THAW_EVENT));
}

/** Subscribe to both edges at once. Returns an unsubscribe. */
export function onFreezeChange(fn: (frozen: boolean) => void) {
  const on = () => fn(true);
  const off = () => fn(false);
  window.addEventListener(FREEZE_EVENT, on);
  window.addEventListener(THAW_EVENT, off);
  return () => {
    window.removeEventListener(FREEZE_EVENT, on);
    window.removeEventListener(THAW_EVENT, off);
  };
}

/* ────────────────────────────── urls ────────────────────────────── */

function withParams(url: string, params: Record<string, string>) {
  const sep = url.includes("?") ? "&" : "?";
  const q = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `${url}${sep}${q}` : url;
}

/**
 * The URL an actual purchase uses.
 *
 * `checkout[custom][service]` is not decoration. While services share one cart
 * (see `config/careerServices.ts`) it is the only thing that records which
 * service the customer thought they were buying, and it survives into the
 * order in Lemon Squeezy. `embed=1` is required for the overlay and must NOT
 * be present on a hosted navigation, where it renders a chromeless page.
 */
export function checkoutUrl(base: string, serviceId: string, embed: boolean) {
  return withParams(base, {
    "checkout[custom][service]": serviceId,
    ...(embed ? { embed: "1" } : null),
  });
}

/** True on phones/tablets — the devices that get the hosted checkout. */
export function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * The page stays frozen until the overlay goes away — and `Checkout.Closed` is
 * the SDK's word for that, which means a page whose event name changes, or
 * whose `Setup` never took, would stay frozen forever.
 *
 * So the freeze is also tied to something observable: the overlay element
 * itself. One second-interval check, alive only while an overlay is open, and
 * it stops the moment either signal says the visitor is back.
 */
function watchOverlay() {
  const gone = () => !document.querySelector("[class*='lemonsqueezy-modal'], #lemonsqueezy-overlay");
  let ticks = 0;
  const timer = window.setInterval(() => {
    // give the SDK a moment to insert its own DOM before believing it is absent
    if ((++ticks > 2 && gone()) || !frozen || ticks > 900) {
      window.clearInterval(timer);
      thaw();
    }
  }, 1000);
}

/* ───────────────────────────── opening ───────────────────────────── */

export type CheckoutRoute = "overlay" | "hosted";

/**
 * Start a purchase. Returns how it was started, so the caller can decide
 * whether to keep showing its pending state (`hosted` — the page is leaving)
 * or restore the button (`overlay` — the visitor is still here).
 *
 * This function never awaits anything before the visitor sees movement: the
 * hosted path navigates synchronously, and the overlay path either opens
 * synchronously or has already been told the script is still in flight.
 */
export function startCheckout(
  base: string,
  serviceId: string,
  onSettled?: (route: CheckoutRoute) => void,
): void {
  freeze();

  const go = (route: CheckoutRoute) => {
    if (route === "hosted") {
      window.location.assign(checkoutUrl(base, serviceId, false));
    } else {
      window.LemonSqueezy!.Url!.Open!(checkoutUrl(base, serviceId, true));
      watchOverlay();
    }
    // Analytics is deliberately after the navigation/open call and out of band.
    // A blocked or slow dataLayer push can never delay a purchase.
    setTimeout(() => {
      trackEvent(`${serviceId}_click`, { service: serviceId });
      // The named-per-service event a report is actually built on:
      // `resume_review_checkout_started`, `linkedin_checkout_started`, …
      const stem = ANALYTICS_ID[serviceId as ServiceId];
      if (stem) trackEvent(`${stem}_checkout_started`, { service: serviceId, route });
      trackEvent("checkout_started", { service: serviceId, route });
    }, 0);
    onSettled?.(route);
  };

  // Phones and tablets: no overlay, ever. Straight to the hosted checkout.
  if (isCoarsePointer()) return go("hosted");

  const overlayReady = () => state === "ready" && !!window.LemonSqueezy?.Url?.Open;
  if (overlayReady()) return go("overlay");
  if (state === "failed") return go("hosted");

  // Still downloading. Give it a short, bounded grace period and then stop
  // caring about the overlay — the sale matters more than the transition.
  let done = false;
  const finish = (route: CheckoutRoute) => {
    if (done) return;
    done = true;
    go(route);
  };
  const timer = window.setTimeout(() => finish("hosted"), OVERLAY_GRACE_MS);
  waiters.push(() => {
    window.clearTimeout(timer);
    finish(overlayReady() ? "overlay" : "hosted");
  });
}
