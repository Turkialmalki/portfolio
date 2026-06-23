"use client";

import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────── */

type Bezier = [number, number, number, number];

type RevealCardProps = {
  children: ReactNode;
  className: string;
  index: number;
  inView: boolean;
  style?: CSSProperties;
};

type StorySlide = {
  company: string;
  initials: string;
  logoGradient: string;
  blobGradient: string;
  bgTint: string;
  impactWord: string;
  tagline: string;
  highlight: string;
  role: string;
  period: string;
  cta: string;
};

type Technology = {
  name: string;
  shortName: string;
  accent: string;
  background: string;
};

type Achievement = {
  label: string;
  description: string;
};

type Certificate = {
  title: string;
  issuer: string;
  year: string;
  isMock?: boolean;
};

type ProjectData = {
  title: string;
  description: string;
  tags: string[];
  image: string;
  imageAlt: string;
};

type TestimonialData = {
  quote: string;
  attribution: string;
  role: string;
  initials: string;
  isMock?: boolean;
};

/* ── Constants ─────────────────────────────────── */

const EASE: Bezier = [0.16, 1, 0.3, 1];

const SLIDE_DURATION = 3800;
const TICK_MS        = 40;

const STORY_SLIDES: StorySlide[] = [
  {
    company:      "Monsha'at",
    initials:     "MN",
    logoGradient: "linear-gradient(145deg, #064e2e, #22c55e)",
    blobGradient: "linear-gradient(135deg, #6ee7b7 0%, #34d399 40%, #38bdf8 100%)",
    bgTint:       "#edfaf5",
    impactWord:   "BUILD",
    tagline:      "Saudi Arabia's government platform for startups.",
    highlight:    "Engineering Leader · 50+ programs supported",
    role:         "Software Engineering Leader",
    period:       "2024 — Now",
    cta:          "Current Role",
  },
  {
    company:      "Emkan",
    initials:     "EK",
    logoGradient: "linear-gradient(145deg, #7c2d12, #f97316)",
    blobGradient: "linear-gradient(135deg, #fdba74 0%, #f43f5e 50%, #c026d3 100%)",
    bgTint:       "#fff8f3",
    impactWord:   "SCALE",
    tagline:      "Fintech products reaching millions of users.",
    highlight:    "Innovation Lab Lead · Mobile & platform teams",
    role:         "Software Engineer III / Innovation Lab Lead",
    period:       "2022 — 2024",
    cta:          "Fintech",
  },
  {
    company:      "Al Rajhi Bank",
    initials:     "AR",
    logoGradient: "linear-gradient(145deg, #78350f, #d97706)",
    blobGradient: "linear-gradient(135deg, #fde68a 0%, #fb923c 45%, #ef4444 100%)",
    bgTint:       "#fffbeb",
    impactWord:   "SHIP",
    tagline:      "Mobile banking for millions of Saudi customers.",
    highlight:    "Senior Engineer · World's largest Islamic bank",
    role:         "Senior Software Engineer",
    period:       "2019 — 2022",
    cta:          "Banking",
  },
  {
    company:      "Saudi Aramco",
    initials:     "SA",
    logoGradient: "linear-gradient(145deg, #1e3a8a, #60a5fa)",
    blobGradient: "linear-gradient(135deg, #93c5fd 0%, #818cf8 50%, #c084fc 100%)",
    bgTint:       "#eff6ff",
    impactWord:   "GROW",
    tagline:      "Enterprise foundations at the world's largest energy company.",
    highlight:    "Intern · Where the journey began",
    role:         "Engineering Intern",
    period:       "2018",
    cta:          "Foundation",
  },
];

const TECH_ROW_ONE: Technology[] = [
  { name: "React Native", shortName: "RN", accent: "#149ECA", background: "#E6F8FD" },
  { name: "TypeScript",   shortName: "TS", accent: "#3178C6", background: "#EAF3FC" },
  { name: "Java",         shortName: "JV", accent: "#E76F00", background: "#FFF1E5" },
  { name: "Spring",       shortName: "SP", accent: "#68BD45", background: "#EEF9E9" },
  { name: "Node.js",      shortName: "ND", accent: "#43853D", background: "#EDF6EB" },
  { name: "React",        shortName: "RE", accent: "#087EA4", background: "#E8F7FB" },
];

