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

export default function ProjectsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />
      <main style={{ backgroundColor: "var(--bg-primary)", transition: "background-color 0.45s ease", minHeight: "100vh" }}>
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
        paddingTop: "clamp(120px, 14vw, 180px)",
        paddingBottom: "clamp(64px, 8vw, 100px)",
        paddingLeft: "clamp(24px, 5vw, 80px)",
        paddingRight: "clamp(24px, 5vw, 80px)",
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-secondary)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 20,
              transition: "color 0.45s ease",
            }}
          >
            Featured Work
          </motion.p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.0, ease: EASE, delay: 0.08 }}
              style={{
                fontSize: "clamp(48px, 7vw, 96px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
                lineHeight: 1.02,
                marginBottom: 0,
                transition: "color 0.45s ease",
              }}
            >
              Case studies.
            </motion.h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.22 }}
          style={{ maxWidth: 380 }}
        >
          <p
            style={{
              fontSize: "clamp(14px, 1.1vw, 16px)",
              color: "var(--text-secondary)",
              lineHeight: 1.75,
              marginBottom: 24,
              transition: "color 0.45s ease",
            }}
          >
            Products, platforms, and systems built across fintech, enterprise,
            and government sectors in Saudi Arabia and the MENA region.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["UX Design", "Product Strategy", "Design Systems", "Open Banking"].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 100,
                  padding: "5px 12px",
                  letterSpacing: "0.01em",
                  transition: "all 0.45s ease",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.0, ease: EASE, delay: 0.35 }}
        style={{
          marginTop: 56,
          height: 1,
          background: "var(--border-color)",
          transition: "background 0.45s ease",
        }}
      />

      {/* Count row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, transition: "color 0.45s ease" }}>
          {PROJECTS.length} projects
        </span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, transition: "color 0.45s ease" }}>
          2022 – 2024
        </span>
      </motion.div>
    </section>
  );
}

function ProjectsList() {
  return (
    <section
      style={{
        paddingBottom: "clamp(80px, 12vw, 160px)",
        paddingLeft: "clamp(24px, 5vw, 80px)",
        paddingRight: "clamp(24px, 5vw, 80px)",
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 2.5vw, 32px)" }}>
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: (typeof PROJECTS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE, delay: index * 0.06 }}
    >
      <Link href={`/projects/${project.slug}`} style={{ textDecoration: "none", display: "block" }}>
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{
            boxShadow: hovered
              ? "0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)"
              : "0 4px 20px rgba(0,0,0,0.06)",
            y: hovered ? -4 : 0,
          }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            borderRadius: "clamp(20px, 2vw, 32px)",
            overflow: "hidden",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            display: "grid",
            gridTemplateColumns: index % 2 === 0 ? "62fr 38fr" : "38fr 62fr",
            minHeight: "clamp(360px, 36vw, 520px)",
            cursor: "pointer",
            transition: "background 0.45s ease, border-color 0.45s ease",
          }}
          className="project-listing-card"
        >
          {/* Visual panel */}
          <div
            style={{
              order: index % 2 === 0 ? 0 : 1,
              background: project.cardBg,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(28px, 4vw, 56px)",
            }}
          >
            {/* Glow blob */}
            <motion.div
              animate={{ opacity: hovered ? 0.9 : 0.5, scale: hovered ? 1.1 : 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{
                position: "absolute",
                top: "10%",
                right: "10%",
                width: "45%",
                paddingBottom: "45%",
                borderRadius: "50%",
                background: project.highlightColor,
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />

            {/* Image or SVG mockup */}
            <motion.div
              animate={{ scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460 }}
            >
              {project.image ? (
                <div
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    aspectRatio: "16/10",
                    position: "relative",
                  }}
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                </div>
              ) : (
                <ProjectVisualLarge accent={project.accent} visual={project.visual} />
              )}
            </motion.div>

            {/* Year badge */}
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
              {project.year}
            </div>
          </div>

          {/* Info panel */}
          <div
            style={{
              order: index % 2 === 0 ? 1 : 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "clamp(28px, 4vw, 52px)",
              backgroundColor: "var(--bg-surface)",
              transition: "background-color 0.45s ease",
            }}
          >
            {/* Top */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.08em",
                    transition: "color 0.45s ease",
                  }}
                >
                  {project.number}
                </span>

                <motion.div
                  animate={{
                    background: hovered ? project.accent : "var(--bg-primary)",
                    borderColor: hovered ? project.accent : "var(--border-color)",
                  }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1.5px solid",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <motion.span
                    animate={{ color: hovered ? "#fff" : "var(--text-secondary)" }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 16, lineHeight: 1, transition: "color 0.3s ease" }}
                  >
                    ↗
                  </motion.span>
                </motion.div>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: project.accent,
                    background: `${project.accent}18`,
                    border: `1px solid ${project.accent}30`,
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
                    letterSpacing: "0.01em",
                    transition: "all 0.45s ease",
                  }}
                >
                  {project.industry}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: "clamp(22px, 2.5vw, 36px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.1,
                  marginBottom: 14,
                  transition: "color 0.45s ease",
                }}
              >
                {project.title}
              </h2>

              <p
                style={{
                  fontSize: "clamp(13px, 1vw, 14px)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.72,
                  marginBottom: 0,
                  transition: "color 0.45s ease",
                }}
              >
                {project.subtitle}
              </p>
            </div>

            {/* Bottom */}
            <div>
              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "var(--border-color)",
                  margin: "28px 0",
                  transition: "background 0.45s ease",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 100,
                        padding: "3px 10px",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        transition: "all 0.45s ease",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <motion.span
                  animate={{
                    color: hovered ? project.accent : "var(--text-secondary)",
                    x: hovered ? 3 : 0,
                  }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "color 0.3s ease",
                  }}
                >
                  View Case Study →
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function ProjectVisualLarge({ accent, visual }: { accent: string; visual: string }) {
  const style = {
    display: "block",
    width: "100%",
    borderRadius: 16,
    overflow: "hidden" as const,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  };

  if (visual === "dashboard") {
    return (
      <svg viewBox="0 0 460 280" fill="none" style={style}>
        <rect width="460" height="280" rx="14" fill="white" fillOpacity="0.07" />
        <rect width="460" height="36" rx="14" fill={`${accent}18`} />
        <rect y="22" width="460" height="14" fill={`${accent}18`} />
        {[14, 26, 38].map((x, i) => (
          <circle key={i} cx={x} cy="16" r="4.5" fill={["#FF5F57", "#FFBD2E", "#28CA41"][i]} />
        ))}
        <rect x="82" y="8" width="180" height="16" rx="8" fill="white" fillOpacity="0.07" />
        <rect x="94" y="13" width="80" height="6" rx="3" fill={`${accent}40`} />
        <rect y="36" width="76" height="244" fill={`${accent}08`} />
        {[0,1,2,3,4].map((i) => (
          <rect key={i} x="12" y={56 + i*34} width="52" height="20" rx="10" fill={i===0 ? `${accent}30` : `${accent}10`} />
        ))}
        {[0,1,2].map((i) => (
          <g key={i}>
            <rect x={90 + i*118} y={48} width={106} height={58} rx={14} fill={i===0 ? `${accent}22` : `${accent}0A`} />
            <rect x={102 + i*118} y={60} width={50} height={7} rx={3.5} fill={`${accent}40`} />
            <rect x={102 + i*118} y={72} width={70} height={16} rx={6} fill={`${accent}${i===0 ? "60" : "25"}`} />
            <rect x={102 + i*118} y={92} width={36} height={5} rx={2.5} fill={`${accent}20`} />
          </g>
        ))}
        <rect x="90" y="120" width="244" height="140" rx="14" fill={`${accent}06`} />
        <line x1="90" y1="236" x2="334" y2="236" stroke={`${accent}20`} strokeWidth="1" />
        {[0.3,0.6,0.45,0.85,0.65,0.92,0.72,0.98].map((h, i) => (
          <rect key={i} x={104+i*28} y={236-Math.round(96*h)} width={18} height={Math.round(96*h)} rx={5}
            fill={accent} fillOpacity={i===7?0.9:0.22+i*0.04} />
        ))}
        <polyline points="113,196 141,172 169,184 197,144 225,158 253,136 281,150 309,124"
          stroke={accent} strokeWidth="2.5" fill="none" strokeOpacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="309" cy="124" r="5.5" fill={accent} fillOpacity="0.9" />
        <rect x="346" y="48" width="102" height="212" rx="14" fill={`${accent}06`} />
        {[0,1,2,3,4,5].map((i) => (
          <g key={i}>
            <circle cx="364" cy={68+i*32} r="9" fill={`${accent}${i===0?"32":"12"}`} />
            <rect x="378" y={61+i*32} width={i===0?62:46} height="8" rx="4" fill={`${accent}${i===0?"28":"10"}`} />
            <rect x="378" y={73+i*32} width="38" height="5" rx="2.5" fill={`${accent}10`} />
          </g>
        ))}
      </svg>
    );
  }

  if (visual === "fintech") {
    return (
      <svg viewBox="0 0 380 260" fill="none" style={style}>
        <rect x="20" y="0" width="145" height="260" rx="26" fill="white" fillOpacity="0.09" stroke={`${accent}25`} strokeWidth="1.5" />
        <rect x="20" y="0" width="145" height="48" rx="26" fill={`${accent}25`} />
        <rect x="20" y="30" width="145" height="18" fill={`${accent}25`} />
        <rect x="60" y="10" width="65" height="15" rx="7.5" fill={`${accent}50`} />
        <rect x="34" y="62" width="117" height="66" rx="16" fill={`${accent}22`} />
        <rect x="46" y="72" width="48" height="9" rx="4.5" fill={`${accent}55`} />
        <rect x="46" y="86" width="72" height="18" rx="7" fill={`${accent}75`} />
        <rect x="46" y="108" width="38" height="7" rx="3.5" fill={`${accent}38`} />
        <polyline points="34,162 56,150 78,156 100,136 122,146 144,128 154,133"
          stroke={accent} strokeWidth="2.5" fill="none" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="154" cy="133" r="5.5" fill={accent} />
        {[0,1,2].map((i) => (
          <g key={i}>
            <rect x="34" y={178+i*22} width="117" height="15" rx="7.5" fill={`${accent}${i===0?"20":"0C"}`} />
            <rect x="34" y={178+i*22} width={[82,60,70][i]} height="15" rx="7.5" fill={`${accent}${i===0?"30":"16"}`} />
          </g>
        ))}
        <rect x="215" y="0" width="145" height="260" rx="26" fill="white" fillOpacity="0.09" stroke={`${accent}25`} strokeWidth="1.5" />
        <rect x="215" y="0" width="145" height="48" rx="26" fill={`${accent}16`} />
        <rect x="215" y="30" width="145" height="18" fill={`${accent}16`} />
        <rect x="255" y="10" width="65" height="15" rx="7.5" fill={`${accent}28`} />
        <rect x="228" y="62" width="117" height="90" rx="14" fill={`${accent}09`} />
        {[0.45,0.75,0.58,0.92,0.68,0.88].map((h, i) => (
          <rect key={i} x={235+i*18} y={144-Math.round(68*h)} width={13} height={Math.round(68*h)} rx={4.5}
            fill={accent} fillOpacity={i===3?0.85:0.3} />
        ))}
        {[0,1,2,3].map((i) => (
          <rect key={i} x={228+i*28} y={162} width={22} height={22} rx={11} fill={`${accent}${i===0?"32":"16"}`} />
        ))}
        {[0,1,2].map((i) => (
          <g key={i}>
            <circle cx="234" cy={200+i*18} r="8" fill={`${accent}20`} />
            <rect x="248" y={195+i*18} width="64" height="8" rx="4" fill={`${accent}20`} />
            <rect x="248" y={206+i*18} width="42" height="5" rx="2.5" fill={`${accent}10`} />
          </g>
        ))}
      </svg>
    );
  }

  if (visual === "mobile") {
    return (
      <svg viewBox="0 0 380 260" fill="none" style={style}>
        <rect x="105" y="0" width="145" height="260" rx="28" fill="white" fillOpacity="0.09" stroke={`${accent}25`} strokeWidth="1.5" />
        <rect x="105" y="0" width="145" height="48" rx="28" fill={`${accent}25`} />
        <rect x="105" y="30" width="145" height="18" fill={`${accent}25`} />
        <rect x="148" y="10" width="65" height="15" rx="7.5" fill={`${accent}50`} />
        <rect x="120" y="62" width="115" height="92" rx="18" fill={`${accent}22`} />
        <circle cx="178" cy="108" r="28" fill={`${accent}32`} />
        <circle cx="178" cy="108" r="18" fill={accent} fillOpacity="0.78" />
        <polygon points="174,101 174,115 187,108" fill="white" opacity="0.95" />
        <rect x="120" y="168" width="80" height="11" rx="5.5" fill={`${accent}38`} />
        <rect x="120" y="183" width="106" height="8" rx="4" fill={`${accent}20`} />
        <rect x="120" y="195" width="88" height="8" rx="4" fill={`${accent}14`} />
        <rect x="120" y="212" width="115" height="32" rx="16" fill={accent} fillOpacity="0.9" />
        <rect x="148" y="223" width="60" height="10" rx="5" fill="white" opacity="0.78" />
        <rect x="0" y="32" width="92" height="60" rx="18" fill="white" fillOpacity="0.1" stroke={`${accent}20`} strokeWidth="1" />
        <rect x="12" y="44" width="36" height="8" rx="4" fill={`${accent}30`} />
        <rect x="12" y="57" width="58" height="14" rx="6" fill={`${accent}22`} />
        <rect x="12" y="75" width="30" height="7" rx="3.5" fill={`${accent}16`} />
        <rect x="290" y="158" width="88" height="72" rx="18" fill="white" fillOpacity="0.1" stroke={`${accent}20`} strokeWidth="1" />
        <circle cx="308" cy="177" r="10" fill={`${accent}30`} />
        <circle cx="308" cy="177" r="5" fill={accent} fillOpacity="0.65" />
        <rect x="324" y="171" width="44" height="8" rx="4" fill={`${accent}25`} />
        <rect x="324" y="183" width="34" height="6" rx="3" fill={`${accent}16`} />
      </svg>
    );
  }

  if (visual === "enterprise") {
    return (
      <svg viewBox="0 0 460 280" fill="none" style={style}>
        <rect width="460" height="280" rx="14" fill="white" fillOpacity="0.07" />
        <rect width="460" height="36" rx="14" fill={`${accent}16`} />
        <rect y="22" width="460" height="14" fill={`${accent}16`} />
        <rect x="16" y="11" width="88" height="14" rx="7" fill={`${accent}35`} />
        <rect x="116" y="11" width="64" height="14" rx="7" fill={`${accent}20`} />
        <rect x="192" y="11" width="64" height="14" rx="7" fill={`${accent}20`} />
        <ellipse cx="230" cy="155" rx="56" ry="42" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" strokeOpacity="0.45" />
        <ellipse cx="230" cy="155" rx="32" ry="25" fill={`${accent}30`} />
        <text x="230" y="160" textAnchor="middle" fontSize="13" fontWeight="700" fill={accent} fillOpacity="0.88">CX</text>
        {[
          { cx: 72, cy: 105, label: "Sales" },
          { cx: 72, cy: 195, label: "Service" },
          { cx: 388, cy: 105, label: "Commerce" },
          { cx: 388, cy: 195, label: "Marketing" },
          { cx: 230, cy: 56, label: "Data" },
        ].map(({ cx, cy, label }, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={230} y2={155} stroke={accent} strokeWidth="1" strokeOpacity="0.28" strokeDasharray="4 3" />
            <rect x={cx-32} y={cy-17} width={64} height={34} rx={11} fill={`${accent}16`} stroke={accent} strokeWidth="1" strokeOpacity="0.32" />
            <text x={cx} y={cy+5} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={accent} fillOpacity="0.8">{label}</text>
          </g>
        ))}
        {[0,1,2].map((i) => (
          <rect key={i} x={58+i*124} y={248} width={106} height={15} rx={7.5} fill={`${accent}${i===0?"22":"0E"}`} />
        ))}
      </svg>
    );
  }

  const nodes: [number, number][] = [[230, 80], [110, 148], [350, 148], [150, 220], [310, 220], [230, 182]];
  const edges = [[0,1],[0,2],[1,3],[2,4],[1,5],[2,5],[3,5],[4,5]];
  return (
    <svg viewBox="0 0 460 280" fill="none" style={style}>
      <rect width="460" height="280" rx="14" fill="white" fillOpacity="0.07" />
      <rect width="460" height="36" rx="14" fill={`${accent}12`} />
      <rect y="22" width="460" height="14" fill={`${accent}12`} />
      <rect x="16" y="11" width="100" height="14" rx="7" fill={`${accent}30`} />
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={accent} strokeWidth="1.5" strokeOpacity="0.25" />
      ))}
      {nodes.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={i===0?24:i===5?20:15}
            fill={`${accent}${i===0?"30":"16"}`}
            stroke={accent} strokeWidth="1.5" strokeOpacity={i===0?0.75:0.35} />
          <circle cx={cx} cy={cy} r={i===0?11:7}
            fill={accent} fillOpacity={i===0?0.75:0.4} />
        </g>
      ))}
      <circle cx="230" cy="80" r="38" stroke={accent} strokeWidth="1" strokeOpacity="0.16" fill="none" />
      {[[230,258,"Saudi Banks"],[64,258,"Open API"],[378,258,"Real-time"]].map(([x, y, label], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" fontSize="10.5" fontWeight="500" fill={accent} fillOpacity="0.58">
          {label}
        </text>
      ))}
    </svg>
  );
}
