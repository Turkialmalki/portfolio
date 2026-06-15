"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";

const AUTOPLAY_MS = 10000;
const INITIAL_PROJECT_INDEX = 0;

type Project = {
  title: string;
  subtitle: string;
  image: string;
  industry: string;
  category: string;
  href: string;
  imageMode: "photo" | "mockup";
  imagePosition?: string;
};

const PROJECTS: Project[] = [
  {
    title: "Monshaat",
    subtitle:
      "Led the digital revamp of the Innovation Center and built scalable internal tools, dashboards, and data systems supporting startups and innovation programs.",
    image: "/monshaat.jpg",
    industry: "Government Innovation",
    category: "Engineering Leadership",
    href: "/projects",
    imageMode: "photo",
    imagePosition: "center center",
  },
  {
    title: "Emkan",
    subtitle:
      "Led the engineering and modernization of scalable fintech experiences across mobile and web, improving architecture, delivery, and product quality.",
    image: "/emkan2025.png",
    industry: "Fintech",
    category: "Mobile Engineering",
    href: "/projects",
    imageMode: "mockup",
    imagePosition: "center center",
  },
  {
    title: "AlRajhi Bank",
    subtitle:
      "Designed, developed, and maintained customer-facing mobile banking experiences using React Native, clean architecture, and scalable frontend practices.",
    image: "/alrajhi2022.png",
    industry: "Digital Banking",
    category: "Mobile Architecture",
    href: "/projects",
    imageMode: "mockup",
    imagePosition: "center center",
  },
  {
    title: "Munaseb Digital Platform",
    subtitle:
      "Led engineering management and product delivery for Munaseb, aligning technology, user experience, and business goals into a focused digital platform.",
    image: "/munasib.png",
    industry: "Digital Product",
    category: "Engineering Management",
    href: "/projects",
    imageMode: "mockup",
    imagePosition: "center center",
  },
  {
    title: "Saudi Aramco",
    subtitle:
      "An early engineering and innovation experience that strengthened my foundations in enterprise technology, software delivery, and structured problem-solving.",
    image: "/aramco.jpeg",
    industry: "Energy & Enterprise",
    category: "Engineering COOP",
    href: "/projects",
    imageMode: "photo",
    imagePosition: "center center",
  },
];

