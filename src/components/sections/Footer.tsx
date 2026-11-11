"use client";

import Image from "next/image";
import { FiArrowUp, FiCalendar, FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CONTACT } from "@/config/contact";
import { MEETING_URL } from "@/config/careerServices";
import Reveal from "@/components/story/Reveal";

const COPY = {
  ar: {
    title: "لنتحدث",
    line: "عندك فكرة أو منتج تبنيه؟ أخبرني، وأرد عليك بنفسي.",
    mail: "راسلني",
    book: "احجز مكالمة",
    top: "للأعلى",
    name: "تركي المالكي",
  },
  en: {
    title: "Let's talk",
    line: "Got an idea or a product to build? Tell me, and I'll reply myself.",
    mail: "Email me",
    book: "Book a call",
    top: "Back to top",
    name: "Turki Almalki",
  },
} as const;

/* Two columns of real work that drift past each other. Each list is doubled so
   the loop has no seam. */
const COL_A = ["/hero/basebox.jpg", "/hero/alrajhi-pair.jpg", "/hero/fba.jpg", "/hero/basebox-dash.jpg"];
const COL_B = ["/hero/munaseb.jpg", "/hero/emkan.jpg", "/hero/ithnain.jpg", "/hero/alrajhi.jpg"];

function Column({ srcs, reverse }: { srcs: string[]; reverse?: boolean }) {
  return (
    <div className={`ft-col${reverse ? " ft-rev" : ""}`} aria-hidden="true">
      <div className="ft-track">
        {[...srcs, ...srcs].map((src, i) => (
          <span key={i} className="ft-tile">
            <Image src={src} alt="" fill sizes="(max-width: 800px) 44vw, 260px" className="ft-img" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  const links = [
    CONTACT.linkedinUrl && { label: "LinkedIn", href: CONTACT.linkedinUrl, Icon: FiLinkedin, event: "linkedin_click" },
    CONTACT.githubUrl && { label: "GitHub", href: CONTACT.githubUrl, Icon: FiGithub, event: null },
  ].filter(Boolean) as { label: string; href: string; Icon: typeof FiLinkedin; event: string | null }[];

  return (
    <footer id="contact-footer" className="ft-root">
      <Reveal className="ft-card">
        <div className="ft-main">
          <div className="ft-copy">
            <h2>{copy.title}</h2>
            <p>{copy.line}</p>

            <div className="ft-actions">
              <a
                className="ft-primary"
                href={`mailto:${CONTACT.email}`}
                onClick={() => trackEvent("contact_click", { location: "footer" })}
              >
                <FiMail size={18} aria-hidden="true" />
                {copy.mail}
              </a>
              <a
                className="ft-ghost"
                href={MEETING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("booking_click", { location: "footer" })}
              >
                <FiCalendar size={18} aria-hidden="true" />
                {copy.book}
              </a>
            </div>
          </div>

          <div className="ft-wall">
            <Column srcs={COL_A} />
            <Column srcs={COL_B} reverse />
          </div>
        </div>

        <div className="ft-rail">
          <span className="ft-name">{copy.name}</span>
          <div className="ft-icons">
            {links.map(({ label, href, Icon, event }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                onClick={event ? () => trackEvent(event, { location: "footer", label }) : undefined}
              >
                <Icon size={18} />
              </a>
            ))}
            <button type="button" aria-label={copy.top} title={copy.top} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <FiArrowUp size={18} />
            </button>
          </div>
        </div>
      </Reveal>

      <style>{`
        .ft-root { background: var(--bg-primary); padding: clamp(24px, 4vw, 48px) clamp(12px, 3vw, 24px) calc(var(--dock-clear, 24px) + 12px); overflow-x: clip; }
        .ft-card {
          max-width: 1180px; margin: 0 auto; border-radius: clamp(28px, 4vw, 44px); overflow: hidden;
          background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--text-primary);
          box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.07);
        }
        .ft-main { display: grid; grid-template-columns: 1fr; align-items: stretch; }
        .ft-copy { padding: clamp(28px, 6vw, 72px) clamp(22px, 5vw, 64px) clamp(24px, 4vw, 48px); display: flex; flex-direction: column; align-items: flex-start; }
        .ft-copy h2 { margin: 0; font-size: clamp(54px, 11vw, 124px); line-height: 1.05; font-weight: 900; letter-spacing: -.04em; }
        [dir="rtl"] .ft-copy h2 { letter-spacing: 0; line-height: 1.25; }
        .ft-copy p { margin: 12px 0 0; max-width: 34ch; font-size: clamp(16px, 2vw, 19px); line-height: 1.7; color: var(--text-secondary); }
        .ft-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: clamp(22px, 4vw, 38px); width: 100%; }
        .ft-primary, .ft-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 26px;
          border-radius: 99px; font-size: 16px; font-weight: 800; text-decoration: none; cursor: pointer;
          transition: transform .45s cubic-bezier(.16,1,.3,1), background-color .25s ease;
        }
        .ft-primary { background: var(--text-primary); color: var(--bg-primary); }
        .ft-ghost { color: var(--text-primary); box-shadow: inset 0 0 0 1.5px var(--border-subtle); background: var(--bg-primary); }

        /* the wall: two columns of real work drifting in opposite directions */
        .ft-wall { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 260px; padding-inline: clamp(14px, 3vw, 24px); overflow: hidden;
          -webkit-mask-image: linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent); mask-image: linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent); }
        .ft-col { overflow: hidden; min-height: 0; height: 100%; }
        .ft-track { display: flex; flex-direction: column; gap: 10px; animation: ft-up 38s linear infinite; will-change: transform; }
        .ft-rev .ft-track { animation-name: ft-down; animation-duration: 46s; }
        .ft-tile { position: relative; flex: none; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; background: var(--bg-card-muted, #eee); box-shadow: 0 0 0 1px rgba(0,0,0,.06); }
        .ft-img { object-fit: cover; }
        @keyframes ft-up { to { transform: translate3d(0, calc(-50% - 5px), 0); } }
        @keyframes ft-down { from { transform: translate3d(0, calc(-50% - 5px), 0); } to { transform: translate3d(0, 0, 0); } }

        .ft-rail { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-inline: clamp(22px, 5vw, 64px); padding-block: 18px; border-top: 1px solid var(--border-subtle); }
        .ft-name { font-size: 15px; font-weight: 700; color: var(--text-secondary); }
        .ft-icons { display: flex; gap: 8px; }
        .ft-icons a, .ft-icons button {
          width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 0; cursor: pointer;
          color: var(--text-primary); background: var(--bg-primary); box-shadow: inset 0 0 0 1px var(--border-subtle); text-decoration: none;
          transition: transform .45s cubic-bezier(.16,1,.3,1);
        }
        .ft-primary:focus-visible, .ft-ghost:focus-visible, .ft-icons a:focus-visible, .ft-icons button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        @media (hover: hover) and (pointer: fine) {
          .ft-primary:hover, .ft-ghost:hover, .ft-icons a:hover, .ft-icons button:hover { transform: translateY(-3px); }
          .ft-wall:hover .ft-track { animation-play-state: paused; }
        }
        @media (min-width: 860px) {
          .ft-main { grid-template-columns: 1.05fr 1fr; }
          .ft-wall { height: 420px; align-self: center; padding-block: 0; padding-inline: 0 clamp(18px, 3vw, 32px); }
          [dir="rtl"] .ft-wall { padding-inline: clamp(18px, 3vw, 32px) 0; }
        }
        @media (max-width: 480px) { .ft-actions > * { flex: 1 1 100%; } }
        @media (prefers-reduced-motion: reduce) { .ft-track { animation: none; } }
      `}</style>
    </footer>
  );
}
