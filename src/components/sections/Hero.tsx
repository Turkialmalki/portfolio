"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LuCheck, LuArrowUpRight, LuGraduationCap, LuBadgeCheck } from "react-icons/lu";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type CategoryKey = "banking" | "fintech" | "government" | "travel" | "platform" | "social";

type HeroProject = {
  name: { ar: string; en: string };
  category: CategoryKey;
  image: string;
  logo: string;
  stack: string[];
  year: string;
  description: { ar: string; en: string };
  imageScale?: number;
};

const PROJECTS: HeroProject[] = [
  {
    name: { ar: "مصرف الراجحي", en: "Al Rajhi Mobile Banking" },
    category: "banking",
    image: "/alrajhi2026.png",
    logo: "/alrajhilogo.png",
    stack: ["React Native", "TypeScript"],
    year: "2024",
    description: {
      ar: "تجربة مصرفية رقمية لملايين المستخدمين",
      en: "Digital banking experience for millions of users",
    },
    imageScale: 1.32,
  },
  {
    name: { ar: "BaseBox", en: "BaseBox" },
    category: "platform",
    image: "/casdd.png",
    logo: "/money.png",
    stack: ["Next.js", "TypeScript"],
    year: "2026",
    description: {
      ar: "منظومة SaaS متكاملة مدعومة بالذكاء الاصطناعي",
      en: "AI-powered SaaS system platform",
    },
  },
  {
    name: { ar: "إمكان", en: "Emkan Finance" },
    category: "fintech",
    image: "/emkan2026.png",
    logo: "/emkanlogo.png",
    stack: ["React Native", "TypeScript"],
    year: "2025",
    description: {
      ar: "حلول تمويل رقمية سريعة وآمنة",
      en: "Fast, secure digital financing solutions",
    },
    imageScale: 1.1,
  },
  {
    name: { ar: "اثنين", en: "Ithnain" },
    category: "social",
    image: "/ithnin2026.png",
    logo: "/ithninlogo.jpeg",
    stack: ["React Native"],
    year: "2024",
    description: {
      ar: "تجربة تواصل اجتماعي عصرية",
      en: "A modern social mobile experience",
    },
    imageScale: 1.25,
  },
  {
    name: { ar: "مناسب", en: "Munaseb" },
    category: "fintech",
    image: "/munasib2026.png",
    logo: "/munasiblogo.jpeg",
    stack: ["React", "Open Banking"],
    year: "2025",
    description: {
      ar: "منصة رقمية مبنية على الخدمات المصرفية المفتوحة",
      en: "Digital platform built on open banking",
    },
    imageScale: 1.3,
  },
  {
    name: { ar: "وجهات", en: "Wijhut" },
    category: "travel",
    image: "/wijhut2026.png",
    logo: "/wjhut.png",
    stack: ["React", "Node.js"],
    year: "2023",
    description: {
      ar: "منصة سفر وتجارب سياحية متكاملة",
      en: "End-to-end travel experiences platform",
    },
    imageScale: 1.1,
  },
];

const TRACK: HeroProject[] = [...PROJECTS, ...PROJECTS];

type HeroProps = { ready?: boolean };

