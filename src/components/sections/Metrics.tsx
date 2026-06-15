"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const CARD_WIDTH = 760;
const CARD_GAP = 64;
const STEP = CARD_WIDTH + CARD_GAP;
const AUTOPLAY_MS = 10000;

const PROJECTS = [
  {
    title: "Vision Pulse Marketing",
    subtitle: "Bold site showcasing services, work, and unique style.",
    image: "/projects/vision.png",
    industry: "Marketing",
    category: "Website",
    href: "/projects/vision-pulse",
  },
  {
    title: "Steak Shack",
    subtitle: "Mobile app to browse, customize, and order steaks.",
    image: "/projects/steak.png",
    industry: "Restaurant",
    category: "Mobile App",
    href: "/projects/steak-shack",
  },
  {
    title: "Nestify Furnitures",
    subtitle: "Furniture marketplace for affordable new & secondhand.",
    image: "/projects/nestify.png",
    industry: "Furniture",
    category: "E-commerce",
    href: "/projects/nestify",
  },
];

const LOOP_PROJECTS = [...PROJECTS, ...PROJECTS, ...PROJECTS];

export default function FeaturedWork() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(PROJECTS.length);

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const centerPadding = (window.innerWidth - CARD_WIDTH) / 2;
    const left = index * STEP - centerPadding;

    scroller.scrollTo({ left, behavior });
    currentIndex.current = index;
  };

  const next = () => {
    let nextIndex = currentIndex.current + 1;

    scrollToIndex(nextIndex);

    if (nextIndex >= PROJECTS.length * 2) {
      setTimeout(() => {
        scrollToIndex(PROJECTS.length, "auto");
      }, 650);
    }
  };

  const prev = () => {
    let prevIndex = currentIndex.current - 1;

    scrollToIndex(prevIndex);

    if (prevIndex <= PROJECTS.length - 1) {
      setTimeout(() => {
        scrollToIndex(PROJECTS.length * 2 - 1, "auto");
      }, 650);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollToIndex(PROJECTS.length, "auto");
    }, 100);

    const interval = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="featured-work"
      style={{
        background: "var(--bg-primary)",
        overflow: "hidden",
        padding: "clamp(80px, 10vw, 120px) 0",
        transition: "background-color 0.35s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div style={pillStyle}>Projects</div>
        <h2 style={titleStyle}>Featured Work</h2>
        <p style={subtitleStyle}>My past projects showcasing my expertise.</p>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 52,
        }}
      >
        <button
          onClick={prev}
          style={{
            ...floatingArrowStyle,
            left: "calc(50% - 430px)",
          }}
        >
          ‹
        </button>

        <button
          onClick={next}
          style={{
            ...floatingArrowStyle,
            right: "calc(50% - 430px)",
          }}
        >
          ›
        </button>

        <div
          ref={scrollerRef}
          className="featured-scroller"
          style={{
            display: "flex",
            gap: CARD_GAP,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "0 calc((100vw - 760px) / 2)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {LOOP_PROJECTS.map((project, index) => (
            <ProjectCard
              key={`${project.title}-${index}`}
              project={project}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 52 }}>
        <Link href="/projects" style={viewAllStyle}>
          View All Projects
        </Link>
      </div>

      <style>{`
        .featured-scroller::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 900px) {
          .featured-scroller {
            padding: 0 24px !important;
            gap: 20px !important;
          }

          .featured-arrow {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    title: string;
    subtitle: string;
    image: string;
    industry: string;
    category: string;
    href: string;
  };
}) {
  return (
    <Link
      href={project.href}
      style={{
        textDecoration: "none",
        color: "inherit",
        flex: "0 0 auto",
        scrollSnapAlign: "center",
      }}
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35 }}
        style={{
          width: CARD_WIDTH,
          height: 330,
          borderRadius: 34,
          background: "var(--bg-card)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          padding: 24,
          gap: 32,
          transition: "background-color 0.35s ease",
        }}
      >
        <div
          style={{
            background: "var(--bg-card-muted)",
            borderRadius: 26,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 34,
            transition: "background-color 0.35s ease",
          }}
        >
          <img
            src={project.image}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "left",
            padding: "18px 4px 4px 0",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                margin: 0,
                color: "var(--text-primary)",
                transition: "color 0.35s ease",
              }}
            >
              {project.title}
            </h3>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.45,
                color: "var(--text-secondary)",
                margin: "14px 0 0",
                maxWidth: 340,
                transition: "color 0.35s ease",
              }}
            >
              {project.subtitle}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <span style={chipStyle}>{project.industry}</span>
            <span style={chipStyle}>{project.category}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 18px",
  borderRadius: 999,
  background: "var(--bg-pill)",
  color: "var(--text-secondary)",
  fontSize: 15,
  marginBottom: 26,
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(42px, 5vw, 72px)",
  fontWeight: 800,
  letterSpacing: "-0.055em",
  lineHeight: 1,
  color: "var(--text-primary)",
  margin: 0,
  transition: "color 0.35s ease",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "clamp(20px, 2vw, 28px)",
  fontWeight: 600,
  color: "var(--text-secondary)",
  margin: "20px auto 0",
  lineHeight: 1.2,
  transition: "color 0.35s ease",
};

const chipStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--chip-text)",
  background: "var(--chip-bg)",
  borderRadius: 999,
  padding: "8px 16px",
  transition: "background-color 0.35s ease, color 0.35s ease",
};

const floatingArrowStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 20,
  width: 46,
  height: 46,
  borderRadius: "50%",
  border: "none",
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  fontSize: 30,
  lineHeight: "46px",
  cursor: "pointer",
  boxShadow: "0 14px 32px rgba(20,149,255,0.28)",
};

const viewAllStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  borderRadius: 999,
  padding: "14px 30px",
  fontSize: 16,
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 12px 30px rgba(20,149,255,0.22)",
};