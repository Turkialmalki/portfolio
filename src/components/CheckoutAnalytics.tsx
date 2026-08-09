"use client";

import { useEffect } from "react";
import { ANALYTICS_ID, type ServiceId } from "@/config/careerServices";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   MEASURING A PURCHASE WITHOUT STANDING IN FRONT OF IT.

   The buy buttons are plain server-rendered anchors with no click handler
   (see CheckoutButton). That is what makes checkout unbreakable, and it is
   also what makes it unmeasurable from the element itself. This component is
   the answer: ONE listener, on the document, for the whole page.

   Three properties, all of them deliberate:

   1. IT IS NOT ON THE NAVIGATION PATH. The listener neither calls
      preventDefault nor returns a value the browser inspects. Whatever
      happens in here — including throwing — the default action of the link
      proceeds. The try/catch exists to keep a broken tag manager out of the
      console, not to protect the navigation, which was never at risk.

   2. IT IS DELEGATED, SO IT COSTS ONE LISTENER. Not one per CTA, and none of
      them attached during hydration of a scene that is mid-animation.

   3. IT RUNS IN THE CAPTURE PHASE. The event is recorded on the way down,
      before anything else on the page could stop propagation, and while the
      document is guaranteed to still be alive.

   If this component never mounts — script blocked, hydration failed, JS off
   — every buy button on the page still works exactly as well. The only thing
   lost is the event, which is the correct thing to lose.
   ═══════════════════════════════════════════════════════════════════════ */

export default function CheckoutAnalytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const link = target?.closest?.("a.ck[data-service]");
      const id = link?.getAttribute("data-service") as ServiceId | null;
      if (!id) return;
      try {
        trackEvent("checkout_started", { service: id });
        // The named-per-service event a report is actually built on:
        // `resume_review_checkout_started`, `linkedin_checkout_started`, …
        const stem = ANALYTICS_ID[id];
        if (stem) trackEvent(`${stem}_checkout_started`, { service: id });
      } catch {
        /* a purchase is not conditional on being counted */
      }
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
