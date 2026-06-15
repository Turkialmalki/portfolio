"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { PROJECTS } from "@/data/projects";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INITIAL_DESKTOP = 4;
const INITIAL_MOBILE = 3;

export default function ProjectsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />
      <main
        style={{
          backgroundColor: "var(--bg-primary)",
          transition: "background-color 0.35s ease",
          minHeight: "100vh",
        }}
      >
        <PageHero />
        <ProjectsList />
      </main>
      <Footer />
    </>
  );
}

function PageHero() {
  return (
    <section
      style={{
        paddingTop: "clamp(82px, 8vw, 110px)",
        paddingBottom: "clamp(48px, 5vw, 64px)",
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: 980,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 18px",
          borderRadius: 999,
          background: "var(--bg-surface)",
          color: "var(--text-secondary)",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 28,
        }}
      >
        Portfolio
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
        style={{
          fontSize: "clamp(44px, 5.8vw, 76px)",
          fontWeight: 800,
          letterSpacing: "-0.055em",
          lineHeight: 0.96,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        Crafted Experiences
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
        style={{
          fontSize: "clamp(17px, 1.35vw, 21px)",
          lineHeight: 1.55,
          color: "var(--text-secondary)",
          maxWidth: 620,
          margin: "22px auto 0",
        }}
      >
        A collection of design solutions crafted with purpose, creativity, and
        attention to detail.
      </motion.p>
    </section>
  );
}

function ProjectsList() {
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const initialCount = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
  const visibleProjects = showAll ? PROJECTS : PROJECTS.slice(0, initialCount);
  const hasMore = PROJECTS.length > initialCount;

  return (
    <section
      style={{
        paddingBottom: "clamp(80px, 10vw, 140px)",
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(28px, 3vw, 40px)",
        }}
      >
        {visibleProjects.map((project, i) => (
          <FeaturedCard key={project.slug} project={project} />
        ))}
      </div>

      {hasMore && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 56 }}
        >
          <LoadMoreButton
            showAll={showAll}
            onToggle={() => setShowAll((p) => !p)}
          />
        </div>
      )}
    </section>
  );
}

function LoadMoreButton({
  showAll,
  onToggle,
}: {
  showAll: boolean;
  onToggle: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onToggle}
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: hov ? "var(--bg-primary)" : "var(--text-primary)",
        background: hov ? "var(--text-primary)" : "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 100,
        padding: "13px 40px",
        cursor: "pointer",
        letterSpacing: "-0.01em",
        outline: "none",
        transition: "all 0.25s ease",
      }}
    >
      {showAll ? "Show Less" : "Load More"}
    </button>
  );
}

