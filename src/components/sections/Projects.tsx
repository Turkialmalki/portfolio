"use client";

import {
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  motion,
  useInView,
} from "framer-motion";

type Bezier = [number, number, number, number];

type RevealCardProps = {
  children: ReactNode;
  className: string;
  index: number;
  inView: boolean;
  style?: CSSProperties;
};

type CareerItem = {
  company: string;
  role: string;
  period: string;
  initial: string;
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

const EASE: Bezier = [0.16, 1, 0.3, 1];

const CAREER_ITEMS: CareerItem[] = [
  {
    company: "Monsha'at",
    role: "Software Engineering Leader",
    period: "2024 — Present",
    initial: "M",
  },
  {
    company: "Emkan",
    role: "Software Engineer III · Innovation Lab",
    period: "2022 — 2024",
    initial: "E",
  },
  {
    company: "Al Rajhi Bank",
    role: "Senior Software Engineer",
    period: "2019 — 2022",
    initial: "R",
  },
  {
    company: "Saudi Aramco",
    role: "Engineering Intern",
    period: "2018",
    initial: "A",
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
  { name: "Next.js",          shortName: "NX", accent: "#121212", background: "#EEEEEE" },
  { name: "JavaScript",       shortName: "JS", accent: "#8F7900", background: "#FFF8CB" },
  { name: "Metabase",         shortName: "MB", accent: "#509EE3", background: "#EAF5FE" },
  { name: "NoCoDB",           shortName: "NC", accent: "#7248E8", background: "#F0ECFF" },
  { name: "Product Strategy", shortName: "PS", accent: "#EB5A72", background: "#FFF0F3" },
  { name: "System Design",    shortName: "SD", accent: "#15966A", background: "#E8F8F0" },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    label: "Innovation Center",
    description:
      "Led the digital revamp of Monsha'at's Innovation Center website and experience.",
  },
  {
    label: "Internal platforms",
    description:
      "Architected scalable NoCoDB data platform and Metabase dashboards for real-time KPI visibility.",
  },
  {
    label: "Startup enablement",
    description:
      "Mentored startup teams and accelerated multiple MVP deliveries through the innovation lab.",
  },
];

// Replace with verified certificates when available
const CERTIFICATES: Certificate[] = [
  { title: "Digital Product Leadership",    issuer: "Sample Academy",   year: "2025", isMock: true },
  { title: "Cloud Architecture Foundations", issuer: "Sample Institute", year: "2024", isMock: true },
  { title: "Innovation Management",          issuer: "Sample Program",   year: "2023", isMock: true },
];

const FEATURED_PROJECT: ProjectData = {
  title: "Monsha'at Innovation Center",
  description:
    "Led the digital revamp of the Innovation Center and built scalable internal systems, dashboards, and data platforms supporting startups and innovation programs.",
  tags: ["Government Innovation", "Engineering Leadership", "Digital Transformation"],
  image: "/monshaat.jpg",
  imageAlt: "Monsha'at Innovation Center – digital platform and internal systems",
};

// Replace with a verified colleague or client quote
const TESTIMONIAL: TestimonialData = {
  quote:
    "Turki brings structure to complex technical challenges and helps teams move from ideas to confident delivery.",
  attribution: "Sample testimonial",
  role: "Replace with a verified colleague or client quote",
  initials: "ST",
  isMock: true,
};

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  const inView = useInView(sectionRef, {
    once: true,
    margin: "-80px",
  });

  return (
    <section id="projects" ref={sectionRef} className="value-section">
      <div className="value-container">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
          className="value-pill"
        >
          Value
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE, delay: 0.04 }}
          className="value-heading"
        >
          Why Work With Me?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="value-subheading"
        >
          Engineering leadership, product thinking, and innovation grounded in real delivery.
        </motion.p>

        <div className="value-bento">
          <ExperienceCard   index={0} inView={inView} />
          <TechnologyCard   index={1} inView={inView} />
          <AchievementsCard index={2} inView={inView} />
          <CertificatesCard index={3} inView={inView} />
          <ProjectCard      index={4} inView={inView} />
          <TestimonialCard  index={5} inView={inView} />
        </div>

      </div>

      <style>{`

        /* ── Layout ───────────────────────────────── */

        .value-section {
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          padding:
            clamp(82px, 9vw, 124px)
            clamp(18px, 3vw, 32px)
            clamp(110px, 11vw, 145px);
          color: var(--text-primary, #0b0b0d);
          background: var(--bg-primary, #ffffff);
          transition: color 350ms ease, background-color 350ms ease;
        }

        .value-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          text-align: center;
        }

        /* ── Header ───────────────────────────────── */

        .value-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 37px;
          padding: 7px 18px;
          margin-bottom: 24px;
          border-radius: 999px;
          color: var(--text-secondary, #666666);
          background: var(--bg-pill, #f0f0f0);
          font-size: 15px;
          font-weight: 500;
          line-height: 1;
          transition: color 350ms ease, background-color 350ms ease;
        }

        .value-heading {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          color: var(--text-primary, #09090b);
          font-size: clamp(44px, 5vw, 70px);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.057em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        .value-subheading {
          width: 100%;
          max-width: 670px;
          margin: 20px auto clamp(52px, 6vw, 72px);
          color: var(--text-secondary, #666666);
          font-size: clamp(19px, 1.8vw, 26px);
          font-weight: 580;
          line-height: 1.24;
          letter-spacing: -0.026em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        /* ── Bento grid ───────────────────────────── */

        .value-bento {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-auto-rows: 174px;
          gap: 16px;
          width: 100%;
        }

        /* ── Base card ────────────────────────────── */

        .bento-card {
          position: relative;
          min-width: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          padding: 22px;
          text-align: left;
          color: var(--text-primary, #0b0b0d);
          background: var(--bg-card, #f3f3f3);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.055));
          border-radius: 26px;
          transition:
            color 350ms ease,
            border-color 350ms ease,
            background-color 350ms ease,
            box-shadow 300ms ease;
        }

        .bento-card:hover {
          box-shadow: var(--shadow-soft, 0 18px 42px rgba(0, 0, 0, 0.075));
        }

        /* ── Grid placements ──────────────────────── */

        .experience-card {
          grid-column: span 5;
          grid-row: span 2;
          display: flex;
          flex-direction: column;
          padding: 26px;
          color: #ffffff;
          background: linear-gradient(145deg, #111827 0%, #17233d 55%, #143c49 100%);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .technology-card {
          grid-column: span 7;
          grid-row: span 1;
          display: grid;
          grid-template-columns: minmax(185px, 0.75fr) minmax(0, 1.25fr);
          align-items: center;
          gap: 20px;
          padding: 20px 0 20px 22px;
        }

        .achievements-card {
          grid-column: span 4;
          grid-row: span 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .certificates-card {
          grid-column: span 3;
          grid-row: span 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
          background: var(--bg-elevated, #ffffff);
        }

        .project-card {
          grid-column: span 7;
          grid-row: span 2;
          padding: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-card, #f3f3f3);
        }

        .testimonial-card {
          grid-column: span 5;
          grid-row: span 2;
          display: flex;
          flex-direction: column;
          background: var(--bg-elevated, #ffffff);
          padding: 28px;
        }

        /* ── Shared text ──────────────────────────── */

        .card-label {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 27px;
          padding: 5px 10px;
          border-radius: 999px;
          color: var(--text-secondary, #666666);
          background: var(--bg-pill, #e9e9e9);
          font-size: 10px;
          font-weight: 650;
          line-height: 1;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          transition: color 350ms ease, background-color 350ms ease;
        }

        .card-title {
          margin: 0;
          color: var(--text-primary, #0b0b0d);
          font-size: clamp(23px, 2vw, 31px);
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.05em;
          text-wrap: balance;
          transition: color 350ms ease;
        }

        .card-description {
          margin: 0;
          color: var(--text-secondary, #666666);
          font-size: 13px;
          line-height: 1.45;
          letter-spacing: -0.015em;
          transition: color 350ms ease;
        }

        /* ── Experience card ──────────────────────── */

        .experience-glow {
          position: absolute;
          width: 260px;
          height: 260px;
          right: -110px;
          top: -130px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 194, 197, 0.32), transparent 68%);
          pointer-events: none;
        }

        .experience-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .experience-card .card-label {
          color: rgba(255, 255, 255, 0.68);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .experience-number {
          margin-top: 22px;
          color: #ffffff;
          font-size: clamp(64px, 6vw, 92px);
          font-weight: 820;
          line-height: 0.82;
          letter-spacing: -0.09em;
        }

        .experience-number span {
          color: #43ded1;
        }

        .experience-heading {
          max-width: 340px;
          margin: 18px 0 8px;
          color: #ffffff;
          font-size: clamp(22px, 2vw, 30px);
          font-weight: 780;
          line-height: 1.02;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .experience-description {
          max-width: 360px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
          line-height: 1.45;
        }

        .career-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: auto;
          padding-top: 18px;
        }

        .career-item {
          position: relative;
          display: grid;
          grid-template-columns: 11px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          min-height: 42px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .career-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.32);
        }

        .career-item:first-child .career-dot {
          background: #43ded1;
          box-shadow: 0 0 0 5px rgba(67, 222, 209, 0.11);
        }

        .career-company {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.9);
          font-size: 11px;
          font-weight: 680;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .career-role {
          display: block;
          overflow: hidden;
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 10px;
          font-weight: 440;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .career-period {
          color: rgba(255, 255, 255, 0.44);
          font-size: 10px;
          white-space: nowrap;
        }

        /* ── Technology card ──────────────────────── */

        .technology-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .technology-copy .card-title {
          max-width: 240px;
        }

        .technology-marquee-wrapper {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        .technology-row {
          width: 100%;
          overflow: hidden;
        }

        .technology-track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation-duration: 26s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .technology-track-forward {
          animation-name: technology-scroll-forward;
        }

        .technology-track-reverse {
          animation-name: technology-scroll-reverse;
          animation-duration: 30s;
        }

        .technology-card:hover .technology-track {
          animation-play-state: paused;
        }

        .technology-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-right: 8px;
        }

        .technology-item {
          --tech-accent: #222222;
          --tech-background: #eeeeee;

          flex: 0 0 auto;
          min-width: 128px;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-sizing: border-box;
          padding: 6px 12px 6px 6px;
          border-radius: 15px;
          background: var(--tech-background);
          border: 1px solid color-mix(in srgb, var(--tech-accent) 14%, transparent);
          transition: transform 250ms ease, box-shadow 250ms ease;
        }

        .technology-item:hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
        }

        .technology-mark {
          flex: 0 0 auto;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          color: #ffffff;
          background: var(--tech-accent);
          font-size: 9px;
          font-weight: 800;
        }

        .technology-name {
          max-width: 72px;
          overflow: hidden;
          color: #171719;
          font-size: 10px;
          font-weight: 680;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        /* ── Achievements card ────────────────────── */

        .achievement-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }

        .achievement-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: auto;
        }

        .achievement-item {
          display: grid;
          grid-template-columns: 7px minmax(0, 1fr);
          gap: 9px;
          padding: 9px 0;
          border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .achievement-dot {
          width: 6px;
          height: 6px;
          margin-top: 4px;
          border-radius: 50%;
          background: var(--accent, #1495ff);
          flex: 0 0 auto;
        }

        .achievement-item strong {
          display: block;
          margin-bottom: 2px;
          color: var(--text-primary, #0b0b0d);
          font-size: 11px;
          font-weight: 700;
          transition: color 350ms ease;
        }

        .achievement-item p {
          margin: 0;
          color: var(--text-secondary, #666666);
          font-size: 10px;
          line-height: 1.35;
          transition: color 350ms ease;
        }

        /* ── Certificates card ────────────────────── */

        .certificate-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: auto;
          padding-top: 12px;
        }

        .certificate-item {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 6px 8px;
          border-radius: 13px;
          background: var(--bg-card, #f3f3f3);
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.045));
          transition:
            background-color 350ms ease,
            border-color 350ms ease,
            transform 220ms ease;
        }

        .certificate-item:hover {
          transform: translateX(3px);
        }

        .certificate-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #7658e7;
          background: #efebff;
          font-size: 14px;
          flex: 0 0 auto;
        }

        .certificate-content {
          min-width: 0;
        }

        .certificate-content strong {
          display: block;
          overflow: hidden;
          color: var(--text-primary, #0b0b0d);
          font-size: 10px;
          font-weight: 680;
          line-height: 1.15;
          white-space: nowrap;
          text-overflow: ellipsis;
          transition: color 350ms ease;
        }

        .certificate-content small {
          display: block;
          overflow: hidden;
          margin-top: 2px;
          color: var(--text-secondary, #777777);
          font-size: 10px;
          white-space: nowrap;
          text-overflow: ellipsis;
          transition: color 350ms ease;
        }

        .mock-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          padding: 3px 7px;
          border-radius: 999px;
          color: #876a24;
          background: #fff5d6;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex: 0 0 auto;
        }

        /* ── Project card ─────────────────────────── */

        .project-card {
          cursor: default;
        }

        .project-image-wrapper {
          position: relative;
          width: 100%;
          height: 56%;
          overflow: hidden;
          flex: 0 0 56%;
          border-radius: 26px 26px 0 0;
        }

        .project-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          transition: transform 600ms ease;
        }

        .project-card:hover .project-image {
          transform: scale(1.04);
        }

        .project-content {
          flex: 1;
          padding: 16px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
        }

        .project-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .project-title {
          margin: 0;
          color: var(--text-primary, #0b0b0d);
          font-size: clamp(16px, 1.5vw, 20px);
          font-weight: 760;
          line-height: 1.05;
          letter-spacing: -0.04em;
          transition: color 350ms ease;
        }

        .project-description {
          margin: 0;
          color: var(--text-secondary, #666666);
          font-size: 12px;
          line-height: 1.48;
          flex: 1;
          transition: color 350ms ease;
        }

        .project-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
        }

        .project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }

        .project-tag {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 4px 9px;
          border-radius: 999px;
          color: var(--text-secondary, #666);
          background: var(--bg-pill, #f1f1f1);
          border: 1px solid var(--border-subtle, rgba(0,0,0,0.07));
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          transition: color 350ms ease, background-color 350ms ease, border-color 350ms ease;
        }

        .project-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent, #1495ff);
          color: #ffffff;
          font-size: 15px;
          flex: 0 0 auto;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 280ms ease, transform 280ms ease;
          line-height: 1;
        }

        .project-card:hover .project-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Testimonial card ─────────────────────── */

        .testimonial-mark {
          display: block;
          color: var(--accent, #1495ff);
          font-size: 52px;
          line-height: 0.7;
          font-weight: 900;
          margin-bottom: 18px;
          opacity: 0.55;
          letter-spacing: -0.04em;
          font-family: Georgia, serif;
        }

        .testimonial-quote {
          margin: 0;
          color: var(--text-primary, #0b0b0d);
          font-size: clamp(16px, 1.4vw, 20px);
          font-weight: 650;
          line-height: 1.2;
          letter-spacing: -0.035em;
          text-wrap: balance;
          flex: 1;
          transition: color 350ms ease;
        }

        .testimonial-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
          padding-top: 20px;
        }

        .testimonial-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 50%;
          color: #ffffff;
          background: linear-gradient(145deg, #25262c, #646773);
          font-size: 10px;
          font-weight: 750;
        }

        .testimonial-person strong {
          display: block;
          color: var(--text-primary, #0b0b0d);
          font-size: 11px;
          font-weight: 680;
          transition: color 350ms ease;
        }

        .testimonial-person small {
          display: block;
          margin-top: 3px;
          color: var(--text-secondary, #777777);
          font-size: 10px;
          line-height: 1.3;
          transition: color 350ms ease;
        }

        .testimonial-placeholder-note {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 3px 8px;
          border-radius: 999px;
          color: #876a24;
          background: #fff5d6;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-left: 6px;
        }

        /* ── Keyframes ────────────────────────────── */

        @keyframes technology-scroll-forward {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes technology-scroll-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }

        /* ── Dark mode ────────────────────────────── */

        .dark .bento-card,
        [data-theme="dark"] .bento-card {
          border-color: rgba(255, 255, 255, 0.075);
        }

        .dark .technology-name,
        [data-theme="dark"] .technology-name {
          color: #171719;
        }

        .dark .certificate-item,
        [data-theme="dark"] .certificate-item {
          border-color: rgba(255, 255, 255, 0.07);
        }

        /* ── Tablet ───────────────────────────────── */

        @media (max-width: 980px) {
          .value-bento {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: auto;
          }

          .experience-card,
          .technology-card,
          .project-card {
            grid-column: 1 / -1;
            grid-row: auto;
          }

          .experience-card {
            min-height: 440px;
          }

          .technology-card {
            min-height: 220px;
          }

          .project-card {
            min-height: 380px;
          }

          .project-image-wrapper {
            height: 52%;
            flex: 0 0 52%;
          }

          .achievements-card,
          .certificates-card,
          .testimonial-card {
            grid-column: span 1;
            min-height: 245px;
            grid-row: auto;
          }

          .testimonial-card {
            min-height: 265px;
          }
        }

        /* ── Mobile ───────────────────────────────── */

        @media (max-width: 680px) {
          .value-section {
            padding: 80px 15px 125px;
          }

          .value-heading {
            max-width: 390px;
            font-size: clamp(42px, 11.5vw, 55px);
          }

          .value-subheading {
            max-width: 390px;
            margin: 19px auto 48px;
            font-size: clamp(18px, 5.4vw, 23px);
          }

          .value-bento {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .experience-card,
          .technology-card,
          .achievements-card,
          .certificates-card,
          .project-card,
          .testimonial-card {
            grid-column: auto;
            grid-row: auto;
            width: 100%;
          }

          .bento-card {
            border-radius: 24px;
          }

          .experience-card {
            min-height: 505px;
            padding: 22px;
          }

          .experience-number {
            font-size: clamp(74px, 23vw, 95px);
          }

          .experience-heading {
            max-width: 320px;
          }

          .career-item {
            min-height: 48px;
            grid-template-columns: 11px minmax(0, 1fr);
          }

          .career-period {
            grid-column: 2;
            margin-top: -4px;
            font-size: 10px;
          }

          .technology-card {
            min-height: 300px;
            grid-template-columns: 1fr;
            align-items: stretch;
            gap: 20px;
            padding: 21px 0 21px 21px;
          }

          .technology-copy {
            padding-right: 21px;
          }

          .technology-copy .card-title {
            max-width: 330px;
          }

          .achievements-card {
            min-height: 255px;
            padding: 20px;
          }

          .certificates-card {
            min-height: 255px;
            padding: 20px;
          }

          .project-card {
            min-height: 380px;
          }

          .project-image-wrapper {
            height: 48%;
            flex: 0 0 48%;
            border-radius: 24px 24px 0 0;
          }

          .testimonial-card {
            min-height: 280px;
            padding: 22px;
          }

          .testimonial-mark {
            font-size: 44px;
            margin-bottom: 14px;
          }

          .testimonial-quote {
            font-size: 17px;
          }

          .testimonial-placeholder-note {
            display: none;
          }
        }

        /* ── Small mobile ─────────────────────────── */

        @media (max-width: 390px) {
          .value-section {
            padding-inline: 13px;
          }

          .value-heading {
            font-size: 40px;
          }

          .value-subheading {
            font-size: 18px;
          }

          .experience-card {
            min-height: 525px;
            padding: 20px;
          }

          .technology-card {
            padding-left: 19px;
          }

          .technology-copy {
            padding-right: 19px;
          }

          .project-card {
            min-height: 360px;
          }

          .project-image-wrapper {
            height: 45%;
            flex: 0 0 45%;
          }
        }

        /* ── Reduced motion ───────────────────────── */

        @media (prefers-reduced-motion: reduce) {
          .bento-card,
          .technology-item,
          .certificate-item,
          .project-image,
          .project-arrow {
            transition: none !important;
          }

          .technology-track {
            animation-play-state: paused !important;
          }
        }

      `}</style>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────── */

function ExperienceCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="bento-card experience-card" index={index} inView={inView}>
      <div className="experience-glow" />

      <div className="experience-header">
        <span className="card-label">Work experience</span>
        <span className="card-label">Since 2017</span>
      </div>

      <div className="experience-number">
        9<span>+</span>
      </div>

      <h3 className="experience-heading">
        Building and leading digital products across complex industries.
      </h3>

      <p className="experience-description">
        Government innovation, banking, fintech, startups, SaaS, and enterprise engineering.
      </p>

      <div className="career-timeline">
        {CAREER_ITEMS.map((item) => (
          <div key={`${item.company}-${item.period}`} className="career-item">
            <span className="career-dot" />
            <div>
              <strong className="career-company">{item.company}</strong>
              <span className="career-role">{item.role}</span>
            </div>
            <span className="career-period">{item.period}</span>
          </div>
        ))}
      </div>
    </RevealCard>
  );
}

function TechnologyCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="bento-card technology-card" index={index} inView={inView}>
      <div className="technology-copy">
        <span className="card-label">Technology</span>
        <h3 className="card-title">A stack built for shipping.</h3>
        <p className="card-description">
          Tools I use across mobile, backend, platforms, data, and product delivery.
        </p>
      </div>

      <div className="technology-marquee-wrapper">
        <TechnologyRow technologies={TECH_ROW_ONE} direction="forward" />
        <TechnologyRow technologies={TECH_ROW_TWO} direction="reverse" />
      </div>
    </RevealCard>
  );
}

