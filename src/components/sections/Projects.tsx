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
  year: string;
  initials: string;
  logoImage?: string;
  logoGradient: string;
  blobGradient: string;
  bgTint: string;
  impactWord: string;
  tagline: string;
  highlight: string;
  cta: string;
  isStartup?: boolean;
  isCTA?: boolean;
};

type SkillTile = {
  name: string;
  short: string;
  accent: string;
  bg: string;
};

type StartupMark = {
  initials: string;
  name: string;
  color: string;
  logoImage?: string;
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
const TICK_MS = 40;

const STARTUP_MARKS: StartupMark[] = [
  { initials: "TP", name: "Tuwaiq Pay",       color: "#3b82f6" },
  { initials: "MU", name: "Munaseb",           color: "#14b8a6", logoImage: "/munasiblogo.jpeg" },
  { initials: "2",  name: "Ithnain",           color: "#8b5cf6", logoImage: "/ithninlogo.jpeg" },
  { initials: "T",  name: "Tarqeem",           color: "#f59e0b" },
  { initials: "F",  name: "Foodics",           color: "#ef4444" },
  { initials: "AP", name: "APATH Engineering", color: "#22c55e" },
];

const STORY_SLIDES: StorySlide[] = [
  {
    company: "My Journey",
    year: "2017 — Today",
    initials: "TK",
    logoGradient: "linear-gradient(145deg, #1e40af, #3b82f6)",
    blobGradient:
      "linear-gradient(135deg, #bfdbfe 0%, #93c5fd 40%, #a5b4fc 100%)",
    bgTint: "#eff6ff",
    impactWord: "BUILD",
    tagline:
      "From Android development to leading engineering teams across banking, fintech, startups, and government innovation.",
    highlight: "9+ Years of Driven Impact",
    cta: "9+ Years of Driven Impact",
  },
  {
    company: "Saudi Aramco",
    year: "2018",
    initials: "SA",
    logoImage: "/aramco.jpeg",
    logoGradient: "linear-gradient(145deg, #1e3a8a, #60a5fa)",
    blobGradient:
      "linear-gradient(135deg, #93c5fd 0%, #818cf8 50%, #c084fc 100%)",
    bgTint: "#eff6ff",
    impactWord: "GROW",
    tagline: "Enterprise foundations at the world's largest energy company.",
    highlight: "Intern · Where the journey began",
    cta: "Foundation",
  },
  {
    company: "Al Rajhi Bank",
    year: "2019 — 2022",
    initials: "AR",
    logoImage: "/alrajhilogo.png",
    logoGradient: "linear-gradient(145deg, #78350f, #d97706)",
    blobGradient:
      "linear-gradient(135deg, #fde68a 0%, #fb923c 45%, #ef4444 100%)",
    bgTint: "#fffbeb",
    impactWord: "SCALE",
    tagline:
      "Built and maintained customer-facing mobile banking experiences with React Native.",
    highlight: "Senior Software Engineer",
    cta: "Senior Software Engineer",
  },
  {
    company: "Emkan",
    year: "2022 — 2024",
    initials: "EM",
    logoImage: "/emkanlogo.png",
    logoGradient: "linear-gradient(145deg, #7c2d12, #f97316)",
    blobGradient:
      "linear-gradient(135deg, #fdba74 0%, #f43f5e 50%, #c026d3 100%)",
    bgTint: "#fff8f3",
    impactWord: "LEAD",
    tagline:
      "Led fintech modernization, mobile product quality, and innovation lab initiatives.",
    highlight: "Fintech Engineering",
    cta: "Fintech Engineering",
  },
  {
    company: "Monsha'at",
    year: "2024 — Present",
    initials: "MN",
    logoGradient: "linear-gradient(145deg, #064e2e, #22c55e)",
    blobGradient:
      "linear-gradient(135deg, #6ee7b7 0%, #34d399 40%, #38bdf8 100%)",
    bgTint: "#edfaf5",
    impactWord: "IMPACT",
    tagline:
      "Leading engineering initiatives, internal systems, dashboards, and startup-support platforms.",
    highlight: "Software Engineering Leader",
    cta: "Software Engineering Leader",
  },
  {
    company: "Startups & Ventures",
    year: "Across the journey",
    initials: "ST",
    logoGradient: "linear-gradient(145deg, #4f46e5, #7c3aed)",
    blobGradient:
      "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 40%, #818cf8 100%)",
    bgTint: "#f5f3ff",
    impactWord: "CREATE",
    tagline:
      "Worked with multiple startups and part-time ventures, bringing a founder mentality to product delivery.",
    highlight: "Founder Mindset",
    cta: "Founder Mindset",
    isStartup: true,
  },
  {
    company: "Open to Opportunities",
    year: "Now",
    initials: "→",
    logoGradient: "linear-gradient(145deg, #1e293b, #334155)",
    blobGradient:
      "linear-gradient(135deg, #94a3b8 0%, #64748b 40%, #475569 100%)",
    bgTint: "#f8fafc",
    impactWord: "CONNECT",
    tagline:
      "Available for engineering leadership, innovation, frontend, mobile, and product-driven technology opportunities.",
    highlight: "Let's Talk",
    cta: "Let's Talk",
    isCTA: true,
  },
];

const SKILLS: SkillTile[] = [
  { name: "TypeScript", short: "TS", accent: "#3178C6", bg: "#EAF3FC" },
  { name: "JavaScript", short: "JS", accent: "#D4A800", bg: "#FEFCE8" },
  { name: "Java", short: "Jv", accent: "#E76F00", bg: "#FFF1E5" },
  { name: "Next.js", short: "Nx", accent: "#111111", bg: "#F0F0F0" },
  { name: "React", short: "Re", accent: "#087EA4", bg: "#E8F7FB" },
  { name: "React Native", short: "RN", accent: "#149ECA", bg: "#E6F8FD" },
  { name: "Figma", short: "Fig", accent: "#A259FF", bg: "#F3EAFF" },
];

const TECH_ROW_ONE: Technology[] = [
  {
    name: "React Native",
    shortName: "RN",
    accent: "#149ECA",
    background: "#E6F8FD",
  },
  {
    name: "TypeScript",
    shortName: "TS",
    accent: "#3178C6",
    background: "#EAF3FC",
  },
  { name: "Java", shortName: "JV", accent: "#E76F00", background: "#FFF1E5" },
  { name: "Spring", shortName: "SP", accent: "#68BD45", background: "#EEF9E9" },
  {
    name: "Node.js",
    shortName: "ND",
    accent: "#43853D",
    background: "#EDF6EB",
  },
  { name: "React", shortName: "RE", accent: "#087EA4", background: "#E8F7FB" },
];

const TECH_ROW_TWO: Technology[] = [
  {
    name: "Next.js",
    shortName: "NX",
    accent: "#111111",
    background: "#EBEBEB",
  },
  {
    name: "JavaScript",
    shortName: "JS",
    accent: "#7A6500",
    background: "#FFF7C2",
  },
  {
    name: "Metabase",
    shortName: "MB",
    accent: "#509EE3",
    background: "#EAF5FE",
  },
  { name: "NoCoDB", shortName: "NC", accent: "#7248E8", background: "#F0ECFF" },
  {
    name: "Product Strategy",
    shortName: "PS",
    accent: "#D63B5A",
    background: "#FFF0F3",
  },
  {
    name: "System Design",
    shortName: "SD",
    accent: "#15966A",
    background: "#E8F8F0",
  },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    label: "Innovation Center",
    description:
      "Led the digital revamp of Monsha'at's Innovation Center website and experience.",
  },
  {
    label: "Internal Platforms",
    description:
      "Architected NoCoDB data platform and Metabase dashboards for real-time KPI visibility.",
  },
  {
    label: "Startup Enablement",
    description:
      "Mentored startup teams and accelerated multiple MVP deliveries through the innovation lab.",
  },
  {
    label: "Fintech Modernization",
    description:
      "Led mobile banking product modernization and technical infrastructure at Al Rajhi Bank.",
  },
];

