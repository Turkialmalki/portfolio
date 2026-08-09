"use client";

import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { ANALYTICS_ID, CONTACT_URL, type ServiceId } from "@/config/careerServices";
import { COMING_SOON, type Lang } from "@/data/careerServices";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   A SERVICE THAT IS NOT FOR SALE YET.

   It keeps its scene, its photography and its place in the journey — what it
   loses is the transaction. This component is what stands where the buy
   button would be, and it is deliberately the ONLY thing that can stand
   there: it has no `href` for a checkout to be passed into, it fires an
   interest event rather than a checkout event, and it routes to the contact
   flow. There is no code path from here to Lemon Squeezy.

   It inherits `currentColor`, so the same component reads correctly on the
   white phone panel and over the dark stage photograph.
   ═══════════════════════════════════════════════════════════════════════ */

export default function ComingSoon({
  serviceId,
  label,
  lang,
}: {
  serviceId: ServiceId;
  /** The quiet secondary action — "Interested? Contact me". */
  label: string;
  lang: Lang;
}) {
  return (
    <span className="cs">
      <span className="cs-badge">{COMING_SOON[lang]}</span>
      <Link
        href={CONTACT_URL}
        className="cs-link"
        onClick={() =>
          trackEvent(`${ANALYTICS_ID[serviceId]}_interest_click`, { service: serviceId })
        }
      >
        {label}
        <LuArrowRight size={14} className="cta-i" />
      </Link>

      <style>{`
        /* align-items:inherit so the block sits the way its host does:
           left in the film's copy column, centred in a phone panel. */
        .cs { display: flex; flex-direction: column; align-items: inherit; gap: 14px; }
        .cs-badge {
          display: inline-flex; align-items: center;
          padding: 9px 18px; border-radius: 999px;
          border: 1px solid currentColor; opacity: 0.9;
          font-size: 11.5px; font-weight: 800; letter-spacing: 0.16em;
          text-transform: uppercase; white-space: nowrap;
        }
        .cs-link {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13.5px; font-weight: 600; color: inherit; opacity: 0.72;
          text-decoration: underline; text-underline-offset: 4px;
          transition: opacity 200ms ease;
        }
        .cs-link:hover { opacity: 1; }
        [dir="rtl"] .cs-badge { letter-spacing: 0; line-height: 1.6; padding-block: 7px; }
        [dir="rtl"] .cs-link { line-height: 1.7; }
      `}</style>
    </span>
  );
}
