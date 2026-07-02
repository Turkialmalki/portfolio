"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type TransitionEvent,
  type TouchEvent,
} from "react";
import { motion } from "framer-motion";

const AUTOPLAY_MS = 10_000;
const CLONE_COUNT = 2;

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
    title: "Monsha’at Innovation Center",
    subtitle:
      "Led the Innovation Center digital revamp and built internal platforms, dashboards, and data systems supporting Saudi startups.",
    image: "/monshaat.jpg",
    industry: "Government Innovation",
    category: "Engineering Leadership",
    href: "/projects",
    imageMode: "photo",
    imagePosition: "center center",
  },
  {
    title: "Emkan Finance App",
    subtitle:
      "Led the modernization of scalable fintech experiences across mobile and web, improving architecture and product delivery.",
    image: "/emkan2025.png",
    industry: "Fintech",
    category: "Mobile Engineering",
    href: "/projects",
    imageMode: "mockup",
    imagePosition: "center center",
  },
  {
    title: "Al Rajhi Mobile Banking",
    subtitle:
      "Designed and maintained customer-facing mobile banking experiences using React Native and scalable frontend architecture.",
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
      "Led engineering and product delivery for a digital financing platform, aligning technology, user experience, and business goals.",
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
      "Built an early foundation in enterprise technology, software delivery, and structured engineering problem-solving.",
    image: "/aramco.jpeg",
    industry: "Energy & Enterprise",
    category: "Engineering COOP",
    href: "/projects",
    imageMode: "photo",
    imagePosition: "center center",
  },
];

const REAL_START_INDEX = CLONE_COUNT;
const REAL_END_INDEX =
  REAL_START_INDEX + PROJECTS.length - 1;

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function getRealProjectIndex(virtualIndex: number) {
  return positiveModulo(
    virtualIndex - REAL_START_INDEX,
    PROJECTS.length,
  );
}