function TechnologyRow({
  technologies,
  direction,
}: {
  technologies: Technology[];
  direction: "forward" | "reverse";
}) {
  return (
    <div className="technology-row">
      <div
        className={[
          "technology-track",
          direction === "forward"
            ? "technology-track-forward"
            : "technology-track-reverse",
        ].join(" ")}
      >
        <TechnologyGroup technologies={technologies} />
        <TechnologyGroup technologies={technologies} hidden />
      </div>
    </div>
  );
}

function TechnologyGroup({
  technologies,
  hidden = false,
}: {
  technologies: Technology[];
  hidden?: boolean;
}) {
  return (
    <div
      className="technology-group"
      aria-hidden={hidden ? true : undefined}
    >
      {technologies.map((technology) => (
        <div
          key={`${technology.name}-${String(hidden)}`}
          className="technology-item"
          title={technology.name}
          style={
            {
              "--tech-accent":      technology.accent,
              "--tech-background":  technology.background,
            } as CSSProperties
          }
        >
          <span className="technology-mark">{technology.shortName}</span>
          <span className="technology-name">{technology.name}</span>
        </div>
      ))}
    </div>
  );
}

function AchievementsCard({ index, inView }: { index: number; inView: boolean }) {
  const cardDelay = 0.1 + index * 0.065;

  return (
    <RevealCard className="bento-card achievements-card" index={index} inView={inView}>
      <div className="achievement-header">
        <span className="card-label">Selected outcomes</span>
        <h3 className="card-title" style={{ marginTop: 8 }}>
          Work with visible impact.
        </h3>
      </div>

      <div className="achievement-list">
        {ACHIEVEMENTS.map((achievement, i) => (
          <motion.div
            key={achievement.label}
            className="achievement-item"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.5,
              ease: EASE,
              delay: cardDelay + 0.12 + i * 0.08,
            }}
          >
            <span className="achievement-dot" />
            <div>
              <strong>{achievement.label}</strong>
              <p>{achievement.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </RevealCard>
  );
}

function CertificatesCard({ index, inView }: { index: number; inView: boolean }) {
  return (
    <RevealCard className="bento-card certificates-card" index={index} inView={inView}>
      <span className="card-label">Certificates</span>
      <h3 className="card-title" style={{ marginTop: 10 }}>
        Continuous learning.
      </h3>

      <div className="certificate-list">
        {CERTIFICATES.map((certificate) => (
          <div key={certificate.title} className="certificate-item">
            <span className="certificate-icon" aria-hidden="true">◇</span>
            <div className="certificate-content">
              <strong>{certificate.title}</strong>
              <small>{certificate.issuer} · {certificate.year}</small>
            </div>
            {certificate.isMock && (
              <span className="mock-badge" aria-label="Placeholder certificate">Mock</span>
            )}
          </div>
        ))}
      </div>
    </RevealCard>
  );
}

function ProjectCard({ index, inView }: { index: number; inView: boolean }) {
  const cardDelay = 0.1 + index * 0.065;

  return (
    <RevealCard className="bento-card project-card" index={index} inView={inView}>
      <div className="project-image-wrapper">
        <Image
          src={FEATURED_PROJECT.image}
          alt={FEATURED_PROJECT.imageAlt}
          className="project-image"
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 100vw, 58vw"
        />
      </div>

      <div className="project-content">
        <div className="project-label-row">
          <span className="card-label">Featured project</span>
        </div>

        <motion.h3
          className="project-title"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE, delay: cardDelay + 0.1 }}
        >
          {FEATURED_PROJECT.title}
        </motion.h3>

        <p className="project-description">{FEATURED_PROJECT.description}</p>

        <div className="project-footer">
          <div className="project-tags">
            {FEATURED_PROJECT.tags.map((tag) => (
              <span key={tag} className="project-tag">{tag}</span>
            ))}
          </div>
          <span className="project-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </RevealCard>
  );
}

