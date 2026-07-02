"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { PROJECTS, type ProjectData } from "@/data/projects";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INITIAL_COUNT = 4;

function industryKey(project: ProjectData) {
  return project.industry.split("/")[0].trim();
}

export default function ProjectsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />
      <main className="pf-page">
        <PageHero />
        <ProjectsList />
      </main>
      <Footer />

      <style>{`
        /* ── Page shell ─────────────────────────────────── */

        .pf-page {
          min-height: 100vh;
          background: var(--bg-primary);
          transition: background-color 0.45s ease;
        }

        /* ── Hero ───────────────────────────────────────── */

        .pf-hero {
          padding:
            clamp(96px, 10vw, 150px)
            clamp(20px, 5vw, 40px)
            clamp(36px, 4vw, 56px);
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }

        .pf-pill {
          display: inline-flex;
          align-items: center;
          height: 36px;
          padding: 0 16px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 500;
          margin-bottom: 26px;
          transition: background-color 0.45s ease, color 0.45s ease;
        }

        .pf-heading {
          margin: 0;
          font-size: clamp(46px, 7vw, 88px);
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 0.96;
          color: var(--text-primary);
          transition: color 0.45s ease;
        }

        .pf-sub {
          margin: 22px auto 0;
          font-size: clamp(16px, 1.5vw, 20px);
          line-height: 1.55;
          color: var(--text-secondary);
          max-width: 640px;
          transition: color 0.45s ease;
        }

        /* ── Filters ────────────────────────────────────── */

        .pf-filters {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          padding: clamp(8px, 1vw, 16px) clamp(20px, 5vw, 40px) clamp(40px, 4.5vw, 60px);
        }

        .pf-filter {
          height: 42px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition:
            background-color 260ms ease,
            color 260ms ease,
            border-color 260ms ease,
            transform 260ms ease;
        }

        .pf-filter:hover {
          transform: translateY(-2px);
          color: var(--text-primary);
        }

        .pf-filter-active {
          background: var(--text-primary);
          border-color: var(--text-primary);
          color: var(--bg-primary);
        }

        .pf-filter-active:hover {
          color: var(--bg-primary);
        }

        /* ── List ───────────────────────────────────────── */

        .pf-list {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 clamp(16px, 4vw, 40px) clamp(80px, 10vw, 140px);
          display: flex;
          flex-direction: column;
          gap: clamp(24px, 3vw, 40px);
        }

        /* ── Card ───────────────────────────────────────── */

        .pf-card {
          display: grid;
          grid-template-columns: 1.04fr 0.96fr;
          gap: clamp(20px, 2.4vw, 32px);
          padding: clamp(14px, 1.6vw, 22px);
          border-radius: 34px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          text-decoration: none;
          cursor: pointer;
          transition:
            background-color 0.45s ease,
            border-color 0.45s ease,
            box-shadow 420ms ease,
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pf-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-card);
        }

        .pf-card-rev .pf-media { order: 2; }
        .pf-card-rev .pf-info { order: 1; }

        /* ── Media side ─────────────────────────────────── */

        .pf-media {
          position: relative;
          min-height: 380px;
          border-radius: 24px;
          overflow: hidden;
          background: var(--bg-card-muted);
          transition: background-color 0.45s ease;
        }

        .pf-media-img {
          position: absolute;
          inset: 0;
          transition: transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pf-card:hover .pf-media-img {
          transform: scale(1.035);
        }

        .pf-media-visual {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 3vw, 44px);
        }

        .pf-media-glow {
          position: absolute;
          top: 6%;
          right: 6%;
          width: 55%;
          padding-bottom: 55%;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          pointer-events: none;
          transition: opacity 500ms ease;
        }

        .pf-card:hover .pf-media-glow { opacity: 0.9; }

        .pf-arrow-badge {
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 5;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--bg-primary);
          background: var(--text-primary);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.2);
          font-size: 24px;
          font-weight: 300;
          line-height: 1;
          opacity: 0;
          transform: translateY(12px) scale(0.8) rotate(-45deg);
          transition:
            opacity 260ms ease,
            transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
            background-color 0.45s ease,
            color 0.45s ease;
        }

        .pf-card:hover .pf-arrow-badge {
          opacity: 1;
          transform: translateY(0) scale(1) rotate(-45deg);
        }

        /* ── Info side ──────────────────────────────────── */

        .pf-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(18px, 2.4vw, 32px) clamp(10px, 1.4vw, 20px) clamp(12px, 1.4vw, 18px);
        }

        .pf-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pf-chips {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .pf-chip {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1.2;
        }

        .pf-chip-plain {
          color: var(--chip-text);
          background: var(--chip-bg);
          transition: color 0.45s ease, background-color 0.45s ease;
        }

        .pf-number {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          font-variant-numeric: tabular-nums;
          transition: color 0.45s ease;
          flex-shrink: 0;
        }

        .pf-title {
          margin: 0 0 12px;
          font-size: clamp(26px, 2.8vw, 40px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.045em;
          line-height: 1.05;
          text-wrap: balance;
          transition: color 0.45s ease;
        }

        .pf-desc {
          margin: 0;
          font-size: clamp(14px, 1.1vw, 16px);
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 420px;
          transition: color 0.45s ease;
        }

        .pf-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
        }

        .pf-tag {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          transition: color 0.45s ease;
        }

        .pf-tag::before {
          content: "#";
          opacity: 0.6;
        }

        /* ── Outcome stats ──────────────────────────────── */

        .pf-stats {
          display: flex;
          gap: clamp(24px, 3vw, 44px);
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid var(--border-color);
          transition: border-color 0.45s ease;
        }

        .pf-stat-value {
          font-size: clamp(22px, 2.2vw, 30px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .pf-stat-label {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.45s ease;
        }

        /* ── Card footer ────────────────────────────────── */

        .pf-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
        }

        .pf-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text-secondary);
          transition: color 300ms ease;
        }

        .pf-cta-arrow {
          display: inline-block;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pf-card:hover .pf-cta {
          color: var(--text-primary);
        }

        .pf-card:hover .pf-cta-arrow {
          transform: translateX(4px);
        }

        .pf-year {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.03em;
          transition: color 0.45s ease;
        }

        /* ── Load more / empty ──────────────────────────── */

        .pf-more {
          display: flex;
          justify-content: center;
          margin-top: clamp(16px, 2vw, 28px);
        }

        .pf-more-btn {
          min-height: 50px;
          padding: 14px 38px;
          border-radius: 999px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 14.5px;
          font-weight: 600;
          font-family: inherit;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition:
            background-color 260ms ease,
            color 260ms ease,
            transform 260ms ease,
            box-shadow 260ms ease;
        }

        .pf-more-btn:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
        }

        /* ── Tablet / Mobile ────────────────────────────── */

        @media (max-width: 900px) {
          .pf-card,
          .pf-card-rev {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .pf-card-rev .pf-media { order: 0; }
          .pf-card-rev .pf-info { order: 1; }

          .pf-media {
            min-height: 0;
            aspect-ratio: 16 / 11;
          }

          .pf-arrow-badge {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(-45deg);
          }

          .pf-info {
            padding: 24px 12px 14px;
          }

          .pf-desc { max-width: none; }
        }

        @media (max-width: 640px) {
          .pf-card { border-radius: 28px; padding: 12px; }
          .pf-media { border-radius: 20px; aspect-ratio: 16 / 12; }

          .pf-filters { gap: 8px; }
          .pf-filter { height: 40px; padding: 0 16px; font-size: 13.5px; }

          .pf-stats { gap: 24px; margin-top: 22px; }

          .pf-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 16px;
          }

          .pf-foot { margin-top: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pf-card,
          .pf-media-img,
          .pf-arrow-badge,
          .pf-cta-arrow,
          .pf-filter,
          .pf-more-btn {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}

function PageHero() {
  return (
    <section className="pf-hero">
      <motion.span
        className="pf-pill"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        Portfolio
      </motion.span>

      <motion.h1
        className="pf-heading"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
      >
        Crafted Experiences
      </motion.h1>

      <motion.p
        className="pf-sub"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
      >
        Engineering initiatives and digital products delivered with purpose —
        across banking, fintech, government, and innovation ecosystems.
      </motion.p>
    </section>
  );
}

function ProjectsList() {
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filters = useMemo(() => {
    const keys = Array.from(new Set(PROJECTS.map(industryKey)));
    return ["All", ...keys];
  }, []);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? PROJECTS
        : PROJECTS.filter((p) => industryKey(p) === filter),
    [filter]
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT;

  return (
    <>
      <motion.div
        className="pf-filters"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.2 }}
      >
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={f === filter ? "pf-filter pf-filter-active" : "pf-filter"}
            onClick={() => {
              setFilter(f);
              setShowAll(false);
            }}
          >
            {f}
          </button>
        ))}
      </motion.div>

      <section className="pf-list">
        <AnimatePresence mode="popLayout">
          {visible.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </AnimatePresence>

        {hasMore && (
          <div className="pf-more">
            <button
              type="button"
              className="pf-more-btn"
              onClick={() => setShowAll((p) => !p)}
            >
              {showAll ? "Show Less" : "Load More"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function ProjectCard({ project, index }: { project: ProjectData; index: number }) {
  const stats = project.outcomes.slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className={index % 2 === 1 ? "pf-card pf-card-rev" : "pf-card"}
      >
        {/* Media */}
        <div className="pf-media">
          {project.image ? (
            <div className="pf-media-img">
              <Image
                src={project.image}
                alt={project.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 900px) 100vw, 50vw"
                preload={index === 0}
              />
            </div>
          ) : (
            <div
              className="pf-media-visual"
              style={{ background: project.cardBg }}
            >
              <div
                className="pf-media-glow"
                style={{ background: project.highlightColor }}
              />
              <div style={{ position: "relative", zIndex: 1, width: "82%", maxWidth: 440 }}>
                <CardVisual accent={project.accent} />
              </div>
            </div>
          )}
          <span className="pf-arrow-badge" aria-hidden>
            →
          </span>
        </div>

        {/* Info */}
        <div className="pf-info">
          <div>
            <div className="pf-meta">
              <div className="pf-chips">
                <span
                  className="pf-chip"
                  style={{
                    color: project.accent,
                    background: `${project.accent}16`,
                    border: `1px solid ${project.accent}2c`,
                  }}
                >
                  {project.category}
                </span>
                <span className="pf-chip pf-chip-plain">{project.industry}</span>
              </div>
              <span className="pf-number">{project.number}</span>
            </div>

            <h2 className="pf-title">{project.title}</h2>
            <p className="pf-desc">{project.subtitle}</p>

            <div className="pf-tags">
              {project.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="pf-tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="pf-stats">
              {stats.map((s) => (
                <div key={s.metric}>
                  <p className="pf-stat-value" style={{ color: project.accent }}>
                    {s.value}
                  </p>
                  <p className="pf-stat-label">{s.metric}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pf-foot">
            <span className="pf-cta">
              View Case Study
              <span className="pf-cta-arrow">→</span>
            </span>
            <span className="pf-year">{project.year}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── SVG visual for projects without an image ───────────── */
function CardVisual({ accent }: { accent: string }) {
  const nodes: [number, number][] = [
    [230, 80],
    [110, 148],
    [350, 148],
    [150, 220],
    [310, 220],
    [230, 182],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
  ];
  return (
    <svg
      viewBox="0 0 460 280"
      fill="none"
      style={{
        display: "block",
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.38)",
      }}
    >
      <rect width="460" height="280" rx="14" fill="white" fillOpacity="0.07" />
      <rect width="460" height="36" rx="14" fill={`${accent}12`} />
      <rect y="22" width="460" height="14" fill={`${accent}12`} />
      <rect x="16" y="11" width="100" height="14" rx="7" fill={`${accent}30`} />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.25"
        />
      ))}
      {nodes.map(([cx, cy], i) => (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r={i === 0 ? 24 : i === 5 ? 20 : 15}
            fill={`${accent}${i === 0 ? "30" : "16"}`}
            stroke={accent}
            strokeWidth="1.5"
            strokeOpacity={i === 0 ? 0.75 : 0.35}
          />
          <circle
            cx={cx}
            cy={cy}
            r={i === 0 ? 11 : 7}
            fill={accent}
            fillOpacity={i === 0 ? 0.75 : 0.4}
          />
        </g>
      ))}
    </svg>
  );
}
