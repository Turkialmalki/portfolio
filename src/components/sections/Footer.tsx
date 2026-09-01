"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  FiGithub,
  FiLinkedin,
  FiMail,
} from "react-icons/fi";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CONTACT } from "@/config/contact";
import { SHOW_PROJECTS } from "@/config/siteFlags";

type Bezier = [number, number, number, number];

const EASE: Bezier = [0.16, 1, 0.3, 1];

// Built from CONTACT so a missing/null URL just drops the icon instead of
// rendering a dead link — see src/config/contact.ts for the verified values.
const SOCIAL_LINKS = [
  CONTACT.linkedinUrl && {
    label: "LinkedIn",
    href: CONTACT.linkedinUrl,
    Icon: FiLinkedin,
    event: "linkedin_click",
  },
  CONTACT.githubUrl && {
    label: "GitHub",
    href: CONTACT.githubUrl,
    Icon: FiGithub,
    event: null,
  },
  {
    label: "Email",
    href: `mailto:${CONTACT.email}`,
    Icon: FiMail,
    event: "email_click",
  },
].filter(Boolean) as {
  label: string;
  href: string;
  Icon: typeof FiLinkedin;
  event: string | null;
}[];

const COPY = {
  en: {
    heading: "Let's Connect",
    body: "I'm always open to new opportunities, ideas, or just a good conversation.",
    cta: "Get in Touch",
    pages: "Pages",
    copyright: "Created by Turki Almalki © 2026",
    brand: "Turki Almalki",
  },
  ar: {
    heading: "لنتواصل",
    body: "أرحّب دائمًا بالفرص الجديدة والأفكار، أو حتى حديث ممتع.",
    cta: "تواصل معي",
    pages: "الصفحات",
    copyright: "صُنع بواسطة تركي المالكي © 2026",
    brand: "تركي المالكي",
  },
};

// const INFO_LINKS = [
//   {
//     label: "Contact",
//     href: "mailto:turkialmalki202200@gmail.com",
//   },
//   { label: "Privacy Policy", href: "/privacy" },
//   { label: "Terms", href: "/terms" },
//   { label: "404", href: "/404" },
// ];

/**
 * The arrow is drawn, not typed.
 *
 * Thmanyah Sans has no U+2192, so a literal "→" fell through to the system UI
 * face — one glyph in a different typeface, inside the button, which is the
 * font mismatch that was visible in the footer. An SVG also mirrors properly
 * for Arabic, which the character never did.
 */
