"use client";

import { FiArrowUp, FiCalendar, FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CONTACT } from "@/config/contact";
import { MEETING_URL } from "@/config/careerServices";
import Reveal from "@/components/story/Reveal";

const COPY = {
  ar: { title: "لنتحدث", mail: "راسلني", book: "احجز مكالمة", top: "للأعلى", name: "تركي المالكي" },
  en: { title: "Let's talk", mail: "Email me", book: "Book a call", top: "Back to top", name: "Turki Almalki" },
} as const;

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
        <h2>{copy.title}</h2>

        <div className="ft-actions">
          <a
            className="ft-primary"
            href={`mailto:${CONTACT.email}`}
            onClick={() => trackEvent("contact_click", { location: "footer" })}
          >
            <FiMail size={18} aria-hidden="true" />
            {copy.mail}
          </a>
          <a className="ft-ghost" href={MEETING_URL} target="_blank" rel="noopener noreferrer">
            <FiCalendar size={18} aria-hidden="true" />
            {copy.book}
          </a>
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
          max-width: 1180px; margin: 0 auto; border-radius: clamp(28px, 4vw, 44px);
          padding: clamp(32px, 7vw, 88px) clamp(22px, 5vw, 64px) clamp(20px, 3vw, 32px);
          background: var(--text-primary); color: var(--bg-primary);
        }
        .ft-card h2 { margin: 0; font-size: clamp(54px, 13vw, 168px); line-height: 1.05; font-weight: 900; letter-spacing: -.04em; }
        [dir="rtl"] .ft-card h2 { letter-spacing: 0; line-height: 1.25; }
        .ft-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: clamp(24px, 4vw, 44px); }
        .ft-primary, .ft-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 26px;
          border-radius: 99px; font-size: 16px; font-weight: 800; text-decoration: none; cursor: pointer;
          transition: transform .45s cubic-bezier(.16,1,.3,1), background-color .25s ease;
        }
        .ft-primary { background: var(--bg-primary); color: var(--text-primary); }
        .ft-ghost { color: var(--bg-primary); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--bg-primary) 40%, transparent); }
        .ft-rail { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: clamp(40px, 8vw, 96px); padding-top: 20px; border-top: 1px solid color-mix(in srgb, var(--bg-primary) 22%, transparent); }
        .ft-name { font-size: 15px; font-weight: 700; opacity: .75; }
        .ft-icons { display: flex; gap: 8px; }
        .ft-icons a, .ft-icons button {
          width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 0; cursor: pointer;
          color: var(--bg-primary); background: color-mix(in srgb, var(--bg-primary) 14%, transparent); text-decoration: none;
          transition: transform .45s cubic-bezier(.16,1,.3,1), background-color .25s ease;
        }
        .ft-primary:focus-visible, .ft-ghost:focus-visible, .ft-icons a:focus-visible, .ft-icons button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        @media (hover: hover) and (pointer: fine) {
          .ft-primary:hover, .ft-ghost:hover { transform: translateY(-3px); }
          .ft-icons a:hover, .ft-icons button:hover { transform: translateY(-3px); background: color-mix(in srgb, var(--bg-primary) 26%, transparent); }
        }
        @media (max-width: 480px) { .ft-actions > * { flex: 1 1 100%; } }
      `}</style>
    </footer>
  );
}
