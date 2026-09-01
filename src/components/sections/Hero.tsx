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
import { WORK_HREF } from "@/config/siteFlags";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { DashboardCard, WorkObjectStyles } from "@/app/services/WorkObjects";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Bi = { ar: string; en: string };

/**
 * Art direction of one floating artifact. Each is a different physical object,
 * placed deliberately — not scattered.
 */
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

/**
 * The five artifacts are five different KINDS of object, because five copies of
 * the same rounded rectangle is what made the old hero read as a screenshot
 * dump. Each variant has its own frame, radius, shadow and caption furniture:
 *
 *  · plate   — a product photograph on a caption rail (the feature card)
 *  · browser — a flat web screenshot under real browser chrome
 *  · photo   — a real photograph, portrait, with a location caption
 *  · strip   — a wide platform shot, short and letter-boxed
 *  · badge   — a credential pill: no screenshot at all
 */
/**
 * Four objects, four different visual languages — chosen for what each asset
 * actually is, not for filling space:
 *
 *  · device  — a real app screenshot, edge to edge, inside a DRAWN phone body
 *              (no screenshot-in-a-rounded-box; the bezel is CSS, the pixels
 *              are the product)
 *  · console — the Film Accelerator report, rendered LIVE from the same
 *              component the services page uses, with the product's real
 *              sign-in screen layered under it
 *  · plate   — a product photograph, cropped tight to the devices
 *  · photo   — the workshop portrait, cinematic crop and controlled overlay
 *
 * Credential pills are gone from the hero on purpose: they are evidence, and
 * evidence belongs in the timeline, where FlightPath already carries them.
 */
type ArtifactVariant = "device" | "console" | "plate" | "photo";

type Artifact = {
  id: string;
  variant: ArtifactVariant;
  title: Bi;
  /** sector / programme line under the title */
  meta: Bi;
  /** year or range — shown where the frame has room for it */
  year?: string;
  /** one technology, never a list: the timeline carries the full stack */
  tech?: string;
  image?: string;
  /** a second, smaller surface layered into the same composition */
  inset?: string;
  /** natural aspect of the shot inside the frame (width / height) */
  ratio: number;
  /** object-position for the crop */
  pos?: string;
  accent: string;
  glow: string;
  /**
   * The anchor is the one object the composition is built around: it is the
   * largest, it travels last, and it lands nearest the route origin, so the
   * eye follows a single object into the timeline.
   */
  anchor?: boolean;
  desktop: Placement;
  mobile: Placement;
  /** hidden on phones — two strong objects beat four crowded ones at 390px */
  phoneHidden?: boolean;
  /** mid-scroll separation, in vw / vh */
  separate: { x: number; y: number };
  /**
   * Scroll-out path. Everything converges on the page centre as it falls,
   * which is where the flight path's entry curve begins, so the artifacts
   * settle onto the route rather than drifting off it.
   */
  exit: { x: number; y: number; rotate: number; scale: number; opacity: number };
};

/**
 * Every pixel below is real work already in this repository: sharp crops of
 * the full-resolution product plates in `public/`, and — for the Film
 * Accelerator — the actual report component, not a picture of one.
 */