/* ─── Featured card (index 0) — full width, horizontal layout ─────────────── */
function FeaturedCard({ project }: { project: (typeof PROJECTS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <Link
        href={`/projects/${project.slug}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{
            y: hovered ? -6 : 0,
            boxShadow: hovered
              ? "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)"
              : "0 2px 12px rgba(0,0,0,0.06)",
          }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{
            borderRadius: 28,
            overflow: "hidden",
            cursor: "pointer",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: 360,
            background: "var(--bg-card)",
            border: "none",
            boxShadow: "none",
            transition: "background-color 0.35s ease",
          }}
          className="featured-card"
        >
          {/* Visual side */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--bg-card-muted)",
              display: "flex",
              transition: "background-color 0.35s ease",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              margin: 24,
              borderRadius: 24,
            }}
          >
            <div
              style={{
                // position: "absolute",
                // top: "5%",
                // right: "5%",
                // width: "55%",
                // paddingBottom: "55%",
                // borderRadius: "50%",
                // background: project.highlightColor,
                // filter: "blur(80px)",
                // opacity: hovered ? 0.9 : 0.6,
                // transition: "opacity 0.5s ease",
                // pointerEvents: "none",
              }}
            />

            <motion.div
              animate={{ scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                maxWidth: 520,
              }}
            >
              {project.image ? (
                <div
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
                    aspectRatio: "16/10",
                    position: "relative",
                  }}
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 65vw"
                    priority
                  />
                </div>
              ) : (
                <CardVisual accent={project.accent} visual={project.visual} />
              )}
            </motion.div>

            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.08em",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 100,
                padding: "4px 12px",
              }}
            >
              {/* {project.year} */}
            </div>
          </div>

          {/* Info side */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "clamp(28px, 4vw, 52px)",
              backgroundColor: "var(--bg-surface)",
              transition: "background-color 0.45s ease",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: project.accent,
                    background: `${project.accent}15`,
                    border: `1px solid ${project.accent}28`,
                    borderRadius: 100,
                    padding: "4px 12px",
                    letterSpacing: "0.01em",
                  }}
                >
                  {project.category}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 100,
                    padding: "4px 12px",
                    transition: "all 0.45s ease",
                  }}
                >
                  {project.industry}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(24px, 3vw, 42px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.038em",
                  lineHeight: 1.1,
                  marginBottom: 14,
                  transition: "color 0.45s ease",
                }}
              >
                {project.title}
              </h2>

              <p
                style={{
                  fontSize: "clamp(13px, 1.05vw, 15px)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.72,
                  transition: "color 0.45s ease",
                }}
              >
                {project.subtitle}
              </p>
            </div>

            <div>
              <div
                style={{
                  height: 1,
                  background: "var(--border-color)",
                  margin: "24px 0",
                  transition: "background 0.45s ease",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: hovered ? project.accent : "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "color 0.3s ease",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span>View Project</span>
                  <motion.span
                    animate={{ x: hovered ? 4 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    →
                  </motion.span>
                </div>

                <motion.div
                  animate={{
                    background: hovered ? project.accent : "var(--bg-primary)",
                    borderColor: hovered
                      ? project.accent
                      : "var(--border-color)",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1.5px solid",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <motion.span
                    animate={{
                      color: hovered ? "#fff" : "var(--text-secondary)",
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 15, lineHeight: 1 }}
                  >
                    ↗
                  </motion.span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Standard project card — portrait, image top ─────────────────────────── */
function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay: (index % 2) * 0.08 }}
    >
      <Link
        href={`/projects/${project.slug}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{
            y: hovered ? -6 : 0,
            boxShadow: hovered
              ? "0 28px 70px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)"
              : "0 2px 10px rgba(0,0,0,0.05)",
          }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{
            borderRadius: 28,
            overflow: "hidden",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            transition: "background 0.45s ease, border-color 0.45s ease",
          }}
        >
          {/* Image / Visual */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              aspectRatio: "16/10",
            }}
          >
            {project.image ? (
              <motion.div
                animate={{ scale: hovered ? 1.04 : 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                style={{ position: "absolute", inset: 0 }}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1320px) 50vw, 660px"
                />
              </motion.div>
            ) : (
              <motion.div
                animate={{ scale: hovered ? 1.04 : 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: project.cardBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "5%",
                    right: "5%",
                    width: "60%",
                    paddingBottom: "60%",
                    borderRadius: "50%",
                    background: project.highlightColor,
                    filter: "blur(80px)",
                    opacity: 0.65,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "72%",
                    maxWidth: 360,
                  }}
                >
                  <CardVisual accent={project.accent} visual={project.visual} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Info */}
          <div
            style={{
              padding: "clamp(20px, 2.5vw, 28px)",
              borderTop: "1px solid var(--border-color)",
              transition: "border-color 0.45s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: project.accent,
                  background: `${project.accent}15`,
                  border: `1px solid ${project.accent}28`,
                  borderRadius: 100,
                  padding: "4px 12px",
                  letterSpacing: "0.01em",
                }}
              >
                {project.category}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 100,
                  padding: "4px 12px",
                  transition: "all 0.45s ease",
                }}
              >
                {project.industry}
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(20px, 2.2vw, 28px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.032em",
                lineHeight: 1.12,
                marginBottom: 8,
                transition: "color 0.45s ease",
              }}
            >
              {project.title}
            </h2>

            <p
              style={
                {
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                  marginBottom: 20,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  transition: "color 0.45s ease",
                } as React.CSSProperties
              }
            >
              {project.subtitle}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: hovered ? project.accent : "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "color 0.3s ease",
                  letterSpacing: "-0.01em",
                }}
              >
                <span>View Case Study</span>
                <motion.span
                  animate={{ x: hovered ? 4 : 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  →
                </motion.span>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.02em",
                  transition: "color 0.45s ease",
                }}
              >
                {project.year}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── SVG visuals for cards without images ────────────────────────────────── */