export default function Hero({ ready = true }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { t, lang } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    transition: { duration: 0.85, ease: EASE, delay },
  });

  return (
    <section id="home" ref={sectionRef} className="hero-root">
      {/* Ambient background — soft glow only */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-orb hero-bg-orb-a" />
        <div className="hero-bg-orb hero-bg-orb-b" />
      </div>

      <div className="hero-container">
        <div className="hero-copy">
          <div className="hero-heading">
            <div className="hero-heading-line">
              <motion.h1 {...reveal(0.06)} className="hero-title">
                {t.hero.greeting}
              </motion.h1>
            </div>
            <div className="hero-heading-line">
              <motion.h1 {...reveal(0.14)} className="hero-title hero-name">
                {t.hero.name}
              </motion.h1>
            </div>
          </div>

          <motion.p {...reveal(0.24)} className="hero-description">
            {t.hero.description}{" "}
            <strong>{t.hero.descriptionStrong}</strong>
          </motion.p>

          <motion.div {...reveal(0.32)} className="hero-actions">
            <GradientButton
              href="/services"
              onClick={() => trackEvent("quick_service_cta_click", { location: "hero" })}
            >
              {t.hero.quickService}
              <LuArrowUpRight size={17} style={{ flexShrink: 0 }} />
            </GradientButton>

            <PillButton
              href="/projects"
              onClick={() => trackEvent("portfolio_cta_click", { location: "hero" })}
            >
              {t.hero.viewPortfolio}
            </PillButton>

            {/* one restrained Career entry point (06A.1 §26) */}
            <Link
              href="/career"
              className="hero-career-link"
              onClick={() => trackEvent("career_cta_click", { location: "hero" })}
            >
              {t.hero.analyzeCv}
              <LuArrowUpRight size={14} style={{ flexShrink: 0 }} />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.ul {...reveal(0.42)} className="hero-trust-badges">
            {t.hero.trustBadges.map((badge) => (
              <li key={badge} className="hero-trust-badge">
                <span className="hero-trust-check">
                  <LuCheck size={10} strokeWidth={3} aria-hidden="true" />
                </span>
                {badge}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 18 }}
          animate={ready ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 18 }}
          transition={{ duration: 1, ease: EASE, delay: 0.16 }}
          style={{ y: portraitY }}
          className="hero-portrait-column"
        >
          <HeroPortrait
            yearsLabel={t.hero.yearsExperience}
            locationLabel={t.hero.location}
          />
        </motion.div>
      </div>

      {/* Credential cards — Monshaat & iHash+ */}
      <motion.div {...reveal(0.52)} className="hero-credentials">
        <CredentialCard
          href="https://play.google.com/store/apps/details?id=sme.bc.monshaat&hl=ar"
          title={t.hero.monshaatTitle}
          body={t.hero.monshaatBody}
          tag={t.hero.monshaatTag}
          logo={
            <span className="hero-credential-logo">
              <Image src="/monshaat.jpg" alt="Monshaat" width={44} height={44} />
            </span>
          }
        />
        <CredentialCard
          href="https://learn.ihashplus.com/teacher"
          title={t.hero.ihashTitle}
          body={t.hero.ihashBody}
          tag={t.hero.ihashTag}
          logo={
            <span className="hero-credential-logo hero-credential-logo-ihash">
              <LuGraduationCap size={22} />
            </span>
          }
        />
      </motion.div>

      {/* Premium project cards marquee */}
      <motion.div {...reveal(0.6)} className="hero-gallery">
        <div className="hero-marquee-viewport">
          <div className="hero-marquee-track">
            {TRACK.map((project, index) => (
              <HeroProjectCard
                key={`${project.name.en}-${index}`}
                project={project}
                lang={lang}
                category={t.projectMeta.categories[project.category]}
                country={t.projectMeta.country}
                viewLabel={t.hero.viewCaseStudy}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        .hero-root {
          --hero-card-background: rgba(255, 255, 255, 0.72);
          --hero-card-border: rgba(0, 0, 0, 0.06);
          --hero-badge-background: rgba(255, 255, 255, 0.94);
          --hero-badge-border: rgba(0, 0, 0, 0.07);
          --hero-badge-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
          --hero-glass-bg: rgba(255, 255, 255, 0.66);
          --hero-glass-border: rgba(0, 0, 0, 0.065);

          position: relative;
          width: 100%;
          overflow: hidden;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #090909);
          transition: background-color 300ms ease, color 300ms ease;
        }

        :global([data-theme="dark"]) .hero-root {
          --hero-card-background: rgba(29, 31, 35, 0.82);
          --hero-card-border: rgba(255, 255, 255, 0.075);
          --hero-badge-background: rgba(34, 36, 41, 0.94);
          --hero-badge-border: rgba(255, 255, 255, 0.09);
          --hero-badge-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          --hero-glass-bg: rgba(28, 30, 36, 0.66);
          --hero-glass-border: rgba(255, 255, 255, 0.08);
        }

        /* ── Ambient background ── */
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .hero-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          opacity: 0.4;
        }

        .hero-bg-orb-a {
          width: 560px;
          height: 560px;
          top: -220px;
          inset-inline-start: -160px;
          background: radial-gradient(circle, rgba(20, 149, 255, 0.24), transparent 72%);
        }

        .hero-bg-orb-b {
          width: 480px;
          height: 480px;
          top: 20px;
          inset-inline-end: -180px;
          background: radial-gradient(circle, rgba(9, 205, 164, 0.16), transparent 72%);
        }

        /* ── Main hero area ── */
        .hero-container {
          position: relative;
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding-top: clamp(136px, 11vw, 172px);
          padding-bottom: clamp(48px, 5vw, 72px);
          display: grid;
          grid-template-columns: minmax(0, 1.28fr) minmax(300px, 0.72fr);
          align-items: center;
          gap: clamp(64px, 8vw, 120px);
        }

        .hero-copy { min-width: 0; max-width: 700px; }

        .hero-heading { margin-bottom: clamp(22px, 2.4vw, 30px); }
        .hero-heading-line { overflow: hidden; }

        .hero-title {
          margin: 0;
          color: var(--text-primary, #090909);
          font-size: clamp(44px, 5.6vw, 76px);
          font-weight: 900;
          line-height: 1.16;
          letter-spacing: -0.03em;
          transition: color 300ms ease;
        }

        .hero-name {
          width: fit-content;
          margin-top: 6px;
          background: linear-gradient(100deg, #1495ff 0%, #09cda4 100%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          padding-bottom: 0.1em; /* keep Arabic descenders unclipped */
        }

        .hero-description {
          max-width: 600px;
          margin: 0 0 36px;
          color: var(--text-secondary, #666666);
          font-size: clamp(17px, 1.4vw, 21px);
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: -0.01em;
          transition: color 300ms ease;
        }

        .hero-description strong {
          color: var(--text-primary, #090909);
          font-weight: 700;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: clamp(32px, 4vw, 44px);
        }

        .hero-career-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-primary, #090909);
          text-decoration: underline;
          text-underline-offset: 5px;
          text-decoration-thickness: 1.5px;
          padding: 8px 4px;
          transition: opacity 0.2s ease;
        }
        .hero-career-link:hover { opacity: 0.7; }

        /* ── Trust badges — small, quiet, refined ── */
        .hero-trust-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .hero-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px 6px 8px;
          border-radius: 999px;
          background: var(--bg-card, #f3f3f3);
          color: var(--text-secondary, #666666);
          font-size: 12.5px;
          font-weight: 500;
          white-space: nowrap;
          transition: background-color 300ms ease, color 300ms ease, transform 300ms ease;
        }

        [dir="rtl"] .hero-trust-badge { padding: 6px 8px 6px 13px; }

        .hero-trust-badge:hover { transform: translateY(-1px); }

        .hero-trust-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          border-radius: 50%;
          background: rgba(9, 205, 164, 0.16);
          color: #09b491;
        }

        :global([data-theme="dark"]) .hero-trust-check { color: #3be0bc; }

        /* ── Credential cards — compact, verified-style ── */
        .hero-credentials {
          position: relative;
          width: min(1200px, calc(100% - 48px));
          margin: clamp(8px, 1vw, 16px) auto 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(12px, 1.6vw, 18px);
        }

        .hero-credential-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px 16px;
          border-radius: 16px;
          background: var(--hero-glass-bg);
          border: 1px solid var(--hero-glass-border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 300ms ease, border-color 300ms ease, background-color 300ms ease;
        }

        .hero-credential-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 34px rgba(20, 149, 255, 0.13);
          border-color: rgba(20, 149, 255, 0.25);
        }

        .hero-credential-logo {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 11px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .hero-credential-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-credential-logo-ihash {
          background: linear-gradient(135deg, #1495ff, #09cda4);
          color: #ffffff;
          border: none;
        }

        .hero-credential-copy { min-width: 0; flex: 1; }

        .hero-credential-title {
          margin: 0 0 2px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary, #090909);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-credential-verified {
          flex-shrink: 0;
          color: var(--accent, #1495ff);
        }

        .hero-credential-body {
          margin: 0;
          font-size: 11.5px;
          font-weight: 400;
          line-height: 1.4;
          color: var(--text-secondary, #666666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-credential-tag { display: none; }

        .hero-credential-arrow {
          flex-shrink: 0;
          color: var(--text-muted, #888888);
          opacity: 0;
          transform: translate(-2px, 2px);
          transition: opacity 250ms ease, transform 250ms ease, color 250ms ease;
        }

        [dir="rtl"] .hero-credential-arrow { transform: translate(2px, 2px) scaleX(-1); }

        .hero-credential-card:hover .hero-credential-arrow {
          opacity: 1;
          transform: translate(0, 0);
          color: var(--accent, #1495ff);
        }

        [dir="rtl"] .hero-credential-card:hover .hero-credential-arrow {
          transform: translate(0, 0) scaleX(-1);
        }

        /* ── Portrait — premium glow ring, glass border ── */
        .hero-portrait-column {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-portrait-stage {
          position: relative;
          width: clamp(280px, 24vw, 350px);
          aspect-ratio: 1 / 1;
        }

        .hero-portrait-glow {
          position: absolute;
          inset: -30px;
          z-index: 0;
          border-radius: 50%;
          background: conic-gradient(from 180deg, #1495ff, #0cbdda, #09cda4, #1495ff);
          filter: blur(46px);
          opacity: 0.3;
        }

        .hero-portrait {
          position: absolute;
          inset: 18px;
          z-index: 1;
          overflow: hidden;
          border-radius: 50%;
          background: linear-gradient(145deg, #0ba9ff 0%, #05d4aa 100%);
          border: 4px solid var(--bg-primary, #ffffff);
          box-shadow: 0 20px 56px rgba(20, 149, 255, 0.22), 0 0 0 1px var(--hero-glass-border);
        }

        .hero-portrait::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle at 52% 35%, rgba(255, 255, 255, 0.15), transparent 58%);
        }

        .hero-portrait-image {
          object-fit: cover;
          object-position: center 22%;
          transform: scale(1.02);
        }

        .hero-floating-badge {
          position: absolute;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 13px;
          color: var(--text-primary, #090909);
          background: var(--hero-badge-background);
          border: 1px solid var(--hero-badge-border);
          border-radius: 15px;
          box-shadow: var(--hero-badge-shadow);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition: color 300ms ease, background-color 300ms ease, border-color 300ms ease;
        }

        .hero-experience-badge { top: 22px; inset-inline-start: -14px; }
        .hero-location-badge { inset-inline-end: -10px; bottom: 20px; }

        .hero-badge-value {
          margin: 0;
          color: var(--accent, #1495ff);
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
        }

        .hero-badge-description {
          margin: 3px 0 0;
          color: var(--text-secondary, #666666);
          font-size: 10px;
          font-weight: 400;
          line-height: 1.1;
          white-space: nowrap;
        }

        .hero-location-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
        }

        /* ── Project cards marquee ── */
        .hero-gallery {
          --hero-gallery-gap: clamp(16px, 1.4vw, 24px);
          --hero-gallery-card-width: clamp(320px, 25vw, 420px);
          position: relative;
          width: 100%;
          padding-top: clamp(56px, 6vw, 88px);
          padding-bottom: clamp(88px, 9vw, 120px);
          overflow: hidden;
        }

        .hero-marquee-viewport {
          width: 100%;
          overflow: hidden;
          direction: ltr; /* marquee motion is direction-agnostic */
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
        }

        .hero-marquee-track {
          width: max-content;
          display: flex;
          align-items: stretch;
          gap: var(--hero-gallery-gap);
          will-change: transform;
          backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
          animation: hero-marquee 60s linear infinite;
        }

        .hero-marquee-viewport:hover .hero-marquee-track,
        .hero-marquee-track:has(a:focus-visible) {
          animation-play-state: paused;
        }

        @keyframes hero-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(calc(-50% - (var(--hero-gallery-gap) / 2)), 0, 0); }
        }

        .hero-project-card {
          position: relative;
          flex: 0 0 var(--hero-gallery-card-width);
          width: var(--hero-gallery-card-width);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: clamp(22px, 1.7vw, 28px);
          background: var(--hero-card-background);
          border: 1px solid var(--hero-card-border);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 6px 26px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 380ms ease, border-color 300ms ease;
        }

        .hero-project-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          border-color: rgba(20, 149, 255, 0.28);
        }

        .hero-project-cover {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10.5;
          overflow: hidden;
          background: var(--bg-card-muted, #e8e8e8);
        }

        .hero-project-cover-image {
          object-fit: contain;
          transform: scale(var(--project-scale, 1));
          transition: transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
          filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.12));
        }

        .hero-project-card:hover .hero-project-cover-image {
          transform: scale(calc(var(--project-scale, 1) + 0.03));
        }

        .hero-project-cover-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(9, 12, 20, 0.44);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .hero-project-card:hover .hero-project-cover-overlay,
        .hero-project-card:focus-visible .hero-project-cover-overlay {
          opacity: 1;
        }

        .hero-project-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.95);
          color: #0d0e12;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transform: translateY(6px);
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-project-card:hover .hero-project-cta { transform: translateY(0); }

        .hero-project-info {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px 20px 22px;
        }

        .hero-project-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-project-logo {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .hero-project-logo img {
          width: 21px;
          height: 21px;
          object-fit: contain;
        }

        .hero-project-heading { min-width: 0; }

        .hero-project-name {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #090909);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hero-project-sub {
          font-size: 12px;
          font-weight: 400;
          color: var(--text-muted, #888888);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .hero-project-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .hero-project-chip {
          padding: 4px 11px;
          border-radius: 999px;
          background: var(--chip-bg, #ededed);
          color: var(--chip-text, #555555);
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── Tablet ── */
        @media (max-width: 960px) {
          .hero-container {
            grid-template-columns: minmax(0, 1.15fr) minmax(230px, 0.85fr);
            gap: 42px;
          }
          .hero-title { font-size: clamp(42px, 6.4vw, 62px); }
          .hero-description { font-size: clamp(17px, 2vw, 20px); }
          .hero-portrait-stage { width: clamp(270px, 31vw, 330px); }
          .hero-gallery { --hero-gallery-card-width: clamp(285px, 34vw, 350px); }
        }

        /* ── Mobile ── */
        @media (max-width: 760px) {
          .hero-container {
            width: min(620px, calc(100% - 32px));
            grid-template-columns: 1fr;
            padding-top: 92px;
            padding-bottom: 26px;
            gap: 34px;
            text-align: center;
          }

          .hero-portrait-column { grid-row: 1; }
          .hero-copy { grid-row: 2; max-width: 600px; margin: 0 auto; }
          .hero-heading { margin-bottom: 17px; }
          .hero-title { font-size: clamp(38px, 10vw, 54px); }
          .hero-name { margin-inline: auto; margin-top: 3px; }

          .hero-description {
            max-width: 560px;
            margin-inline: auto;
            margin-bottom: 26px;
            font-size: 17px;
            line-height: 1.62;
          }

          .hero-actions { justify-content: center; }
          .hero-trust-badges { justify-content: center; }

          .hero-portrait-stage { width: clamp(260px, 72vw, 330px); }
          .hero-experience-badge { top: 18px; inset-inline-start: 0; }
          .hero-location-badge { inset-inline-end: 0; bottom: 15px; }

          .hero-credentials {
            width: min(620px, calc(100% - 32px));
            grid-template-columns: 1fr;
          }

          .hero-gallery {
            --hero-gallery-card-width: clamp(272px, 78vw, 330px);
            --hero-gallery-gap: 13px;
            padding-bottom: 84px;
          }
        }

        /* ── Small mobile ── */
        @media (max-width: 480px) {
          .hero-container { padding-top: 84px; gap: 28px; }
          .hero-title { font-size: clamp(34px, 10.5vw, 44px); }
          .hero-description { font-size: 16px; }
          .hero-portrait-stage { width: min(280px, calc(100vw - 40px)); }
          .hero-portrait { inset: 26px; }
          .hero-floating-badge { padding: 8px 10px; border-radius: 13px; }
          .hero-badge-value { font-size: 18px; }
          .hero-trust-badge { font-size: 12px; padding: 7px 12px; }
          .hero-gallery { --hero-gallery-card-width: clamp(252px, 82vw, 300px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-marquee-track { animation-play-state: paused; }
          .hero-credential-card,
          .hero-project-card,
          .hero-project-cover-image,
          .hero-project-cta,
          .hero-trust-badge {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function HeroPortrait({
  yearsLabel,
  locationLabel,
}: {
  yearsLabel: string;
  locationLabel: string;
}) {
  return (
    <div className="hero-portrait-stage">
      <div className="hero-portrait-glow" aria-hidden="true" />
      <div className="hero-portrait">
        <Image
          src="/avatar.jpg"
          alt="Turki Almalki"
          fill
          priority
          sizes="(max-width: 480px) 234px, (max-width: 760px) 284px, 336px"
          className="hero-portrait-image"
        />
      </div>

      <motion.div
        className="hero-floating-badge hero-experience-badge"
        initial={{ opacity: 0, x: -14, y: -5 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.75 }}
      >
        <div>
          <p className="hero-badge-value">9+</p>
          <p className="hero-badge-description">{yearsLabel}</p>
        </div>
      </motion.div>

      <motion.div
        className="hero-floating-badge hero-location-badge"
        initial={{ opacity: 0, x: 14, y: 5 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
      >
        <span className="hero-location-dot" />
        <div>
          <p className="hero-badge-description">{locationLabel}</p>
        </div>
      </motion.div>
    </div>
  );
}

function CredentialCard({
  href,
  title,
  body,
  tag,
  logo,
}: {
  href: string;
  title: string;
  body: string;
  tag: string;
  logo: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hero-credential-card"
      onClick={() => trackEvent("credential_card_click", { href })}
    >
      {logo}
      <div className="hero-credential-copy">
        <h3 className="hero-credential-title">
          {title}
          <LuBadgeCheck size={14} className="hero-credential-verified" aria-hidden="true" />
        </h3>
        <p className="hero-credential-body">{body}</p>
        <span className="hero-credential-tag">{tag}</span>
      </div>
      <LuArrowUpRight size={15} className="hero-credential-arrow" aria-hidden="true" />
    </a>
  );
}

function HeroProjectCard({
  project,
  lang,
  category,
  country,
  viewLabel,
}: {
  project: HeroProject;
  lang: "ar" | "en";
  category: string;
  country: string;
  viewLabel: string;
}) {
  const name = project.name[lang];

  return (
    <Link
      href="/projects"
      className="hero-project-card"
      aria-label={name}
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ "--project-scale": project.imageScale ?? 1 } as CSSProperties}
      onClick={() => trackEvent("hero_project_card_click", { project: project.name.en })}
    >
      <div className="hero-project-cover">
        <Image
          src={project.image}
          alt={name}
          fill
          sizes="(max-width: 480px) 300px, (max-width: 760px) 330px, 400px"
          className="hero-project-cover-image"
        />
        <div className="hero-project-cover-overlay">
          <span className="hero-project-cta">
            {viewLabel}
            <LuArrowUpRight size={15} />
          </span>
        </div>
      </div>

      <div className="hero-project-info">
        <div className="hero-project-head">
          <span className="hero-project-logo">
            <Image src={project.logo} alt="" width={20} height={20} />
          </span>
          <div className="hero-project-heading">
            <h3 className="hero-project-name">{name}</h3>
            <span className="hero-project-sub">
              {category} · {country} · {project.year}
            </span>
          </div>
        </div>

        <div className="hero-project-meta">
          {project.stack.map((tech) => (
            <span key={tech} className="hero-project-chip">{tech}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function GradientButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <Link
        href={href}
        onClick={onClick}
        className="hero-gradient-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 50,
          padding: "13px 28px",
          color: "#ffffff",
          background: "linear-gradient(100deg, #1495ff 0%, #09cda4 100%)",
          borderRadius: 999,
          boxShadow: "0 12px 32px rgba(20, 149, 255, 0.32)",
          fontSize: 15.5,
          fontWeight: 700,
          lineHeight: 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "box-shadow 300ms ease",
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function PillButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <Link
        href={href}
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 50,
          padding: "13px 28px",
          color: "var(--text-primary, #090909)",
          background: "transparent",
          border: "1.5px solid var(--border-subtle, rgba(0,0,0,0.12))",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "border-color 300ms ease, color 300ms ease",
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}