const ARTIFACTS: Artifact[] = [
  {
    id: "emkan",
    variant: "device",
    anchor: true,
    title: { ar: "إمكان", en: "Emkan Finance" },
    meta: { ar: "تقنية مالية · تطبيق الجوال", en: "Fintech · mobile app" },
    year: "2022 — 2024",
    tech: "React Native",
    /* the app screen itself, cropped out of the product plate: the phone body
       around it is drawn in CSS so the UI can run edge to edge */
    image: "/hero/emkan-screen.png",
    ratio: 538 / 1200,
    accent: "#7b5cff",
    glow: "rgba(123,92,255,.24)",
    desktop: {
      dx: "clamp(220px, 27vw, 400px)",
      dy: "clamp(-80px, -6vh, -38px)",
      w: "clamp(108px, 10.2vw, 144px)",
      rotate: -2.6,
      depth: 14,
    },
    mobile: {
      dx: "clamp(72px, 23vw, 98px)",
      dy: "-27vh",
      w: "clamp(66px, 18vw, 80px)",
      rotate: -3,
      depth: 5,
    },
    separate: { x: 1.4, y: -1.4 },
    exit: { x: -3.1, y: 31, rotate: 0, scale: 0.8, opacity: 0.48 },
  },
  {
    id: "film",
    variant: "console",
    title: { ar: "مسرّعة أعمال الأفلام", en: "Film Business Accelerator" },
    meta: { ar: "لوحة المحفظة · هيئة الأفلام", en: "Portfolio dashboard · Film Commission" },
    year: "2026",
    /* the real sign-in screen of the same product, layered in */
    inset: "/hero/fba-login.jpg",
    ratio: 1.3,
    accent: "#d9902f",
    glow: "rgba(217,144,47,.2)",
    desktop: {
      dx: "clamp(-436px, -30.5vw, -232px)",
      dy: "clamp(-244px, -21vh, -136px)",
      w: "clamp(196px, 17.6vw, 254px)",
      rotate: 1.6,
      depth: 9,
    },
    mobile: {
      dx: "clamp(-116px, -30vw, -84px)",
      dy: "24vh",
      w: "clamp(150px, 40vw, 186px)",
      rotate: 1.8,
      depth: 4,
    },
    phoneHidden: true,
    separate: { x: -1.9, y: -2 },
    exit: { x: 3.4, y: 26, rotate: -3, scale: 0.7, opacity: 0.26 },
  },
  {
    id: "workshop",
    variant: "photo",
    title: { ar: "ورشة MVP", en: "MVP workshop" },
    meta: { ar: "مركز الابتكار — منشآت", en: "Innovation Center — Monsha'at" },
    image: "/turki.jpg",
    ratio: 0.82,
    pos: "61% 31%",
    accent: "#f0a35e",
    glow: "rgba(240,163,94,.2)",
    desktop: {
      dx: "clamp(-398px, -27.5vw, -216px)",
      dy: "clamp(118px, 19.5vh, 212px)",
      w: "clamp(114px, 10vw, 138px)",
      rotate: -3.4,
      depth: 7,
    },
    mobile: {
      dx: "clamp(-100px, -26vw, -76px)",
      dy: "23vh",
      w: "clamp(90px, 24vw, 106px)",
      rotate: -3.2,
      depth: 3,
    },
    separate: { x: -1.5, y: 2.1 },
    exit: { x: 2.5, y: 23, rotate: 4, scale: 0.68, opacity: 0.24 },
  },
  {
    id: "alrajhi",
    variant: "plate",
    title: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
    meta: { ar: "تجربة مصرفية للأفراد", en: "Retail banking experience" },
    year: "2019 — 2022",
    tech: "React Native",
    image: "/hero/alrajhi-pair.jpg",
    ratio: 780 / 860,
    accent: "#3f7ae0",
    glow: "rgba(63,122,224,.2)",
    desktop: {
      dx: "clamp(206px, 24.5vw, 360px)",
      dy: "clamp(168px, 27vh, 278px)",
      w: "clamp(128px, 11.6vw, 162px)",
      rotate: 2.8,
      depth: 8,
    },
    mobile: {
      dx: "clamp(78px, 25vw, 104px)",
      dy: "25vh",
      w: "clamp(88px, 24vw, 104px)",
      rotate: 2.6,
      depth: 3,
    },
    phoneHidden: true,
    separate: { x: 2, y: 2.3 },
    exit: { x: -2.6, y: 24, rotate: -2, scale: 0.68, opacity: 0.24 },
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
  const centerOpacity = useTransform(progress, [0, 0.6, 1], [1, 0.95, 0.62]);
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
            <ArtifactScene
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
                    href={WORK_HREF}
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

        /* The block is centred on the sticky stage, but everything INSIDE it
           is normal flow — name, then description, then buttons, each with its
           own margin. Nothing is absolutely placed and nothing is pulled up
           with negative margin, so the text can never stack on itself. */
        .hero-center-anchor {
          position: absolute;
          z-index: 7;
          left: 50%;
          top: 48.5%;
          width: min(720px, calc(100% - 48px));
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
          font-weight: 700;
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
          max-width: 16ch;
          margin: 0 auto;
          color: var(--text-primary,#090909);
          font-size: clamp(42px,4.7vw,76px);
          font-weight: 900;
          line-height: 1.04;
          letter-spacing: -.042em;
          text-align: center;
          text-wrap: balance;
        }

        /* Arabic needs the extra leading and the descender room, and it must
           be free to wrap: no nowrap anywhere on this element. */
        [dir="rtl"] .hero-name-title {
          max-width: 14ch;
          letter-spacing: 0;
          line-height: 1.22;
          padding-bottom: .1em;
        }

        .hero-positioning {
          display: block;
          width: 100%;
          max-width: 560px;
          margin: 18px auto 0;
          color: var(--text-secondary,#656565);
          font-size: clamp(15px,1.2vw,18px);
          line-height: 1.7;
          text-wrap: balance;
        }

        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 11px;
          margin-top: 30px;
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
          font-weight: 700;
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

        /* ---------- floating artifacts ---------- */

        .hero-scene {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          perspective: 1700px;
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
          inset: -14%;
          border-radius: 44%;
          background: var(--art-glow);
          filter: blur(30px);
          opacity: .5;
        }

        /* ---- shared artifact furniture ---- */

        .art {
          position: relative;
          display: block;
          width: 100%;
          margin: 0;
          color: #0b0d11;
        }

        [data-theme="dark"] .art { color: #f3f5f9; }

        .art-shot {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: var(--ar, 1.5);
          overflow: hidden;
          background: #e9ebef;
        }

        [data-theme="dark"] .art-shot { background: #1b1e25; }

        .art-shot img { object-fit: cover; }

        .art strong {
          display: block;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: -.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        [dir="rtl"] .art strong { letter-spacing: 0; }

        .art figcaption > span,
        .art-console-copy span,
        .art-tag span {
          display: block;
          margin-top: 2px;
          color: #79828f;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        [data-theme="dark"] .art figcaption > span,
        [data-theme="dark"] .art-console-copy span,
        [data-theme="dark"] .art-tag span { color: rgba(255,255,255,.55); }

        .art-tech,
        .art-year {
          flex: 0 0 auto;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 9px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: .01em;
          white-space: nowrap;
        }

        .art-tech {
          background: color-mix(in srgb, var(--art-accent) 15%, transparent);
          color: color-mix(in srgb, var(--art-accent) 80%, #1b1f27);
        }

        [data-theme="dark"] .art-tech {
          color: color-mix(in srgb, var(--art-accent) 90%, #ffffff);
        }

        /* a year range reads left-to-right in both scripts */
        .art-year {
          direction: ltr;
          background: rgba(12,14,18,.06);
          color: #5d6673;
        }

        [data-theme="dark"] .art-year {
          background: rgba(255,255,255,.09);
          color: rgba(255,255,255,.62);
        }

        /* ---- 1. device — the anchor: real UI, drawn phone body ---- */

        .art-device { display: block; }

        .art-device-body {
          position: relative;
          display: block;
          padding: 2.4%;
          border-radius: 15% / 6.9%;
          /* titanium rail: two light sources, no flat grey */
          background:
            linear-gradient(148deg,#8f949e 0%,#2a2d34 16%,#585d67 38%,#1d2026 62%,#6e737d 84%,#232630 100%);
          box-shadow:
            0 42px 60px -26px rgba(12,17,29,.52),
            0 14px 26px -14px rgba(12,17,29,.34),
            inset 0 0 0 .5px rgba(255,255,255,.35);
        }

        .art-device-screen {
          position: relative;
          display: block;
          overflow: hidden;
          border-radius: 13.2% / 6.1%;
          background: #000;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.85);
        }

        /* the screenshot already carries the status bar and dynamic island —
           drawing another notch on top would double it */
        .art-device-screen .art-shot { aspect-ratio: var(--ar); }

        .art-device-btn {
          position: absolute;
          width: 1.6%;
          border-radius: 2px;
          background: linear-gradient(180deg,#6c717b,#2b2e35);
        }

        .art-device-btn-a { inset-inline-start: -1.1%; top: 21%; height: 7%; }
        .art-device-btn-b { inset-inline-start: -1.1%; top: 31%; height: 11%; }
        .art-device-btn-c { inset-inline-end: -1.1%; top: 26%; height: 13%; }

        .art-device-gloss {
          position: absolute;
          inset: 0;
          border-radius: 15% / 6.9%;
          background: linear-gradient(118deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 34%);
          pointer-events: none;
        }

        /* identity rides beside the device, not in a box around it */
        .art-tag-device {
          position: absolute;
          inset-inline-end: -6%;
          bottom: calc(100% + 12px);
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 9px 12px;
          border-radius: 13px;
          background: rgba(255,255,255,.94);
          border: 1px solid rgba(0,0,0,.05);
          box-shadow: 0 16px 30px -14px rgba(15,23,42,.34);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        [data-theme="dark"] .art-tag-device {
          background: rgba(22,25,31,.92);
          border-color: rgba(255,255,255,.09);
        }

        .art-tag-device .art-year { align-self: flex-start; margin-top: 1px; }

        /* ---- 2. console — the live report, cropped to stay legible ---- */

        .art-console {
          padding: 7px 7px 0;
          border-radius: 15px;
          background: #fff;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow:
            0 34px 56px -24px rgba(15,23,42,.34),
            0 10px 20px -12px rgba(15,23,42,.2);
        }

        [data-theme="dark"] .art-console {
          background: #171a21;
          border-color: rgba(255,255,255,.09);
          box-shadow: 0 36px 60px -24px rgba(0,0,0,.66);
        }

        .art-console-stage {
          position: relative;
          display: block;
          aspect-ratio: var(--ar, 1.6);
          overflow: hidden;
          border-radius: 10px;
          background: #0b0d12;
        }

        /* Rendered wider than the frame and pulled up, so what shows is the
           executive summary at readable size rather than a whole dashboard
           shrunk into noise. */
        /* The report sizes itself in container-query units. Its own element
           declares the container, and a container cannot query itself, so
           without this wrapper those units fell back to the viewport and the card
           rendered at poster size. */
        .art-console-zoom {
          position: absolute;
          container-type: inline-size;
          inset-inline-start: 0;
          top: -3%;
          display: block;
          width: 150%;
          pointer-events: none;
        }

        .art-console-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(158deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,0) 44%);
          pointer-events: none;
        }

        /* the same product's sign-in screen, layered as the second surface */
        .art-console-inset {
          position: absolute;
          z-index: 2;
          overflow: hidden;
          inset-inline-start: -8%;
          bottom: -14%;
          width: 31%;
          aspect-ratio: 0.89;
          overflow: hidden;
          border-radius: 9px;
          background: #f7f4ef;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 18px 30px -14px rgba(15,23,42,.4);
        }

        .art-console-inset img { object-fit: cover; }

        .art-console-plate {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 4px 10px;
        }

        .art-console-copy { min-width: 0; flex: 1 1 auto; }

        /* ---- 3. plate — a product photograph, cropped tight ---- */

        .art-plate {
          overflow: hidden;
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(0,0,0,.06);
          box-shadow:
            0 28px 48px -20px rgba(15,23,42,.32),
            0 8px 16px -10px rgba(15,23,42,.18);
        }

        [data-theme="dark"] .art-plate {
          background: #14161c;
          border-color: rgba(255,255,255,.09);
          box-shadow: 0 30px 52px -20px rgba(0,0,0,.62);
        }

        .art-plate .art-shot { border-radius: 18px 18px 0 0; }

        .art-plate-cap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 9px 11px 11px;
        }

        .art-plate-copy { min-width: 0; width: 100%; }

        /* ---- 4. photo — the strongest treatment, kept ---- */

        .art-photo {
          overflow: hidden;
          border-radius: 20px;
          border: 3px solid #fff;
          box-shadow:
            0 30px 52px -20px rgba(15,23,42,.38),
            0 9px 18px -10px rgba(15,23,42,.24);
        }

        [data-theme="dark"] .art-photo {
          border-color: rgba(255,255,255,.14);
          box-shadow: 0 32px 58px -20px rgba(0,0,0,.7);
        }

        .art-photo .art-shot { border-radius: 17px; }

        .art-grade {
          position: absolute;
          inset: 0;
          border-radius: 17px;
          background: linear-gradient(to top, rgba(8,10,14,.8) 0%, rgba(8,10,14,.18) 44%, transparent 68%);
          pointer-events: none;
        }

        .art-photo-cap {
          position: absolute;
          inset-inline: 11px;
          bottom: 10px;
          color: #fff;
        }

        .art-photo-cap strong { color: #fff; }
        .art-photo-cap > span { color: rgba(255,255,255,.74); }

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
          font-weight: 700;
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

        @media (max-width: 1023px) and (min-width: 761px) {
          .hero-stage-inner { width: min(960px,calc(100% - 24px)); }

          .hero-positioning { max-width: 440px; }

          .hero-object-emkan { --dx: clamp(252px, 36vw, 320px); }
          .hero-object-alrajhi { --dx: clamp(240px, 34vw, 300px); }
          .hero-object-film { --dx: clamp(-330px, -37vw, -252px); }
          .hero-object-workshop { --dx: clamp(-310px, -35vw, -240px); }
        }

        @media (max-width: 760px) {
          .hero-story { height: 132svh; min-height: 850px; }
          .hero-sticky-stage { min-height: 620px; }
          .hero-stage-inner { width: 100%; }

          .hero-object {
            width: var(--mw);
            transform: translate(calc(-50% + var(--mdx)), calc(-50% + var(--mdy)));
          }

          /* Two artifacts stand down on phones — three well-spaced objects
             read as a composition, five crammed into 390px read as clutter. */
          .hero-object[data-phone-hidden="1"] { display: none; }

          .art strong { font-size: 10.5px; }
          .art figcaption > span,
          .art-console-copy span,
          .art-tag span { font-size: 8.5px; }
          .art-tech, .art-year { font-size: 8px; padding: 2px 5px; }
          /* the device's identity plate has nowhere to sit at 390px without
             touching either the top bar or the wordmark — the first timeline
             proof card names the same product a screen later */
          .art-tag-device { display: none; }
          .art-photo-cap > span { display: none; }
          .art-chrome { height: 15px; }
          .art-url { font-size: 7px; }

          .hero-center-anchor {
            top: 49%;
            width: calc(100% - 32px);
            max-width: 420px;
          }

          .hero-role-cycle { height: 20px; margin-bottom: 6px; }

          .hero-name-title {
            max-width: none;
            font-size: clamp(38px,11.5vw,54px);
            line-height: 1.08;
          }

          [dir="rtl"] .hero-name-title {
            max-width: none;
            line-height: 1.24;
            padding-bottom: .12em;
          }

          .hero-positioning {
            max-width: none;
            padding-inline: 4px;
            margin-top: 14px;
            font-size: 14.5px;
            line-height: 1.7;
          }

          .hero-cta-row {
            width: 100%;
            max-width: 340px;
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 9px;
            margin-top: 24px;
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
            left: calc(50% - 96px);
            top: 29%;
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
          .hero-avatar-orbit { left: calc(50% - 88px); top: 28%; width: 50px; height: 50px; }
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
/* Artifact scene                                                      */
/* ------------------------------------------------------------------ */

function ArtifactScene({
  lang,
  progress,
  mx,
  my,
  ready,
  isMobile,
  still,
}: {
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
      {/* the report component ships its own self-contained styles */}
      <WorkObjectStyles />
      {ARTIFACTS.map((artifact, index) => (
        <ArtifactObject
          key={artifact.id}
          artifact={artifact}
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

function ArtifactObject({
  artifact,
  index,
  lang,
  progress,
  mx,
  my,
  ready,
  isMobile,
  still,
}: {
  artifact: Artifact;
  index: number;
  lang: "ar" | "en";
  progress: MotionValue<number>;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  ready: boolean;
  isMobile: boolean;
  still: boolean;
}) {
  const place = isMobile ? artifact.mobile : artifact.desktop;
  const { separate, exit, anchor } = artifact;

  /* 0–15% hold · 15–38% separate · 38–66% travel · 66–100% settle on the route.
     The lead artifact runs the same path a beat later and stops larger, so the
     composition collapses toward one object instead of five at once. */
  const stops = anchor ? [0, 0.18, 0.44, 0.74, 1] : [0, 0.15, 0.38, 0.66, 0.94];

  const travelX = useTransform(progress, stops, [
    "0vw",
    "0vw",
    `${separate.x}vw`,
    `${exit.x * 0.55}vw`,
    `${exit.x}vw`,
  ]);

  const travelY = useTransform(progress, stops, [
    "0vh",
    "0vh",
    `${separate.y}vh`,
    `${exit.y * 0.48}vh`,
    `${exit.y}vh`,
  ]);

  const scale = useTransform(progress, stops, [1, 1, 1.04, 0.98, exit.scale]);

  const rotate = useTransform(progress, stops, [
    place.rotate,
    place.rotate,
    place.rotate * 0.6,
    exit.rotate * 0.5,
    exit.rotate,
  ]);

  /* Nothing ever reaches zero: the stage recedes with the artifacts still on
     it, so the handoff to the timeline is never a blank screen. */
  const opacity = useTransform(
    progress,
    [0, 0.16, 0.82, 1],
    [1, 1, anchor ? 0.86 : 0.74, exit.opacity],
  );

  /* Depth: the further an object sits from the identity, the softer it goes as
     it recedes — a cheap, honest atmospheric cue rather than a blur effect. */
  const depthBlur = useTransform(progress, [0.62, 1], [0, anchor ? 0.6 : 1.8]);
  const filter = useMotionTemplate`blur(${depthBlur}px)`;

  const pointerX = useTransform(mx, [-0.5, 0.5], [-place.depth, place.depth]);
  const pointerY = useTransform(my, [-0.5, 0.5], [-place.depth * 0.5, place.depth * 0.5]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-place.depth * 0.32, place.depth * 0.32]);
  const rotateX = useTransform(my, [-0.5, 0.5], [place.depth * 0.26, -place.depth * 0.26]);

  const style = {
    "--dx": artifact.desktop.dx,
    "--dy": artifact.desktop.dy,
    "--w": artifact.desktop.w,
    "--mdx": artifact.mobile.dx,
    "--mdy": artifact.mobile.dy,
    "--mw": artifact.mobile.w,
    "--art-accent": artifact.accent,
    "--art-glow": artifact.glow,
    "--ar": String(artifact.ratio ?? 1.5),
  } as CSSProperties;

  return (
    <div
      className={`hero-object hero-object-${artifact.id}`}
      data-phone-hidden={artifact.phoneHidden ? "1" : "0"}
      style={style}
    >
      <motion.div
        className="ho-travel"
        style={
          still
            ? { rotate: place.rotate }
            : { x: travelX, y: travelY, scale, rotate, opacity, filter }
        }
      >
        <motion.div
          className="ho-enter"
          initial={{
            opacity: 0,
            scale: 0.92,
            y: 24,
            rotateX: index % 2 === 0 ? 8 : -7,
            rotateY: index % 2 === 0 ? -6 : 6,
          }}
          animate={
            ready
              ? { opacity: 1, scale: 1, y: 0, rotateX: 0, rotateY: 0 }
              : { opacity: 0, scale: 0.92, y: 24 }
          }
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 26,
            mass: 0.72,
            delay: still ? 0 : 0.06 + index * 0.07,
          }}
        >
          <motion.div
            className="ho-pointer"
            style={still ? undefined : { x: pointerX, y: pointerY, rotateX, rotateY }}
          >
            <span className="ho-halo" aria-hidden="true" />
            <ArtifactCard artifact={artifact} lang={lang} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One artifact, five genuinely different objects                      */
/* ------------------------------------------------------------------ */

function ArtifactCard({ artifact, lang }: { artifact: Artifact; lang: "ar" | "en" }) {
  const shot = artifact.image ? (
    <span className="art-shot">
      <Image
        src={artifact.image}
        alt=""
        fill
        sizes="(max-width: 760px) 200px, 320px"
        quality={92}
        style={artifact.pos ? { objectPosition: artifact.pos } : undefined}
      />
    </span>
  ) : null;

  /* ── the app, in a phone that is drawn rather than photographed ── */
  if (artifact.variant === "device") {
    return (
      <figure className="art art-device">
        <span className="art-device-body">
          <span className="art-device-screen">{shot}</span>
          <span className="art-device-btn art-device-btn-a" aria-hidden="true" />
          <span className="art-device-btn art-device-btn-b" aria-hidden="true" />
          <span className="art-device-btn art-device-btn-c" aria-hidden="true" />
          <span className="art-device-gloss" aria-hidden="true" />
        </span>
        <figcaption className="art-tag art-tag-device">
          <strong>{artifact.title[lang]}</strong>
          <span>{artifact.meta[lang]}</span>
          {artifact.year && <em className="art-year">{artifact.year}</em>}
        </figcaption>
      </figure>
    );
  }

  /**
   * The Film Accelerator report — the real component, not a screenshot of one.
   *
   * `DashboardCard` is container-query typed, so rendering it at ~2× the frame
   * width and cropping to the executive summary keeps the figures legible at
   * hero scale instead of shrinking a whole dashboard into an unreadable
   * texture. The product's own sign-in screen sits under it as the second
   * surface of the same engagement.
   */
  if (artifact.variant === "console") {
    return (
      <figure className="art art-console">
        <span className="art-console-stage">
          <span className="art-console-zoom">
            <DashboardCard lang={lang} />
          </span>
          <span className="art-console-sheen" aria-hidden="true" />

          {artifact.inset && (
            <span className="art-console-inset">
              <Image
                src={artifact.inset}
                alt=""
                fill
                sizes="120px"
                quality={90}
                style={{ objectPosition: "center 36%" }}
              />
            </span>
          )}
        </span>

        <figcaption className="art-console-plate">
          <span className="art-console-copy">
            <strong>{artifact.title[lang]}</strong>
            <span>{artifact.meta[lang]}</span>
          </span>
          {artifact.year && <em className="art-year">{artifact.year}</em>}
        </figcaption>
      </figure>
    );
  }

  /* ── a product photograph, cropped tight to the devices ── */
  if (artifact.variant === "plate") {
    return (
      <figure className="art art-plate">
        {shot}
        <figcaption className="art-plate-cap">
          <span className="art-plate-copy">
            <strong>{artifact.title[lang]}</strong>
            <span>{artifact.meta[lang]}</span>
          </span>
          {artifact.tech && <em className="art-tech">{artifact.tech}</em>}
        </figcaption>
      </figure>
    );
  }

  /* ── the photograph ── */
  return (
    <figure className="art art-photo">
      {shot}
      <span className="art-grade" aria-hidden="true" />
      <figcaption className="art-photo-cap">
        <strong>{artifact.title[lang]}</strong>
        <span>{artifact.meta[lang]}</span>
      </figcaption>
    </figure>
  );
}