export default function FeaturedWork() {
  /*
   * Two duplicates are placed on each side.
   *
   * This keeps neighboring cards identical during the
   * invisible loop correction, preventing a visible flash.
   */
  const carouselProjects = useMemo(
    () => [
      ...PROJECTS.slice(-CLONE_COUNT),
      ...PROJECTS,
      ...PROJECTS.slice(0, CLONE_COUNT),
    ],
    [],
  );

  const viewportRef = useRef<HTMLDivElement>(null);

  const slideRefs = useRef<
    Array<HTMLDivElement | null>
  >([]);

  const virtualIndexRef = useRef(REAL_START_INDEX);
  const touchStartXRef = useRef<number | null>(null);

  const firstJumpFrameRef = useRef<number | null>(null);
  const secondJumpFrameRef = useRef<number | null>(null);

  const [virtualIndex, setVirtualIndex] =
    useState(REAL_START_INDEX);

  const [translateX, setTranslateX] = useState(0);
  const [viewportHeight, setViewportHeight] =
    useState<number | undefined>(undefined);

  const [transitionEnabled, setTransitionEnabled] =
    useState(false);

  const [isPaused, setIsPaused] = useState(false);

  const activeProjectIndex =
    getRealProjectIndex(virtualIndex);

  const measureSlide = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const slide = slideRefs.current[index];

    if (!viewport || !slide) {
      return;
    }

    /*
     * Center the selected project inside the viewport.
     */
    const slideCenter =
      slide.offsetLeft + slide.offsetWidth / 2;

    const viewportCenter =
      viewport.clientWidth / 2;

    setTranslateX(viewportCenter - slideCenter);

    /*
     * The carousel viewport follows the full card height.
     * This prevents the mobile text section from being cut.
     */
    setViewportHeight(slide.offsetHeight);
  }, []);

  const moveToIndex = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(
        0,
        Math.min(
          nextIndex,
          carouselProjects.length - 1,
        ),
      );

      virtualIndexRef.current = safeIndex;

      setTransitionEnabled(true);
      setVirtualIndex(safeIndex);
    },
    [carouselProjects.length],
  );

  const jumpToIndex = useCallback(
    (nextIndex: number) => {
      virtualIndexRef.current = nextIndex;

      /*
       * Disable movement animation before changing
       * from a duplicate card to its matching real card.
       */
      setTransitionEnabled(false);
      setVirtualIndex(nextIndex);

      if (firstJumpFrameRef.current !== null) {
        cancelAnimationFrame(
          firstJumpFrameRef.current,
        );
      }

      if (secondJumpFrameRef.current !== null) {
        cancelAnimationFrame(
          secondJumpFrameRef.current,
        );
      }

      firstJumpFrameRef.current =
        requestAnimationFrame(() => {
          measureSlide(nextIndex);

          secondJumpFrameRef.current =
            requestAnimationFrame(() => {
              setTransitionEnabled(true);
            });
        });
    },
    [measureSlide],
  );

  const showNextProject = useCallback(() => {
    moveToIndex(virtualIndexRef.current + 1);
  }, [moveToIndex]);

  const showPreviousProject = useCallback(() => {
    moveToIndex(virtualIndexRef.current - 1);
  }, [moveToIndex]);

  const showProject = useCallback(
    (projectIndex: number) => {
      moveToIndex(REAL_START_INDEX + projectIndex);
    },
    [moveToIndex],
  );

  /*
   * Measure and center the selected card whenever its
   * virtual position changes.
   */
  useLayoutEffect(() => {
    measureSlide(virtualIndex);
  }, [measureSlide, virtualIndex]);

  /*
   * Watch the active card for height changes caused by
   * responsive text wrapping or image loading.
   */
  useEffect(() => {
    const activeSlide =
      slideRefs.current[virtualIndex];

    if (!activeSlide) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measureSlide(virtualIndex);
    });

    resizeObserver.observe(activeSlide);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measureSlide, virtualIndex]);

  /*
   * Recalculate card positioning when the browser width
   * changes or the phone rotates.
   */
  useEffect(() => {
    const handleResize = () => {
      setTransitionEnabled(false);

      requestAnimationFrame(() => {
        measureSlide(virtualIndexRef.current);

        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [measureSlide]);

  /*
   * Initial positioning.
   */
  useEffect(() => {
    const initialFrame = requestAnimationFrame(() => {
      measureSlide(REAL_START_INDEX);

      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });

    return () => {
      cancelAnimationFrame(initialFrame);
    };
  }, [measureSlide]);

  /*
   * Autoplay waits ten seconds after every movement.
   */
  useEffect(() => {
    if (isPaused) {
      return;
    }

    const autoplayTimer = window.setTimeout(() => {
      showNextProject();
    }, AUTOPLAY_MS);

    return () => {
      window.clearTimeout(autoplayTimer);
    };
  }, [
    isPaused,
    showNextProject,
    virtualIndex,
  ]);

  /*
   * After reaching a duplicated boundary card, instantly
   * align to the equivalent real card.
   *
   * Because the cards and their neighbors are identical,
   * this correction is invisible.
   */
  const handleTrackTransitionEnd = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const firstTrailingClone =
      REAL_START_INDEX + PROJECTS.length;

    const finalLeadingClone =
      REAL_START_INDEX - 1;

    if (virtualIndex >= firstTrailingClone) {
      const matchingRealIndex =
        REAL_START_INDEX +
        (virtualIndex - firstTrailingClone);

      jumpToIndex(matchingRealIndex);
      return;
    }

    if (virtualIndex <= finalLeadingClone) {
      const distanceFromFinalLeadingClone =
        finalLeadingClone - virtualIndex;

      const matchingRealIndex =
        REAL_END_INDEX -
        distanceFromFinalLeadingClone;

      jumpToIndex(matchingRealIndex);
    }
  };

  const handleTouchStart = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    touchStartXRef.current =
      event.touches[0]?.clientX ?? null;

    setIsPaused(true);
  };

  const handleTouchEnd = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    const startX = touchStartXRef.current;
    const endX =
      event.changedTouches[0]?.clientX;

    touchStartXRef.current = null;
    setIsPaused(false);

    if (
      startX === null ||
      endX === undefined
    ) {
      return;
    }

    const distance = startX - endX;

    if (Math.abs(distance) < 45) {
      return;
    }

    if (distance > 0) {
      showNextProject();
    } else {
      showPreviousProject();
    }
  };

  return (
    <section
      id="featured-work"
      className="featured-work"
    >
      <div className="featured-heading">
        <div className="featured-pill">
          Projects
        </div>

        <h2 className="featured-title">
          Featured Work
        </h2>

        <p className="featured-subtitle">
          Engineering initiatives and digital products
          delivered across government, fintech, banking,
          and innovation.
        </p>
      </div>

      <div
        className="carousel-stage"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <button
          type="button"
          className="
            carousel-navigation
            carousel-navigation-previous
          "
          onClick={showPreviousProject}
          aria-label="Show previous project"
        >
          ‹
        </button>

        <div
          ref={viewportRef}
          className="carousel-viewport"
          style={{
            height:
              viewportHeight === undefined
                ? undefined
                : `${viewportHeight}px`,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            touchStartXRef.current = null;
            setIsPaused(false);
          }}
        >
          <div
            className="carousel-track"
            onTransitionEnd={
              handleTrackTransitionEnd
            }
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,

              transition: transitionEnabled
                ? "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
            }}
          >
            {carouselProjects.map(
              (project, index) => (
                <div
                  key={`${project.title}-${index}`}
                  ref={(element) => {
                    slideRefs.current[index] =
                      element;
                  }}
                  className={
                    index === virtualIndex
                      ? "project-slide"
                      : "project-slide project-slide-inactive"
                  }
                  aria-hidden={
                    index !== virtualIndex
                  }
                >
                  <ProjectCard
                    project={project}
                  />
                </div>
              ),
            )}
          </div>
        </div>

        <button
          type="button"
          className="
            carousel-navigation
            carousel-navigation-next
          "
          onClick={showNextProject}
          aria-label="Show next project"
        >
          ›
        </button>
      </div>

      <div
        className="carousel-progress"
        aria-label={`Project ${
          activeProjectIndex + 1
        } of ${PROJECTS.length}`}
      >
        {PROJECTS.map((project, index) => (
          <button
            key={project.title}
            type="button"
            className={
              index === activeProjectIndex
                ? "carousel-dot carousel-dot-active"
                : "carousel-dot"
            }
            aria-label={`Show ${project.title}`}
            aria-current={
              index === activeProjectIndex
                ? "true"
                : undefined
            }
            onClick={() => showProject(index)}
          />
        ))}

        <span
          className="carousel-counter"
          aria-hidden="true"
        >
          {String(activeProjectIndex + 1).padStart(2, "0")}
          {" / "}
          {String(PROJECTS.length).padStart(2, "0")}
        </span>
      </div>

      <div className="featured-cta">
        <Link
          href="/projects"
          className="featured-view-all"
        >
          View All Projects
        </Link>
      </div>

      <style>{`
        .featured-work {
          /*
           * Smaller desktop cards and larger empty spaces.
           */
          --project-card-width:
            clamp(700px, 54vw, 900px);

          --project-card-half:
            clamp(350px, 27vw, 450px);

          --project-gap:
            clamp(100px, 6.5vw, 120px);

          --project-gap-half:
            clamp(50px, 3.25vw, 60px);

          --carousel-arrow-size: 46px;

          width: 100%;
          box-sizing: border-box;

          overflow-x: hidden;
          overflow-x: clip;
          overflow-y: visible;

          padding:
            clamp(84px, 9vw, 120px)
            0
            clamp(145px, 13vw, 190px);

          background:
            var(--bg-primary, #ffffff);

          transition:
            background-color 350ms ease;
        }

        .featured-heading {
          width:
            min(1180px, calc(100% - 48px));

          margin: 0 auto;
          text-align: center;
        }

        .featured-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 38px;

          box-sizing: border-box;

          padding: 7px 18px;
          margin-bottom: 25px;

          color:
            var(--text-secondary, #666666);

          background:
            var(--bg-pill, #f1f1f1);

          border-radius: 999px;

          font-size: 14px;
          font-weight: 500;
          line-height: 1;

          transition:
            color 350ms ease,
            background-color 350ms ease;
        }

        .featured-title {
          width: 100%;
          max-width: 850px;

          margin: 0 auto;

          color:
            var(--text-primary, #090909);

          font-size:
            clamp(46px, 5.2vw, 72px);

          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.055em;

          text-wrap: balance;

          transition: color 350ms ease;
        }

        .featured-subtitle {
          width: 100%;
          max-width: 760px;

          margin: 20px auto 0;

          color:
            var(--text-secondary, #666666);

          font-size:
            clamp(19px, 1.8vw, 25px);

          font-weight: 600;
          line-height: 1.28;
          letter-spacing: -0.025em;

          text-wrap: balance;

          transition: color 350ms ease;
        }

        .carousel-stage {
          position: relative;
          width: 100%;

          margin-top:
            clamp(48px, 5vw, 68px);

          overflow: visible;
        }

        /*
         * The viewport height is controlled by the active
         * slide measurement in React.
         */
        .carousel-viewport {
          position: relative;

          width: 100%;
          min-height: 1px;

          overflow: hidden;

          touch-action: pan-y;

          transition:
            height 420ms
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            );
        }

        .carousel-track {
          display: flex;
          align-items: flex-start;

          width: max-content;

          gap: var(--project-gap);

          will-change: transform;
        }

        .project-slide {
          flex:
            0 0
            var(--project-card-width);

          width:
            var(--project-card-width);

          min-width: 0;
          height: auto;

          transition:
            transform 700ms
              cubic-bezier(0.16, 1, 0.3, 1),
            opacity 700ms ease;
        }

        /*
         * Neighboring cards recede so the active project
         * carries the visual focus.
         */
        .project-slide-inactive {
          transform: scale(0.94);
          opacity: 0.45;
        }

        .project-slide > a {
          display: block;

          width: 100%;
          height: auto;

          color: inherit;
          text-decoration: none;

          border-radius: 30px;
        }

        .project-slide > a:focus-visible {
          outline:
            3px solid
            var(--accent, #1495ff);

          outline-offset: 5px;
        }

        .project-card {
          width: 100%;
          min-height: 370px;

          box-sizing: border-box;

          display: grid;

          grid-template-columns:
            minmax(0, 1.04fr)
            minmax(0, 0.96fr);

          gap:
            clamp(24px, 2.4vw, 34px);

          padding: 20px;

          overflow: hidden;

          background:
            var(--bg-card, #f3f3f3);

          border:
            1px solid
            var(
              --border-subtle,
              rgba(0, 0, 0, 0.04)
            );

          border-radius: 30px;

          transition:
            background-color 350ms ease,
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .project-media {
          position: relative;

          width: 100%;
          min-width: 0;
          min-height: 330px;

          display: flex;
          align-items: center;
          justify-content: center;

          box-sizing: border-box;
          overflow: hidden;

          background:
            var(--bg-card-muted, #e8e8e8);

          border-radius: 23px;

          transition:
            background-color 350ms ease;
        }

        .project-media-photo {
          padding: 0;
        }

        .project-media-mockup {
          padding:
            clamp(22px, 2.6vw, 36px);
        }

        .project-image {
          display: block;

          width: 100%;
          height: 100%;

          transition:
            transform 450ms
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            );
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

        .project-open-arrow {
          position: absolute;

          right: 18px;
          bottom: 18px;
          z-index: 5;

          width: 50px;
          height: 50px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color:
            var(--bg-primary, #ffffff);

          background:
            var(--text-primary, #090909);

          box-shadow:
            0 14px 32px
            rgba(0, 0, 0, 0.2);

          font-size: 28px;
          font-weight: 300;
          line-height: 1;

          opacity: 0;
          visibility: hidden;
          pointer-events: none;

          transform:
            translateY(12px)
            scale(0.78)
            rotate(-45deg);

          transition:
            opacity 260ms ease,
            visibility 260ms ease,
            transform 380ms
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              ),
            background-color 350ms ease,
            color 350ms ease,
            box-shadow 350ms ease;
        }

        .project-card:hover .project-open-arrow,
        .project-slide
          > a:focus-visible
          .project-open-arrow {
          opacity: 1;
          visibility: visible;

          transform:
            translateY(0)
            scale(1)
            rotate(-45deg);
        }

        .project-copy {
          min-width: 0;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          box-sizing: border-box;

          padding:
            clamp(20px, 2.4vw, 30px)
            10px
            8px
            0;

          text-align: left;
        }

        .project-copy-main {
          min-width: 0;
        }

        .project-title {
          max-width: 370px;

          margin: 0;

          color:
            var(--text-primary, #090909);

          font-size:
            clamp(28px, 2.25vw, 36px);

          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.052em;

          text-wrap: balance;

          transition: color 350ms ease;
        }

        .project-description {
          display: -webkit-box;

          max-width: 380px;

          margin: 16px 0 0;

          overflow: hidden;

          color:
            var(--text-secondary, #666666);

          font-size:
            clamp(15px, 1.1vw, 17px);

          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.012em;

          -webkit-box-orient: vertical;
          -webkit-line-clamp: 4;

          transition: color 350ms ease;
        }

        .project-foot {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 12px;
          margin-top: 24px;
        }

        .project-cta {
          display: inline-flex;
          align-items: center;

          gap: 7px;
          padding-bottom: 8px;

          color:
            var(--text-secondary, #666666);

          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          white-space: nowrap;

          transition: color 300ms ease;
        }

        .project-cta-arrow {
          display: inline-block;

          transition:
            transform 300ms
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            );
        }

        .project-card:hover .project-cta {
          color:
            var(--accent, #1495ff);
        }

        .project-card:hover .project-cta-arrow {
          transform: translateX(4px);
        }

        .project-tags {
          display: flex;
          flex-wrap: wrap;

          justify-content: flex-end;
          align-items: center;

          gap: 8px;
        }

        .project-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-height: 33px;
          max-width: 175px;

          box-sizing: border-box;

          padding: 7px 14px;

          color:
            var(--chip-text, #555555);

          background:
            var(--chip-bg, #dedede);

          border-radius: 999px;

          font-size: 12px;
          font-weight: 500;
          line-height: 1.2;
          text-align: center;

          transition:
            color 350ms ease,
            background-color 350ms ease;
        }

        .project-chip-accent {
          color:
            var(--accent, #1495ff);

          background:
            rgba(20, 149, 255, 0.12);
        }

        /*
         * Arrows are exactly centered in the empty spaces.
         */
        .carousel-navigation {
          position: absolute;

          top: 50%;
          z-index: 30;

          width:
            var(--carousel-arrow-size);

          height:
            var(--carousel-arrow-size);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;

          border: none;
          border-radius: 50%;

          color:
            var(--accent-contrast, #ffffff);

          background:
            var(--accent, #1495ff);

          box-shadow:
            0 12px 30px
            rgba(
              20,
              149,
              255,
              0.25
            );

          font-family: inherit;
          font-size: 28px;
          line-height: 1;

          cursor: pointer;

          transform:
            translate(-50%, -50%);

          transition:
            transform 250ms ease,
            box-shadow 250ms ease,
            background-color 250ms ease;
        }

        .carousel-navigation:hover {
          transform:
            translate(-50%, -50%)
            scale(1.07);

          box-shadow:
            0 17px 38px
            rgba(
              20,
              149,
              255,
              0.32
            );
        }

        .carousel-navigation-previous {
          left:
            calc(
              50% -
              var(--project-card-half) -
              var(--project-gap-half)
            );
        }

        .carousel-navigation-next {
          left:
            calc(
              50% +
              var(--project-card-half) +
              var(--project-gap-half)
            );
        }

        .carousel-progress {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          margin-top: 24px;
        }

        .carousel-dot {
          width: 8px;
          height: 8px;

          padding: 0;

          border: none;
          border-radius: 999px;

          background:
            var(--chip-bg, #dedede);

          cursor: pointer;

          transition:
            width 300ms ease,
            background-color 300ms ease,
            transform 300ms ease;
        }

        .carousel-dot:hover {
          transform: scale(1.15);
        }

        .carousel-dot-active {
          width: 28px;

          background:
            var(--accent, #1495ff);
        }

        .carousel-counter {
          margin-left: 10px;

          color:
            var(--text-muted, #888888);

          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.06em;

          font-variant-numeric:
            tabular-nums;

          transition: color 350ms ease;
        }

        .featured-cta {
          display: flex;
          justify-content: center;

          margin-top:
            clamp(32px, 4vw, 46px);
        }

        .featured-view-all {
          min-height: 49px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          box-sizing: border-box;

          padding: 14px 29px;

          border-radius: 999px;

          color:
            var(--accent-contrast, #ffffff);

          background:
            var(--accent, #1495ff);

          box-shadow:
            0 12px 30px
            rgba(
              20,
              149,
              255,
              0.22
            );

          font-size: 15px;
          font-weight: 600;
          line-height: 1;

          text-decoration: none;

          transition:
            transform 250ms ease,
            box-shadow 250ms ease;
        }

        .featured-view-all:hover {
          transform: translateY(-2px);

          box-shadow:
            0 16px 36px
            rgba(
              20,
              149,
              255,
              0.28
            );
        }

        @media (max-width: 1080px) {
          .featured-work {
            --project-card-width:
              min(
                740px,
                calc(100vw - 100px)
              );

            --project-gap: 50px;
          }

          .carousel-navigation {
            display: none;
          }
        }

        /*
         * Mobile viewport.
         *
         * The card remains in normal vertical flow,
         * and its measured height controls the viewport.
         */
        @media (max-width: 760px) {
          .featured-work {
            --project-card-width:
              calc(100vw - 32px);

            --project-gap: 18px;

            padding:
              82px
              0
              max(
                190px,
                calc(
                  160px +
                  env(
                    safe-area-inset-bottom
                  )
                )
              );
          }

          .featured-heading {
            width:
              calc(100% - 32px);

            max-width: 520px;
          }

          .featured-pill {
            min-height: 36px;

            padding: 7px 17px;
            margin-bottom: 24px;

            font-size: 14px;
          }

          .featured-title {
            max-width: 430px;

            font-size:
              clamp(
                42px,
                11vw,
                55px
              );

            line-height: 1.02;
            letter-spacing: -0.055em;
          }

          .featured-subtitle {
            max-width: 410px;

            margin-top: 20px;

            font-size:
              clamp(
                17px,
                4.8vw,
                21px
              );

            line-height: 1.3;
          }

          .carousel-stage {
            margin-top: 50px;
          }

          .carousel-viewport {
            /*
             * The shadow and hover movement remain inside
             * the viewport while the entire card stays visible.
             */
            padding: 4px 0 18px;

            box-sizing: content-box;
          }

          .project-slide {
            width:
              var(--project-card-width);

            height: auto;
          }

          .project-slide > a {
            width: 100%;
            height: auto;
          }

          .project-card {
            width: 100%;
            height: auto;
            min-height: 0;

            /*
             * The homepage marquee styles a global
             * .project-card with a fixed aspect ratio.
             * The carousel card must grow with its text.
             */
            aspect-ratio: auto;

            display: flex;
            flex-direction: column;

            gap: 0;

            padding: 14px;

            overflow: hidden;

            border-radius: 30px;
          }

          .project-media {
            width: 100%;
            height: auto;
            min-height: 0;

            aspect-ratio: 1.12 / 1;

            flex: none;

            border-radius: 24px;
          }

          .project-media-photo {
            padding: 0;
          }

          .project-media-mockup {
            padding:
              clamp(
                16px,
                5vw,
                27px
              );
          }

          .project-copy {
            width: 100%;
            min-height: 0;

            display: flex;
            flex-direction: column;
            justify-content: flex-start;

            box-sizing: border-box;

            padding:
              25px
              16px
              23px;

            text-align: left;
          }

          .project-copy-main {
            width: 100%;
            min-width: 0;
          }

          /*
           * Mobile tags appear above the heading.
           * The textual call to action is hidden because
           * the circular arrow stays visible on the image.
           */
          .project-foot {
            order: -1;

            margin:
              0
              0
              21px;
          }

          .project-cta {
            display: none;
          }

          .project-tags {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;

            gap: 8px;
          }

          .project-chip {
            min-height: 33px;
            max-width: 100%;

            padding: 7px 13px;

            font-size: 12px;
            white-space: normal;
          }

          .project-title {
            width: 100%;
            max-width: none;

            font-size:
              clamp(
                28px,
                8vw,
                36px
              );

            line-height: 1.06;
            letter-spacing: -0.048em;

            overflow-wrap: break-word;
          }

          .project-description {
            width: 100%;
            max-width: none;

            margin-top: 15px;

            font-size:
              clamp(
                15px,
                4.2vw,
                17px
              );

            line-height: 1.5;

            /*
             * Do not clamp on mobile.
             * The complete description is visible.
             */
            display: block;
            overflow: visible;

            -webkit-line-clamp: unset;
          }

          /*
           * There is no hover on mobile, so the internal
           * project action remains visible.
           */
          .project-open-arrow {
            right: 17px;
            bottom: 17px;

            width: 50px;
            height: 50px;

            font-size: 28px;

            opacity: 1;
            visibility: visible;

            transform:
              translateY(0)
              scale(1)
              rotate(-45deg);
          }

          .carousel-progress {
            margin-top: 24px;
          }

          .featured-cta {
            margin-top: 34px;
          }

          .featured-view-all {
            min-height: 50px;

            padding: 14px 28px;

            font-size: 15px;
          }
        }

        @media (max-width: 420px) {
          .featured-work {
            --project-card-width:
              calc(100vw - 24px);

            --project-gap: 14px;
          }

          .featured-heading {
            width:
              calc(100% - 28px);
          }

          .project-card {
            padding: 11px;

            border-radius: 27px;
          }

          .project-media {
            aspect-ratio: 1.08 / 1;

            border-radius: 21px;
          }

          .project-media-mockup {
            padding: 14px;
          }

          .project-copy {
            padding:
              22px
              11px
              19px;
          }

          .project-tags {
            margin-bottom: 18px;
          }

          .project-chip {
            min-height: 31px;

            padding: 6px 11px;

            font-size: 11px;
          }

          .project-title {
            font-size:
              clamp(
                27px,
                8.5vw,
                33px
              );
          }

          .project-description {
            font-size:
              clamp(
                14px,
                4.3vw,
                16px
              );

            line-height: 1.5;
          }

          .project-open-arrow {
            right: 14px;
            bottom: 14px;

            width: 47px;
            height: 47px;

            font-size: 26px;
          }
        }

        :global(.dark) .project-card,
        :global([data-theme="dark"])
          .project-card {
          border-color:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .carousel-track,
          .carousel-viewport,
          .project-slide,
          .project-cta-arrow,
          .project-card,
          .project-image,
          .project-open-arrow,
          .carousel-navigation,
          .carousel-dot,
          .featured-view-all {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

type ProjectCardProps = {
  project: Project;
};

function ProjectCard({
  project,
}: ProjectCardProps) {
  const isPhoto =
    project.imageMode === "photo";

  return (
    <Link href={project.href}>
      <motion.article
        className="project-card"
        whileHover={{
          y: -5,
          boxShadow:
            "var(--shadow-card)",
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
            loading="lazy"
            draggable={false}
            style={{
              objectPosition:
                project.imagePosition ??
                "center center",
            }}
          />

          <span
            className="project-open-arrow"
            aria-hidden="true"
          >
            →
          </span>
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

          <div className="project-foot">
            <span className="project-cta">
              View Case Study
              <span
                className="project-cta-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </span>

            <div className="project-tags">
              <span className="project-chip project-chip-accent">
                {project.industry}
              </span>

              <span className="project-chip">
                {project.category}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}