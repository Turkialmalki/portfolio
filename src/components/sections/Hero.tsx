"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { useLanguage } from "@/i18n/LanguageProvider";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type CategoryKey =
  | "banking"
  | "fintech"
  | "government"
  | "travel"
  | "platform"
  | "social";

/** Art direction of a floating hero object. Each one is a different physical object. */
type Placement = {
  /** horizontal offset from stage centre — clamped so it can never widen the page */
  dx: string;
  /** vertical offset from stage centre */
  dy: string;
  /** rendered width of the object */
  w: string;
  rotate: number;
  /** pointer-parallax strength (px) */
  depth: number;
};

type HeroObjectConfig = {
  desktop: Placement;
  mobile: Placement & { delayed?: boolean };
  /** mid-scroll separation, in vw / vh */
  separate: { x: number; y: number };
  /**
   * Scroll-out path. Every object converges toward the page centre as it
   * falls, which is exactly where the flight path's entry curve begins — so
   * the cards read as settling onto the route rather than drifting off it.
   */
  exit: { x: number; y: number; rotate: number; scale: number };
};

type HeroProject = {
  name: { ar: string; en: string };
  category: CategoryKey;
  image: string;
  logo: string;
  stack: string[];
  year: string;
  description: { ar: string; en: string };
  /** natural aspect of the source file (width / height) */
  imgAspect: number;
  /**
   * Optional tighter aspect for the card. Some renders sit in a lot of empty
   * backdrop; giving the card a narrower ratio trims that dead margin off the
   * sides while still showing the whole product. Defaults to `imgAspect`,
   * which shows the composition exactly as shot.
   */
  cropAspect?: number;
  accent: string;
  glow: string;
  hero: HeroObjectConfig;
};

/**
 * Real projects only. Screenshots, logos, years and stacks are the existing assets —
 * `focal`, `hero` and `cardVariant` add art direction on top of them.
 */
