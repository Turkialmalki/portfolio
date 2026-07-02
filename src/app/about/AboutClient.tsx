"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiRedux,
  SiFigma,
  SiNodedotjs,
  SiDynatrace,
} from "react-icons/si";
import { LuTrophy, LuWorkflow, LuChartBar, LuSparkles, LuSmartphone } from "react-icons/lu";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/* ── Experience data ─────────────────────────────── */

type Job = {
  company: string;
  role: string;
  date: string;
  logo?: string;
  logoBg?: string;
  tile?: "M" | "trophy";
  bullets: string[];
};

const JOBS: Job[] = [
  {
    company: "Monshaat",
    role: "Engineering Leader | Innovation Center",
    date: "Oct 2024 – Present",
    tile: "M",
    bullets: [
      "Lead digital initiatives inside the Innovation Center, translating business needs into prioritized roadmaps for web and mobile products.",
      "Evaluate modern frameworks and AI-enabled tools to improve productivity, feasibility, and engineering impact.",
      "Partner with Product, Design, Backend, and business teams to deliver products from concept to launch.",
    ],
  },
  {
    company: "Emkan",
    role: "Lead Software Engineer",
    date: "Jul 2022 – Oct 2024",
    logo: "/emkanlogo.png",
    logoBg: "#ffffff",
    bullets: [
      "Led modernization of core digital merchant platforms across web and mobile.",
      "Implemented UI/UX improvements and AI-driven integrations that improved customer satisfaction by 150%.",
      "Used Dynatrace and Countly insights to improve performance, accessibility, adoption, and usability.",
    ],
  },
  {
    company: "Alrajhi Bank",
    role: "Senior Software Engineer",
    date: "Aug 2019 – Jul 2022",
    logo: "/alrajhilogo.png",
    logoBg: "#ffffff",
    bullets: [
      "Led development and enhancement of a customer-facing mobile experience using React Native, JavaScript, and Redux.",
      "Helped achieve 95% positive user feedback and a 90% increase in app downloads.",
      "Worked with Design teams using Figma to convert complex banking requirements into clean mobile journeys.",
    ],
  },
  {
    company: "Awards & Innovation",
    role: "Programming Competitions & Certifications",
    date: "Continuous Growth",
    tile: "trophy",
    bullets: [
      "1st Place: Aramco Wa’ed Programming Competition.",
      "2nd Place: KAUST Programming Competition.",
      "Bachelor of Computer Science from King Faisal University, recognized by the College Dean.",
    ],
  },
];

/* ── Stack data ──────────────────────────────────── */

type Tool = { name: string; icon: IconType; color: string };

