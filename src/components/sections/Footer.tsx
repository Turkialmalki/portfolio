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

type Bezier = [number, number, number, number];

const EASE: Bezier = [0.16, 1, 0.3, 1];

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/turki-almalki",
    Icon: FiLinkedin,
  },
  {
    label: "GitHub",
    href: "https://github.com/Turkialmalki",
    Icon: FiGithub,
  },
  {
    label: "Email",
    href: "mailto:turkialmalki202200@gmail.com",
    Icon: FiMail,
  },
];

const PAGE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

// const INFO_LINKS = [
//   {
//     label: "Contact",
//     href: "mailto:turkialmalki202200@gmail.com",
//   },
//   { label: "Privacy Policy", href: "/privacy" },
//   { label: "Terms", href: "/terms" },
//   { label: "404", href: "/404" },
// ];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

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
              Let&apos;s Connect
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
              I&apos;m always open to new opportunities, ideas, or just a good
              conversation.
            </motion.p>

            <motion.a
              href="mailto:turkialmalki202200@gmail.com"
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
              className="contact-button"
            >
              Get in Touch
              <span aria-hidden="true">→</span>
            </motion.a>
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
              <h3>Turki Almalki</h3>

              <div className="social-links">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <motion.a
                    key={label}
                    href={href}
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

            <div className="footer-navigation">
              <nav
                className="footer-column"
                aria-label="Footer pages"
              >
                <h4>Pages</h4>

                {PAGE_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

         
            </div>
          </div>

          <p className="footer-copyright">
            Created by Turki Almalki © 2026
          </p>
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
          text-align: left;
          padding: 58px 28px 58px 46px;
        }

        .contact-copy h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(42px, 5vw, 64px);
          font-weight: 800;
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
          font-weight: 600;
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
          padding: 46px 46px 26px;
          background: var(--bg-card);
          border-radius: 34px;
          transition: background-color 0.35s ease;
        }

        .footer-main-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 80px;
          align-items: start;
        }

        .footer-brand h3 {
          margin: 0;
          font-size: clamp(42px, 4.5vw, 60px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.055em;
          background: linear-gradient(
            100deg,
            #1495ff 0%,
            #08cfa7 80%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .social-links {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
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

        .footer-navigation {
          display: grid;
          grid-template-columns: repeat(2, minmax(110px, auto));
          gap: clamp(44px, 6vw, 76px);
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 19px;
          text-align: left;
        }

        .footer-column h4 {
          margin: 0 0 4px;
          color: var(--text-primary);
          font-size: 17px;
          font-weight: 800;
          line-height: 1;
          transition: color 0.35s ease;
        }

        .footer-column a {
          position: relative;
          color: var(--text-secondary);
          font-size: 16px;
          font-weight: 400;
          line-height: 1.2;
          text-decoration: none;
          transition:
            color 0.25s ease,
            transform 0.25s ease;
        }

        .footer-column a:hover {
          color: var(--text-primary);
          transform: translateX(3px);
        }

        .footer-column a:focus-visible,
        .social-button:focus-visible,
        .contact-button:focus-visible {
          outline: 3px solid rgba(20, 149, 255, 0.35);
          outline-offset: 4px;
        }

        .footer-copyright {
          margin: 52px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
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

          .footer-navigation {
            justify-content: center;
          }

          .footer-column {
            min-width: 120px;
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

          .footer-brand h3 {
            font-size: 42px;
          }

          .footer-navigation {
            width: 100%;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
          }

          .footer-column {
            min-width: 0;
          }

          .footer-column a {
            font-size: 15px;
          }

          .footer-copyright {
            margin-top: 42px;
            font-size: 13px;
          }
        }
      `}</style>
    </footer>
  );
}