const TECH_ROW_TWO: Technology[] = [
  { name: "Next.js",          shortName: "NX", accent: "#111111", background: "#EBEBEB" },
  { name: "JavaScript",       shortName: "JS", accent: "#7A6500", background: "#FFF7C2" },
  { name: "Metabase",         shortName: "MB", accent: "#509EE3", background: "#EAF5FE" },
  { name: "NoCoDB",           shortName: "NC", accent: "#7248E8", background: "#F0ECFF" },
  { name: "Product Strategy", shortName: "PS", accent: "#D63B5A", background: "#FFF0F3" },
  { name: "System Design",    shortName: "SD", accent: "#15966A", background: "#E8F8F0" },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    label:       "Innovation Center",
    description: "Led the digital revamp of Monsha'at's Innovation Center website and experience.",
  },
  {
    label:       "Internal Platforms",
    description: "Architected scalable NoCoDB data platform and Metabase dashboards for real-time KPI visibility.",
  },
  {
    label:       "Startup Enablement",
    description: "Mentored startup teams and accelerated multiple MVP deliveries through the innovation lab.",
  },
  {
    label:       "Fintech Modernization",
    description: "Led mobile banking product modernization and technical infrastructure at Al Rajhi Bank.",
  },
];

const CERTIFICATES: Certificate[] = [
  { title: "Digital Product Leadership",     issuer: "Sample Academy",   year: "2025", isMock: true },
  { title: "Cloud Architecture Foundations", issuer: "Sample Institute", year: "2024", isMock: true },
  { title: "Innovation Management",          issuer: "Sample Program",   year: "2023", isMock: true },
];

const FEATURED_PROJECT: ProjectData = {
  title:       "Monsha'at Innovation Center",
  description: "Led the digital revamp of the Innovation Center and built scalable internal systems, dashboards, and data platforms supporting startups and innovation programs.",
  tags:        ["Government Innovation", "Engineering Leadership", "Digital Transformation"],
  image:       "/monshaat.jpg",
  imageAlt:    "Monsha'at Innovation Center – digital platform and internal systems",
};

const TESTIMONIAL: TestimonialData = {
  quote:       "Turki brings structure to complex technical challenges and helps teams move from ideas to confident delivery.",
  attribution: "Sample testimonial",
  role:        "Replace with a verified colleague or client quote",
  initials:    "ST",
  isMock:      true,
};