const CERTIFICATES: Certificate[] = [
  {
    title: "Digital Product Leadership",
    issuer: "Sample Academy",
    year: "2025",
    isMock: true,
  },
  {
    title: "Cloud Architecture Foundations",
    issuer: "Sample Institute",
    year: "2024",
    isMock: true,
  },
  {
    title: "Innovation Management",
    issuer: "Sample Program",
    year: "2023",
    isMock: true,
  },
];

const FEATURED_PROJECT: ProjectData = {
  title: "Monsha'at Innovation Center",
  description:
    "Led the digital revamp of the Innovation Center and built scalable internal systems, dashboards, and data platforms supporting startups and innovation programs.",
  tags: [
    "Government Innovation",
    "Engineering Leadership",
    "Digital Transformation",
  ],
  image: "/monshaat.jpg",
  imageAlt:
    "Monsha'at Innovation Center – digital platform and internal systems",
};

const TESTIMONIAL: TestimonialData = {
  quote:
    "Turki brings structure to complex technical challenges and helps teams move from ideas to confident delivery.",
  attribution: "Sample testimonial",
  role: "Replace with a verified colleague or client quote",
  initials: "ST",
  isMock: true,
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
          Backed by experience, driven by Impact.
        </motion.p>

        <div className="vs-grid">
          <ExperienceCard index={0} inView={inView} />
          <ImpactCard index={1} inView={inView} />
          <SkillsCard index={2} inView={inView} />
          {/* <ProjectCard      index={3} inView={inView} /> */}
          {/* <TechCard         index={4} inView={inView} />
          <AchievementsCard index={5} inView={inView} />
          <TestimonialCard  index={6} inView={inView} />
          <CertificatesCard index={7} inView={inView} /> */}
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
          min-height: 600px;
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #edfaf5;
          border: 1px solid rgba(100, 180, 140, 0.18);
          border-radius: clamp(10px, 3.5vw, 16px);
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.09),
            0 4px 14px rgba(15, 23, 42, 0.06);
        }

        .ec:hover {
          box-shadow:
            0 28px 72px rgba(15, 23, 42, 0.13),
            0 6px 20px rgba(15, 23, 42, 0.07) !important;
        }

        .ec-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

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

        .ec-fg {
          position: relative;
          z-index: 3;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px 26px 0;
        }

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

        .ec-slide {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

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
          overflow: hidden;
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

        .ec-logo-img {
          object-fit: contain;
          border-radius: 0;
        }

        .ec-startup-logo {
          object-fit: contain;
          border-radius: 4px;
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

        .ec-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 14px;
          padding: 20px 16px 18px;
        }

        .ec-impact {
          margin: 0;
          font-size: clamp(30px, 12.4vw, 30px);
          font-weight: 900;
          line-height: 0.88;
          letter-spacing: -0.07em;
          color: #0f172a;
          text-transform: uppercase;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .ec-tagline {
          margin: 0;
          font-size: 13.5px;
          font-weight: 480;
          line-height: 1.5;
          color: rgba(15, 23, 42, 0.62);
          max-width: 250px;
        }

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

        /* startup marks cluster */
        .ec-startup-grid {
          display: grid;
          grid-template-columns: repeat(3, 52px);
          grid-template-rows: repeat(2, 52px);
          gap: 8px;
          margin: 0 auto;
        }

        .ec-startup-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
          cursor: default;
        }

        .ec-startup-mark span {
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
        }

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
            0 1px 4px rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .ec-cta--connect {
          background: #1495ff;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(20, 149, 255, 0.36);
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
        [data-theme="dark"] .ec-bar-bg { background: rgba(255,255,255,0.16); }
        .dark .ec-bar-fill,
        [data-theme="dark"] .ec-bar-fill { background: rgba(255,255,255,0.8); }
        .dark .ec-slide-co,
        [data-theme="dark"] .ec-slide-co { color: #dde4f0; }
        .dark .ec-slide-per,
        [data-theme="dark"] .ec-slide-per { color: rgba(221,228,240,0.4); }
        .dark .ec-impact,
        [data-theme="dark"] .ec-impact { color: #f1f5f9; }
        .dark .ec-tagline,
        [data-theme="dark"] .ec-tagline { color: rgba(226,232,240,0.62); }
        .dark .ec-highlight,
        [data-theme="dark"] .ec-highlight {
          background: rgba(255,255,255,0.07);
          color: rgba(226,232,240,0.46);
        }
        .dark .ec-cta,
        [data-theme="dark"] .ec-cta {
          background: rgba(255,255,255,0.1);
          color: #f1f5f9;
          box-shadow:
            0 4px 20px rgba(0,0,0,0.28),
            0 0 0 1px rgba(255,255,255,0.09);
        }
        .dark .ec-cta--connect,
        [data-theme="dark"] .ec-cta--connect {
          background: #1495ff;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(20,149,255,0.4);
        }

        /* ═══════════════════════════════════════════════════════
           Impact card (dark personal card)
        ═══════════════════════════════════════════════════════ */

        .ic {
          grid-column: 5 / span 4;
          grid-row: 1;
          min-height: 500px;
          background: #0d1120 !important;
          border-color: rgba(255, 255, 255, 0.07) !important;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ic:hover {
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.36),
            0 4px 14px rgba(0, 0, 0, 0.22) !important;
        }

        .ic-content {
          flex: 1;
          padding: 22px 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          z-index: 2;
        }

        .ic-title {
          margin: 0;
          color: #f0f0ef;
          font-size: clamp(15px, 1.6vw, 26px);
          font-weight: 760;
          line-height: 1.6;
          letter-spacing: -0.048em;
        }

        .ic-desc {
          margin: 0;
          color: rgba(226, 232, 240, 0.52);
          font-size: 11.5px;
          line-height: 1.5;
        }

        .ic-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 2px;
        }

        .ic-tag {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(226, 232, 240, 0.52);
          font-size: 9.5px;
          font-weight: 580;
        }

        .ic-photo-area {
          position: relative;
          height: 270px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .ic-photo {
          object-fit: cover;
          object-position: center top;
        }

        .ic-photo-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, #0d1120 0%, rgba(13, 17, 32, 0) 45%);
          z-index: 1;
          pointer-events: none;
        }

        /* ═══════════════════════════════════════════════════════
           Skills card
        ═══════════════════════════════════════════════════════ */

        .sk {
          grid-column: 9 / span 4;
          grid-row: 1;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          padding: 22px;
          gap: 14px;
        }

        .sk-header {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sk-title {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(16px, 1.6vw, 20px);
          font-weight: 740;
          line-height: 1.02;
          letter-spacing: -0.044em;
          transition: color 350ms ease;
        }

        .sk-desc {
          margin: 0;
          color: var(--text-secondary);
          font-size: 10.5px;
          line-height: 1.4;
          transition: color 350ms ease;
        }

        .sk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          flex: 1;
          align-content: start;
        }

        .sk-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 6px;
          border-radius: 14px;
          background: var(--sk-bg, #f0f0f0);
          border: 1px solid color-mix(in srgb, var(--sk-accent, #222) 14%, transparent);
          cursor: default;
          transition: transform 230ms ease, box-shadow 230ms ease;
        }

        .sk-tile:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
        }

        .sk-mark {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--sk-accent, #222);
          color: #ffffff;
          font-size: 8.5px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sk-name {
          font-size: 8px;
          font-weight: 620;
          color: #1a1a1a;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          line-height: 1;
        }

        .dark .sk-tile,
        [data-theme="dark"] .sk-tile {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .dark .sk-name,
        [data-theme="dark"] .sk-name { color: rgba(226,232,240,0.72); }

        /* ─── Project card ─────────────────────────────────── */

        .pc {
          grid-column: 5 / span 8;
          grid-row: 2;
          display: flex;
          flex-direction: column;
          padding: 0;
          min-height: 330px;
          cursor: default;
        }

        .pc-img-wrap {
          position: relative;
          width: 100%;
          height: 200px;
          flex: 0 0 200px;
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

        .pc:hover .pc-img { transform: scale(1.04); }

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
        [data-theme="dark"] .bc { border-color: rgba(255,255,255,0.07); }

        .dark .cc-item,
        [data-theme="dark"] .cc-item { border-color: rgba(255,255,255,0.07); }

        .dark .tc-name,
        [data-theme="dark"] .tc-name { color: #1a1a1a; }

        /* ─── Tablet 980px ─────────────────────────────────── */

        @media (max-width: 980px) {
          .vs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

          .ec  { grid-column: 1 / -1; grid-row: auto; max-width: 520px; margin-inline: auto; }
          .ic  { grid-column: 1 / span 1; grid-row: auto; min-height: 320px; }
          .sk  { grid-column: 2 / span 1; grid-row: auto; min-height: 320px; }
          .pc  { grid-column: 1 / -1; grid-row: auto; min-height: 400px; }
          .tc  { grid-column: 1 / -1; grid-row: auto; grid-template-columns: 200px minmax(0, 1fr); min-height: 200px; }
          .ac  { grid-column: 1 / span 1; grid-row: auto; min-height: 260px; }
          .tmc { grid-column: 1 / -1; grid-row: auto; }
          .cc  { grid-column: 2 / span 1; grid-row: auto; min-height: 260px; }
        }

        /* ─── Mobile 680px ──────────────────────────────────── */

        @media (max-width: 680px) {
          .vs { padding: 72px 16px 120px; }
          .vs-h2 { font-size: clamp(38px, 10.5vw, 52px); }
          .vs-sub { font-size: clamp(16px, 4.5vw, 19px); margin-bottom: 36px; }

          .vs-grid { grid-template-columns: 1fr; gap: 12px; }

          .ec, .ic, .sk, .pc, .tc, .ac, .tmc, .cc {
            grid-column: auto; grid-row: auto; width: 100%;
          }

          .bc { border-radius: 22px; }

          /* Story card */
          .ec {
            max-width: 100%;
            min-height: 520px;
            aspect-ratio: auto;
            height: 540px;
            border-radius: 34px;
          }
          .ec-fg { padding: 22px 24px 0; }
          .ec-blob-1 { width: 230px; height: 200px; top: -65px; right: -60px; }
          .ec-blob-2 { width: 185px; height: 165px; bottom: -55px; left: -55px; }
          .ec-body { padding: 18px 18px 14px; gap: 12px; }
          .ec-cta-row { padding: 0 24px 28px; }
          .ec-cta { height: 50px; font-size: 10.5px; letter-spacing: 0.13em; }

          /* Impact card */
          .ic { min-height: 360px; background: #0d1120; }
          .ic-content { padding: 22px 22px 16px; gap: 10px; }
          .ic-title { font-size: clamp(22px, 6.5vw, 28px); line-height: 1.0; }
          .ic-desc { font-size: 12px; line-height: 1.55; }
          .ic-photo-area { height: 190px; }

          /* Skills card */
          .sk { min-height: auto; padding: 20px 18px 18px; gap: 12px; }
          .sk-title { font-size: clamp(18px, 5.5vw, 24px); }
          .sk-grid { gap: 6px; }
          .sk-tile { padding: 9px 5px 9px; gap: 5px; border-radius: 12px; }
          .sk-mark { width: 30px; height: 30px; border-radius: 8px; font-size: 8px; }
          .sk-name { font-size: 7.5px; }

          /* Project card */
          .pc { min-height: auto; }
          .pc-img-wrap { height: 210px; flex: 0 0 210px; border-radius: 22px 22px 0 0; }
          .pc-body { padding: 16px 20px 18px; gap: 7px; }
          .pc-title { font-size: clamp(16px, 4.5vw, 20px); }
          .pc-desc { font-size: 12px; line-height: 1.5; }

          /* Tech marquee card */
          .tc {
            grid-template-columns: 1fr;
            min-height: unset;
            padding: 20px 0 20px 20px;
            gap: 14px;
          }
          .tc-copy { padding-right: 20px; }
          .tc-title { max-width: unset; font-size: clamp(18px, 5vw, 22px); }
          .tc-desc  { max-width: unset; font-size: 12px; }

          /* Achievements card */
          .ac { min-height: unset; padding: 20px; }
          .ac-title { font-size: clamp(16px, 5vw, 20px); }

          /* Testimonial */
          .tmc { padding: 22px; }
          .tmc-quote { font-size: clamp(15px, 4.5vw, 19px); line-height: 1.35; }

          /* Certificates */
          .cc { min-height: unset; }
        }

        /* ─── Mobile 430px ──────────────────────────────────── */

        @media (max-width: 430px) {
          .ec { height: 520px; }
          .ec-impact { font-size: 66px; }
          .ec-blob-1 { width: 200px; height: 180px; top: -60px; right: -55px; }
          .ec-blob-2 { width: 165px; height: 148px; bottom: -50px; left: -50px; }
          .ic { min-height: 340px; }
          .ic-photo-area { height: 170px; }
          .sk-grid { gap: 5px; }
        }

        /* ─── Mobile 390px ──────────────────────────────────── */

        @media (max-width: 390px) {
          .vs { padding-inline: 14px; }
          .vs-h2  { font-size: 36px; }
          .vs-sub { font-size: 15.5px; }
          .ec { height: 500px; }
          .ec-fg { padding: 20px 20px 0; }
          .ec-impact { font-size: 58px; }
          .ec-cta-row { padding: 0 20px 24px; }
          .ec-cta { height: 46px; }
          .ic { min-height: 320px; }
          .ic-photo-area { height: 155px; }
          .ic-content { padding: 20px 18px 14px; }
          .sk { padding: 18px 16px 16px; }
          .sk-tile { padding: 8px 4px; }
          .sk-mark { width: 27px; height: 27px; }
          .pc-img-wrap { height: 185px; flex: 0 0 185px; }
          .tc { padding-left: 16px; }
          .tc-copy { padding-right: 16px; }
        }

        /* ─── Mobile 360px ──────────────────────────────────── */

        @media (max-width: 360px) {
          .vs { padding-inline: 12px; }
          .ec { height: 480px; }
          .ec-impact { font-size: 54px; }
          .ic-photo-area { height: 145px; }
          .pc-img-wrap { height: 170px; flex: 0 0 170px; }
        }

        /* ─── Reduced motion ───────────────────────────────── */

        @media (prefers-reduced-motion: reduce) {
          .tc-track                      { animation-play-state: paused !important; }
          .ec-blob-1, .ec-blob-2         { animation-play-state: paused !important; }
          .ec-bar-fill                   { transition: none !important; }
          .bc, .tc-chip, .cc-item, .pc-img, .pc-arrow,
          .sk-tile                       { transition: none !important; }
        }

      `}</style>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────── */

function RevealCard({
  children,
  className,
  index,
  inView,
  style,
}: RevealCardProps) {
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

/* ── StartupCluster ──────────────────────────────── */

function StartupCluster() {
  return (
    <div className="ec-startup-grid" role="list" aria-label="Startup ventures">
      {STARTUP_MARKS.map((mark, i) => (
        <motion.div
          key={mark.name}
          role="listitem"
          className="ec-startup-mark"
          style={{ background: mark.color }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: EASE, delay: 0.06 + i * 0.07 }}
          title={mark.name}
          aria-label={mark.name}
        >
          {mark.logoImage ? (
            <Image
              src={mark.logoImage}
              alt={mark.name}
              width={36}
              height={36}
              className="ec-startup-logo"
            />
          ) : (
            <span aria-hidden="true">{mark.initials}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ── ExperienceCard ──────────────────────────────── */

function ExperienceCard({ index, inView }: { index: number; inView: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef({ slide: 0, progress: 0 });
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
        tickRef.current.slide =
          (tickRef.current.slide + 1) % STORY_SLIDES.length;
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
      {/* layer 0: per-slide background tint */}
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

      {/* layer 1: dark mode overlay */}
      <div className="ec-dark-overlay" aria-hidden="true" />

      {/* layer 2: animated blobs */}
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
            <div
              className="ec-blob-1"
              style={{ background: slide.blobGradient }}
            />
            <div
              className="ec-blob-2"
              style={{ background: slide.blobGradient }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* layer 3: content */}
      <div
        className="ec-fg"
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
      >
        {/* progress bars */}
        <div className="ec-bars" aria-hidden="true">
          {STORY_SLIDES.map((_, i) => (
            <div key={i} className="ec-bar-bg">
              <div
                className="ec-bar-fill"
                style={{
                  width:
                    i < activeSlide
                      ? "100%"
                      : i === activeSlide
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <p className="ec-sr" aria-live="polite" aria-atomic="true">
          {`${activeSlide + 1} of ${STORY_SLIDES.length}: ${slide.company}, ${slide.year}. ${slide.tagline}`}
        </p>

        {/* animated slide content */}
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
                // style={{ background: slide.logoGradient }}
                initial={{ scale: 0.72, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
              >
                {slide.logoImage ? (
                  <Image
                    src={slide.logoImage}
                    alt={slide.company}
                    width={30}
                    height={30}
                    className="ec-logo-img"
                  />
                ) : (
                  <span>{slide.initials}</span>
                )}
              </motion.div>
              <div className="ec-hdr-text">
                <span className="ec-slide-co">{slide.company}</span>
                <span className="ec-slide-per">{slide.year}</span>
              </div>
            </div>

            {/* body */}
            <div className="ec-body">
              <h3 className="ec-impact">{slide.impactWord}</h3>
              {slide.isStartup ? (
                <StartupCluster />
              ) : (
                <>
                  <p className="ec-tagline">{slide.tagline}</p>
                  {!slide.isCTA && (
                    <span className="ec-highlight">{slide.highlight}</span>
                  )}
                </>
              )}
            </div>

            {/* CTA */}
            <div className="ec-cta-row">
              <span
                className={`ec-cta${slide.isCTA ? " ec-cta--connect" : ""}`}
              >
                {slide.cta}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </RevealCard>
  );
}

/* ── ImpactCard ──────────────────────────────────── */

function ImpactCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="ic" index={index} inView={inView}>
      <div className="ic-content">
 
        <motion.h3
          className="ic-title"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.52, ease: EASE, delay: 0.14 }}
        >
          20+ Workshops
          <br />
          1,000+ Consultation Hours
          
        </motion.h3>
        <p className="ic-desc">
          Across banking, fintech, startups, and government innovation, help building
          products that move from idea to execution.
        </p>
        <div className="ic-tags">
          <span className="ic-tag">Engineering Leadership</span>
          <span className="ic-tag">Product Builder</span>
          <span className="ic-tag">Innovation Mindset</span>
        </div>
      </div>
      <div className="ic-photo-area">
        <Image
          src="/turki.jpg"
          alt="Turki Almalki"
          fill
          className="ic-photo"
          sizes="(max-width: 680px) 100vw, 25vw"
        />
        <div className="ic-photo-fade" aria-hidden="true" />
      </div>
    </RevealCard>
  );
}

/* ── SkillsCard ──────────────────────────────────── */

function SkillsCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="sk" index={index} inView={inView}>
      <div className="sk-header">
        <span className="clabel">Tech Stack</span>
        <h3 className="sk-title">
          My Skills<br />
         
        </h3>
        <p className="sk-desc">
          Product Innovation, MVP, fintech, and product experiences.
        </p>
      </div>
      <div className="sk-grid">
        {SKILLS.map((skill, i) => (
          <motion.div
            key={skill.name}
            className="sk-tile"
            style={
              {
                "--sk-accent": skill.accent,
                "--sk-bg": skill.bg,
              } as CSSProperties
            }
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.42, ease: EASE, delay: 0.12 + i * 0.06 }}
            title={skill.name}
          >
            <span className="sk-mark">{skill.short}</span>
            <span className="sk-name">{skill.name}</span>
          </motion.div>
        ))}
      </div>
    </RevealCard>
  );
}

/* ── ProjectCard ─────────────────────────────────── */

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
              <span key={tag} className="pc-tag">
                {tag}
              </span>
            ))}
          </div>
          <span className="pc-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
      </div>
    </RevealCard>
  );
}

/* ── TechCard ────────────────────────────────────── */

function TechCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="tc" index={index} inView={inView}>
      <div className="tc-copy">
        <span className="clabel">Technology</span>
        <h3 className="tc-title">A stack built for shipping.</h3>
        <p className="tc-desc">
          Mobile, backend, platforms, data, and product delivery.
        </p>
      </div>
      <div className="tc-marquee">
        <TechRow technologies={TECH_ROW_ONE} direction="fwd" />
        <TechRow technologies={TECH_ROW_TWO} direction="rev" />
      </div>
    </RevealCard>
  );
}

function TechRow({
  technologies,
  direction,
}: {
  technologies: Technology[];
  direction: "fwd" | "rev";
}) {
  return (
    <div className="tc-row">
      <div className={`tc-track tc-track-${direction}`}>
        <TechGroup technologies={technologies} />
        <TechGroup technologies={technologies} hidden />
      </div>
    </div>
  );
}

function TechGroup({
  technologies,
  hidden = false,
}: {
  technologies: Technology[];
  hidden?: boolean;
}) {
  return (
    <div className="tc-group" aria-hidden={hidden ? true : undefined}>
      {technologies.map((tech) => (
        <div
          key={`${tech.name}-${String(hidden)}`}
          className="tc-chip"
          title={tech.name}
          style={
            {
              "--chip-accent": tech.accent,
              "--chip-bg": tech.background,
            } as CSSProperties
          }
        >
          <span className="tc-mark">{tech.shortName}</span>
          <span className="tc-name">{tech.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── AchievementsCard ────────────────────────────── */

function AchievementsCard({
  index,
  inView,
}: {
  index: number;
  inView: boolean;
}) {
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
            transition={{
              duration: 0.44,
              ease: EASE,
              delay: baseDelay + 0.14 + i * 0.07,
            }}
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

/* ── TestimonialCard ─────────────────────────────── */

function TestimonialCard({
  index,
  inView,
}: {
  index: number;
  inView: boolean;
}) {
  const delay = 0.07 + index * 0.07;
  return (
    <RevealCard className="tmc" index={index} inView={inView}>
      <span className="clabel">
        What People Say
        {TESTIMONIAL.isMock && (
          <span className="mock-pill" aria-label="Placeholder testimonial">
            Placeholder
          </span>
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
        <span className="tmc-avatar" aria-hidden="true">
          {TESTIMONIAL.initials}
        </span>
        <div className="tmc-person">
          <strong>{TESTIMONIAL.attribution}</strong>
          <small>{TESTIMONIAL.role}</small>
        </div>
      </div>
    </RevealCard>
  );
}

/* ── CertificatesCard ────────────────────────────── */

function CertificatesCard({
  index,
  inView,
}: {
  index: number;
  inView: boolean;
}) {
  return (
    <RevealCard className="cc" index={index} inView={inView}>
      <span className="clabel">Certificates</span>
      <h3 className="cc-title">Continuous learning.</h3>
      <div className="cc-list">
        {CERTIFICATES.map((cert) => (
          <div key={cert.title} className="cc-item">
            <span className="cc-icon" aria-hidden="true">
              ◇
            </span>
            <div className="cc-text">
              <strong>{cert.title}</strong>
              <small>
                {cert.issuer} · {cert.year}
              </small>
            </div>
            {cert.isMock && (
              <span className="mock-badge" aria-label="Placeholder certificate">
                Mock
              </span>
            )}
          </div>
        ))}
      </div>
    </RevealCard>
  );
}
