"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { CONTACT_URL, MEETING_URL } from "@/config/careerServices";
import { TALK, type Lang } from "@/data/careerServices";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   THE SAFETY NET — for everyone the price list does not fit.

   Someone who is not sure which service they need, or wants two of them, or
   wants something that is not on this page at all, currently has exactly one
   thing to do: leave. This section is the alternative, and it sits at the end
   of the journey where that doubt actually surfaces — after the bundle, where
   the visitor either knows what they want or knows they don't.

   It is deliberately the quietest thing on the page: no scene, no card, no
   scrubbed object. Whitespace, a face, a sentence and one button. The only
   motion is a single fade-up the first time it is seen, after which the
   observer disconnects and nothing here runs again.
   ═══════════════════════════════════════════════════════════════════════ */

/** One fade-up, once, then nothing. */
function useSeen(ref: React.RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return seen;
}

export default function TalkSection({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useSeen(ref);

  return (
    <section ref={ref} className={`tk${seen ? " is-in" : ""}`}>
      <div className="tk-in">
        <figure className="tk-ph">
          <Image
            src="/speaking-portrait.jpg"
            alt={lang === "ar" ? "تركي المالكي" : "Turki Almalki"}
            fill
            sizes="(max-width: 820px) 128px, 180px"
          />
        </figure>

        <span className="tk-eb">{TALK.eyebrow[lang]}</span>
        <h2 className="tk-h">{TALK.headline[lang]}</h2>
        <p className="tk-b">{TALK.body[lang]}</p>

        <div className="tk-a">
          <a
            className="cta"
            href={MEETING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("meeting_click", { location: "services_talk" })}
          >
            {TALK.meeting[lang]}
            <LuArrowRight size={15} className="cta-i" />
          </a>
          <Link
            href={CONTACT_URL}
            className="tk-g"
            onClick={() => trackEvent("contact_click", { location: "services_talk" })}
          >
            {TALK.contact[lang]}
          </Link>
        </div>
      </div>

      <style>{`
        .tk {
          /* Independent of every scrubbed scene above it — nothing here is
             measured against the viewport, so it can be skipped until near. */
          content-visibility: auto; contain-intrinsic-size: auto 620px;
          padding-block: clamp(96px, 13vw, 180px);
          padding-inline: 22px;
        }
        .tk-in {
          display: flex; flex-direction: column; align-items: center;
          width: min(720px, 100%); margin-inline: auto; text-align: center;
        }
        .tk-ph {
          position: relative; width: clamp(104px, 13vw, 148px); aspect-ratio: 1;
          margin: 0 0 clamp(26px, 3vw, 38px); border-radius: 50%; overflow: hidden;
          background: #e9e9e6;
        }
        .tk-ph img { object-fit: cover; object-position: 45% 38%; }
        .tk-eb {
          font-size: 11px; font-weight: 800; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--text-muted, #8b8b8b);
        }
        .tk-h {
          margin: 16px 0 0; font-size: clamp(30px, 4.6vw, 58px); font-weight: 900;
          letter-spacing: -0.04em; line-height: 1.04;
        }
        .tk-b {
          margin: clamp(16px, 1.8vw, 22px) 0 0; max-width: 46ch;
          font-size: clamp(14px, 1.15vw, 17px); line-height: 1.6;
          color: var(--text-secondary);
        }
        .tk-a {
          display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
          gap: 24px; margin-top: clamp(30px, 3.4vw, 44px);
        }
        .tk-g {
          font-size: 14.5px; font-weight: 500; color: var(--text-secondary);
          text-decoration: underline; text-underline-offset: 4px;
        }
        .tk-g:hover { color: var(--text-primary); }

        /* the one entrance */
        .tk-in > * {
          opacity: 0; transform: translate3d(0, 14px, 0);
          transition: opacity 520ms cubic-bezier(0.22,1,0.36,1),
                      transform 560ms cubic-bezier(0.22,1,0.36,1);
        }
        .tk-in > .tk-h { transition-delay: 60ms; }
        .tk-in > .tk-b { transition-delay: 110ms; }
        .tk-in > .tk-a { transition-delay: 160ms; }
        .tk.is-in .tk-in > * { opacity: 1; transform: none; }

        @media (max-width: 820px) {
          .tk { padding-block: clamp(84px, 16vw, 120px) 40px; }
          .tk-a { flex-direction: column; gap: 18px; }
          .tk-a .cta { width: 100%; max-width: 420px; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tk-in > * { opacity: 1; transform: none; transition: none; }
        }

        [dir="rtl"] .tk-h { line-height: 1.24; }
        [dir="rtl"] .tk-b { line-height: 1.85; max-width: 40ch; }
        [dir="rtl"] .tk-eb { line-height: 1.7; letter-spacing: 0; }
        [dir="rtl"] .tk-g { line-height: 1.7; }
      `}</style>
    </section>
  );
}
