"use client";

import { useEffect } from "react";
import { checkCareerHealth } from "@/lib/careerHealth";

/**
 * Wires `window.__careerHealthCheck()` in development only. This is NOT
 * customer-facing UI — it renders nothing and does nothing in a production
 * build. Its only job is letting a developer open the console on
 * localhost and confirm the static frontend → Supabase Edge Function path
 * is wired correctly, without adding any visible affordance for a visitor.
 */
export default function CareerHealthProbe() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as { __careerHealthCheck?: typeof checkCareerHealth }).__careerHealthCheck =
      checkCareerHealth;
  }, []);

  return null;
}