const PROJECTS: HeroProject[] = [
  {
    name: { ar: "مصرف الراجحي", en: "Al Rajhi Mobile Banking" },
    category: "banking",
    image: "/hero/alrajhi.jpg",
    logo: "/alrajhilogo.png",
    stack: ["React Native", "TypeScript"],
    year: "2024",
    description: {
      ar: "تجربة مصرفية رقمية لملايين المستخدمين",
      en: "Digital banking experience for millions of users",
    },
    imgAspect: 1.235,
    cropAspect: 1.15,
    accent: "#4aa8ff",
    glow: "rgba(52,150,255,.32)",
    hero: {
      desktop: {
        dx: "clamp(178px, 26vw, 372px)",
        dy: "clamp(-232px, -21vh, -128px)",
        w: "clamp(112px, 10.4vw, 152px)",
        rotate: -3.4,
        depth: 13,
      },
      mobile: {
        dx: "clamp(96px, 32vw, 128px)",
        dy: "-28vh",
        w: "clamp(78px, 21vw, 96px)",
        rotate: -3.6,
        depth: 5,
      },
      separate: { x: 1.6, y: -2.4 },
      exit: { x: -3.2, y: 34, rotate: 0, scale: 0.76 },
    },
  },
  {
    name: { ar: "BaseBox", en: "BaseBox" },
    category: "platform",
    image: "/hero/basebox.jpg",
    logo: "/money.png",
    stack: ["Next.js", "TypeScript"],
    year: "2026",
    description: {
      ar: "منظومة SaaS متكاملة مدعومة بالذكاء الاصطناعي",
      en: "AI-powered SaaS system platform",
    },
    imgAspect: 2.119,
    accent: "#9b83ff",
    glow: "rgba(126,92,255,.30)",
    hero: {
      desktop: {
        dx: "clamp(-296px, -20vw, -150px)",
        dy: "clamp(140px, 26vh, 268px)",
        w: "clamp(158px, 15vw, 216px)",
        rotate: 3.1,
        depth: 8,
      },
      mobile: {
        dx: "clamp(-118px, -30vw, -86px)",
        dy: "12vh",
        w: "clamp(104px, 28vw, 128px)",
        rotate: 3.2,
        depth: 4,
        delayed: true,
      },
      separate: { x: -2.2, y: 1.8 },
      exit: { x: 2.6, y: 30, rotate: -2, scale: 0.74 },
    },
  },
  {
    name: { ar: "إمكان", en: "Emkan Finance" },
    category: "fintech",
    image: "/hero/emkan.jpg",
    logo: "/emkanlogo.png",
    stack: ["React Native", "TypeScript"],
    year: "2025",
    description: {
      ar: "حلول تمويل رقمية سريعة وآمنة",
      en: "Fast, secure digital financing solutions",
    },
    imgAspect: 2.417,
    accent: "#2ec8b4",
    glow: "rgba(44,206,194,.28)",
    hero: {
      desktop: {
        dx: "clamp(210px, 28vw, 396px)",
        dy: "clamp(76px, 13vh, 156px)",
        w: "clamp(152px, 14.6vw, 212px)",
        rotate: 2.8,
        depth: 10,
      },
      mobile: {
        dx: "clamp(90px, 30vw, 120px)",
        dy: "30vh",
        w: "clamp(104px, 28vw, 128px)",
        rotate: 2.6,
        depth: 4,
      },
      separate: { x: 2.4, y: 2.2 },
      exit: { x: -2.4, y: 33, rotate: 2, scale: 0.75 },
    },
  },
  {
    name: { ar: "اثنين", en: "Ithnain" },
    category: "social",
    image: "/hero/ithnain.jpg",
    logo: "/ithninlogo.jpeg",
    stack: ["React Native"],
    year: "2024",
    description: {
      ar: "تجربة تواصل اجتماعي عصرية",
      en: "A modern social mobile experience",
    },
    imgAspect: 2.381,
    accent: "#ff6f9c",
    glow: "rgba(255,83,137,.26)",
    hero: {
      desktop: {
        dx: "clamp(-404px, -33vw, -200px)",
        dy: "clamp(38px, 6vh, 74px)",
        w: "clamp(142px, 13.6vw, 198px)",
        rotate: 2.2,
        depth: 7,
      },
      mobile: {
        dx: "clamp(-118px, -31vw, -86px)",
        dy: "-25vh",
        w: "clamp(104px, 28vw, 128px)",
        rotate: 2.4,
        depth: 4,
      },
      separate: { x: -1.4, y: -1.6 },
      exit: { x: 3.4, y: 32, rotate: 3, scale: 0.73 },
    },
  },
  {
    name: { ar: "مناسب", en: "Munaseb" },
    category: "fintech",
    image: "/hero/munaseb.jpg",
    logo: "/munasiblogo.jpeg",
    stack: ["React", "Open Banking"],
    year: "2025",
    description: {
      ar: "منصة رقمية مبنية على الخدمات المصرفية المفتوحة",
      en: "Digital platform built on open banking",
    },
    imgAspect: 2.512,
    cropAspect: 1.65,
    accent: "#6dd5ad",
    glow: "rgba(57,183,135,.26)",
    hero: {
      desktop: {
        dx: "clamp(-352px, -25vw, -176px)",
        dy: "clamp(-256px, -24vh, -140px)",
        w: "clamp(150px, 14.2vw, 206px)",
        rotate: -2.4,
        depth: 11,
      },
      mobile: {
        dx: "clamp(-116px, -22vw, -78px)",
        dy: "-38vh",
        w: "clamp(104px, 28vw, 128px)",
        rotate: -2.6,
        depth: 4,
        delayed: true,
      },
      separate: { x: -2.6, y: -3 },
      exit: { x: 4.2, y: 31, rotate: -2, scale: 0.76 },
    },
  },
  {
    name: { ar: "مسرعة الأعمال في الأفلام", en: "Film Business Accelerator" },
    category: "platform",
    image: "/hero/fba.jpg",
    logo: "/film-accelerator-logo.png",
    // TODO(turki): confirm the real framework/stack — the screenshots don't
    // reveal it and I'd rather label it plainly than guess.
    stack: ["Web Platform"],
    year: "2026",
    description: {
      ar: "منصة تحليلات وإدارة لمسرّعة أعمال في قطاع الأفلام",
      en: "Programme analytics and operations for a film accelerator",
    },
    imgAspect: 1.68,
    accent: "#c8791f",
    glow: "rgba(200,121,31,.26)",
    hero: {
      desktop: {
        dx: "clamp(96px, 13vw, 196px)",
        dy: "clamp(180px, 30vh, 300px)",
        w: "clamp(150px, 14.2vw, 206px)",
        rotate: -2.6,
        depth: 6,
      },
      mobile: {
        dx: "clamp(-118px, -30vw, -86px)",
        dy: "30vh",
        w: "clamp(96px, 26vw, 118px)",
        rotate: -2.4,
        depth: 3,
      },
      separate: { x: 0.8, y: 2.6 },
      exit: { x: -2.2, y: 26, rotate: 1, scale: 0.72 },
    },
  },
];