/* ── Section ────────────────────────────────────── */

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section id="projects" ref={sectionRef} className="vs">
      <div className="vs-wrap">

        <motion.div
          className="vs-pill"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Value
        </motion.div>

        <motion.h2
          className="vs-h2"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.05 }}
        >
          Why Me?
        </motion.h2>

        <motion.p
          className="vs-sub"
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.62, ease: EASE, delay: 0.1 }}
        >
          Engineering leadership, product thinking, and innovation grounded in real delivery.
        </motion.p>

        <div className="vs-grid">
          <ExperienceCard   index={0} inView={inView} />

        </div>

      </div>

      <style>{`

        /* ─── Section ──────────────────────────────────────── */

        .vs {
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          padding:
            clamp(80px, 9vw, 118px)
            clamp(16px, 3vw, 32px)
            clamp(96px, 10vw, 136px);
          color: var(--text-primary);
          background: var(--bg-primary);
          transition: color 350ms ease, background-color 350ms ease;
        }

        .vs-wrap {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          text-align: center;
        }

        /* ─── Header ───────────────────────────────────────── */

        .vs-pill {
          display: inline-flex;
          align-items: center;
          height: 35px;
          padding: 0 15px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          color: var(--text-secondary);
          background: var(--bg-pill);
          transition: color 350ms ease, background-color 350ms ease;
        }

        .vs-h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(40px, 5vw, 66px);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.055em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        .vs-sub {
          max-width: 620px;
          margin: 17px auto clamp(46px, 6vw, 66px);
          color: var(--text-secondary);
          font-size: clamp(17px, 1.65vw, 23px);
          font-weight: 490;
          line-height: 1.28;
          letter-spacing: -0.023em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        /* ─── Grid ─────────────────────────────────────────── */

        .vs-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 13px;
          width: 100%;
          align-items: start;
        }

        /* ─── Base card ────────────────────────────────────── */

        .bc {
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          min-width: 0;
          text-align: left;
          color: var(--text-primary);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 22px;
          transition:
            color 350ms ease,
            background-color 350ms ease,
            border-color 350ms ease,
            box-shadow 300ms ease;
        }

        .bc:hover {
          box-shadow: var(--shadow-soft, 0 14px 36px rgba(0, 0, 0, 0.07));
        }

        /* ─── Shared label ─────────────────────────────────── */

        .clabel {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 650;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          flex-shrink: 0;
          color: var(--text-secondary);
          background: var(--bg-pill);
          transition: color 350ms ease, background-color 350ms ease;
        }

        /* ═══════════════════════════════════════════════════════
           Experience card — animated story card
        ═══════════════════════════════════════════════════════ */

        .ec {
          grid-column: 1 / span 4;
          grid-row: 1 / span 2;
          width: 100%;
          aspect-ratio: 2 / 3;
          min-height: 520px;
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #edfaf5;
          border: 1px solid rgba(100, 180, 140, 0.18);
          border-radius: clamp(28px, 3.5vw, 48px);
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.09),
            0 4px 14px rgba(15, 23, 42, 0.06);
        }

        .ec:hover {
          box-shadow:
            0 28px 72px rgba(15, 23, 42, 0.13),
            0 6px 20px rgba(15, 23, 42, 0.07) !important;
        }

        /* per-slide background tint — fades between companies */
        .ec-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        /* dark overlay — covers light tint in dark mode */
        .ec-dark-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: #0d1120;
          opacity: 0;
          pointer-events: none;
          transition: opacity 350ms ease;
        }

        .dark .ec-dark-overlay,
        [data-theme="dark"] .ec-dark-overlay {
          opacity: 1;
        }

        /* blob layer — always drifting */
        .ec-blob-layer {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }

        .ec-blob-1,
        .ec-blob-2 {
          position: absolute;
        }

        .ec-blob-1 {
          width: 320px;
          height: 290px;
          top: -100px;
          right: -90px;
          border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
          opacity: 0.75;
          animation: ec-drift-a 10s ease-in-out infinite;
        }

        .ec-blob-2 {
          width: 260px;
          height: 235px;
          bottom: -85px;
          left: -80px;
          border-radius: 41% 59% 47% 53% / 52% 44% 56% 48%;
          opacity: 0.52;
          animation: ec-drift-b 13s ease-in-out infinite;
        }

        @keyframes ec-drift-a {
          0%, 100% { transform: translate(0,    0)    scale(1)    rotate(0deg); }
          30%      { transform: translate(26px, -20px) scale(1.09) rotate(7deg);  }
          65%      { transform: translate(-16px, 26px) scale(0.93) rotate(-5deg); }
        }

        @keyframes ec-drift-b {
          0%, 100% { transform: translate(0,     0)    scale(1)    rotate(0deg);  }
          40%      { transform: translate(-24px,  18px) scale(1.08) rotate(-9deg); }
          75%      { transform: translate( 18px, -24px) scale(0.94) rotate( 6deg); }
        }

        /* foreground content */
        .ec-fg {
          position: relative;
          z-index: 3;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px 26px 0;
        }

        /* story progress bars */
        .ec-bars {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        .ec-bar-bg {
          flex: 1;
          height: 2.5px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.14);
          overflow: hidden;
        }

        .ec-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.54);
          transition: width 50ms linear;
        }

        /* sr-only */
        .ec-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* slide wrapper */
        .ec-slide {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        /* header row: logo + stacked company/period */
        .ec-slide-hdr {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 20px;
          flex-shrink: 0;
        }

        .ec-logo-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.22),
            0 1px 0   rgba(255, 255, 255, 0.26) inset;
        }

        .ec-logo-circle span {
          font-size: 12px;
          font-weight: 860;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
        }

        .ec-hdr-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .ec-slide-co {
          display: block;
          font-size: 14px;
          font-weight: 720;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .ec-slide-per {
          display: block;
          font-size: 11px;
          font-weight: 420;
          color: rgba(15, 23, 42, 0.4);
          white-space: nowrap;
          line-height: 1.1;
        }

        /* centred body */
        .ec-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
          padding: 24px 16px 20px;
        }

        /* massive impact word */
        .ec-impact {
          margin: 0;
          font-size: clamp(80px, 19vw, 100px);
          font-weight: 900;
          line-height: 0.86;
          letter-spacing: -0.07em;
          color: #0f172a;
          text-transform: uppercase;
        }

        /* one-line tagline */
        .ec-tagline {
          margin: 0;
          font-size: 14px;
          font-weight: 480;
          line-height: 1.5;
          color: rgba(15, 23, 42, 0.62);
          max-width: 260px;
        }

        /* context badge below tagline */
        .ec-highlight {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.06);
          font-size: 10.5px;
          font-weight: 580;
          color: rgba(15, 23, 42, 0.5);
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        /* CTA row */
        .ec-cta-row {
          padding: 0 26px 34px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .ec-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 46px;
          padding: 0 34px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          font-size: 10px;
          font-weight: 760;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.1),
            0 1px  4px rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        /* ── dark mode ── */
        .dark .ec,
        [data-theme="dark"] .ec {
          background: #0d1120;
          border-color: rgba(120, 140, 255, 0.1);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.36),
            0 4px 14px rgba(0, 0, 0, 0.22);
        }

        .dark .ec-bar-bg,
        [data-theme="dark"] .ec-bar-bg {
          background: rgba(255, 255, 255, 0.16);
        }

        .dark .ec-bar-fill,
        [data-theme="dark"] .ec-bar-fill {
          background: rgba(255, 255, 255, 0.8);
        }

        .dark .ec-slide-co,
        [data-theme="dark"] .ec-slide-co {
          color: #dde4f0;
        }

        .dark .ec-slide-per,
        [data-theme="dark"] .ec-slide-per {
          color: rgba(221, 228, 240, 0.4);
        }

        .dark .ec-impact,
        [data-theme="dark"] .ec-impact {
          color: #f1f5f9;
        }

        .dark .ec-tagline,
        [data-theme="dark"] .ec-tagline {
          color: rgba(226, 232, 240, 0.62);
        }

        .dark .ec-highlight,
        [data-theme="dark"] .ec-highlight {
          background: rgba(255, 255, 255, 0.07);
          color: rgba(226, 232, 240, 0.46);
        }

        .dark .ec-cta,
        [data-theme="dark"] .ec-cta {
          background: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(255, 255, 255, 0.09);
        }

        /* ─── Project card ─────────────────────────────────── */

        .pc {
          grid-column: 5 / span 8;
          grid-row: 1 / span 2;
          display: flex;
          flex-direction: column;
          padding: 0;
          min-height: 436px;
          cursor: default;
        }

        .pc-img-wrap {
          position: relative;
          width: 100%;
          height: 230px;
          flex: 0 0 230px;
          overflow: hidden;
          border-radius: 22px 22px 0 0;
        }

        .pc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          transition: transform 650ms ease;
        }

        .pc:hover .pc-img {
          transform: scale(1.04);
        }

        .pc-body {
          flex: 1;
          padding: 16px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-height: 0;
        }

        .pc-title {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(15px, 1.35vw, 19px);
          font-weight: 730;
          line-height: 1.06;
          letter-spacing: -0.04em;
          transition: color 350ms ease;
        }

        .pc-desc {
          margin: 0;
          flex: 1;
          color: var(--text-secondary);
          font-size: 11.5px;
          line-height: 1.52;
          transition: color 350ms ease;
        }

        .pc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 6px;
        }

        .pc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }

        .pc-tag {
          display: inline-flex;
          align-items: center;
          height: 23px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 570;
          white-space: nowrap;
          color: var(--text-secondary);
          background: var(--bg-pill);
          border: 1px solid var(--border-subtle);
          transition:
            color 350ms ease,
            background-color 350ms ease,
            border-color 350ms ease;
        }

        .pc-arrow {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--accent, #1495ff);
          color: #ffffff;
          font-size: 14px;
          line-height: 1;
          opacity: 0;
          transform: translateX(-5px);
          transition: opacity 270ms ease, transform 270ms ease;
        }

        .pc:hover .pc-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ─── Tech card ────────────────────────────────────── */

        .tc {
          grid-column: 1 / span 7;
          grid-row: 3;
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          align-items: center;
          gap: 18px;
          padding: 19px 0 19px 21px;
        }

        .tc-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
        }

        .tc-title {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(17px, 1.6vw, 22px);
          font-weight: 730;
          line-height: 1.05;
          letter-spacing: -0.046em;
          max-width: 185px;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        .tc-desc {
          margin: 0;
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.42;
          max-width: 185px;
          transition: color 350ms ease;
        }

        .tc-marquee {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          overflow: hidden;
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
        }

        .tc-row { overflow: hidden; }

        .tc-track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .tc-track-fwd { animation-name: tech-fwd; animation-duration: 26s; }
        .tc-track-rev { animation-name: tech-rev; animation-duration: 30s; }

        .tc:hover .tc-track { animation-play-state: paused; }

        .tc-group {
          display: flex;
          align-items: center;
          gap: 7px;
          padding-right: 7px;
        }

        .tc-chip {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          height: 40px;
          min-width: 116px;
          padding: 0 10px 0 5px;
          border-radius: 12px;
          border: 1px solid color-mix(in srgb, var(--chip-accent, #222) 13%, transparent);
          background: var(--chip-bg, #ebebeb);
          transition: transform 240ms ease, box-shadow 240ms ease;
        }

        .tc-chip:hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow: 0 7px 18px rgba(0, 0, 0, 0.07);
        }

        .tc-mark {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--chip-accent, #222);
          color: #ffffff;
          font-size: 8px;
          font-weight: 800;
        }

        .tc-name {
          max-width: 68px;
          overflow: hidden;
          color: #1a1a1a;
          font-size: 9.5px;
          font-weight: 640;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        /* ─── Achievements card ────────────────────────────── */

        .ac {
          grid-column: 8 / span 5;
          grid-row: 3;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .ac-head {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          margin-bottom: 10px;
        }

        .ac-title {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(17px, 1.6vw, 21px);
          font-weight: 720;
          line-height: 1.05;
          letter-spacing: -0.044em;
          transition: color 350ms ease;
        }

        .ac-list {
          display: flex;
          flex-direction: column;
          margin-top: auto;
        }

        .ac-item {
          display: grid;
          grid-template-columns: 6px minmax(0, 1fr);
          gap: 9px;
          padding: 8px 0;
          border-top: 1px solid var(--border-subtle);
        }

        .ac-dot {
          width: 6px;
          height: 6px;
          margin-top: 3px;
          border-radius: 50%;
          background: var(--accent, #1495ff);
          flex-shrink: 0;
        }

        .ac-item strong {
          display: block;
          color: var(--text-primary);
          font-size: 10.5px;
          font-weight: 700;
          margin-bottom: 2px;
          transition: color 350ms ease;
        }

        .ac-item p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 10px;
          line-height: 1.4;
          transition: color 350ms ease;
        }

        /* ─── Testimonial card ─────────────────────────────── */

        .tmc {
          grid-column: 1 / span 8;
          grid-row: 4;
          display: flex;
          flex-direction: column;
          padding: 24px;
          background: var(--bg-elevated);
        }

        .tmc-quotemark {
          color: var(--accent, #1495ff);
          font-size: 46px;
          line-height: 0.7;
          font-weight: 900;
          margin-bottom: 14px;
          opacity: 0.48;
          letter-spacing: -0.03em;
          font-family: Georgia, serif;
        }

        .tmc-quote {
          margin: 0;
          flex: 1;
          color: var(--text-primary);
          font-size: clamp(14px, 1.35vw, 18px);
          font-weight: 600;
          line-height: 1.28;
          letter-spacing: -0.033em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        .tmc-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }

        .tmc-avatar {
          flex-shrink: 0;
          width: 33px;
          height: 33px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #252731, #616473);
          color: #ffffff;
          font-size: 10px;
          font-weight: 730;
        }

        .tmc-person strong {
          display: block;
          color: var(--text-primary);
          font-size: 10.5px;
          font-weight: 650;
          transition: color 350ms ease;
        }

        .tmc-person small {
          display: block;
          margin-top: 2px;
          color: var(--text-secondary);
          font-size: 9.5px;
          line-height: 1.35;
          transition: color 350ms ease;
        }

        /* ─── Certificates card ────────────────────────────── */

        .cc {
          grid-column: 9 / span 4;
          grid-row: 4;
          display: flex;
          flex-direction: column;
          padding: 20px;
          background: var(--bg-elevated);
        }

        .cc-title {
          margin: 9px 0 0;
          color: var(--text-primary);
          font-size: clamp(15px, 1.35vw, 18px);
          font-weight: 720;
          line-height: 1.05;
          letter-spacing: -0.043em;
          transition: color 350ms ease;
        }

        .cc-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: auto;
          padding-top: 12px;
        }

        .cc-item {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 6px 8px;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          transition:
            background-color 350ms ease,
            border-color 350ms ease,
            transform 220ms ease;
        }

        .cc-item:hover { transform: translateX(3px); }

        .cc-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eeebff;
          color: #7250e5;
          font-size: 13px;
          flex-shrink: 0;
        }

        .cc-text strong {
          display: block;
          overflow: hidden;
          color: var(--text-primary);
          font-size: 10px;
          font-weight: 660;
          line-height: 1.2;
          white-space: nowrap;
          text-overflow: ellipsis;
          transition: color 350ms ease;
        }

        .cc-text small {
          display: block;
          margin-top: 2px;
          overflow: hidden;
          color: var(--text-secondary);
          font-size: 9.5px;
          white-space: nowrap;
          text-overflow: ellipsis;
          transition: color 350ms ease;
        }

        /* ─── Shared badges ────────────────────────────────── */

        .mock-pill {
          display: inline-flex;
          align-items: center;
          height: 19px;
          padding: 0 6px;
          border-radius: 999px;
          color: #886720;
          background: #fff4ce;
          font-size: 7.5px;
          font-weight: 750;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .mock-badge {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          color: #886720;
          background: #fff4ce;
          font-size: 7px;
          font-weight: 750;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        /* ─── Keyframes ────────────────────────────────────── */

        @keyframes tech-fwd {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes tech-rev {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }

        /* ─── Dark mode tweaks ─────────────────────────────── */

        .dark .bc,
        [data-theme="dark"] .bc {
          border-color: rgba(255, 255, 255, 0.07);
        }

        .dark .cc-item,
        [data-theme="dark"] .cc-item {
          border-color: rgba(255, 255, 255, 0.07);
        }

        .dark .tc-name,
        [data-theme="dark"] .tc-name {
          color: #1a1a1a;
        }

        /* ─── Tablet ───────────────────────────────────────── */

        @media (max-width: 980px) {
          .vs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

          .ec, .pc, .tc { grid-column: 1 / -1; grid-row: auto; }

          .ac  { grid-column: 1 / span 1; grid-row: auto; min-height: 250px; }
          .tmc { grid-column: 1 / -1;     grid-row: auto; }
          .cc  { grid-column: 2 / span 1; grid-row: auto; min-height: 250px; }

          .ec { max-width: 480px; margin-inline: auto; }
          .pc { min-height: 420px; }

          .tc {
            grid-template-columns: 195px minmax(0, 1fr);
            min-height: 200px;
          }
        }

        /* ─── Mobile ───────────────────────────────────────── */

        @media (max-width: 680px) {
          .vs { padding: 76px 14px 118px; }
          .vs-h2 { font-size: clamp(36px, 10.5vw, 50px); }
          .vs-sub { font-size: clamp(16px, 5vw, 20px); margin-bottom: 40px; }

          .vs-grid { grid-template-columns: 1fr; gap: 11px; }

          .ec, .pc, .tc, .ac, .tmc, .cc {
            grid-column: auto; grid-row: auto; width: 100%;
          }

          .bc { border-radius: 20px; }

          .ec {
            max-width: 100%;
            aspect-ratio: 3 / 4;
            min-height: 460px;
            border-radius: 32px;
          }

          .ec-fg { padding: 20px 22px 0; }
          .ec-blob-1 { width: 230px; height: 200px; top: -65px; right: -60px; }
          .ec-blob-2 { width: 185px; height: 165px; bottom: -55px; left: -55px; }

          .pc { min-height: 370px; }
          .pc-img-wrap { height: 190px; flex: 0 0 190px; border-radius: 20px 20px 0 0; }

          .tc { grid-template-columns: 1fr; min-height: unset; padding: 19px 0 19px 19px; gap: 15px; }
          .tc-copy { padding-right: 19px; }
          .tc-title { max-width: unset; }
          .tc-desc  { max-width: unset; }

          .ac  { min-height: unset; }
          .tmc { padding: 20px; }
          .cc  { min-height: unset; }
        }

        @media (max-width: 420px) {
          .ec { aspect-ratio: auto; height: 540px; }
          .ec-impact { font-size: 68px; }
          .ec-slide-sub { font-size: 13px; max-width: 240px; }
          .ec-body { gap: 10px; padding: 20px 10px; }
          .ec-blob-1 { width: 200px; height: 180px; top: -60px; right: -55px; }
          .ec-blob-2 { width: 165px; height: 148px; bottom: -50px; left: -50px; }
        }

        @media (max-width: 390px) {
          .vs { padding-inline: 12px; }
          .vs-h2  { font-size: 36px; }
          .vs-sub { font-size: 16px; }
          .ec { height: 500px; }
          .ec-fg { padding: 18px 18px 0; }
          .ec-impact { font-size: 60px; }
          .ec-cta-row { padding: 0 18px 26px; }
          .pc { min-height: 345px; }
          .pc-img-wrap { height: 170px; flex: 0 0 170px; }
          .tc { padding-left: 17px; }
          .tc-copy { padding-right: 17px; }
        }

        /* ─── Reduced motion ───────────────────────────────── */

        @media (prefers-reduced-motion: reduce) {
          .tc-track                      { animation-play-state: paused !important; }
          .ec-blob-1, .ec-blob-2         { animation-play-state: paused !important; }
          .ec-bar-fill                   { transition: none !important; }
          .bc, .tc-chip, .cc-item, .pc-img, .pc-arrow { transition: none !important; }
        }

      `}</style>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────── */

