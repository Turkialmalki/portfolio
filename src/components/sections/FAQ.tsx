"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const FAQS = [
  {
    question: "What kind of work do you specialize in?",
    answer:
      "I specialize in leading frontend and mobile engineering teams, building scalable digital products, and turning complex business requirements into clear, high-performing user experiences.",
  },
  {
    question: "What is your strongest technical background?",
    answer:
      "My strongest background is in React, Next.js, React Native, TypeScript, clean architecture, frontend/mobile architecture, and building scalable systems that are maintainable and performance-focused.",
  },
  {
    question: "What industries have you worked in?",
    answer:
      "I have worked across government innovation, fintech, banking, enterprise platforms, and digital transformation projects in Saudi Arabia and the MENA region.",
  },
  {
    question: "How do you work with product and design teams?",
    answer:
      "I partner closely with product, design, backend, QA, and business teams to align technical decisions with user needs, business goals, and delivery timelines.",
  },
  {
    question: "What makes your experience different?",
    answer:
      "I combine engineering leadership, product thinking, UI/UX sensitivity, and hands-on technical depth. I have led teams, shipped large-scale web and mobile products, improved platform quality, and won national programming and innovation competitions.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle} className="faq-grid">
        {/* ── Left column ── */}
        <div style={leftColStyle} className="faq-left-col">
          <div style={pillStyle}>FAQ</div>

          <h2 style={headingStyle} className="faq-heading">
            Got Questions?
            <br />
            I Got Answers!
          </h2>

          <p style={supportingTextStyle}>
            Here are common questions about my experience, leadership, and
            product engineering work.
          </p>

          <div style={imageWrapStyle} className="faq-image-wrap">
            <Image
              src="/avatar.jpg"
              alt="Turki Almalki"
              fill
              style={{ objectFit: "cover", objectPosition: "top center" }}
              sizes="(max-width: 860px) 90vw, 420px"
              priority={false}
            />
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={rightColStyle} className="faq-right-col">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} style={cardStyle}>
                <button
                  onClick={() => toggle(index)}
                  style={cardHeaderStyle}
                  aria-expanded={isOpen}
                >
                  <span style={questionStyle}>{faq.question}</span>
                  <span style={iconStyle(isOpen)} aria-hidden>
                    {isOpen ? "×" : "+"}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.25 },
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <p style={answerStyle}>{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .faq-grid {
            flex-direction: column !important;
          }
          .faq-left-col {
            flex: none !important;
            width: 100% !important;
          }
          .faq-right-col {
            flex: none !important;
            width: 100% !important;
          }
          .faq-image-wrap {
            height: 300px !important;
          }
          .faq-heading {
            font-size: clamp(42px, 10vw, 56px) !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ── Styles ── */

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  padding: "clamp(80px, 10vw, 140px) 24px",
  transition: "background-color 0.35s ease",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "flex",
  gap: "clamp(40px, 5vw, 80px)",
  alignItems: "flex-start",
};

const leftColStyle: React.CSSProperties = {
  flex: "0 0 clamp(280px, 36%, 400px)",
  display: "flex",
  flexDirection: "column",
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "8px 18px",
  borderRadius: 999,
  background: "var(--bg-pill)",
  color: "var(--text-secondary)",
  fontSize: 15,
  fontWeight: 500,
  marginBottom: 24,
};

const headingStyle: React.CSSProperties = {
  fontSize: "clamp(42px, 4.6vw, 72px)",
  fontWeight: 800,
  letterSpacing: "-0.055em",
  lineHeight: 1.05,
  color: "var(--text-primary)",
  margin: "0 0 22px",
  transition: "color 0.35s ease",
};

const supportingTextStyle: React.CSSProperties = {
  fontSize: "clamp(15px, 1.3vw, 18px)",
  lineHeight: 1.65,
  color: "var(--text-secondary)",
  margin: 0,
  maxWidth: 340,
  transition: "color 0.35s ease",
};

const imageWrapStyle: React.CSSProperties = {
  position: "relative",
  marginTop: 40,
  borderRadius: 32,
  background: "var(--bg-card)",
  overflow: "hidden",
  height: "clamp(260px, 26vw, 360px)",
  width: "100%",
  transition: "background-color 0.35s ease",
};

const rightColStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  paddingTop: 4,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 20,
  overflow: "hidden",
  transition: "background-color 0.35s ease",
};

const cardHeaderStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "22px 24px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};

const questionStyle: React.CSSProperties = {
  fontSize: "clamp(16px, 1.45vw, 22px)",
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  transition: "color 0.35s ease",
};

const iconStyle = (isOpen: boolean): React.CSSProperties => ({
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: isOpen ? 24 : 20,
  fontWeight: 400,
  lineHeight: 1,
  userSelect: "none",
  transition: "font-size 0.2s ease, background-color 0.35s ease",
});

const answerStyle: React.CSSProperties = {
  fontSize: "clamp(14px, 1.1vw, 17px)",
  lineHeight: 1.7,
  color: "var(--text-secondary)",
  margin: 0,
  padding: "0 24px 24px",
  transition: "color 0.35s ease",
};