type HeroProps = { ready?: boolean };

export default function Hero({ ready = true }: HeroProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const pointerStageRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLanguage();
  const prefersReducedMotion = useSafeReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress: rawProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(rawProgress, {
    stiffness: 175,
    damping: 30,
    mass: 0.22,
  });

  const centerScale = useTransform(progress, [0, 0.4, 0.86], [1, 0.995, 0.95]);
  /**
   * The stage recedes rather than emptying. Fading the identity all the way out
   * before the sticky released left a screen of blank stage between the hero
   * and the flight path; holding it dimmed lets the hero scroll away under the
   * timeline instead, which is what makes the two read as one page.
   */
  const centerOpacity = useTransform(progress, [0, 0.6, 1], [1, 0.95, 0.5]);
  const avatarOpacity = useTransform(progress, [0, 0.6, 0.9], [1, 0.85, 0]);
  const cueOpacity = useTransform(progress, [0, 0.14, 0.4], [1, 0.6, 0]);

  /**
   * Scroll-velocity focus. Lenis drives the real scroll, so reading velocity
   * off the scroll progress means the headline softens exactly as fast as the
   * page is actually moving — not on a fixed timer.
   */
  const scrollVelocity = useVelocity(rawProgress);
  const rawFocus = useTransform(scrollVelocity, [-2.4, 0, 2.4], [3.4, 0, 3.4], {
    clamp: true,
  });
  const focusBlur = useSpring(rawFocus, {
    stiffness: 190,
    damping: 34,
    mass: 0.28,
  });
  const titleFilter = useMotionTemplate`blur(${focusBlur}px)`;

  const scrollCue = lang === "ar" ? "مرّر لتتابع الرحلة" : "Scroll to follow the journey";

  const positioningWords = useMemo(
    () => t.hero.positioning.split(" ").filter(Boolean),
    [t.hero.positioning],
  );

  const finePointerRef = useRef(false);
  useEffect(() => {
    finePointerRef.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 140, damping: 23, mass: 0.38 });
  const smy = useSpring(my, { stiffness: 140, damping: 23, mass: 0.38 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      prefersReducedMotion ||
      !finePointerRef.current ||
      event.pointerType !== "mouse" ||
      !pointerStageRef.current
    ) {
      return;
    }

    const rect = pointerStageRef.current.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    mx.set(0);
    my.set(0);
  };


  const reveal = (delay: number, duration = 0.62, distance = 14) => ({
    initial: { opacity: 0, y: distance },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { duration, ease: EASE, delay },
  });

  /**
   * Blur → focus reveal.
   *
   * NOTE: this deliberately never splits below WORD level. Arabic letters are
   * shaped by their neighbours, so splitting "تركي" into per-character spans
   * would break the joins and render it as disconnected letterforms. Words are
   * safe in both scripts; characters are not.
   */
  const revealFocus = (delay: number, duration = 0.78, blur = 13) => ({
    initial: { opacity: 0, filter: `blur(${blur}px)`, y: 14 },
    animate: ready
      ? { opacity: 1, filter: "blur(0px)", y: 0 }
      : { opacity: 0, filter: `blur(${blur}px)`, y: 14 },
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { duration, ease: EASE, delay },
  });

  return (
    <section id="home" className="hero-root">
      <div className="hero-field" aria-hidden="true">
        <div className="hero-dots" />
        <div className="hero-aurora hero-aurora-a" />
        <div className="hero-aurora hero-aurora-b" />
        {/* One tiled noise pass — the cheapest 'shot on film' cue there is. */}
        <div className="hero-grain" />
      </div>


      <div ref={storyRef} className="hero-story">
        <div
          ref={pointerStageRef}
          className="hero-sticky-stage"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div className="hero-stage-inner">
            <HeroProjectScene
              projects={PROJECTS}
              lang={lang}
              progress={progress}
              mx={smx}
              my={smy}
              ready={ready}
              isMobile={isMobile}
              still={Boolean(prefersReducedMotion)}
            />

            <motion.div
              className="hero-avatar-orbit"
              {...reveal(0.08, 0.7, -8)}
              style={{ opacity: prefersReducedMotion ? 1 : avatarOpacity }}
            >
              <div className="hero-avatar-ring">
                <div className="hero-photo-mask">
                  <Image
                    src="/avatar.jpg"
                    alt={t.hero.name}
                    fill
                    sizes="72px"
                    quality={100}
                    priority
                  />
                </div>
              </div>
              <span className="hero-avatar-status" aria-hidden="true" />
            </motion.div>

            <div className="hero-center-anchor">
              <motion.div
                className="hero-center"
                style={
                  prefersReducedMotion
                    ? undefined
                    : { scale: centerScale, opacity: centerOpacity }
                }
              >
                <div className="hero-role-cycle" aria-hidden="true">
                  {t.hero.roleWords.map((word, index) => (
                    <span
                      key={word}
                      className="hero-role-word"
                      style={{ animationDelay: `${index * 3}s` }}
                    >
                      {word}
                    </span>
                  ))}
                </div>

                <motion.h1 className="hero-name-title" {...revealFocus(0.16, 0.85)}>
                  <motion.span
                    className="hero-name-inner"
                    style={
                      prefersReducedMotion ? undefined : { filter: titleFilter }
                    }
                  >
                    {t.hero.name}
                  </motion.span>
                </motion.h1>

                <p className="hero-positioning">
                  {positioningWords.map((word, index) => (
                    <Fragment key={`${word}-${index}`}>
                      {index > 0 ? " " : ""}
                      <motion.span
                        className="hero-word"
                        {...revealFocus(0.44 + index * 0.042, 0.56, 9)}
                      >
                        {word}
                      </motion.span>
                    </Fragment>
                  ))}
                </p>

                <motion.div className="hero-cta-row" {...reveal(0.66, 0.42, 10)}>
                  <Link
                    href="/services"
                    className="hero-cta-primary"
                    onClick={() =>
                      trackEvent("quick_service_cta_click", { location: "hero" })
                    }
                  >
                    {t.hero.ctaPrimary}
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
                </motion.div>

              </motion.div>
            </div>

            <motion.div className="hero-scroll-cue" style={{ opacity: cueOpacity }}>
              <span className="hero-scroll-label">{scrollCue}</span>
              <span className="hero-scroll-line" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* The hero's last stroke is the timeline's first: this hairline drops
          out of the stage and the flight path picks it up from the same point. */}
      <div className="hero-route-stub" aria-hidden="true">
        <span className="hero-route-line" />
      </div>

      <style>{`
        .hero-root {
          --hero-dot-color: rgba(0,0,0,.075);
          --hero-border: rgba(0,0,0,.075);
          --glass-surface: rgba(255,255,255,.66);
          --glass-border: rgba(0,0,0,.075);
          position: relative;
          width: 100%;
          max-width: 100vw;
          overflow-x: clip;
          background: var(--bg-primary,#fff);
          color: var(--text-primary,#090909);
        }

        [data-theme="dark"] .hero-root {
          --hero-dot-color: rgba(255,255,255,.07);
          --hero-border: rgba(255,255,255,.09);
          --glass-surface: rgba(26,29,35,.62);
          --glass-border: rgba(255,255,255,.10);
        }

        .hero-field {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle,var(--hero-dot-color) 1px,transparent 1.55px);
          background-size: 27px 27px;
          -webkit-mask-image: radial-gradient(ellipse 67% 49% at 50% 26%,transparent 0%,#000 76%);
          mask-image: radial-gradient(ellipse 67% 49% at 50% 26%,transparent 0%,#000 76%);
        }

        .hero-aurora {
          position: absolute;
          width: 48vw;
          aspect-ratio: 1;
          border-radius: 50%;
          filter: blur(110px);
          opacity: .12;
        }

        .hero-aurora-a { left: 23%; top: 13%; background: #55a9ff; }
        .hero-aurora-b { right: 20%; top: 30%; background: #7d5cff; opacity: .07; }

        /* The tail of this height is scroll where the stage has already faded.
           Keeping it short means the flight path arrives right behind the last
           card instead of after a screen of empty stage. */
        .hero-story {
          position: relative;
          height: 134svh;
          min-height: 900px;
        }

        .hero-sticky-stage {
          position: sticky;
          top: 0;
          height: 100svh;
          min-height: 650px;
          overflow: clip;
        }

        .hero-stage-inner {
          position: relative;
          width: min(1180px,calc(100% - 34px));
          height: 100%;
          margin: 0 auto;
          perspective: 1500px;
        }

        /* ---------- centre identity ---------- */

        .hero-center-anchor {
          position: absolute;
          z-index: 7;
          left: 50%;
          top: 48.5%;
          width: min(700px,70vw);
          transform: translate(-50%,-50%);
        }

        .hero-center {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transform-origin: 50% 45%;
        }

        .hero-role-cycle {
          position: relative;
          width: 100%;
          height: 18px;
          margin-bottom: 12px;
          color: var(--text-muted,#8a8a8a);
          font-size: 11px;
          font-weight: 760;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        [dir="rtl"] .hero-role-cycle { letter-spacing: 0; text-transform: none; }

        .hero-role-word {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          opacity: 0;
          animation: hero-role-fade 12s ease-in-out infinite;
        }

        @keyframes hero-role-fade {
          0%,2% { opacity:0; transform:translate(-50%,5px); }
          7%,20% { opacity:1; transform:translate(-50%,0); }
          25%,100% { opacity:0; transform:translate(-50%,-5px); }
        }

        .hero-name-title {
          width: 100%;
          margin: 0;
          color: var(--text-primary,#090909);
          font-size: clamp(66px,8.8vw,150px);
          font-weight: 900;
          line-height: 1.02;
          letter-spacing: -.045em;
          text-align: center;
        }

        [dir="rtl"] .hero-name-title {
          letter-spacing: 0;
          line-height: 1.18;
          padding-bottom: .12em;
        }

        .hero-positioning {
          width: 100%;
          max-width: 590px;
          margin: 14px auto 0;
          color: var(--text-secondary,#656565);
          font-size: clamp(15px,1.25vw,19px);
          line-height: 1.65;
        }

        .hero-cta-row {
          display: flex;
          justify-content: center;
          gap: 11px;
          margin-top: 26px;
        }

        .hero-cta-primary,
        .hero-cta-secondary {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 780;
          text-decoration: none;
          transition: transform 260ms cubic-bezier(.16,1,.3,1),box-shadow 260ms ease,border-color 260ms ease;
        }

        .hero-cta-primary {
          color: var(--bg-primary,#fff);
          background: var(--text-primary,#0c0d10);
          box-shadow: 0 13px 30px rgba(0,0,0,.16);
        }

        .hero-cta-secondary {
          color: var(--text-primary,#0c0d10);
          background: rgba(255,255,255,.76);
          border: 1px solid rgba(0,0,0,.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        [data-theme="dark"] .hero-cta-secondary {
          background: rgba(24,26,31,.76);
          border-color: rgba(255,255,255,.09);
        }

        .hero-cta-primary:hover,
        .hero-cta-secondary:hover { transform: translateY(-2px); }
        .hero-cta-primary:hover { box-shadow: 0 18px 38px rgba(0,0,0,.2); }

        /* ---------- avatar ---------- */

        .hero-avatar-orbit {
          position: absolute;
          z-index: 10;
          left: calc(50% + clamp(126px,10.2vw,178px));
          top: 27.5%;
          width: 68px;
          height: 68px;
          animation: hero-avatar-float 5.6s ease-in-out infinite;
        }

        .hero-avatar-ring {
          width: 100%;
          height: 100%;
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(145deg,rgba(255,255,255,.97),rgba(255,255,255,.62));
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 16px 40px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.95);
        }

        [data-theme="dark"] .hero-avatar-ring {
          background: linear-gradient(145deg,rgba(255,255,255,.92),rgba(255,255,255,.5));
          border-color: rgba(255,255,255,.16);
          box-shadow: 0 18px 42px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.9);
        }

        .hero-photo-mask {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 50%;
        }

        .hero-photo-mask img {
          object-fit: cover !important;
          object-position: center 28% !important;
        }

        .hero-avatar-status {
          position: absolute;
          right: 2px;
          bottom: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #19c69c;
          border: 2.5px solid #fff;
          box-shadow: 0 4px 12px rgba(25,198,156,.36);
        }

        @keyframes hero-avatar-float {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-7px,0); }
        }

        /* ---------- floating product objects ---------- */

        .hero-scene {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          perspective: 1600px;
        }

        .hero-object {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--w);
          transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)));
        }

        .ho-travel {
          width: 100%;
          will-change: transform, opacity;
          transform: translateZ(0);
        }

        .ho-enter { width: 100%; transform-style: preserve-3d; }

        .ho-pointer {
          position: relative;
          width: 100%;
          pointer-events: auto;
          transform-style: preserve-3d;
          transform-origin: 50% 50%;
          backface-visibility: hidden;
          transition: transform 340ms cubic-bezier(.16,1,.3,1);
        }

        .ho-pointer:hover { transform: translateY(-5px); }

        .ho-halo {
          position: absolute;
          z-index: -1;
          inset: -12%;
          border-radius: 46%;
          background: var(--obj-glow);
          filter: blur(28px);
          opacity: .55;
        }

        .ho-label {
          position: absolute;
          z-index: 4;
          left: 50%;
          bottom: -13px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 4px 9px;
          border-radius: 999px;
          background: var(--glass-surface);
          border: 1px solid var(--glass-border);
          color: var(--text-primary,#111);
          box-shadow: 0 8px 20px rgba(0,0,0,.10);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 8.5px;
          font-weight: 800;
          opacity: 0;
          transform: translate(-50%,6px);
          transition: opacity 240ms ease, transform 240ms cubic-bezier(.16,1,.3,1);
        }

        .ho-pointer:hover .ho-label { opacity: 1; transform: translate(-50%,0); }

        .ho-shot {
          position: absolute;
          inset: 0;
          overflow: hidden;
          will-change: transform;
        }

        .ho-shot img {
          object-fit: cover !important;
          object-position: center !important;
        }

        /* ---- one floating card, two shapes ---- */

        .hero-card {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 17px;
          /* the white edge is what makes these read as photo cards rather than
             screenshots dropped on the page */
          border: 3px solid #fff;
          background: #fff;
          box-shadow:
            0 24px 46px -16px rgba(15,23,42,.30),
            0 8px 16px -8px rgba(15,23,42,.20);
        }

        [data-theme="dark"] .hero-card {
          border-color: rgba(255,255,255,.16);
          background: rgba(255,255,255,.16);
          box-shadow:
            0 26px 50px -16px rgba(0,0,0,.62),
            0 8px 16px -8px rgba(0,0,0,.44);
        }

        /* The card takes the image's own aspect, so the full product
           composition is shown — nothing is ever cropped off. */
        .hero-card { aspect-ratio: var(--ar, 1.5); }

        /* Clears the floating bottom navigation, which owns the last ~90px of
           the viewport on every breakpoint. */
        .hero-scroll-cue {
          position: absolute;
          z-index: 8;
          left: 50%;
          bottom: 106px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .hero-scroll-label {
          color: var(--text-muted,#999);
          font-size: 10.5px;
          font-weight: 720;
          letter-spacing: .12em;
          text-transform: uppercase;
          white-space: nowrap;
          opacity: .72;
        }

        [dir="rtl"] .hero-scroll-label {
          letter-spacing: 0;
          text-transform: none;
          font-size: 12px;
        }

        .hero-scroll-line {
          display: block;
          width: 1px;
          height: 34px;
          background: linear-gradient(to bottom,transparent,var(--text-muted,#999) 48%,transparent);
          animation: hero-scroll-pulse 2s ease-in-out infinite;
        }

        @keyframes hero-scroll-pulse {
          0%,100% { transform:translateY(0); opacity:.28; }
          50% { transform:translateY(8px); opacity:.72; }
        }

        /* ---------- route stub: hero → flight path ---------- */

        .hero-route-stub {
          position: relative;
          z-index: 6;
          display: flex;
          justify-content: center;
          height: 74px;
          pointer-events: none;
        }

        .hero-route-line {
          display: block;
          width: 1.5px;
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(to bottom,transparent,var(--hero-border) 30%,rgba(30,143,255,.42) 100%);
        }

        [data-theme="dark"] .hero-route-line {
          background: linear-gradient(to bottom,transparent,var(--hero-border) 30%,rgba(70,167,255,.5) 100%);
        }

        /* ---------- responsive ---------- */

        @media (max-width: 980px) {
          .hero-stage-inner { width: min(960px,calc(100% - 24px)); }
        }

        @media (max-width: 760px) {
          .hero-story { height: 132svh; min-height: 850px; }
          .hero-sticky-stage { min-height: 620px; }
          .hero-stage-inner { width: 100%; }

          .hero-object {
            width: var(--mw);
            transform: translate(calc(-50% + var(--mdx)), calc(-50% + var(--mdy)));
          }

          .ho-label { display: none; }

          /* Wide cards stand down on phones — four well-spaced objects read as
             a composition, six crammed into 390px read as clutter. */
          .hero-object-2,
          .hero-object-5 { display: none; }

          .hero-center-anchor {
            top: 49%;
            width: calc(100% - 38px);
            max-width: 390px;
          }

          .hero-role-cycle { height: 20px; margin-bottom: 6px; }

          .hero-name-title { font-size: clamp(58px,19vw,80px); line-height: 1.07; }
          [dir="rtl"] .hero-name-title { line-height: 1.16; padding-bottom: .15em; }

          .hero-positioning {
            max-width: 330px;
            margin-top: 6px;
            font-size: 14.5px;
            line-height: 1.62;
          }

          .hero-cta-row {
            width: 100%;
            max-width: 330px;
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 9px;
            margin-top: 21px;
          }

          .hero-cta-primary,
          .hero-cta-secondary {
            width: 100%;
            min-width: 0;
            min-height: 46px;
            padding: 11px 10px;
            font-size: 13px;
          }

          .hero-avatar-orbit {
            left: calc(50% + 22px);
            top: 19.5%;
            width: 54px;
            height: 54px;
          }

          .hero-avatar-ring { padding: 3px; }
          .hero-avatar-status { width: 10px; height: 10px; border-width: 2px; }

          .hero-scroll-cue { bottom: 98px; gap: 6px; }
          .hero-scroll-line { height: 26px; }

          .hero-route-stub { height: 58px; }
        }

        @media (max-width: 420px) {
          .hero-avatar-orbit { left: calc(50% + 18px); top: 19%; width: 50px; height: 50px; }
        }

        /* ---------- film grain ---------- */

        .hero-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 140px 140px;
          mix-blend-mode: overlay;
          opacity: .05;
          pointer-events: none;
        }

        [data-theme="dark"] .hero-grain { opacity: .085; mix-blend-mode: soft-light; }

        /* ---------- focus reveal ---------- */

        .hero-name-inner { display: inline-block; will-change: filter; }
        .hero-word { display: inline-block; }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          /* the stage keeps an explicit height so the objects still anchor to its centre */
          .hero-story { height: auto; min-height: 0; }
          .hero-sticky-stage { position: relative; height: 840px; min-height: 840px; }
          .hero-stage-inner { height: 840px; }
          .hero-scroll-cue { display: none; }
          .hero-avatar-orbit { animation: none !important; }
          .hero-role-word { animation: none !important; }
          .hero-role-word:first-child { opacity: 1; transform: translate(-50%,0); }
          .ho-pointer { transition: none !important; }
          .hero-name-inner, .hero-word { filter: none !important; }
          .hero-route-stub { height: 46px; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero scene                                                          */
/* ------------------------------------------------------------------ */

function HeroProjectScene({
  projects,
  lang,
  progress,
  mx,
  my,
  ready,
  isMobile,
  still,
}: {
  projects: HeroProject[];
  lang: "ar" | "en";
  progress: MotionValue<number>;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  ready: boolean;
  isMobile: boolean;
  still: boolean;
}) {
  return (
    <div className="hero-scene" aria-hidden="true">
      {projects.map((project, index) => (
        <HeroProjectObject
          key={project.name.en}
          project={project}
          index={index}
          lang={lang}
          progress={progress}
          mx={mx}
          my={my}
          ready={ready}
          isMobile={isMobile}
          still={still}
        />
      ))}
    </div>
  );
}

function HeroProjectObject({
  project,
  index,
  lang,
  progress,
  mx,
  my,
  ready,
  isMobile,
  still,
}: {
  project: HeroProject;
  index: number;
  lang: "ar" | "en";
  progress: MotionValue<number>;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  ready: boolean;
  isMobile: boolean;
  still: boolean;
}) {
  const cfg = project.hero;
  const place = isMobile ? cfg.mobile : cfg.desktop;
  const { separate, exit } = cfg;

  /* 0–15% hold · 15–38% separate · 38–66% travel · 66–86% settle onto the route */
  const stops = [0, 0.15, 0.38, 0.66, 0.86];

  const travelX = useTransform(progress, stops, [
    "0vw",
    "0vw",
    `${separate.x}vw`,
    `${exit.x * 0.6}vw`,
    `${exit.x}vw`,
  ]);

  const travelY = useTransform(progress, stops, [
    "0vh",
    "0vh",
    `${separate.y}vh`,
    `${exit.y * 0.5}vh`,
    `${exit.y}vh`,
  ]);

  const scale = useTransform(progress, stops, [1, 1, 1.05, 1.0, exit.scale]);

  const rotate = useTransform(progress, stops, [
    place.rotate,
    place.rotate,
    place.rotate * 0.65,
    exit.rotate * 0.5,
    exit.rotate,
  ]);

  /* two mobile objects arrive on early scroll instead of on load */
  const delayed = isMobile && Boolean(cfg.mobile.delayed);
  const opacity = useTransform(
    progress,
    [0, 0.05, 0.16, 0.82, 1],
    delayed ? [0, 0.35, 1, 0.78, 0.3] : [1, 1, 1, 0.78, 0.3],
  );

  const pointerX = useTransform(mx, [-0.5, 0.5], [-place.depth, place.depth]);
  const pointerY = useTransform(my, [-0.5, 0.5], [-place.depth * 0.5, place.depth * 0.5]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-place.depth * 0.34, place.depth * 0.34]);
  const rotateX = useTransform(my, [-0.5, 0.5], [place.depth * 0.28, -place.depth * 0.28]);

  /* internal product parallax — the screenshot drifts against its own surface */
  const shotY = useTransform(progress, [0, 0.8], [0, -6 - index * 1.6]);

  const style = {
    "--dx": cfg.desktop.dx,
    "--dy": cfg.desktop.dy,
    "--w": cfg.desktop.w,
    "--mdx": cfg.mobile.dx,
    "--mdy": cfg.mobile.dy,
    "--mw": cfg.mobile.w,
    "--obj-accent": project.accent,
    "--obj-glow": project.glow,
    "--ar": String(project.cropAspect ?? project.imgAspect),
  } as CSSProperties;

  return (
    <div className={`hero-object hero-object-${index + 1}`} style={style}>
      <motion.div
        className="ho-travel"
        style={
          still
            ? { rotate: place.rotate }
            : { x: travelX, y: travelY, scale, rotate, opacity }
        }
      >
        <motion.div
          className="ho-enter"
          initial={{
            opacity: 0,
            scale: 0.9,
            y: 26,
            rotateX: index % 2 === 0 ? 9 : -8,
            rotateY: index % 2 === 0 ? -7 : 7,
          }}
          animate={
            ready
              ? { opacity: 1, scale: 1, y: 0, rotateX: 0, rotateY: 0 }
              : { opacity: 0, scale: 0.9, y: 26 }
          }
          transition={{
            type: "spring",
            stiffness: 210,
            damping: 26,
            mass: 0.7,
            delay: still ? 0 : 0.05 + index * 0.055,
          }}
        >
          <motion.div
            className="ho-pointer"
            style={
              still
                ? undefined
                : { x: pointerX, y: pointerY, rotateX, rotateY }
            }
          >
            <ProjectVisual project={project} shotY={still ? undefined : shotY} />
            <span className="ho-label">{project.name[lang]}</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** One component system, six genuinely different physical objects. */
/**
 * One card, every project. The screenshot is the object; the frame, the bloom
 * and the shadow are what make it float. Names stay off the face and appear on
 * hover, so a 100px card and a 240px card are legible in exactly the same way.
 */
function ProjectVisual({
  project,
  shotY,
}: {
  project: HeroProject;
  shotY?: MotionValue<number>;
}) {
  return (
    <div className="hero-card">
      <motion.div className="ho-shot" style={shotY ? { y: shotY } : undefined}>
        <Image
          src={project.image}
          alt=""
          fill
          sizes="(max-width:760px) 120px, 280px"
        />
      </motion.div>
    </div>
  );
}
