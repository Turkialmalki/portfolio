"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { LuArrowUpRight, LuGraduationCap, LuBadgeCheck } from "react-icons/lu";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type CategoryKey =
  | "banking"
  | "fintech"
  | "government"
  | "travel"
  | "platform"
  | "social";

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
  const stageRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // ── Scroll handoff: the name loses prominence as the stage scrolls away ──
  const { scrollYProgress: stageProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end start"],
  });
  const centerScale = useTransform(stageProgress, [0, 1], [1, 0.92]);
  const centerOpacity = useTransform(stageProgress, [0, 0.85], [1, 0.5]);

  // ── Pointer parallax — fine pointers only, disabled under reduced motion ──
  const finePointerRef = useRef(false);
  useEffect(() => {
    finePointerRef.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.5 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      prefersReducedMotion ||
      !finePointerRef.current ||
      e.pointerType !== "mouse" ||
      !stageRef.current
    )
      return;
    const rect = stageRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handlePointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const reveal = (delay: number, duration = 0.6, distance = 14) => ({
    initial: { opacity: 0, y: distance },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: { duration, ease: EASE, delay },
  });

  return (
    <section id="home" ref={sectionRef} className="hero-root">
      {/* Quiet dotted field + one restrained illumination — see §M */}
      <div className="hero-field" aria-hidden="true">
        <div className="hero-dots" />
        <div className="hero-glow" />
      </div>

      <div
        className="hero-stage"
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Floating identity chip — §L */}
      <motion.div className="hero-chip" {...reveal(0.1, 0.7, -10)}>
  <div className="hero-photo-mask">
    <Image
      src="/avatar.jpg"
      alt={t.hero.name}
      fill
      sizes="112px"
      quality={100}
      priority
    />
  </div>
</motion.div>

        <motion.div
          className="hero-center"
          style={{ scale: centerScale, opacity: centerOpacity }}
        >
          {!prefersReducedMotion && (
            <div className="hero-role-cycle" aria-hidden="true">
              {t.hero.roleWords.map((word, i) => (
                <span
                  key={word}
                  className="hero-role-word"
                  style={{ animationDelay: `${i * 3}s` }}
                >
                  {word}
                </span>
              ))}
            </div>
          )}

          <motion.h1 className="hero-name-title" {...reveal(0.2, 0.5, 12)}>
            {t.hero.name}
          </motion.h1>

          <motion.p className="hero-positioning" {...reveal(0.45, 0.45, 10)}>
            {t.hero.positioning}
          </motion.p>

          <motion.div className="hero-cta-row" {...reveal(0.7, 0.4, 10)}>
            <Link
              href="/services"
              className="hero-cta-primary"
              onClick={() =>
                trackEvent("quick_service_cta_click", { location: "hero" })
              }
            >
              {t.hero.ctaPrimary}
              {/* <LuArrowUpRight size={16} style={{ flexShrink: 0 }} /> */}
            </Link>

            <Link
              href="/projects"
              className="hero-cta-secondary"
              onClick={() =>
                trackEvent("portfolio_cta_click", { location: "hero" })
              }
            >
              {t.hero.ctaSecondary}
            </Link>

            <Link
              href="/career"
              className="hero-career-link"
              onClick={() =>
                trackEvent("career_cta_click", { location: "hero" })
              }
            >
              {/* {t.hero.analyzeCv} */}
              {/* <LuArrowUpRight size={13} style={{ flexShrink: 0 }} /> */}
            </Link>
          </motion.div>
        </motion.div>

        {/* Spatial micro-elements — §N, quiet edge fragments of real work */}
        <div className="hero-micro-field" aria-hidden="true">
          <MicroSlot
            className="hero-micro-a"
            mx={smx}
            my={smy}
            depth={10}
            delay={0.95}
          >
            <div className="micro-code">
              <div className="micro-code-dots">
                <span />
                <span />
                <span />
              </div>
              <pre>{'<Product\n  scale="enterprise"\n/>'}</pre>
            </div>
          </MicroSlot>

          <MicroSlot
            className="hero-micro-b"
            mx={smx}
            my={smy}
            depth={7}
            delay={1.02}
          >
            <div className="micro-browser">
              <div className="micro-browser-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="micro-browser-body">
                <i style={{ width: "72%" }} />
                <i style={{ width: "46%" }} />
                <i className="accent" style={{ width: "86%" }} />
              </div>
            </div>
          </MicroSlot>

          <MicroSlot
            className="hero-micro-c"
            mx={smx}
            my={smy}
            depth={9}
            delay={1.09}
          >
            <div className="micro-tag">
              <span className="micro-tag-dot" />
              {PROJECTS[0].name[lang]} · {t.projectMeta.categories.banking}
            </div>
          </MicroSlot>

          <MicroSlot
            className="hero-micro-d"
            mx={smx}
            my={smy}
            depth={6}
            delay={1.16}
          >
            <div className="micro-metric">
              <strong>+9</strong>
              <span>{t.hero.yearsExperience}</span>
            </div>
          </MicroSlot>

          <MicroSlot
            className="hero-micro-e"
            mx={smx}
            my={smy}
            depth={11}
            delay={1.23}
          >
            <div className="micro-phone">
              <div className="micro-phone-notch" />
              <div className="micro-phone-row" />
              <div className="micro-phone-row short" />
              <div className="micro-phone-chip" />
            </div>
          </MicroSlot>
        </div>

        {!prefersReducedMotion && (
          <motion.div
            className="hero-scroll-cue"
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.3 }}
          >
            <span />
          </motion.div>
        )}
      </div>

      {/* Handoff strip — credentials & real project evidence, one quick beat below the fold */}
      <motion.div {...reveal(0.15, 0.7)} className="hero-credentials">
        <CredentialCard
          href="https://play.google.com/store/apps/details?id=sme.bc.monshaat&hl=ar"
          title={t.hero.monshaatTitle}
          body={t.hero.monshaatBody}
          tag={t.hero.monshaatTag}
          logo={
            <span className="hero-credential-logo">
              <Image
                src="/monshaat.jpg"
                alt="Monshaat"
                width={44}
                height={44}
              />
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
      <motion.div {...reveal(0.22, 0.7)} className="hero-gallery">
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
          --hero-glass-bg: rgba(255, 255, 255, 0.66);
          --hero-glass-border: rgba(0, 0, 0, 0.08);
          --hero-dot-color: rgba(0, 0, 0, 0.09);
          --hero-glow-color: rgba(20, 149, 255, 0.08);

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
          --hero-glass-bg: rgba(28, 30, 36, 0.66);
          --hero-glass-border: rgba(255, 255, 255, 0.09);
          --hero-dot-color: rgba(255, 255, 255, 0.08);
          --hero-glow-color: rgba(36, 156, 255, 0.14);
        }

        /* ── Background: quiet dots + one restrained glow ── */
        .hero-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, var(--hero-dot-color) 1px, transparent 1.6px);
          background-size: 26px 26px;
          -webkit-mask-image: radial-gradient(ellipse 58% 48% at 50% 40%, transparent 0%, #000 72%);
          mask-image: radial-gradient(ellipse 58% 48% at 50% 40%, transparent 0%, #000 72%);
        }

        .hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 58% 42% at 50% 34%, var(--hero-glow-color), transparent 70%);
        }

        /* ── Stage: name-first, centered, one intentional viewport ── */
        .hero-stage {
          position: relative;
          width: min(980px, calc(100% - 40px));
          margin: 0 auto;
          min-height: clamp(560px, 90svh, 900px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: clamp(96px, 10vw, 140px);
          padding-bottom: clamp(48px, 6vw, 88px);
        }

        /* ── Identity chip ── */
 .hero-chip {
  position: absolute;
  top: clamp(96px, 9vw, 128px);
  inset-inline-end: 0;
  z-index: 3;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 128px;
  height: 128px;
  padding: 8px;
  box-sizing: border-box;

  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;

  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.1);
}