const TOOLS: Tool[] = [
  { name: "React", icon: SiReact, color: "#61DAFB" },
  { name: "Next.js", icon: SiNextdotjs, color: "var(--text-primary)" },
  { name: "React Native", icon: LuSmartphone, color: "#61DAFB" },
  { name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
  { name: "JavaScript", icon: SiJavascript, color: "#E8C51A" },
  { name: "Redux", icon: SiRedux, color: "#764ABC" },
  { name: "Figma", icon: SiFigma, color: "#F24E1E" },
  { name: "Node.js", icon: SiNodedotjs, color: "#5FA04E" },
  { name: "CI/CD", icon: LuWorkflow, color: "#1495FF" },
  { name: "Dynatrace", icon: SiDynatrace, color: "#1496FF" },
  { name: "Countly", icon: LuChartBar, color: "#017AFF" },
  { name: "AI Tools", icon: LuSparkles, color: "#D97757" },
];

/* ── Skills data ─────────────────────────────────── */

const TECHNICAL_SKILLS = [
  ["🏗️", "Frontend Architecture"],
  ["📱", "Mobile App Development"],
  ["⚛️", "React / Next.js / React Native"],
  ["🧹", "Clean Architecture"],
  ["🧩", "System Architecture"],
  ["💡", "Product & Service Innovation"],
  ["🤖", "AI Assessment"],
  ["📊", "Data Analysis & Performance Measurement"],
] as const;

const LEADERSHIP_SKILLS = [
  ["🧭", "Technical Leadership"],
  ["🌱", "Team Mentorship"],
  ["🤝", "Stakeholder Management"],
  ["🚀", "Cross-functional Delivery"],
  ["💬", "Communication"],
  ["🎤", "Presentation"],
  ["🏃", "Agile Execution"],
  ["🧠", "Problem Solving"],
] as const;

/* ── Gallery data ────────────────────────────────── */

const GALLERY = {
  large: { src: "/1.jpg", alt: "Turki Almalki on stage at an innovation event", position: "center 20%" },
  wide: { src: "/turki.jpg", alt: "Turki Almalki leading an MVP workshop", position: "center 30%" },
  small: [
    { src: "/IMG-20181201-WA0054.jpg", alt: "Winning team at the Wa'ed Hackathon", position: "center center" },
    { src: "/screenshot.jpg", alt: "Turki Almalki presenting a product session", position: "center 30%" },
  ],
} as const;

export default function AboutClient() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />

      <main className="ab-page">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="ab-hero">
          <motion.div
            className="ab-hero-avatar"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: EASE }}
          >
            <Image
              src="/avatar.jpg"
              alt="Turki Almalki"
              fill
              sizes="(max-width: 640px) 200px, 300px"
              preload
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </motion.div>

          <motion.span
            className="ab-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          >
            About Me
          </motion.span>

          <motion.h1
            className="ab-hero-heading"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
          >
            Turki Almalki
          </motion.h1>

          <motion.p
            className="ab-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.26 }}
          >
            Engineering Manager | Digital Innovation &amp; Product Innovation
          </motion.p>

          <motion.p
            className="ab-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
          >
            Engineering and digital innovation leader with 9+ years of experience
            building high-performance web and mobile products across government,
            fintech, banking, and innovation ecosystems. I combine React, Next.js,
            React Native, AI innovation, CX, and product execution to turn ideas
            into scalable digital experiences.
          </motion.p>

          <motion.div
            className="ab-hero-ctas"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
          >
            <Link href="/projects" className="ab-btn-primary">
              View My Portfolio
            </Link>
            <a href="mailto:turkialmalki202200@gmail.com" className="ab-btn-secondary">
              Let&apos;s Connect
            </a>
          </motion.div>
        </section>

        {/* ── Experience ───────────────────────────── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <motion.span className="ab-pill" {...fadeUp} transition={{ duration: 0.6, ease: EASE }}>
              Experience
            </motion.span>
            <motion.h2
              className="ab-h2"
              {...fadeUp}
              transition={{ duration: 0.75, ease: EASE, delay: 0.06 }}
            >
              My Engineering Journey
            </motion.h2>
            <motion.p
              className="ab-section-sub"
              {...fadeUp}
              transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            >
              A look into the teams, products, and work that shaped my path.
            </motion.p>
          </div>

          <motion.h3 className="ab-h3" {...fadeUp} transition={{ duration: 0.7, ease: EASE }}>
            Work History
          </motion.h3>

          <div className="ab-jobs-grid">
            {JOBS.map((job, i) => (
              <motion.article
                key={job.company}
                className="ab-card ab-job-card"
                {...fadeUp}
                transition={{ duration: 0.7, ease: EASE, delay: (i % 2) * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <div className="ab-job-head">
                  {job.logo ? (
                    <span className="ab-job-logo" style={{ background: job.logoBg }}>
                      <Image src={job.logo} alt={`${job.company} logo`} width={44} height={44} style={{ objectFit: "contain" }} />
                    </span>
                  ) : job.tile === "trophy" ? (
                    <span className="ab-job-logo ab-job-logo-tile ab-job-logo-trophy">
                      <LuTrophy size={30} />
                    </span>
                  ) : (
                    <span className="ab-job-logo ab-job-logo-tile">{job.tile}</span>
                  )}
                  <div>
                    <h4 className="ab-job-company">{job.company}</h4>
                    <p className="ab-job-role">{job.role}</p>
                    <p className="ab-job-date">{job.date}</p>
                  </div>
                </div>
                <ul className="ab-job-bullets">
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Stack ────────────────────────────────── */}
        <section className="ab-section">
          <motion.h2
            className="ab-h2 ab-h2-center"
            {...fadeUp}
            transition={{ duration: 0.75, ease: EASE }}
          >
            Stack
          </motion.h2>

          <div className="ab-stack-grid">
            {TOOLS.map(({ name, icon: Icon, color }, i) => (
              <motion.div
                key={name}
                className="ab-card ab-stack-card"
                {...fadeUp}
                transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.07 }}
                whileHover={{ y: -5 }}
              >
                <span className="ab-stack-icon">
                  <Icon size={26} style={{ color }} />
                </span>
                <span className="ab-stack-name">{name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Skills ───────────────────────────────── */}
        <section className="ab-section">
          <motion.h2
            className="ab-h2 ab-h2-center"
            {...fadeUp}
            transition={{ duration: 0.75, ease: EASE }}
          >
            Engineering &amp; Innovation Skills
          </motion.h2>

          <div className="ab-skills-grid">
            {(
              [
                ["Technical Skills", TECHNICAL_SKILLS],
                ["Leadership Skills", LEADERSHIP_SKILLS],
              ] as const
            ).map(([title, items], i) => (
              <motion.div
                key={title}
                className="ab-card ab-skills-card"
                {...fadeUp}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
              >
                <p className="ab-skills-title">{title}</p>
                <ul className="ab-skills-list">
                  {items.map(([emoji, label]) => (
                    <li key={label}>
                      <span className="ab-skills-emoji" aria-hidden>
                        {emoji}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="ab-skills-cta"
            {...fadeUp}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          >
            <a href="mailto:turkialmalki202200@gmail.com" className="ab-btn-primary">
              Contact Me
            </a>
          </motion.div>
        </section>

        {/* ── Beyond the Screen ────────────────────── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <motion.span className="ab-pill" {...fadeUp} transition={{ duration: 0.6, ease: EASE }}>
              Lifestyle
            </motion.span>
            <motion.h2
              className="ab-h2"
              {...fadeUp}
              transition={{ duration: 0.75, ease: EASE, delay: 0.06 }}
            >
              Beyond the Screen
            </motion.h2>
            <motion.p
              className="ab-section-sub"
              {...fadeUp}
              transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            >
              A glimpse into the ideas, moments, and experiences that drive my creativity.
            </motion.p>
          </div>

          <div className="ab-gallery">
            <motion.div
              className="ab-gallery-large"
              {...fadeUp}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <Image
                src={GALLERY.large.src}
                alt={GALLERY.large.alt}
                fill
                sizes="(max-width: 900px) 100vw, 46vw"
                style={{ objectFit: "cover", objectPosition: GALLERY.large.position }}
              />
            </motion.div>

            <div className="ab-gallery-right">
              <motion.div
                className="ab-gallery-wide"
                {...fadeUp}
                transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
              >
                <Image
                  src={GALLERY.wide.src}
                  alt={GALLERY.wide.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 54vw"
                  style={{ objectFit: "cover", objectPosition: GALLERY.wide.position }}
                />
              </motion.div>

              <div className="ab-gallery-pair">
                {GALLERY.small.map((img, i) => (
                  <motion.div
                    key={img.src}
                    className="ab-gallery-small"
                    {...fadeUp}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.14 + i * 0.06 }}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 27vw"
                      style={{ objectFit: "cover", objectPosition: img.position }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        /* ── Page shell ─────────────────────────────── */

        .ab-page {
          background: var(--bg-primary);
          transition: background-color 0.45s ease;
          padding-bottom: clamp(100px, 12vw, 160px);
          overflow-x: clip;
        }

        .ab-pill {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 15px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: background-color 0.45s ease, color 0.45s ease;
        }

        /* ── Hero ───────────────────────────────────── */

        .ab-hero {
          padding:
            clamp(110px, 13vw, 168px)
            clamp(20px, 5vw, 40px)
            clamp(70px, 8vw, 120px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ab-hero-avatar {
          position: relative;
          width: clamp(190px, 26vw, 300px);
          height: clamp(190px, 26vw, 300px);
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 34px;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.12);
        }

        .ab-hero-heading {
          margin: 22px 0 20px;
          font-size: clamp(52px, 8.5vw, 104px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.05em;
          line-height: 0.98;
          transition: color 0.45s ease;
        }

        .ab-hero-title {
          margin: 0 0 16px;
          font-size: clamp(15px, 1.6vw, 19px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          max-width: 720px;
          transition: color 0.45s ease;
        }

        .ab-hero-sub {
          margin: 0 0 38px;
          max-width: 720px;
          font-size: clamp(15px, 1.4vw, 17.5px);
          color: var(--text-secondary);
          line-height: 1.7;
          transition: color 0.45s ease;
        }

        .ab-hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ab-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 30px;
          border-radius: 999px;
          background: #0091ff;
          color: #ffffff;
          font-size: 15.5px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 26px rgba(0, 145, 255, 0.34);
          transition: box-shadow 240ms ease, transform 240ms ease;
        }

        .ab-btn-primary:hover {
          box-shadow: 0 12px 34px rgba(0, 145, 255, 0.46);
          transform: translateY(-2px);
        }

        .ab-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 30px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-primary);
          font-size: 15.5px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: background-color 240ms ease, transform 240ms ease;
        }

        .ab-btn-secondary:hover {
          background: var(--bg-card-muted);
          transform: translateY(-2px);
        }

        /* ── Sections ───────────────────────────────── */

        .ab-section {
          max-width: 1240px;
          margin: 0 auto;
          padding:
            clamp(48px, 6vw, 90px)
            clamp(20px, 5vw, 40px)
            0;
        }

        .ab-section-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: clamp(40px, 5vw, 64px);
        }

        .ab-h2 {
          margin: 20px 0 18px;
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.045em;
          line-height: 1.02;
          transition: color 0.45s ease;
        }

        .ab-h2-center {
          display: block;
          text-align: center;
          margin: 0 0 clamp(36px, 4.5vw, 56px);
        }

        .ab-section-sub {
          margin: 0;
          max-width: 480px;
          font-size: clamp(16px, 1.7vw, 21px);
          color: var(--text-secondary);
          line-height: 1.5;
          transition: color 0.45s ease;
        }

        .ab-h3 {
          margin: 0 0 clamp(28px, 3.5vw, 44px);
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.04em;
          text-align: center;
          transition: color 0.45s ease;
        }

        /* ── Cards (shared) ─────────────────────────── */

        .ab-card {
          background: var(--bg-card);
          border-radius: 40px;
          transition: background-color 0.45s ease, box-shadow 300ms ease;
        }

        .ab-card:hover {
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }

        /* ── Experience cards ───────────────────────── */

        .ab-jobs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(20px, 2.5vw, 32px);
        }

        .ab-job-card {
          padding: clamp(26px, 3vw, 40px);
        }

        .ab-job-head {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .ab-job-logo {
          flex-shrink: 0;
          width: 68px;
          height: 68px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }

        .ab-job-logo-tile {
          background: linear-gradient(145deg, #0091ff, #006ee0);
          color: #ffffff;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .ab-job-logo-trophy {
          background: linear-gradient(145deg, #f5b432, #e08c0d);
        }

        .ab-job-company {
          margin: 2px 0 4px;
          font-size: clamp(20px, 2vw, 24px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          transition: color 0.45s ease;
        }

        .ab-job-role {
          margin: 0 0 3px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.45s ease;
        }

        .ab-job-date {
          margin: 0;
          font-size: 14px;
          color: var(--text-muted);
          transition: color 0.45s ease;
        }

        .ab-job-bullets {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ab-job-bullets li {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.62;
          transition: color 0.45s ease;
        }

        /* ── Stack ──────────────────────────────────── */

        .ab-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-stack-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: clamp(34px, 4vw, 56px) 24px;
        }

        .ab-stack-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: var(--bg-primary);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
          transition: background-color 0.45s ease;
        }

        .ab-stack-name {
          font-size: clamp(17px, 1.8vw, 21px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.025em;
          transition: color 0.45s ease;
        }

        /* ── Skills ─────────────────────────────────── */

        .ab-skills-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(20px, 2.5vw, 32px);
        }

        .ab-skills-card {
          padding: clamp(28px, 3vw, 42px);
        }

        .ab-skills-title {
          margin: 0 0 26px;
          font-size: clamp(18px, 1.9vw, 22px);
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.45s ease;
        }

        .ab-skills-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ab-skills-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: clamp(16px, 1.7vw, 20px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          transition: color 0.45s ease;
        }

        .ab-skills-emoji {
          font-size: 20px;
          line-height: 1;
        }

        .ab-skills-cta {
          display: flex;
          justify-content: center;
          margin-top: clamp(36px, 4.5vw, 56px);
        }

        /* ── Gallery ────────────────────────────────── */

        .ab-gallery {
          display: grid;
          grid-template-columns: 46fr 54fr;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-large {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          min-height: 420px;
        }

        .ab-gallery-right {
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-wide {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          height: clamp(220px, 24vw, 330px);
        }

        .ab-gallery-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-small {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          height: clamp(200px, 22vw, 300px);
        }

        /* ── Tablet ─────────────────────────────────── */

        @media (max-width: 1024px) {
          .ab-stack-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile ─────────────────────────────────── */

        @media (max-width: 900px) {
          .ab-jobs-grid { grid-template-columns: 1fr; }
          .ab-skills-grid { grid-template-columns: 1fr; }

          .ab-gallery { grid-template-columns: 1fr; }
          .ab-gallery-large { min-height: 0; height: clamp(300px, 60vw, 460px); }
        }

        @media (max-width: 640px) {
          .ab-stack-grid { grid-template-columns: 1fr; }
          .ab-stack-card { padding: 28px 20px; }

          .ab-card { border-radius: 30px; }
          .ab-job-card, .ab-skills-card { padding: 24px; }

          .ab-job-logo { width: 58px; height: 58px; border-radius: 17px; }
          .ab-job-logo-tile { font-size: 26px; }

          .ab-hero-ctas { width: 100%; flex-direction: column; align-items: stretch; }
          .ab-btn-primary, .ab-btn-secondary { width: 100%; }

          .ab-gallery-pair { grid-template-columns: 1fr; }
          .ab-gallery-small { height: clamp(240px, 62vw, 320px); }
          .ab-gallery-wide { height: clamp(200px, 52vw, 280px); }
          .ab-gallery-large, .ab-gallery-wide, .ab-gallery-small { border-radius: 26px; }
        }
      `}</style>
    </>
  );
}