export default function FeaturedWork() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(INITIAL_PROJECT_INDEX);
  const scrollFrameRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(
    INITIAL_PROJECT_INDEX,
  );

  const updateActiveIndex = useCallback((index: number) => {
    const safeIndex = Math.max(
      0,
      Math.min(index, PROJECTS.length - 1),
    );

    activeIndexRef.current = safeIndex;
    setActiveIndex(safeIndex);
  }, []);

  const scrollToIndex = useCallback(
    (
      index: number,
      behavior: ScrollBehavior = "smooth",
    ) => {
      const scroller = scrollerRef.current;

      const safeIndex = Math.max(
        0,
        Math.min(index, PROJECTS.length - 1),
      );

      const card = cardRefs.current[safeIndex];

      if (!scroller || !card) {
        return;
      }

      const cardCenter =
        card.offsetLeft + card.clientWidth / 2;

      const viewportCenter = scroller.clientWidth / 2;

      const targetLeft = cardCenter - viewportCenter;

      scroller.scrollTo({
        left: targetLeft,
        behavior,
      });

      updateActiveIndex(safeIndex);
    },
    [updateActiveIndex],
  );

  const showNextProject = () => {
    const nextIndex = activeIndexRef.current + 1;

    if (nextIndex >= PROJECTS.length) {
      return;
    }

    scrollToIndex(nextIndex);
  };

  const showPreviousProject = () => {
    const previousIndex = activeIndexRef.current - 1;

    if (previousIndex < 0) {
      return;
    }

    scrollToIndex(previousIndex);
  };

  const handleCarouselScroll = () => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const viewportCenter =
        scroller.scrollLeft + scroller.clientWidth / 2;

      let nearestIndex = activeIndexRef.current;
      let smallestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, index) => {
        if (!card) {
          return;
        }

        const cardCenter =
          card.offsetLeft + card.clientWidth / 2;

        const distance = Math.abs(
          cardCenter - viewportCenter,
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex !== activeIndexRef.current) {
        updateActiveIndex(nearestIndex);
      }
    });
  };

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(() => {
      scrollToIndex(INITIAL_PROJECT_INDEX, "auto");
    });

    const handleResize = () => {
      scrollToIndex(activeIndexRef.current, "auto");
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", handleResize);

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(
          scrollFrameRef.current,
        );
      }
    };
  }, [scrollToIndex]);

  useEffect(() => {
    if (activeIndex >= PROJECTS.length - 1) {
      return;
    }

    const autoplayTimer = window.setTimeout(() => {
      scrollToIndex(activeIndex + 1);
    }, AUTOPLAY_MS);

    return () => {
      window.clearTimeout(autoplayTimer);
    };
  }, [activeIndex, scrollToIndex]);

  const isFirstProject = activeIndex === 0;
  const isLastProject =
    activeIndex === PROJECTS.length - 1;

  return (
    <section
      id="featured-work"
      className="featured-work"
    >
      <div className="featured-heading">
        <div style={pillStyle}>Projects</div>

        <h2 style={titleStyle}>
          Featured Work
        </h2>

        <p style={subtitleStyle}>
          Engineering initiatives and digital products
          delivered across government, fintech, banking,
          and innovation.
        </p>
      </div>

      <div className="carousel-stage">
        <button
          type="button"
          onClick={showPreviousProject}
          disabled={isFirstProject}
          className="featured-arrow featured-arrow-left"
          aria-label="Show previous project"
        >
          ‹
        </button>

        <div
          ref={scrollerRef}
          className="featured-scroller"
          onScroll={handleCarouselScroll}
        >
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              refCallback={(element) => {
                cardRefs.current[index] = element;
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={showNextProject}
          disabled={isLastProject}
          className="featured-arrow featured-arrow-right"
          aria-label="Show next project"
        >
          ›
        </button>
      </div>

      <div
        className="carousel-progress"
        aria-label={`Project ${activeIndex + 1} of ${
          PROJECTS.length
        }`}
      >
        {PROJECTS.map((project, index) => (
          <button
            key={project.title}
            type="button"
            className={
              index === activeIndex
                ? "carousel-dot carousel-dot-active"
                : "carousel-dot"
            }
            aria-label={`Show ${project.title}`}
            aria-current={
              index === activeIndex
                ? "true"
                : undefined
            }
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>

      <div className="featured-cta">
        <Link
          href="/projects"
          style={viewAllStyle}
        >
          View All Projects
        </Link>
      </div>

      <style>{`
        .featured-work {
          --featured-card-width: min(
            900px,
            calc(100vw - 48px)
          );

          --featured-card-half: min(
            450px,
            calc((100vw - 48px) / 2)
          );

          --featured-card-gap: 120px;

          width: 100%;
          overflow: hidden;
          padding: clamp(84px, 9vw, 120px) 0;

          background: var(--bg-primary);

          transition:
            background-color 0.35s ease;
        }

        .featured-heading {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
          text-align: center;
        }

        .carousel-stage {
          position: relative;
          width: 100%;
          margin-top: clamp(48px, 5vw, 68px);
        }

        .featured-scroller {
          display: flex;
          gap: var(--featured-card-gap);

          width: 100%;
          overflow-x: auto;
          overflow-y: visible;

          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          overscroll-behavior-inline: contain;

          scrollbar-width: none;
          -ms-overflow-style: none;

          padding-inline: calc(
            (100vw - var(--featured-card-width)) / 2
          );

          padding-block: 14px 20px;
        }

        .featured-scroller::-webkit-scrollbar {
          display: none;
        }

        .project-slide {
          flex: 0 0 auto;
          width: var(--featured-card-width);

          scroll-snap-align: center;
          scroll-snap-stop: always;
        }

        .project-card {
          box-sizing: border-box;

          width: 100%;
          min-height: 410px;

          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(0, 0.95fr);

          gap: clamp(24px, 3vw, 38px);
          padding: 22px;

          overflow: hidden;

          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 34px;

          transition:
            background-color 0.35s ease,
            border-color 0.35s ease,
            box-shadow 0.35s ease;
        }

        .project-media {
          position: relative;

          min-width: 0;
          min-height: 364px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          background: var(--bg-card-muted);
          border-radius: 25px;

          transition:
            background-color 0.35s ease;
        }

        .project-media-photo {
          padding: 0;
        }

        .project-media-mockup {
          padding: clamp(20px, 2.5vw, 34px);
        }

        .project-image {
          display: block;

          width: 100%;
          height: 100%;

          transition:
            transform 0.45s
            cubic-bezier(0.16, 1, 0.3, 1);
        }

        .project-media-photo .project-image {
          object-fit: cover;
        }

        .project-media-mockup .project-image {
          object-fit: contain;
        }

        .project-card:hover .project-image {
          transform: scale(1.025);
        }

        .project-copy {
          min-width: 0;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding:
            clamp(22px, 3vw, 34px)
            12px
            10px
            0;

          text-align: left;
        }

        .project-copy-main {
          min-width: 0;
        }

        .project-title {
          max-width: 390px;
          margin: 0;

          color: var(--text-primary);

          font-size: clamp(28px, 2.5vw, 38px);
          font-weight: 800;
          line-height: 1.03;
          letter-spacing: -0.052em;

          overflow-wrap: anywhere;

          transition: color 0.35s ease;
        }

        .project-description {
          display: -webkit-box;

          max-width: 390px;
          margin: 18px 0 0;

          overflow: hidden;

          color: var(--text-secondary);

          font-size: clamp(15px, 1.25vw, 17px);
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: -0.012em;

          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;

          transition: color 0.35s ease;
        }

        .project-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;

          gap: 8px;
          margin-top: 28px;
        }

        .project-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 34px;
          max-width: 180px;

          padding: 7px 14px;

          color: var(--chip-text);
          background: var(--chip-bg);
          border-radius: 999px;

          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
          text-align: center;

          transition:
            color 0.35s ease,
            background-color 0.35s ease;
        }

        .featured-arrow {
          position: absolute;
          top: 50%;
          z-index: 20;

          width: 50px;
          height: 50px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;
          border: none;
          border-radius: 50%;

          color: var(--accent-contrast);
          background: var(--accent);

          box-shadow:
            0 14px 34px
            rgba(20, 149, 255, 0.26);

          font-family: inherit;
          font-size: 31px;
          line-height: 1;

          cursor: pointer;

          transform: translate(-50%, -50%);

          transition:
            opacity 0.25s ease,
            transform 0.25s ease,
            background-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .featured-arrow:hover:not(:disabled) {
          transform:
            translate(-50%, -50%)
            scale(1.07);

          box-shadow:
            0 18px 42px
            rgba(20, 149, 255, 0.32);
        }

        .featured-arrow:active:not(:disabled) {
          transform:
            translate(-50%, -50%)
            scale(0.96);
        }

        .featured-arrow:disabled {
          opacity: 0.25;
          cursor: not-allowed;
          box-shadow: none;
        }

        .featured-arrow-left {
          left: calc(
            50% -
            var(--featured-card-half) -
            (var(--featured-card-gap) / 2)
          );
        }

        .featured-arrow-right {
          left: calc(
            50% +
            var(--featured-card-half) +
            (var(--featured-card-gap) / 2)
          );
        }

        .carousel-progress {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;
          margin-top: 22px;
        }

        .carousel-dot {
          width: 8px;
          height: 8px;

          padding: 0;
          border: none;
          border-radius: 999px;

          background: var(--chip-bg);
          cursor: pointer;

          transition:
            width 0.3s ease,
            background-color 0.3s ease,
            transform 0.3s ease;
        }

        .carousel-dot:hover {
          transform: scale(1.15);
        }

        .carousel-dot-active {
          width: 28px;
          background: var(--accent);
        }

        .featured-cta {
          display: flex;
          justify-content: center;

          margin-top:
            clamp(32px, 4vw, 48px);
        }

        @media (max-width: 1100px) {
          .featured-work {
            --featured-card-gap: 36px;
          }

          .featured-arrow {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .featured-work {
            --featured-card-width:
              calc(100vw - 32px);
          }

          .featured-heading {
            width: calc(100% - 32px);
          }

          .featured-scroller {
            gap: 18px;
            padding-inline: 16px;
          }

          .project-card {
            min-height: 580px;

            grid-template-columns: 1fr;
            grid-template-rows: 290px 1fr;

            gap: 0;
            padding: 16px;

            border-radius: 28px;
          }

          .project-media {
            min-height: 0;
            border-radius: 21px;
          }

          .project-media-mockup {
            padding: 20px;
          }

          .project-copy {
            padding: 26px 8px 6px;
          }

          .project-title {
            max-width: none;
            font-size: 29px;
          }

          .project-description {
            max-width: none;

            margin-top: 13px;
            font-size: 15px;

            -webkit-line-clamp: 4;
          }

          .project-tags {
            justify-content: flex-start;
            margin-top: 24px;
          }

          .project-chip {
            max-width: none;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .featured-scroller {
            scroll-behavior: auto;
          }

          .project-card,
          .project-image,
          .featured-arrow,
          .carousel-dot {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function ProjectCard({
  project,
  refCallback,
}: {
  project: Project;
  refCallback: (
    element: HTMLDivElement | null,
  ) => void;
}) {
  const isPhoto =
    project.imageMode === "photo";

  return (
    <div
      ref={refCallback}
      className="project-slide"
    >
      <Link
        href={project.href}
        style={{
          display: "block",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <motion.article
          className="project-card"
          whileHover={{
            y: -5,
            boxShadow: "var(--shadow-card)",
          }}
          transition={{
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div
            className={[
              "project-media",
              isPhoto
                ? "project-media-photo"
                : "project-media-mockup",
            ].join(" ")}
          >
            <img
              src={project.image}
              alt={project.title}
              className="project-image"
              style={{
                objectPosition:
                  project.imagePosition ??
                  "center center",
              }}
            />
          </div>

          <div className="project-copy">
            <div className="project-copy-main">
              <h3 className="project-title">
                {project.title}
              </h3>

              <p className="project-description">
                {project.subtitle}
              </p>
            </div>

            <div className="project-tags">
              <span className="project-chip">
                {project.industry}
              </span>

              <span className="project-chip">
                {project.category}
              </span>
            </div>
          </div>
        </motion.article>
      </Link>
    </div>
  );
}

const pillStyle: CSSProperties = {
  display: "inline-flex",
  padding: "8px 18px",
  marginBottom: 25,

  borderRadius: 999,

  background: "var(--bg-pill)",
  color: "var(--text-secondary)",

  fontSize: 14,
  fontWeight: 500,
};

const titleStyle: CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",

  color: "var(--text-primary)",

  fontSize: "clamp(44px, 5vw, 68px)",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "-0.055em",

  transition: "color 0.35s ease",
};

const subtitleStyle: CSSProperties = {
  maxWidth: 740,
  margin: "20px auto 0",

  color: "var(--text-secondary)",

  fontSize: "clamp(18px, 1.8vw, 24px)",
  fontWeight: 600,
  lineHeight: 1.3,
  letterSpacing: "-0.025em",

  transition: "color 0.35s ease",
};

const viewAllStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  minHeight: 48,
  padding: "13px 27px",

  borderRadius: 999,

  color: "var(--accent-contrast)",
  background: "var(--accent)",

  boxShadow:
    "0 12px 30px rgba(20,149,255,0.22)",

  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1,

  textDecoration: "none",
};