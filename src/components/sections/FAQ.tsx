"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const faqs = [
  {
    question: "What does your design process look like?",
    answer:
      "I start with deep discovery — understanding user needs, business goals, and technical constraints. From there I move into information architecture, wireframing, and iterative prototyping. Every decision is documented and tied to a clear rationale. I design in Figma and hand off with precise specs and motion prototypes.",
  },
  {
    question: "Do you work on both design and development?",
    answer:
      "Yes — I'm a full-stack designer/developer. I can take a product from initial concept and UX strategy all the way through to production-ready code in React / Next.js. This eliminates the typical handoff friction and ensures what gets built matches the design intent precisely.",
  },
  {
    question: "What types of projects do you take on?",
    answer:
      "I focus on web applications, SaaS products, brand identities, and interactive marketing sites. I'm particularly drawn to products that demand both rigorous UX thinking and high-quality visual execution — fintech, creative tools, and premium consumer brands.",
  },
  {
    question: "Are you available for freelance or contract work?",
    answer:
      "I'm currently open to select freelance and contract engagements. I typically work with 2-3 clients at a time to maintain quality. If you have an interesting project, reach out and let's explore fit.",
  },
  {
    question: "What is your typical project timeline?",
    answer:
      "A focused brand + landing page takes 3-4 weeks. A full product design sprint (research through high-fidelity) takes 6-10 weeks. Full-stack implementation adds 4-8 weeks depending on scope. I'll give you a precise timeline after understanding your requirements.",
  },
  {
    question: "How do you handle revisions and feedback?",
    answer:
      "I use structured feedback rounds built into every project phase. I share work-in-progress early and often — weekly check-ins, Loom walkthroughs, and async Figma comments. Surprises are eliminated through consistent communication.",
  },
];

export default function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      ref={ref}
      style={{ backgroundColor: "#F9F9FB" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "clamp(40px, 6vw, 80px)",
          alignItems: "start",
        }}
        className="faq-layout"
      >
        {/* Left: Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          style={{ position: "sticky", top: 96 }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#666D80",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              color: "#0D0E12",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Frequently Asked Questions
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#666D80",
              lineHeight: 1.65,
            }}
          >
            Everything you need to know before we start working together.
          </p>
        </motion.div>

        {/* Right: Accordion list */}
        <div>
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              inView={inView}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-layout {
            grid-template-columns: 1fr !important;
          }
          .faq-layout > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </section>
  );
}

function AccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
  inView,
}: {
  faq: { question: string; answer: string };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0], delay: 0.1 + index * 0.06 }}
      style={{
        borderBottom: "1px solid #E4E7EC",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: "clamp(15px, 1.5vw, 17px)",
            fontWeight: 600,
            color: "#0D0E12",
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
          }}
        >
          {faq.question}
        </span>

        {/* +/- icon */}
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid #E4E7EC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 18,
            fontWeight: 300,
            lineHeight: 1,
            color: isOpen ? "#FFFFFF" : "#0D0E12",
            background: isOpen ? "#0D0E12" : "transparent",
            borderColor: isOpen ? "#0D0E12" : "#E4E7EC",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
          }}
          aria-hidden
        >
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                fontSize: 15,
                color: "#666D80",
                lineHeight: 1.7,
                paddingBottom: 22,
                maxWidth: 640,
              }}
            >
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
