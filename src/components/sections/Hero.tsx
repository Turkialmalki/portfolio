"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const EASE: [number, number, number, number] = [
  0.16,
  1,
  0.3,
  1,
];

type HeroProject = {
  title: string;
  brand: string;
  image: string;
  logo: string;
  objectPosition?: string;
  imageScale?: number;
};

const PROJECTS: HeroProject[] = [
  {
    title: "Al Rajhi Mobile Banking",
    brand: "Al Rajhi Bank",
    image: "/alrajhi2026.png",
    logo: "/alrajhilogo.png",
    objectPosition: "center center",
    imageScale: 1.32,
  },
  {
    title: "Engineering MasterPiece",
    brand: "Fintech",
    image: "/casdd.png",
    logo: "/money.png",
    objectPosition: "center center",
    imageScale: 1,
  },
    {
    title: "Emkan",
    brand: "Emkan",
    image: "/emkan2026.png",
    logo: "/emkanlogo.png",
    objectPosition: "center center",
    imageScale: 1.1,
  },
  {
    title: "Ithnain Mobile Experience",
    brand: "Ithnain",
    image: "/ithnin2026.png",
    logo: "ithninlogo.jpeg",
    objectPosition: "center center",
    imageScale: 1.25,
  },
  {
    title: "Munaseb Digital Platform",
    brand: "Munaseb",
    image: "munasib2026.png",
    logo: "/munasiblogo.jpeg",
    objectPosition: "center center",
    imageScale: 1.3,
  },
  {
    title: "Wijhut Travel Experience",
    brand: "Wijhut",
    image: "/wijhut2026.png",
    logo: "/wjhut.png",
    objectPosition: "center center",
    imageScale: 1.1,
  },
];

const FIRST_ROW: HeroProject[] = [
  ...PROJECTS,
  ...PROJECTS,
];

const REVERSED_PROJECTS = [...PROJECTS].reverse();

const SECOND_ROW: HeroProject[] = [
  ...REVERSED_PROJECTS,
  ...REVERSED_PROJECTS,
];

type HeroProps = {
  ready?: boolean;
};