function TestimonialCard({ index, inView }: { index: number; inView: boolean }) {
  const cardDelay = 0.1 + index * 0.065;

  return (
    <RevealCard className="bento-card testimonial-card" index={index} inView={inView}>
      <span className="card-label">
        What people say
        {TESTIMONIAL.isMock && (
          <span className="testimonial-placeholder-note">Placeholder</span>
        )}
      </span>

      <motion.span
        className="testimonial-mark"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.55 } : {}}
        transition={{ duration: 0.6, ease: EASE, delay: cardDelay + 0.08 }}
      >
        &ldquo;
      </motion.span>

      <motion.blockquote
        className="testimonial-quote"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: EASE, delay: cardDelay + 0.16 }}
      >
        {TESTIMONIAL.quote}
      </motion.blockquote>

      <div className="testimonial-footer">
        <span className="testimonial-avatar" aria-hidden="true">
          {TESTIMONIAL.initials}
        </span>
        <div className="testimonial-person">
          <strong>{TESTIMONIAL.attribution}</strong>
          <small>{TESTIMONIAL.role}</small>
        </div>
      </div>
    </RevealCard>
  );
}

function RevealCard({ children, className, index, inView, style }: RevealCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26, scale: 0.987 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        ease: EASE,
        delay: 0.1 + index * 0.065,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.28, ease: EASE },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.article>
  );
}