function ArrowGlyph() {
  return (
    <svg
      className="contact-button-arrow"
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 6h15M11.6 1.4 16.2 6l-4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { t, lang } = useLanguage();
  const copy = COPY[lang];

  const pageLinks = [
    { label: t.nav.home, href: "/" },
    ...(SHOW_PROJECTS ? [{ label: t.nav.portfolio, href: "/projects" }] : []),
    { label: t.nav.services, href: "/services" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.blog, href: "/blog" },
  ];

  const inView = useInView(ref, {
    once: true,
    margin: "-80px",
  });

  return (
    <footer
      id="contact-footer"
      ref={ref}
      className="footer-root"
    >
      <div className="footer-container">
        {/* Contact banner */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.9,
            ease: EASE,
          }}
          className="contact-card"
        >
          <div className="contact-copy">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.8,
                ease: EASE,
                delay: 0.08,
              }}
            >
              {copy.heading}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.75,
                ease: EASE,
                delay: 0.14,
              }}
            >
              {copy.body}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                ease: EASE,
                delay: 0.2,
              }}
              whileHover={{
                y: -3,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Link
                href="/contact"
                onClick={() => trackEvent("contact_click", { location: "footer" })}
                className="contact-button"
              >
                {copy.cta}
                <ArrowGlyph />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 1,
              ease: EASE,
              delay: 0.12,
            }}
            className="contact-visual"
          >
            <Image
              src="/turki.jpg"
              alt="Turki Almalki inviting visitors to get in touch"
              fill
              sizes="(max-width: 800px) 100vw, 600px"
              className="contact-image"
            />
          </motion.div>
        </motion.section>

        {/* Main footer information */}
        <motion.section
          initial={{ opacity: 0, y: 34 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.9,
            ease: EASE,
            delay: 0.12,
          }}
          className="footer-card"
        >
          <div className="footer-main-row">
            <div className="footer-brand">
              <h3>{copy.brand}</h3>
              <p className="footer-brand-role">{t.hero.eyebrow}</p>

              <div className="social-links">
                {SOCIAL_LINKS.map(({ label, href, Icon, event }) => (
                  <motion.a
                    key={label}
                    href={href}
                    onClick={event ? () => trackEvent(event, { location: "footer", label }) : undefined}
                    target={
                      href.startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={label}
                    title={label}
                    whileHover={{
                      y: -3,
                      scale: 1.06,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    className="social-button"
                  >
                    <Icon size={19} />
                  </motion.a>
                ))}
              </div>
            </div>

          </div>

          {/* The links and the copyright share one baseline instead of a
              column stranded on the far side of an empty card. */}
          <div className="footer-rail">
            <nav className="footer-links" aria-label={copy.pages}>
              {pageLinks.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <p className="footer-copyright">{copy.copyright}</p>
          </div>
        </motion.section>
      </div>

      <style>{`
        .footer-root {
          width: 100%;
          background: var(--bg-primary);
          padding: 24px 24px 96px;
          overflow: hidden;
          transition: background-color 0.35s ease;
        }

        .footer-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .contact-card {
          position: relative;
          display: grid;
          grid-template-columns: 46% 54%;
          min-height: 410px;
          background: var(--bg-card);
          border-radius: 34px;
          overflow: hidden;
          transition: background-color 0.35s ease;
        }

        .contact-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          text-align: start;
          padding-block: 58px;
          padding-inline: 46px 28px;
        }

        .contact-button-arrow {
          flex: 0 0 auto;
          transition: transform 260ms cubic-bezier(.16,1,.3,1);
        }

        [dir="rtl"] .contact-button-arrow { transform: scaleX(-1); }

        .contact-button:hover .contact-button-arrow { transform: translateX(3px); }
        [dir="rtl"] .contact-button:hover .contact-button-arrow {
          transform: scaleX(-1) translateX(3px);
        }

        .contact-copy h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(38px, 4.4vw, 56px);
          /* 700 and 900 are real files; 800 is not, so the browser was
             synthesising or snapping it. */
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.055em;
          transition: color 0.35s ease;
        }

        .contact-copy p {
          max-width: 400px;
          margin: 20px 0 28px;
          color: var(--footer-body-text);
          font-size: clamp(16px, 1.35vw, 19px);
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: -0.02em;
          transition: color 0.35s ease;
        }

        .contact-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 25px;
          color: var(--accent-contrast);
          background: var(--accent);
          border-radius: 999px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 700;
          line-height: 1;
          box-shadow: 0 12px 28px rgba(20, 149, 255, 0.2);
          transition: background-color 0.25s ease;
        }

        .contact-button:hover {
          background: var(--accent-hover);
        }

        .contact-visual {
          position: relative;
          align-self: stretch;
          min-height: 410px;
        }

        .contact-image {
          object-fit: contain;
          object-position: center bottom;
        }

        .footer-card {
          margin-top: 22px;
          padding: 38px 44px 24px;
          background: var(--bg-card);
          border-radius: 34px;
          transition: background-color 0.35s ease;
        }

        .footer-main-row {
          display: flex;
          justify-content: flex-start;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .footer-rail {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px 28px;
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid var(--border-color);
          transition: border-color 0.35s ease;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 24px;
        }

        .footer-links a {
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
          text-decoration: none;
          transition: color 0.25s ease;
        }

        .footer-links a:hover { color: var(--text-primary); }

        .footer-links a:focus-visible {
          outline: 3px solid rgba(20, 149, 255, 0.35);
          outline-offset: 4px;
          border-radius: 4px;
        }

        /* The name is the site's ink, at the site's weight, in the site's
           typeface. The old treatment painted it with a blue-to-turquoise
           gradient — a colour that appears nowhere else — and clipped the
           background to the glyphs, which is what made Thmanyah's letterforms
           read as a different, foreign face down here. */
        .footer-brand h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(26px, 2.5vw, 36px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          transition: color 0.35s ease;
        }

        [dir="rtl"] .footer-brand h3 { letter-spacing: 0; line-height: 1.3; }

        .footer-brand-role {
          margin: 8px 0 0;
          max-width: 34ch;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.6;
          transition: color 0.35s ease;
        }

        .social-links {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }

        .social-button {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--social-btn-color);
          background: var(--social-btn-bg);
          border-radius: 50%;
          text-decoration: none;
          transition:
            color 0.25s ease,
            background-color 0.25s ease;
        }

        .social-button:hover {
          background: var(--social-btn-hover);
        }

        

        

        .social-button:focus-visible,
        .contact-button:focus-visible {
          outline: 3px solid rgba(20, 149, 255, 0.35);
          outline-offset: 4px;
        }

        .footer-copyright {
          margin: 0;
          color: var(--text-muted);
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: -0.015em;
          transition: color 0.35s ease;
        }

        @media (max-width: 900px) {
          .contact-card {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .contact-copy {
            align-items: center;
            text-align: center;
            padding: 54px 28px 20px;
          }

          .contact-copy p {
            margin-left: auto;
            margin-right: auto;
          }

          .contact-visual {
            min-height: 330px;
          }

          .footer-main-row {
            grid-template-columns: 1fr;
            gap: 52px;
          }

          .footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          
        }

        @media (max-width: 600px) {
          .footer-root {
            padding: 16px 16px 88px;
          }

          .contact-card,
          .footer-card {
            border-radius: 26px;
          }

          .contact-copy {
            padding: 44px 22px 12px;
          }

          .contact-copy h2 {
            font-size: 42px;
          }

          .contact-visual {
            min-height: 260px;
          }

          .footer-card {
            padding: 38px 24px 26px;
          }

          .footer-brand h3 { font-size: 26px; }
          .footer-brand-role { max-width: 42ch; }

          

          .footer-copyright {
            margin-top: 42px;
            font-size: 13px;
          }
        }

        /* ══════════════════ Arabic footer ══════════════════
           Thmanyah's Arabic glyph box is 1.25em tall, so every line-height: 1
           here was cutting the script off. The worst of them was the brand
           name: "تركي المالكي" is painted through background-clip: text, and
           a clipped gradient crops to the LINE BOX — so the descenders of ي
           and ك were being erased outright, not merely overlapped. */
        [dir="rtl"] .footer-brand h3 { line-height: 1.28; padding-block: 0.04em; }
        [dir="rtl"] .contact-copy h2 { line-height: 1.22; }
        [dir="rtl"] .contact-copy p { line-height: 1.75; }
        [dir="rtl"] 
        [dir="rtl"] 
        [dir="rtl"] .footer-copyright { line-height: 1.7; }
        /* The pill keeps its 15px/13px proportions: the extra glyph room comes
           out of the padding, so the button is the same height as in English. */
        [dir="rtl"] .contact-button { line-height: 1.6; padding-block: 8px; }
      `}</style>
    </footer>
  );
}