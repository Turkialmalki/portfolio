"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useInView } from "framer-motion";
import { LuMail, LuPhone, LuCalendarDays, LuCheck, LuArrowUpRight } from "react-icons/lu";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type FormState = {
  name: string;
  email: string;
  business: string;
  message: string;
};

type Status = "idle" | "submitting" | "success";

const CONTACT_ACTIONS = [
  {
    icon: LuMail,
    label: "Mail",
    href: "mailto:turkialmalki202200@gmail.com",
    external: false,
  },
  {
    icon: LuPhone,
    label: "Call",
    href: "tel:+966",
    external: false,
  },
  {
    icon: LuCalendarDays,
    label: "Book",
    href: "https://calendly.com",
    external: true,
  },
] as const;

export default function ContactPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const inView = useInView(heroRef, { once: true, margin: "-60px" });

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    business: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    await new Promise<void>((r) => setTimeout(r, 1100));
    const subject = `Message from ${form.name}${form.business ? ` — ${form.business}` : ""}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\nBusiness: ${form.business}\n\n${form.message}`;
    window.location.href = `mailto:turkialmalki202200@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("success");
  };

  return (
    <>
      <TopBar />
      <Navbar />

      <main className="contact-page">
        {/* ── Hero ── */}
        <div ref={heroRef} className="cp-hero">
          <motion.span
            className="cp-pill"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Contact
          </motion.span>

          <motion.h1
            className="cp-heading"
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.72, ease: EASE, delay: 0.06 }}
          >
            Get in Touch
          </motion.h1>

          <motion.p
            className="cp-sub"
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: EASE, delay: 0.13 }}
          >
            Have a question, opportunity, or just want to talk?
            I&apos;m always open to thoughtful conversations.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            className="cp-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: EASE, delay: 0.22 }}
          >
            {CONTACT_ACTIONS.map(({ icon: Icon, label, href, external }, i) => (
              <motion.a
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="cp-action"
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.52, ease: EASE, delay: 0.28 + i * 0.07 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.94 }}
              >
                <span className="cp-action-icon">
                  <Icon size={22} />
                </span>
                <span className="cp-action-label">{label}</span>
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* ── Form card ── */}
        <div className="cp-form-wrap">
          <motion.div
            className="cp-card"
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.72, ease: EASE, delay: 0.35 }}
          >
            {status === "success" ? (
              <motion.div
                className="cp-success"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, ease: EASE }}
              >
                <span className="cp-success-icon">
                  <LuCheck size={28} />
                </span>
                <h2 className="cp-success-title">Message received!</h2>
                <p className="cp-success-sub">
                  Your email client opened — I&apos;ll get back to you soon.
                </p>
                <button
                  className="cp-success-reset"
                  onClick={() => {
                    setStatus("idle");
                    setForm({ name: "", email: "", business: "", message: "" });
                  }}
                >
                  Send another
                </button>
              </motion.div>
            ) : (
              <>
                <h2 className="cp-card-title">Or shoot me a message!</h2>

                <form className="cp-form" onSubmit={handleSubmit} noValidate>
                  {/* Name + Email row */}
                  <div className="cp-row-2">
                    <div className="cp-field">
                      <label className="cp-label" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="cp-input"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div className="cp-field">
                      <label className="cp-label" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="cp-input"
                        placeholder="jane@gmail.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Business */}
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="business">
                      Business
                    </label>
                    <input
                      id="business"
                      name="business"
                      type="text"
                      className="cp-input"
                      placeholder="Apple"
                      value={form.business}
                      onChange={handleChange}
                      autoComplete="organization"
                    />
                  </div>

                  {/* Message */}
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="message">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className="cp-textarea"
                      placeholder="Your message..."
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                    />
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="cp-submit"
                    disabled={status === "submitting"}
                    whileHover={status === "idle" ? { scale: 1.015 } : {}}
                    whileTap={status === "idle" ? { scale: 0.97 } : {}}
                  >
                    {status === "submitting" ? (
                      <span className="cp-spinner" aria-label="Sending…" />
                    ) : (
                      <>
                        Submit
                        <LuArrowUpRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      <style>{`
        /* ── Page shell ─────────────────────────────────── */

        .contact-page {
          min-height: 100vh;
          background: var(--bg-primary);
          transition: background-color 0.45s ease;
          padding-bottom: clamp(80px, 10vw, 140px);
        }

        /* ── Hero ───────────────────────────────────────── */

        .cp-hero {
          padding:
            clamp(110px, 13vw, 172px)
            clamp(20px, 5vw, 40px)
            clamp(56px, 6vw, 80px);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cp-pill {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 520;
          margin-bottom: 22px;
          transition: background-color 0.45s ease, color 0.45s ease;
        }

        .cp-heading {
          margin: 0 0 18px;
          font-size: clamp(52px, 8vw, 96px);
          font-weight: 820;
          color: var(--text-primary);
          letter-spacing: -0.056em;
          line-height: 0.95;
          transition: color 0.45s ease;
        }

        .cp-sub {
          margin: 0 0 52px;
          font-size: clamp(15px, 1.5vw, 18px);
          color: var(--text-secondary);
          line-height: 1.62;
          max-width: 500px;
          font-weight: 440;
          transition: color 0.45s ease;
        }

        /* ── Three action buttons ───────────────────────── */

        .cp-actions {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: clamp(32px, 5vw, 56px);
        }

        .cp-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .cp-action-icon {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: var(--accent, #1495ff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow:
            0 8px 28px rgba(20, 149, 255, 0.34),
            0 2px 8px rgba(20, 149, 255, 0.18);
          transition: box-shadow 280ms ease, background 0.45s ease;
        }

        .cp-action:hover .cp-action-icon {
          box-shadow:
            0 14px 36px rgba(20, 149, 255, 0.46),
            0 4px 12px rgba(20, 149, 255, 0.22);
        }

        .cp-action-label {
          font-size: 13px;
          font-weight: 540;
          color: var(--text-secondary);
          transition: color 0.45s ease;
        }

        .cp-action:hover .cp-action-label {
          color: var(--text-primary);
        }

        /* ── Form section ───────────────────────────────── */

        .cp-form-wrap {
          padding: 0 clamp(16px, 5vw, 40px);
        }

        .cp-card {
          max-width: 680px;
          margin: 0 auto;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 28px;
          padding: clamp(24px, 4vw, 42px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          transition:
            background-color 0.45s ease,
            border-color 0.45s ease;
        }

        .cp-card-title {
          margin: 0 0 28px;
          font-size: clamp(17px, 1.8vw, 21px);
          font-weight: 750;
          color: var(--text-primary);
          text-align: center;
          letter-spacing: -0.038em;
          transition: color 0.45s ease;
        }

        /* ── Form elements ──────────────────────────────── */

        .cp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cp-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .cp-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .cp-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.01em;
          transition: color 0.45s ease;
        }

        .cp-input {
          height: 46px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 440;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          width: 100%;
          transition:
            border-color 220ms ease,
            background-color 0.45s ease,
            color 0.45s ease,
            box-shadow 220ms ease;
        }

        .cp-input::placeholder {
          color: var(--text-muted, #aaa);
        }

        .cp-input:focus {
          border-color: var(--accent, #1495ff);
          box-shadow: 0 0 0 3px rgba(20, 149, 255, 0.14);
        }

        .cp-textarea {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 440;
          font-family: inherit;
          resize: vertical;
          min-height: 130px;
          outline: none;
          box-sizing: border-box;
          width: 100%;
          line-height: 1.55;
          transition:
            border-color 220ms ease,
            background-color 0.45s ease,
            color 0.45s ease,
            box-shadow 220ms ease;
        }

        .cp-textarea::placeholder {
          color: var(--text-muted, #aaa);
        }

        .cp-textarea:focus {
          border-color: var(--accent, #1495ff);
          box-shadow: 0 0 0 3px rgba(20, 149, 255, 0.14);
        }

        /* ── Submit button ──────────────────────────────── */

        .cp-submit {
          height: 54px;
          width: 100%;
          border-radius: 999px;
          background: var(--accent, #1495ff);
          color: #ffffff;
          font-size: 15px;
          font-weight: 680;
          font-family: inherit;
          letter-spacing: -0.01em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 6px 24px rgba(20, 149, 255, 0.36);
          transition: opacity 220ms ease, box-shadow 220ms ease;
          margin-top: 4px;
        }

        .cp-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cp-submit:not(:disabled):hover {
          box-shadow: 0 10px 32px rgba(20, 149, 255, 0.48);
        }

        /* ── Spinner ────────────────────────────────────── */

        .cp-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: cp-spin 0.72s linear infinite;
        }

        @keyframes cp-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Success state ──────────────────────────────── */

        .cp-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 20px 24px;
          text-align: center;
        }

        .cp-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(145deg, #1495ff, #0d7fe0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 28px rgba(20, 149, 255, 0.38);
          margin-bottom: 4px;
        }

        .cp-success-title {
          margin: 0;
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 760;
          color: var(--text-primary);
          letter-spacing: -0.04em;
          transition: color 0.45s ease;
        }

        .cp-success-sub {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: 300px;
          transition: color 0.45s ease;
        }

        .cp-success-reset {
          margin-top: 8px;
          height: 38px;
          padding: 0 20px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 560;
          font-family: inherit;
          border: none;
          cursor: pointer;
          transition:
            background-color 220ms ease,
            color 220ms ease;
        }

        .cp-success-reset:hover {
          background: var(--bg-card-muted);
          color: var(--text-primary);
        }

        /* ── Dark mode tweaks ───────────────────────────── */

        .dark .cp-input,
        [data-theme="dark"] .cp-input,
        .dark .cp-textarea,
        [data-theme="dark"] .cp-textarea {
          background: var(--bg-elevated);
        }

        /* ── Mobile ─────────────────────────────────────── */

        @media (max-width: 640px) {
          .cp-hero {
            padding-top: clamp(100px, 26vw, 140px);
            padding-bottom: clamp(44px, 8vw, 64px);
          }

          .cp-heading { font-size: clamp(46px, 13vw, 68px); }
          .cp-sub { font-size: 15px; margin-bottom: 40px; }

          .cp-actions { gap: 28px; }
          .cp-action-icon { width: 58px; height: 58px; }

          .cp-row-2 { grid-template-columns: 1fr; }

          .cp-card { border-radius: 22px; }

          .cp-submit { height: 52px; font-size: 14.5px; }
        }

        @media (max-width: 390px) {
          .cp-heading { font-size: 42px; }
          .cp-actions { gap: 22px; }
          .cp-action-icon { width: 54px; height: 54px; }
        }
      `}</style>
    </>
  );
}