function CardVisual({ accent, visual }: { accent: string; visual: string }) {
  const s = {
    display: "block",
    width: "100%",
    borderRadius: 14,
    overflow: "hidden" as const,
    boxShadow: "0 16px 48px rgba(0,0,0,0.38)",
  };

  if (visual === "dashboard") {
    return (
      <svg viewBox="0 0 460 280" fill="none" style={s}>
        <rect
          width="460"
          height="280"
          rx="14"
          fill="white"
          fillOpacity="0.07"
        />
        <rect width="460" height="36" rx="14" fill={`${accent}18`} />
        <rect y="22" width="460" height="14" fill={`${accent}18`} />
        {[14, 26, 38].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy="16"
            r="4.5"
            fill={["#FF5F57", "#FFBD2E", "#28CA41"][i]}
          />
        ))}
        <rect
          x="82"
          y="8"
          width="180"
          height="16"
          rx="8"
          fill="white"
          fillOpacity="0.07"
        />
        <rect x="94" y="13" width="80" height="6" rx="3" fill={`${accent}40`} />
        <rect y="36" width="76" height="244" fill={`${accent}08`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x="12"
            y={56 + i * 34}
            width="52"
            height="20"
            rx="10"
            fill={i === 0 ? `${accent}30` : `${accent}10`}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={90 + i * 118}
              y={48}
              width={106}
              height={58}
              rx={14}
              fill={i === 0 ? `${accent}22` : `${accent}0A`}
            />
            <rect
              x={102 + i * 118}
              y={60}
              width={50}
              height={7}
              rx={3.5}
              fill={`${accent}40`}
            />
            <rect
              x={102 + i * 118}
              y={72}
              width={70}
              height={16}
              rx={6}
              fill={`${accent}${i === 0 ? "60" : "25"}`}
            />
            <rect
              x={102 + i * 118}
              y={92}
              width={36}
              height={5}
              rx={2.5}
              fill={`${accent}20`}
            />
          </g>
        ))}
        <rect
          x="90"
          y="120"
          width="244"
          height="140"
          rx="14"
          fill={`${accent}06`}
        />
        <line
          x1="90"
          y1="236"
          x2="334"
          y2="236"
          stroke={`${accent}20`}
          strokeWidth="1"
        />
        {[0.3, 0.6, 0.45, 0.85, 0.65, 0.92, 0.72, 0.98].map((h, i) => (
          <rect
            key={i}
            x={104 + i * 28}
            y={236 - Math.round(96 * h)}
            width={18}
            height={Math.round(96 * h)}
            rx={5}
            fill={accent}
            fillOpacity={i === 7 ? 0.9 : 0.22 + i * 0.04}
          />
        ))}
        <polyline
          points="113,196 141,172 169,184 197,144 225,158 253,136 281,150 309,124"
          stroke={accent}
          strokeWidth="2.5"
          fill="none"
          strokeOpacity="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="309" cy="124" r="5.5" fill={accent} fillOpacity="0.9" />
        <rect
          x="346"
          y="48"
          width="102"
          height="212"
          rx="14"
          fill={`${accent}06`}
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <circle
              cx="364"
              cy={68 + i * 32}
              r="9"
              fill={`${accent}${i === 0 ? "32" : "12"}`}
            />
            <rect
              x="378"
              y={61 + i * 32}
              width={i === 0 ? 62 : 46}
              height="8"
              rx="4"
              fill={`${accent}${i === 0 ? "28" : "10"}`}
            />
            <rect
              x="378"
              y={73 + i * 32}
              width="38"
              height="5"
              rx="2.5"
              fill={`${accent}10`}
            />
          </g>
        ))}
      </svg>
    );
  }

  if (visual === "mobile") {
    return (
      <svg viewBox="0 0 380 260" fill="none" style={s}>
        <rect
          x="105"
          y="0"
          width="145"
          height="260"
          rx="28"
          fill="white"
          fillOpacity="0.09"
          stroke={`${accent}25`}
          strokeWidth="1.5"
        />
        <rect
          x="105"
          y="0"
          width="145"
          height="48"
          rx="28"
          fill={`${accent}25`}
        />
        <rect x="105" y="30" width="145" height="18" fill={`${accent}25`} />
        <rect
          x="148"
          y="10"
          width="65"
          height="15"
          rx="7.5"
          fill={`${accent}50`}
        />
        <rect
          x="120"
          y="62"
          width="115"
          height="92"
          rx="18"
          fill={`${accent}22`}
        />
        <circle cx="178" cy="108" r="28" fill={`${accent}32`} />
        <circle cx="178" cy="108" r="18" fill={accent} fillOpacity="0.78" />
        <polygon points="174,101 174,115 187,108" fill="white" opacity="0.95" />
        <rect
          x="120"
          y="168"
          width="80"
          height="11"
          rx="5.5"
          fill={`${accent}38`}
        />
        <rect
          x="120"
          y="183"
          width="106"
          height="8"
          rx="4"
          fill={`${accent}20`}
        />
        <rect
          x="120"
          y="195"
          width="88"
          height="8"
          rx="4"
          fill={`${accent}14`}
        />
        <rect
          x="120"
          y="212"
          width="115"
          height="32"
          rx="16"
          fill={accent}
          fillOpacity="0.9"
        />
        <rect
          x="148"
          y="223"
          width="60"
          height="10"
          rx="5"
          fill="white"
          opacity="0.78"
        />
        <rect
          x="0"
          y="32"
          width="92"
          height="60"
          rx="18"
          fill="white"
          fillOpacity="0.1"
          stroke={`${accent}20`}
          strokeWidth="1"
        />
        <rect x="12" y="44" width="36" height="8" rx="4" fill={`${accent}30`} />
        <rect
          x="12"
          y="57"
          width="58"
          height="14"
          rx="6"
          fill={`${accent}22`}
        />
        <rect
          x="290"
          y="158"
          width="88"
          height="72"
          rx="18"
          fill="white"
          fillOpacity="0.1"
          stroke={`${accent}20`}
          strokeWidth="1"
        />
        <circle cx="308" cy="177" r="10" fill={`${accent}30`} />
        <circle cx="308" cy="177" r="5" fill={accent} fillOpacity="0.65" />
        <rect
          x="324"
          y="171"
          width="44"
          height="8"
          rx="4"
          fill={`${accent}25`}
        />
      </svg>
    );
  }

  if (visual === "enterprise") {
    return (
      <svg viewBox="0 0 460 280" fill="none" style={s}>
        <rect
          width="460"
          height="280"
          rx="14"
          fill="white"
          fillOpacity="0.07"
        />
        <rect width="460" height="36" rx="14" fill={`${accent}16`} />
        <rect y="22" width="460" height="14" fill={`${accent}16`} />
        <rect
          x="16"
          y="11"
          width="88"
          height="14"
          rx="7"
          fill={`${accent}35`}
        />
        <ellipse
          cx="230"
          cy="155"
          rx="56"
          ry="42"
          fill={`${accent}18`}
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
        <ellipse cx="230" cy="155" rx="32" ry="25" fill={`${accent}30`} />
        <text
          x="230"
          y="160"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={accent}
          fillOpacity="0.88"
        >
          CX
        </text>
        {[
          { cx: 72, cy: 105, label: "Sales" },
          { cx: 72, cy: 195, label: "Service" },
          { cx: 388, cy: 105, label: "Commerce" },
          { cx: 388, cy: 195, label: "Marketing" },
          { cx: 230, cy: 56, label: "Data" },
        ].map(({ cx, cy, label }, i) => (
          <g key={i}>
            <line
              x1={cx}
              y1={cy}
              x2={230}
              y2={155}
              stroke={accent}
              strokeWidth="1"
              strokeOpacity="0.28"
              strokeDasharray="4 3"
            />
            <rect
              x={cx - 32}
              y={cy - 17}
              width={64}
              height={34}
              rx={11}
              fill={`${accent}16`}
              stroke={accent}
              strokeWidth="1"
              strokeOpacity="0.32"
            />
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="600"
              fill={accent}
              fillOpacity="0.8"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // network / fintech fallback
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
    <svg viewBox="0 0 460 280" fill="none" style={s}>
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