function RevealCard({ children, className, index, inView, style }: RevealCardProps) {
  return (
    <motion.article
      className={`bc ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.62, ease: EASE, delay: 0.07 + index * 0.07 }}
      whileHover={{ y: -3, transition: { duration: 0.24, ease: EASE } }}
      style={style}
    >
      {children}
    </motion.article>
  );
}

/* ── ExperienceCard ──────────────────────────────── */

function ExperienceCard({ index, inView }: { index: number; inView: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress]       = useState(0);
  const tickRef     = useRef({ slide: 0, progress: 0 });
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (!inView) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = setInterval(() => {
      if (isPausedRef.current) return;
      tickRef.current.progress += (TICK_MS / SLIDE_DURATION) * 100;
      if (tickRef.current.progress >= 100) {
        tickRef.current.progress = 0;
        tickRef.current.slide = (tickRef.current.slide + 1) % STORY_SLIDES.length;
        setActiveSlide(tickRef.current.slide);
        setProgress(0);
      } else {
        setProgress(tickRef.current.progress);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [inView]);

  const slide = STORY_SLIDES[activeSlide];

  return (
    <RevealCard className="ec" index={index} inView={inView}>

      {/* layer 0: per-slide background tint, cross-fades on slide change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${activeSlide}`}
          className="ec-bg"
          style={{ background: slide.bgTint }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* layer 1: dark mode overlay (covers light tint) */}
      <div className="ec-dark-overlay" aria-hidden="true" />

      {/* layer 2: blobs — continuously animated, colors swap per slide */}
      <div className="ec-blob-layer" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={`blobs-${activeSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <div className="ec-blob-1" style={{ background: slide.blobGradient }} />
            <div className="ec-blob-2" style={{ background: slide.blobGradient }} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* layer 3: all readable content */}
      <div
        className="ec-fg"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
      >
        {/* story progress bars */}
        <div className="ec-bars" aria-hidden="true">
          {STORY_SLIDES.map((_, i) => (
            <div key={i} className="ec-bar-bg">
              <div
                className="ec-bar-fill"
                style={{
                  width:
                    i < activeSlide     ? "100%"
                    : i === activeSlide ? `${progress}%`
                    : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <p className="ec-sr" aria-live="polite" aria-atomic="true">
          {`${activeSlide + 1} of ${STORY_SLIDES.length}: ${slide.company}, ${slide.role}, ${slide.period}. ${slide.tagline}`}
        </p>

        {/* animated slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            className="ec-slide"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.34, ease: EASE }}
            aria-hidden="true"
          >
            {/* company header */}
            <div className="ec-slide-hdr">
              <motion.div
                className="ec-logo-circle"
                style={{ background: slide.logoGradient }}
                initial={{ scale: 0.72, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
              >
                <span>{slide.initials}</span>
              </motion.div>
              <div className="ec-hdr-text">
                <span className="ec-slide-co">{slide.company}</span>
                <span className="ec-slide-per">{slide.period}</span>
              </div>
            </div>

            {/* centred body: word + tagline + highlight badge */}
            <div className="ec-body">
              <h3 className="ec-impact">{slide.impactWord}</h3>
              <p className="ec-tagline">{slide.tagline}</p>
              <span className="ec-highlight">{slide.highlight}</span>
            </div>

            {/* CTA */}
            <div className="ec-cta-row">
              <span className="ec-cta">{slide.cta}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </RevealCard>
  );
}

/* ── Other cards (unchanged) ─────────────────────── */

function ProjectCard({ index, inView }: { index: number; inView: boolean }) {
  const delay = 0.07 + index * 0.07;
  return (
    <RevealCard className="pc" index={index} inView={inView}>
      <div className="pc-img-wrap">
        <Image
          src={FEATURED_PROJECT.image}
          alt={FEATURED_PROJECT.imageAlt}
          className="pc-img"
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 100vw, 58vw"
        />
      </div>
      <div className="pc-body">
        <span className="clabel">Featured Project</span>
        <motion.h3
          className="pc-title"
          initial={{ opacity: 0, y: 7 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.48, ease: EASE, delay: delay + 0.1 }}
        >
          {FEATURED_PROJECT.title}
        </motion.h3>
        <p className="pc-desc">{FEATURED_PROJECT.description}</p>
        <div className="pc-footer">
          <div className="pc-tags">
            {FEATURED_PROJECT.tags.map((tag) => (
              <span key={tag} className="pc-tag">{tag}</span>
            ))}
          </div>
          <span className="pc-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </RevealCard>
  );
}

function TechCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="tc" index={index} inView={inView}>
      <div className="tc-copy">
        <span className="clabel">Technology</span>
        <h3 className="tc-title">A stack built for shipping.</h3>
        <p className="tc-desc">Mobile, backend, platforms, data, and product delivery.</p>
      </div>
      <div className="tc-marquee">
        <TechRow technologies={TECH_ROW_ONE} direction="fwd" />
        <TechRow technologies={TECH_ROW_TWO} direction="rev" />
      </div>
    </RevealCard>
  );
}

function TechRow({ technologies, direction }: { technologies: Technology[]; direction: "fwd" | "rev" }) {
  return (
    <div className="tc-row">
      <div className={`tc-track tc-track-${direction}`}>
        <TechGroup technologies={technologies} />
        <TechGroup technologies={technologies} hidden />
      </div>
    </div>
  );
}

function TechGroup({ technologies, hidden = false }: { technologies: Technology[]; hidden?: boolean }) {
  return (
    <div className="tc-group" aria-hidden={hidden ? true : undefined}>
      {technologies.map((tech) => (
        <div
          key={`${tech.name}-${String(hidden)}`}
          className="tc-chip"
          title={tech.name}
          style={{ "--chip-accent": tech.accent, "--chip-bg": tech.background } as CSSProperties}
        >
          <span className="tc-mark">{tech.shortName}</span>
          <span className="tc-name">{tech.name}</span>
        </div>
      ))}
    </div>
  );
}

function AchievementsCard({ index, inView }: { index: number; inView: boolean }) {
  const baseDelay = 0.07 + index * 0.07;
  return (
    <RevealCard className="ac" index={index} inView={inView}>
      <div className="ac-head">
        <span className="clabel">Selected Outcomes</span>
        <h3 className="ac-title">Work with visible impact.</h3>
      </div>
      <div className="ac-list">
        {ACHIEVEMENTS.map((item, i) => (
          <motion.div
            key={item.label}
            className="ac-item"
            initial={{ opacity: 0, x: -7 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.44, ease: EASE, delay: baseDelay + 0.14 + i * 0.07 }}
          >
            <span className="ac-dot" />
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </RevealCard>
  );
}

function TestimonialCard({ index, inView }: { index: number; inView: boolean }) {
  const delay = 0.07 + index * 0.07;
  return (
    <RevealCard className="tmc" index={index} inView={inView}>
      <span className="clabel">
        What People Say
        {TESTIMONIAL.isMock && (
          <span className="mock-pill" aria-label="Placeholder testimonial">Placeholder</span>
        )}
      </span>
      <motion.span
        className="tmc-quotemark"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.48 } : {}}
        transition={{ duration: 0.52, ease: EASE, delay: delay + 0.08 }}
      >
        &ldquo;
      </motion.span>
      <motion.blockquote
        className="tmc-quote"
        initial={{ opacity: 0, y: 9 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.58, ease: EASE, delay: delay + 0.16 }}
      >
        {TESTIMONIAL.quote}
      </motion.blockquote>
      <div className="tmc-footer">
        <span className="tmc-avatar" aria-hidden="true">{TESTIMONIAL.initials}</span>
        <div className="tmc-person">
          <strong>{TESTIMONIAL.attribution}</strong>
          <small>{TESTIMONIAL.role}</small>
        </div>
      </div>
    </RevealCard>
  );
}

function CertificatesCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="cc" index={index} inView={inView}>
      <span className="clabel">Certificates</span>
      <h3 className="cc-title">Continuous learning.</h3>
      <div className="cc-list">
        {CERTIFICATES.map((cert) => (
          <div key={cert.title} className="cc-item">
            <span className="cc-icon" aria-hidden="true">◇</span>
            <div className="cc-text">
              <strong>{cert.title}</strong>
              <small>{cert.issuer} · {cert.year}</small>
            </div>
            {cert.isMock && (
              <span className="mock-badge" aria-label="Placeholder certificate">Mock</span>
            )}
          </div>
        ))}
      </div>
    </RevealCard>
  );
}