export default function Hero({
  ready = true,
}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const portraitY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "8%"],
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-root"
    >
      <div className="hero-container">
        <div className="hero-copy">
          <div className="hero-heading">
            <div className="hero-heading-line">
              <motion.h1
                initial={{
                  y: "110%",
                  opacity: 0,
                }}
                animate={
                  ready
                    ? {
                        y: 0,
                        opacity: 1,
                      }
                    : {
                        y: "110%",
                        opacity: 0,
                      }
                }
                transition={{
                  duration: 0.95,
                  ease: EASE,
                  delay: 0.06,
                }}
                className="hero-title"
              >
                Hello! 👋 I&apos;m
              </motion.h1>
            </div>

            <div className="hero-heading-line">
              <motion.h1
                initial={{
                  y: "110%",
                  opacity: 0,
                }}
                animate={
                  ready
                    ? {
                        y: 0,
                        opacity: 1,
                      }
                    : {
                        y: "110%",
                        opacity: 0,
                      }
                }
                transition={{
                  duration: 0.95,
                  ease: EASE,
                  delay: 0.12,
                }}
                className="hero-title hero-name"
              >
                Turki Almalki
              </motion.h1>
            </div>
          </div>

          <motion.p
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={
              ready
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    y: 18,
                  }
            }
            transition={{
              duration: 0.8,
              ease: EASE,
              delay: 0.22,
            }}
            className="hero-description"
          >
            I&apos;m an engineering leader and product innovator
            building{" "}
            <strong>
              scalable, intuitive, and impactful digital products.
            </strong>
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={
              ready
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    y: 14,
                  }
            }
            transition={{
              duration: 0.75,
              ease: EASE,
              delay: 0.32,
            }}
            className="hero-actions"
          >
            <PillButton href="/projects">
              View Portfolio
            </PillButton>
          </motion.div>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
            y: 18,
          }}
          animate={
            ready
              ? {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  scale: 0.9,
                  y: 18,
                }
          }
          transition={{
            duration: 1,
            ease: EASE,
            delay: 0.16,
          }}
          style={{
            y: portraitY,
          }}
          className="hero-portrait-column"
        >
          <HeroPortrait />
        </motion.div>
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 26,
        }}
        animate={
          ready
            ? {
                opacity: 1,
                y: 0,
              }
            : {
                opacity: 0,
                y: 26,
              }
        }
        transition={{
          duration: 0.9,
          ease: EASE,
          delay: 0.42,
        }}
        className="hero-gallery"
      >
        <MarqueeRow
          projects={FIRST_ROW}
          direction="left"
          duration={45}
          delay={-12}
        />

        <MarqueeRow
          projects={SECOND_ROW}
          direction="right"
          duration={52}
          delay={-20}
        />
      </motion.div>

      <style>{`
        .hero-root {
          --hero-card-background: #E8E8E8;
          --hero-card-border: rgba(0, 0, 0, 0);

          --hero-badge-background:
            rgba(255, 255, 255, 0.94);

          --hero-badge-border:
            rgba(0, 0, 0, 0.07);

          --hero-badge-shadow:
            0 10px 28px rgba(0, 0, 0, 0.1);

          width: 100%;
          overflow: hidden;

          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #090909);

          transition:
            background-color 300ms ease,
            color 300ms ease;
        }

        :global(.dark) .hero-root,
        :global([data-theme="dark"]) .hero-root {
          --hero-card-background: #1d1f23;
          --hero-card-border:
            rgba(255, 255, 255, 0.075);

          --hero-badge-background:
            rgba(34, 36, 41, 0.94);

          --hero-badge-border:
            rgba(255, 255, 255, 0.09);

          --hero-badge-shadow:
            0 12px 30px rgba(0, 0, 0, 0.28);
        }

        /*
         * Main hero area
         */

        .hero-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;

          padding-top: clamp(108px, 9vw, 132px);
          padding-bottom: clamp(42px, 5vw, 60px);

          display: grid;
          grid-template-columns:
            minmax(0, 1.35fr)
            minmax(280px, 0.65fr);

          align-items: center;
          gap: clamp(56px, 8vw, 112px);
        }

        .hero-copy {
          min-width: 0;
          max-width: 720px;
        }

        .hero-heading {
          margin-bottom: clamp(18px, 2vw, 24px);
        }

        .hero-heading-line {
          overflow: hidden;
        }

        .hero-title {
          margin: 0;

          color: var(--text-primary, #090909);

          font-size: clamp(52px, 6.2vw, 82px);
          font-weight: 800;
          line-height: 0.99;
          letter-spacing: -0.06em;

          transition: color 300ms ease;
        }

        .hero-name {
          width: fit-content;
          margin-top: 4px;

          background:
            linear-gradient(
              105deg,
              #1495ff 0%,
              #0cbdda 45%,
              #09cda4 100%
            );

          background-clip: text;
          -webkit-background-clip: text;

          color: transparent;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          max-width: 660px;
          margin: 0 0 30px;

          color: var(--text-secondary, #666666);

          font-size: clamp(19px, 1.65vw, 24px);
          font-weight: 500;
          line-height: 1.42;
          letter-spacing: -0.028em;

          transition: color 300ms ease;
        }

        .hero-description strong {
          color: var(--text-primary, #090909);
          font-weight: 750;

          transition: color 300ms ease;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /*
         * Portrait and floating badges
         */

        .hero-portrait-column {
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-portrait-stage {
          position: relative;

          width: clamp(300px, 27vw, 380px);
          aspect-ratio: 1 / 1;
        }

        .hero-portrait {
          position: absolute;
          inset: 22px;

          overflow: hidden;

          border-radius: 50%;

          background:
            linear-gradient(
              145deg,
              #0ba9ff 0%,
              #05d4aa 100%
            );

          border:
            3px solid rgba(20, 149, 255, 0.22);

          box-shadow:
            0 24px 68px rgba(20, 149, 255, 0.22);
        }

        .hero-portrait::before {
          content: "";

          position: absolute;
          inset: 0;
          z-index: 1;

          pointer-events: none;

          background:
            radial-gradient(
              circle at 52% 35%,
              rgba(255, 255, 255, 0.15),
              transparent 58%
            );
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
          gap: 10px;

          padding: 11px 14px;

          color: var(--text-primary, #090909);
          background: var(--hero-badge-background);

          border:
            1px solid
            var(--hero-badge-border);

          border-radius: 16px;

          box-shadow: var(--hero-badge-shadow);

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          transition:
            color 300ms ease,
            background-color 300ms ease,
            border-color 300ms ease;
        }

        .hero-experience-badge {
          top: 28px;
          left: -6px;
        }

        .hero-location-badge {
          right: -4px;
          bottom: 24px;
        }

        .hero-badge-value {
          margin: 0;

          color: var(--accent, #1495ff);

          font-size: 22px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .hero-badge-title {
          margin: 0;

          color: var(--text-primary, #090909);

          font-size: 13px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;

          white-space: nowrap;
        }

        .hero-badge-description {
          margin: 4px 0 0;

          color: var(--text-secondary, #666666);

          font-size: 10px;
          line-height: 1.1;

          white-space: nowrap;
        }

        .hero-location-dot {
          width: 8px;
          height: 8px;

          flex: 0 0 auto;

          border-radius: 50%;
          background: #ef4444;

          box-shadow:
            0 0 0 4px rgba(239, 68, 68, 0.12);
        }

        /*
         * Moving project gallery
         */

        .hero-gallery {
          --hero-gallery-gap:
            clamp(12px, 1.1vw, 18px);

          --hero-gallery-card-width:
            clamp(280px, 21vw, 370px);

          width: 100%;

          display: flex;
          flex-direction: column;
          gap: var(--hero-gallery-gap);

          padding-top: 4px;
          padding-bottom: clamp(72px, 8vw, 104px);

          overflow: hidden;
        }

        .hero-marquee-viewport {
          width: 100%;
          overflow: hidden;

          -webkit-mask-image:
            linear-gradient(
              90deg,
              transparent 0%,
              #000 3%,
              #000 97%,
              transparent 100%
            );

          mask-image:
            linear-gradient(
              90deg,
              transparent 0%,
              #000 3%,
              #000 97%,
              transparent 100%
            );
        }

        .hero-marquee-track {
          width: max-content;

          display: flex;
          align-items: center;
          gap: var(--hero-gallery-gap);

          will-change: transform;
          backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
        }

        .hero-marquee-track-left {
          animation:
            hero-marquee-left
            var(--hero-marquee-duration)
            linear
            infinite;

          animation-delay:
            var(--hero-marquee-delay);
        }

        .hero-marquee-track-right {
          animation:
            hero-marquee-right
            var(--hero-marquee-duration)
            linear
            infinite;

          animation-delay:
            var(--hero-marquee-delay);
        }

        .hero-marquee-viewport:hover
        .hero-marquee-track {
          animation-play-state: paused;
        }

        /*
         * Outer wrapper stays visible.
         * Inner surface clips only the project artwork.
         */

        .hero-gallery-card {
          position: relative;

          flex:
            0 0
            var(--hero-gallery-card-width);

          width:
            var(--hero-gallery-card-width);

          aspect-ratio: 1.5 / 1;

          overflow: visible;
          background: transparent;
          border: none;
        }

        .hero-gallery-surface {
          position: absolute;
          inset: 0;

          overflow: hidden;

          background:
            var(--hero-card-background);

          border:
            1px solid
            var(--hero-card-border);

          border-radius:
            clamp(22px, 1.7vw, 30px);

          transition:
            transform 350ms
              cubic-bezier(0.16, 1, 0.3, 1),
            background-color 300ms ease,
            border-color 300ms ease,
            box-shadow 350ms ease;
        }

        .hero-gallery-card:hover
        .hero-gallery-surface {
          transform: translateY(-3px);

          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.09);
        }

        .hero-gallery-media {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          background: transparent;
          border-radius: inherit;
        }

        .hero-gallery-art {
          position: relative;

          width: 100%;
          height: 100%;

          transform:
            scale(var(--project-scale, 1));

          transform-origin: center center;

          transition:
            transform 420ms
              cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-gallery-card:hover
        .hero-gallery-art {
          transform:
            scale(
              calc(
                var(--project-scale, 1) + 0.02
              )
            );
        }

        .hero-gallery-image {
          object-fit: contain;
          object-position: center center;

          filter:
            drop-shadow(
              0 15px 18px
              rgba(0, 0, 0, 0.14)
            );
        }

        /*
         * Floating project logo badge
         */

        .project-brand-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 10;

          display: inline-flex;
          align-items: center;
          gap: 8px;

          min-height: 38px;
          max-width: calc(100% - 28px);

          padding: 6px 12px 6px 7px;

          color: var(--text-primary, #111111);
          background: var(--hero-badge-background);

          border:
            1px solid
            var(--hero-badge-border);

          border-radius: 999px;

          box-shadow: var(--hero-badge-shadow);

          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);

          pointer-events: none;

          transition:
            transform 300ms ease,
            color 300ms ease,
            background-color 300ms ease,
            border-color 300ms ease;
        }

        .hero-gallery-card:hover
        .project-brand-badge {
          transform: translateY(-1px);
        }

        /*
         * Explicit image sizing prevents logos
         * from being cropped by Next Image fill.
         */

        .project-brand-logo {
          width: 28px;
          height: 28px;

          flex: 0 0 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          background: #ffffff;

          border:
            1px solid rgba(0, 0, 0, 0.055);

          border-radius: 50%;
        }

        .project-brand-logo-image {
          width: 19px;
          height: 19px;

          display: block;

          object-fit: contain;
        }

        .project-brand-name {
          max-width: 132px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.015em;
        }

        @keyframes hero-marquee-left {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform:
              translate3d(
                calc(
                  -50% -
                  (var(--hero-gallery-gap) / 2)
                ),
                0,
                0
              );
          }
        }

        @keyframes hero-marquee-right {
          from {
            transform:
              translate3d(
                calc(
                  -50% -
                  (var(--hero-gallery-gap) / 2)
                ),
                0,
                0
              );
          }

          to {
            transform: translate3d(0, 0, 0);
          }
        }

        /*
         * Tablet
         */

        @media (max-width: 960px) {
          .hero-container {
            grid-template-columns:
              minmax(0, 1.15fr)
              minmax(230px, 0.85fr);

            gap: 42px;
          }

          .hero-title {
            font-size:
              clamp(48px, 6.8vw, 66px);
          }

          .hero-description {
            font-size:
              clamp(18px, 2vw, 21px);
          }

          .hero-portrait-stage {
            width:
              clamp(270px, 31vw, 330px);
          }

          .hero-gallery {
            --hero-gallery-card-width:
              clamp(265px, 30vw, 330px);
          }

          .project-brand-name {
            max-width: 105px;
          }
        }

        /*
         * Mobile
         */

        @media (max-width: 760px) {
          .hero-container {
            width:
              min(620px, calc(100% - 32px));

            grid-template-columns: 1fr;

            padding-top: 86px;
            padding-bottom: 44px;

            gap: 34px;

            text-align: center;
          }

          .hero-portrait-column {
            grid-row: 1;
          }

          .hero-copy {
            grid-row: 2;

            max-width: 600px;
            margin: 0 auto;
          }

          .hero-heading {
            margin-bottom: 17px;
          }

          .hero-title {
            font-size:
              clamp(42px, 11vw, 58px);

            line-height: 1.01;
          }

          .hero-name {
            margin-inline: auto;
            margin-top: 3px;
          }

          .hero-description {
            max-width: 560px;

            margin-inline: auto;
            margin-bottom: 26px;

            font-size: 18px;
            line-height: 1.45;
          }

          .hero-actions {
            justify-content: center;
          }

          .hero-portrait-stage {
            width:
              clamp(270px, 76vw, 340px);
          }

          .hero-experience-badge {
            top: 18px;
            left: 0;
          }

          .hero-location-badge {
            right: 0;
            bottom: 15px;
          }

          .hero-gallery {
            --hero-gallery-card-width:
              clamp(245px, 64vw, 310px);

            --hero-gallery-gap: 12px;

            padding-bottom: 78px;
          }

          .project-brand-badge {
            top: 11px;
            left: 11px;

            min-height: 34px;

            padding:
              5px 9px 5px 6px;
          }

          .project-brand-logo {
            width: 24px;
            height: 24px;
            flex-basis: 24px;
          }

          .project-brand-logo-image {
            width: 16px;
            height: 16px;
          }

          .project-brand-name {
            max-width: 94px;
            font-size: 10px;
          }
        }

        /*
         * Small mobile
         */

        @media (max-width: 480px) {
          .hero-container {
            padding-top: 76px;
            padding-bottom: 38px;

            gap: 28px;
          }

          .hero-title {
            font-size:
              clamp(38px, 11.5vw, 49px);
          }

          .hero-description {
            font-size: 16.5px;
            line-height: 1.48;
          }

          .hero-portrait-stage {
            width:
              min(290px, calc(100vw - 32px));
          }

          .hero-portrait {
            inset: 28px;
          }

          .hero-floating-badge {
            padding: 8px 10px;
            border-radius: 13px;
          }

          .hero-badge-value {
            font-size: 18px;
          }

          .hero-badge-title {
            font-size: 11px;
          }

          .hero-badge-description {
            font-size: 9px;
          }

          .hero-experience-badge {
            top: 17px;
            left: 2px;
          }

          .hero-location-badge {
            right: 2px;
            bottom: 16px;
          }

          .hero-gallery {
            --hero-gallery-card-width:
              clamp(220px, 72vw, 270px);

            --hero-gallery-gap: 10px;

            padding-bottom: 66px;
          }

          .hero-gallery-card {
            border-radius: 21px;
          }

          .project-brand-badge {
            top: 10px;
            left: 10px;

            width: 34px;
            height: 34px;

            min-height: 0;

            padding: 4px;

            justify-content: center;
          }

          .project-brand-logo {
            width: 25px;
            height: 25px;
            flex-basis: 25px;
          }

          .project-brand-logo-image {
            width: 17px;
            height: 17px;
          }

          .project-brand-name {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-marquee-track {
            animation-play-state: paused;
          }

          .hero-gallery-surface,
          .hero-gallery-art,
          .project-brand-badge {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function HeroPortrait() {
  return (
    <div className="hero-portrait-stage">
      <div className="hero-portrait">
        <Image
          src="/avatar.jpg"
          alt="Turki Almalki"
          fill
          priority
          sizes="
            (max-width: 480px) 234px,
            (max-width: 760px) 284px,
            336px
          "
          className="hero-portrait-image"
        />
      </div>

      <motion.div
        className="
          hero-floating-badge
          hero-experience-badge
        "
        initial={{
          opacity: 0,
          x: -14,
          y: -5,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: EASE,
          delay: 0.75,
        }}
      >
        <div>
          <p className="hero-badge-value">
            9+
          </p>

          <p className="hero-badge-description">
            Years Experience
          </p>
        </div>
      </motion.div>

      <motion.div
        className="
          hero-floating-badge
          hero-location-badge
        "
        initial={{
          opacity: 0,
          x: 14,
          y: 5,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: EASE,
          delay: 0.9,
        }}
      >
        <span className="hero-location-dot" />

        <div>
          <p className="hero-badge-title">
            Turki Almalki
          </p>

          <p className="hero-badge-description">
            Riyadh, Saudi Arabia
          </p>
        </div>
      </motion.div>
    </div>
  );
}

type MarqueeRowProps = {
  projects: HeroProject[];
  direction: "left" | "right";
  duration: number;
  delay: number;
};

function MarqueeRow({
  projects,
  direction,
  duration,
  delay,
}: MarqueeRowProps) {
  return (
    <div className="hero-marquee-viewport">
      <div
        className={[
          "hero-marquee-track",
          direction === "left"
            ? "hero-marquee-track-left"
            : "hero-marquee-track-right",
        ].join(" ")}
        style={
          {
            "--hero-marquee-duration": `${duration}s`,
            "--hero-marquee-delay": `${delay}s`,
          } as CSSProperties
        }
      >
        {projects.map((project, index) => (
          <HeroGalleryCard
            key={`${direction}-${project.title}-${index}`}
            project={project}
          />
        ))}
      </div>
    </div>
  );
}

type HeroGalleryCardProps = {
  project: HeroProject;
};

function HeroGalleryCard({
  project,
}: HeroGalleryCardProps) {
  const imageScale =
    project.imageScale ?? 1;

  return (
    <article
      className="hero-gallery-card"
      aria-label={project.title}
      title={project.title}
      style={
        {
          "--project-scale": imageScale,
        } as CSSProperties
      }
    >
      <div className="hero-gallery-surface">
        <div className="hero-gallery-media">
          <div className="hero-gallery-art">
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="
                (max-width: 480px) 270px,
                (max-width: 760px) 310px,
                (max-width: 960px) 330px,
                370px
              "
              className="hero-gallery-image"
              style={{
                objectPosition:
                  project.objectPosition ??
                  "center center",
              }}
            />
          </div>
        </div>
      </div>

      <ProjectBrandBadge
        logo={project.logo}
        brand={project.brand}
      />
    </article>
  );
}

type ProjectBrandBadgeProps = {
  logo: string;
  brand: string;
};

function ProjectBrandBadge({
  logo,
  brand,
}: ProjectBrandBadgeProps) {
  return (
    <div className="project-brand-badge">
      <div className="project-brand-logo">
        <Image
          src={logo}
          alt={`${brand} logo`}
          width={19}
          height={19}
          className="project-brand-logo-image"
        />
      </div>

      <span className="project-brand-name">
        {brand}
      </span>
    </div>
  );
}

type PillButtonProps = {
  children: ReactNode;
  href: string;
};

function PillButton({
  children,
  href,
}: PillButtonProps) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.97,
      }}
      transition={{
        duration: 0.22,
        ease: EASE,
      }}
    >
      <Link
        href={href}
        onClick={() => trackEvent("portfolio_cta_click", { location: "hero" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",

          minHeight: 48,
          padding: "13px 28px",

          color: "#ffffff",
          background: "var(--accent, #1495ff)",

          borderRadius: 999,

          boxShadow:
            "0 10px 28px rgba(20, 149, 255, 0.24)",

          fontSize: 15,
          fontWeight: 650,
          lineHeight: 1,
          letterSpacing: "-0.015em",

          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}