/* This masks the rectangular photo into a circle */
.hero-photo-mask {
  position: relative !important;

  width: 112px !important;
  height: 112px !important;
  flex: 0 0 112px !important;

  overflow: hidden !important;
  border-radius: 50% !important;
}

.hero-photo-mask img {
  position: absolute !important;
  inset: 0 !important;

  width: 100% !important;
  height: 100% !important;

  object-fit: cover !important;
  object-position: center 28% !important;

  border-radius: 50% !important;
}

@media (max-width: 760px) {
  .hero-chip {
    position: static;
    align-self: center;
    margin-bottom: 28px;
  }
}

        .hero-chip-copy { display: flex; flex-direction: column; gap: 1px; line-height: 1.3; }
        .hero-chip-copy strong { font-size: 16px; font-weight: 700; color: var(--text-primary); }
        .hero-chip-copy em {
          font-style: normal;
          font-size: 13x;
          font-weight: 500;
          color: var(--text-secondary);
        }

      @media (max-width: 760px) {
  .hero-chip {
    position: static;
    align-self: center;
    margin-bottom: 28px;
  }
}
}

        /* ── Center: name, positioning, CTAs ── */
        .hero-center {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transform-origin: center 30%;
        }

        .hero-role-cycle {
          position: relative;
          height: 16px;
          margin-bottom: clamp(16px, 2vw, 22px);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted, #888888);
        }

        [dir="rtl"] .hero-role-cycle { text-transform: none; letter-spacing: 0; }

        .hero-role-word {
          position: absolute;
          inset-inline-start: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          opacity: 0;
          animation: hero-role-fade 12s ease-in-out infinite;
        }

        [dir="rtl"] .hero-role-word { transform: translateX(50%); }

        @keyframes hero-role-fade {
          0%, 2% { opacity: 0; }
          6%, 20% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }

        .hero-name-title {
          margin: 0;
          color: var(--text-primary, #090909);
          font-size: clamp(60px, 9vw, 152px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.03em;
          transition: color 300ms ease;
        }

        [dir="rtl"] .hero-name-title {
          line-height: 1.22;
          padding-bottom: 0.22em; /* keep Arabic descenders unclipped */
        }

        .hero-positioning {
          max-width: 560px;
          margin: clamp(18px, 2.4vw, 26px) 0 0;
          color: var(--text-secondary, #666666);
          font-size: clamp(16px, 1.3vw, 19px);
          font-weight: 400;
          line-height: 1.6;
          letter-spacing: -0.01em;
        }

        .hero-cta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: clamp(28px, 3.4vw, 40px);
        }

        .hero-cta-primary,
        .hero-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          padding: 13px 28px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          text-decoration: none;
          transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 260ms ease, border-color 260ms ease;
        }

        .hero-cta-primary {
          color: var(--bg-primary, #ffffff);
          background: var(--text-primary, #0d0e12);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
        }

        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(0, 0, 0, 0.2); }

        .hero-cta-secondary {
          color: var(--text-primary, #0d0e12);
          background: var(--hero-glass-bg);
          border: 1px solid var(--hero-glass-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .hero-cta-secondary:hover { transform: translateY(-2px); border-color: var(--accent, #1495ff); }

        .hero-career-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary, #090909);
          text-decoration: underline;
          text-underline-offset: 5px;
          text-decoration-thickness: 1.5px;
          padding: 8px 4px;
          transition: opacity 0.2s ease;
        }
        .hero-career-link:hover { opacity: 0.7; }

        /* ── Micro-elements ── */
        .hero-micro-field {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .hero-micro-a, .hero-micro-b, .hero-micro-c, .hero-micro-d, .hero-micro-e {
          position: absolute;
        }

        .hero-micro-a { top: 21%; inset-inline-start: 3%; }
        .hero-micro-b { bottom: 16%; inset-inline-start: 5%; }
        .hero-micro-c { top: 32%; inset-inline-end: 3%; }
        .hero-micro-d { bottom: 20%; inset-inline-end: 4%; }
        .hero-micro-e { top: 58%; inset-inline-end: 0.5%; }

        .micro-code, .micro-browser, .micro-tag, .micro-metric, .micro-phone {
          border-radius: 16px;
          background: var(--hero-glass-bg);
          border: 1px solid var(--hero-glass-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
        }

        .micro-code {
          padding: 12px 14px;
          width: 176px;
          direction: ltr;
        }
        .micro-code-dots { display: flex; gap: 5px; margin-bottom: 9px; }
        .micro-code-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted, #999); opacity: 0.4; }
        .micro-code pre {
          margin: 0;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
          font-size: 10.5px;
          line-height: 1.5;
          color: var(--text-secondary, #666);
          white-space: pre;
        }

        .micro-browser { padding: 10px; width: 168px; direction: ltr; }
        .micro-browser-bar { display: flex; align-items: center; gap: 4px; margin-bottom: 9px; }
        .micro-browser-bar span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted, #999); opacity: 0.35; }
        .micro-browser-body { display: flex; flex-direction: column; gap: 6px; }
        .micro-browser-body i { display: block; height: 5px; border-radius: 3px; background: var(--border-subtle, rgba(0,0,0,0.09)); font-style: normal; }
        .micro-browser-body i.accent { background: var(--accent, #1495ff); opacity: 0.5; }

        .micro-tag {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 15px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary, #666);
          white-space: nowrap;
        }
        .micro-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #09b491; flex-shrink: 0; }

        .micro-metric {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 10px 16px;
        }
        .micro-metric strong { font-size: 19px; font-weight: 900; color: var(--accent, #1495ff); line-height: 1.1; }
        .micro-metric span { font-size: 10px; color: var(--text-secondary, #666); white-space: nowrap; }

        .micro-phone {
          width: 74px;
          height: 108px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: center;
        }
        .micro-phone-notch { width: 26px; height: 4px; border-radius: 3px; background: var(--border-subtle, rgba(0,0,0,0.1)); }
        .micro-phone-row { width: 100%; height: 5px; border-radius: 3px; background: var(--border-subtle, rgba(0,0,0,0.09)); }
        .micro-phone-row.short { width: 65%; }
        .micro-phone-chip { margin-top: auto; width: 100%; height: 20px; border-radius: 7px; background: var(--accent, #1495ff); opacity: 0.16; }

        /* ── Scroll cue ── */
        .hero-scroll-cue {
          position: absolute;
          bottom: clamp(14px, 2vw, 24px);
          inset-inline-start: 50%;
          transform: translateX(-50%);
          z-index: 2;
        }
        .hero-scroll-cue span {
          display: block;
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, transparent, var(--text-muted, #999) 45%, transparent);
          opacity: 0.55;
          animation: hero-scroll-pulse 2.6s ease-in-out infinite;
        }
        @keyframes hero-scroll-pulse {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(8px); opacity: 0.6; }
        }

        /* ── Credential cards — compact, verified-style ── */
        .hero-credentials {
          position: relative;
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
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

        /* ── Project cards marquee ── */
        .hero-gallery {
          --hero-gallery-gap: clamp(16px, 1.4vw, 24px);
          --hero-gallery-card-width: clamp(320px, 25vw, 420px);
          position: relative;
          width: 100%;
          padding-top: clamp(40px, 5vw, 64px);
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

        /* ── Tablet: thin the micro-field, keep the name centered ── */
        @media (max-width: 1180px) {
          .hero-micro-b, .hero-micro-e { display: none; }
        }

        @media (max-width: 960px) {
          .hero-name-title { font-size: clamp(52px, 10vw, 96px); }
          .hero-positioning { font-size: clamp(16px, 2vw, 18px); }
          .hero-gallery { --hero-gallery-card-width: clamp(285px, 34vw, 350px); }
        }

        /* ── Mobile: intentional, not compressed desktop ── */
        @media (max-width: 760px) {
          .hero-stage {
            width: min(560px, calc(100% - 32px));
            min-height: clamp(480px, 82svh, 720px);
            padding-top: 84px;
            padding-bottom: 32px;
          }

          .hero-chip { position: static; margin-bottom: 28px; align-self: center; }

          .hero-role-cycle { margin-bottom: 12px; }
          .hero-name-title { font-size: clamp(40px, 13vw, 64px); }
          .hero-positioning { font-size: 16px; line-height: 1.6; margin-top: 16px; }
          .hero-cta-row { margin-top: 26px; }
          .hero-cta-primary, .hero-cta-secondary { padding: 12px 22px; font-size: 14px; min-height: 46px; }

          /* Mobile keeps 2 quiet fragments, both clear of the fixed TopBar and the CTA row */
          .hero-micro-a, .hero-micro-b, .hero-micro-d { display: none; }
          .hero-micro-c { top: auto; bottom: 20px; inset-inline-end: 3%; }
          .hero-micro-e { display: block; top: auto; bottom: 20px; inset-inline-start: 3%; inset-inline-end: auto; transform: scale(0.8); }

          .hero-credentials {
            width: min(560px, calc(100% - 32px));
            grid-template-columns: 1fr;
            margin-top: 8px;
          }

          .hero-gallery {
            --hero-gallery-card-width: clamp(272px, 78vw, 330px);
            --hero-gallery-gap: 13px;
            padding-top: 28px;
            padding-bottom: 84px;
          }
        }

        @media (max-width: 480px) {
          .hero-stage { padding-top: 76px; }
          .hero-name-title { font-size: clamp(36px, 13.5vw, 52px); }
          .hero-micro-c, .hero-micro-e { transform: scale(0.72); }
          .hero-gallery { --hero-gallery-card-width: clamp(252px, 82vw, 300px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-marquee-track { animation-play-state: paused; }
          .hero-role-word { animation: none; opacity: 1; }
          .hero-credential-card,
          .hero-project-card,
          .hero-project-cover-image,
          .hero-project-cta,
          .hero-cta-primary,
          .hero-cta-secondary {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function MicroSlot({
  className,
  mx,
  my,
  depth,
  delay,
  children,
}: {
  className: string;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  delay: number;
  children: ReactNode;
}) {
  const x = useTransform(mx, [-0.5, 0.5], [-depth, depth]);
  const y = useTransform(my, [-0.5, 0.5], [-depth, depth]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      <motion.div style={{ x, y }}>{children}</motion.div>
    </motion.div>
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
          <LuBadgeCheck
            size={14}
            className="hero-credential-verified"
            aria-hidden="true"
          />
        </h3>
        <p className="hero-credential-body">{body}</p>
        <span className="hero-credential-tag">{tag}</span>
      </div>
      <LuArrowUpRight
        size={15}
        className="hero-credential-arrow"
        aria-hidden="true"
      />
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
      onClick={() =>
        trackEvent("hero_project_card_click", { project: project.name.en })
      }
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
            <span key={tech} className="hero-project-chip">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
