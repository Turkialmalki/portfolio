"use client";

import { useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { getProject, PROJECTS } from "@/data/projects";
import type { ProjectData } from "@/data/projects";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function FadeIn({ children, delay = 0, y = 24 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: accent,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 20,
      }}
    >
      {children}
    </p>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--border-color)",
        margin: "clamp(64px, 8vw, 112px) 0",
        transition: "background 0.45s ease",
      }}
    />
  );
}

export default function ProjectDetailClient({ slug }: { slug: string }) {
  const project = getProject(slug);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (!project) {
    notFound();
  }

  const currentIndex = PROJECTS.findIndex((p) => p.slug === slug);
  const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

  return (
    <>
      <TopBar />
      <Navbar />
      <main style={{ backgroundColor: "var(--bg-primary)", transition: "background-color 0.45s ease" }}>
        <HeroSection project={project} />
        <ShowcaseSection project={project} />
        <ContentWrapper>
          <ProjectInfoSection project={project} />
          <SectionDivider />
          <ProblemSection project={project} />
          <SectionDivider />
          <GoalSection project={project} />
          <SectionDivider />
          <ResearchSection project={project} />
          <SectionDivider />
          <DesignProcessSection project={project} />
          <SectionDivider />
          <FinalSolutionSection project={project} />
          <SectionDivider />
          <DesignDecisionsSection project={project} />
          <SectionDivider />
          <OutcomesSection project={project} />
          <SectionDivider />
          <ReflectionSection project={project} />
        </ContentWrapper>
        <NextProjectSection project={nextProject} />
      </main>
      <Footer />
    </>
  );
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 clamp(24px, 5vw, 48px)",
      }}
    >
      {children}
    </div>
  );
}

function HeroSection({ project }: { project: ProjectData }) {
  return (
    <section
      style={{
        paddingTop: "clamp(120px, 14vw, 180px)",
        paddingBottom: "clamp(56px, 7vw, 88px)",
        paddingLeft: "clamp(24px, 5vw, 80px)",
        paddingRight: "clamp(24px, 5vw, 80px)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ marginBottom: 40 }}
      >
        <Link
          href="/projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = project.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <span style={{ fontSize: 16 }}>←</span>
          All Work
        </Link>
      </motion.div>

      {/* Tags row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.06 }}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: project.accent,
            background: `${project.accent}18`,
            border: `1px solid ${project.accent}35`,
            borderRadius: 100,
            padding: "5px 14px",
            letterSpacing: "0.01em",
          }}
        >
          {project.category}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 100,
            padding: "5px 14px",
            letterSpacing: "0.01em",
            transition: "all 0.45s ease",
          }}
        >
          {project.industry}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 100,
            padding: "5px 14px",
            transition: "all 0.45s ease",
          }}
        >
          {project.year}
        </span>
      </motion.div>

      {/* Title */}
      <div style={{ overflow: "hidden", marginBottom: 20 }}>
        <motion.h1
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.0, ease: EASE, delay: 0.1 }}
          style={{
            fontSize: "clamp(44px, 7vw, 96px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            transition: "color 0.45s ease",
          }}
        >
          {project.title}
        </motion.h1>
      </div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        style={{
          fontSize: "clamp(16px, 1.4vw, 20px)",
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          maxWidth: 560,
          marginBottom: 44,
          transition: "color 0.45s ease",
        }}
      >
        {project.subtitle}
      </motion.p>

      {/* Meta pills row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.28 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        {[
          { label: "Role", value: project.role },
          { label: "Duration", value: project.duration },
          { label: "Year", value: project.year },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              padding: "12px 20px",
              transition: "all 0.45s ease",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 4,
                transition: "color 0.45s ease",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                transition: "color 0.45s ease",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function ShowcaseSection({ project }: { project: ProjectData }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: EASE, delay: 0.38 }}
      style={{
        padding: "0 clamp(16px, 3vw, 40px)",
        marginBottom: "clamp(64px, 8vw, 112px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: "clamp(20px, 2.5vw, 36px)",
          overflow: "hidden",
          background: project.cardBg,
          aspectRatio: "16 / 7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            right: "8%",
            width: "38%",
            paddingBottom: "38%",
            borderRadius: "50%",
            background: project.highlightColor,
            filter: "blur(70px)",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "8%",
            width: "28%",
            paddingBottom: "28%",
            borderRadius: "50%",
            background: project.highlightColor,
            filter: "blur(60px)",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />

        {/* Visual content */}
        <div style={{ width: "72%", maxWidth: 680, position: "relative", zIndex: 1 }}>
          {project.image ? (
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
                aspectRatio: "16/10",
                position: "relative",
              }}
            >
              <Image
                src={project.image}
                alt={`${project.title} showcase`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 90vw, 70vw"
                priority
              />
            </div>
          ) : (
            <ShowcaseVisual project={project} />
          )}
        </div>

        {/* Project number watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 28,
            fontSize: "clamp(48px, 6vw, 80px)",
            fontWeight: 900,
            color: "rgba(255,255,255,0.05)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {project.number}
        </div>
      </div>
    </motion.section>
  );
}

function ShowcaseVisual({ project }: { project: ProjectData }) {
  const s = {
    display: "block",
    width: "100%",
    borderRadius: 16,
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  };

  if (project.visual === "dashboard") {
    return (
      <svg viewBox="0 0 560 320" fill="none" style={s}>
        <rect width="560" height="320" rx="16" fill="white" fillOpacity="0.08" />
        <rect width="560" height="42" rx="16" fill={`${project.accent}1A`} />
        <rect y="26" width="560" height="16" fill={`${project.accent}1A`} />
        {[16,28,40].map((x,i)=><circle key={i} cx={x} cy="18" r="5" fill={["#FF5F57","#FFBD2E","#28CA41"][i]}/>)}
        <rect x="100" y="9" width="220" height="18" rx="9" fill="white" fillOpacity="0.07" />
        <rect x="112" y="14" width="90" height="8" rx="4" fill={`${project.accent}45`} />
        <rect y="42" width="88" height="278" fill={`${project.accent}09`} />
        {[0,1,2,3,4,5].map((i)=>(
          <rect key={i} x="14" y={64+i*38} width="60" height="24" rx="12"
            fill={i===0?`${project.accent}32`:`${project.accent}12`} />
        ))}
        {[0,1,2].map((i)=>(
          <g key={i}>
            <rect x={102+i*142} y={56} width={130} height={68} rx={16}
              fill={i===0?`${project.accent}24`:`${project.accent}0C`} />
            <rect x={116+i*142} y={70} width={58} height={8} rx="4" fill={`${project.accent}45`} />
            <rect x={116+i*142} y={84} width={84} height={20} rx="7"
              fill={`${project.accent}${i===0?"65":"28"}`} />
            <rect x={116+i*142} y={108} width={42} height={6} rx="3" fill={`${project.accent}22`} />
          </g>
        ))}
        <rect x="102" y="140" width="296" height="168" rx="16" fill={`${project.accent}07`} />
        <line x1="102" y1="284" x2="398" y2="284" stroke={`${project.accent}22`} strokeWidth="1" />
        {[0.3,0.6,0.45,0.88,0.65,0.94,0.72,0.98,0.82,0.76].map((h,i)=>(
          <rect key={i} x={114+i*28} y={284-Math.round(114*h)} width={20} height={Math.round(114*h)} rx="5"
            fill={project.accent} fillOpacity={i===9?0.92:0.22+i*0.035} />
        ))}
        <polyline
          points="124,242 152,212 180,226 208,178 236,196 264,164 292,180 320,148 348,160 376,136"
          stroke={project.accent} strokeWidth="2.5" fill="none" strokeOpacity="0.75"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="376" cy="136" r="6" fill={project.accent} fillOpacity="0.92" />
        <rect x="410" y="56" width="126" height="252" rx="16" fill={`${project.accent}07`} />
        {[0,1,2,3,4,5,6].map((i)=>(
          <g key={i}>
            <circle cx="430" cy={76+i*34} r="10" fill={`${project.accent}${i===0?"34":"14"}`} />
            <rect x="446" y={69+i*34} width={i===0?74:54} height="9" rx="4.5"
              fill={`${project.accent}${i===0?"2C":"12"}`} />
            <rect x="446" y={81+i*34} width="44" height="6" rx="3" fill={`${project.accent}10`} />
          </g>
        ))}
      </svg>
    );
  }

  if (project.visual === "fintech") {
    return (
      <svg viewBox="0 0 560 300" fill="none" style={s}>
        <rect x="30" y="0" width="190" height="300" rx="32" fill="white" fillOpacity="0.1" stroke={`${project.accent}28`} strokeWidth="1.5" />
        <rect x="30" y="0" width="190" height="58" rx="32" fill={`${project.accent}28`} />
        <rect x="30" y="36" width="190" height="22" fill={`${project.accent}28`} />
        <rect x="88" y="14" width="74" height="18" rx="9" fill={`${project.accent}55`} />
        <rect x="48" y="74" width="154" height="82" rx="18" fill={`${project.accent}24`} />
        <rect x="62" y="86" width="60" height="10" rx="5" fill={`${project.accent}58`} />
        <rect x="62" y="102" width="96" height="22" rx="8" fill={`${project.accent}78`} />
        <rect x="62" y="128" width="48" height="9" rx="4.5" fill={`${project.accent}40`} />
        <polyline points="48,184 72,170 96,178 120,156 144,167 168,146 184,151"
          stroke={project.accent} strokeWidth="2.5" fill="none" strokeOpacity="0.82"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="184" cy="151" r="6" fill={project.accent} />
        {[0,1,2,3].map((i)=>(
          <g key={i}>
            <rect x="48" y={204+i*24} width="154" height="18" rx="9"
              fill={`${project.accent}${i===0?"1C":"0A"}`} />
            <rect x="48" y={204+i*24} width={[100,70,86,55][i]} height="18" rx="9"
              fill={`${project.accent}${i===0?"2E":"18"}`} />
          </g>
        ))}
        <rect x="270" y="0" width="190" height="300" rx="32" fill="white" fillOpacity="0.1" stroke={`${project.accent}28`} strokeWidth="1.5" />
        <rect x="270" y="0" width="190" height="58" rx="32" fill={`${project.accent}18`} />
        <rect x="270" y="36" width="190" height="22" fill={`${project.accent}18`} />
        <rect x="328" y="14" width="74" height="18" rx="9" fill={`${project.accent}2C`} />
        <rect x="286" y="74" width="154" height="106" rx="16" fill={`${project.accent}0C`} />
        {[0.45,0.78,0.58,0.95,0.68,0.90,0.72].map((h,i)=>(
          <rect key={i} x={292+i*20} y={172-Math.round(82*h)} width={14} height={Math.round(82*h)} rx="5"
            fill={project.accent} fillOpacity={i===3?0.88:0.32} />
        ))}
        {[0,1,2,3].map((i)=>(
          <rect key={i} x={286+i*36} y={190} width={28} height={28} rx="14"
            fill={`${project.accent}${i===0?"35":"18"}`} />
        ))}
        {[0,1,2].map((i)=>(
          <g key={i}>
            <circle cx="296" cy={236+i*22} r="10" fill={`${project.accent}22`} />
            <rect x="312" y={229+i*22} width="76" height="9" rx="4.5" fill={`${project.accent}22`} />
            <rect x="312" y={242+i*22} width="50" height="6" rx="3" fill={`${project.accent}12`} />
          </g>
        ))}
      </svg>
    );
  }

  if (project.visual === "mobile") {
    return (
      <svg viewBox="0 0 560 320" fill="none" style={s}>
        <rect x="150" y="0" width="180" height="320" rx="34" fill="white" fillOpacity="0.1" stroke={`${project.accent}28`} strokeWidth="1.5" />
        <rect x="150" y="0" width="180" height="58" rx="34" fill={`${project.accent}28`} />
        <rect x="150" y="36" width="180" height="22" fill={`${project.accent}28`} />
        <rect x="198" y="13" width="84" height="18" rx="9" fill={`${project.accent}55`} />
        <rect x="166" y="74" width="148" height="112" rx="22" fill={`${project.accent}24`} />
        <circle cx="240" cy="130" r="34" fill={`${project.accent}35`} />
        <circle cx="240" cy="130" r="22" fill={project.accent} fillOpacity="0.82" />
        <polygon points="235,122 235,138 250,130" fill="white" opacity="0.96" />
        <rect x="166" y="200" width="96" height="13" rx="6.5" fill={`${project.accent}40`} />
        <rect x="166" y="218" width="140" height="10" rx="5" fill={`${project.accent}22`} />
        <rect x="166" y="232" width="116" height="10" rx="5" fill={`${project.accent}16`} />
        <rect x="166" y="253" width="148" height="38" rx="19" fill={project.accent} fillOpacity="0.92" />
        <rect x="200" y="267" width="80" height="12" rx="6" fill="white" opacity="0.8" />
        <rect x="0" y="40" width="116" height="74" rx="22" fill="white" fillOpacity="0.1" stroke={`${project.accent}22`} strokeWidth="1" />
        <rect x="14" y="55" width="44" height="9" rx="4.5" fill={`${project.accent}32`} />
        <rect x="14" y="70" width="72" height="17" rx="7.5" fill={`${project.accent}24`} />
        <rect x="14" y="91" width="38" height="8" rx="4" fill={`${project.accent}18`} />
        <rect x="444" y="198" width="112" height="82" rx="22" fill="white" fillOpacity="0.1" stroke={`${project.accent}22`} strokeWidth="1" />
        <circle cx="466" cy="220" r="12" fill={`${project.accent}32`} />
        <circle cx="466" cy="220" r="6" fill={project.accent} fillOpacity="0.68" />
        <rect x="484" y="213" width="56" height="9" rx="4.5" fill={`${project.accent}28`} />
        <rect x="484" y="226" width="42" height="7" rx="3.5" fill={`${project.accent}18`} />
      </svg>
    );
  }

  if (project.visual === "enterprise") {
    return (
      <svg viewBox="0 0 560 300" fill="none" style={s}>
        <rect width="560" height="300" rx="16" fill="white" fillOpacity="0.07" />
        <rect width="560" height="42" rx="16" fill={`${project.accent}18`} />
        <rect y="26" width="560" height="16" fill={`${project.accent}18`} />
        <rect x="18" y="12" width="96" height="18" rx="9" fill={`${project.accent}38`} />
        <rect x="126" y="12" width="72" height="18" rx="9" fill={`${project.accent}22`} />
        <rect x="210" y="12" width="72" height="18" rx="9" fill={`${project.accent}22`} />
        <ellipse cx="280" cy="172" rx="68" ry="50" fill={`${project.accent}1C`} stroke={project.accent} strokeWidth="1.5" strokeOpacity="0.5" />
        <ellipse cx="280" cy="172" rx="40" ry="30" fill={`${project.accent}32`} />
        <text x="280" y="178" textAnchor="middle" fontSize="15" fontWeight="700" fill={project.accent} fillOpacity="0.9">CX Cloud</text>
        {[
          {cx:88,cy:118,label:"Sales"},
          {cx:88,cy:218,label:"Service"},
          {cx:472,cy:118,label:"Commerce"},
          {cx:472,cy:218,label:"Marketing"},
          {cx:280,cy:62,label:"Data"},
        ].map(({cx,cy,label},i)=>(
          <g key={i}>
            <line x1={cx} y1={cy} x2={280} y2={172} stroke={project.accent} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5 3" />
            <rect x={cx-38} y={cy-20} width={76} height={40} rx={13}
              fill={`${project.accent}18`} stroke={project.accent} strokeWidth="1" strokeOpacity="0.35" />
            <text x={cx} y={cy+5} textAnchor="middle" fontSize="11" fontWeight="600"
              fill={project.accent} fillOpacity="0.82">{label}</text>
          </g>
        ))}
        {[0,1,2,3].map((i)=>(
          <rect key={i} x={42+i*128} y={266} width={112} height={17} rx={8.5}
            fill={`${project.accent}${i===0?"24":"0E"}`} />
        ))}
      </svg>
    );
  }

  const nodes: [number,number][] = [[280,90],[138,166],[422,166],[184,250],[376,250],[280,208]];
  const edges = [[0,1],[0,2],[1,3],[2,4],[1,5],[2,5],[3,5],[4,5]];
  return (
    <svg viewBox="0 0 560 300" fill="none" style={s}>
      <rect width="560" height="300" rx="16" fill="white" fillOpacity="0.07" />
      <rect width="560" height="42" rx="16" fill={`${project.accent}14`} />
      <rect y="26" width="560" height="16" fill={`${project.accent}14`} />
      <rect x="18" y="12" width="114" height="18" rx="9" fill={`${project.accent}34`} />
      {edges.map(([a,b],i)=>(
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={project.accent} strokeWidth="1.5" strokeOpacity="0.28" />
      ))}
      {nodes.map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r={i===0?28:i===5?22:17}
            fill={`${project.accent}${i===0?"32":"18"}`}
            stroke={project.accent} strokeWidth="1.5" strokeOpacity={i===0?0.8:0.38} />
          <circle cx={cx} cy={cy} r={i===0?13:8}
            fill={project.accent} fillOpacity={i===0?0.8:0.45} />
        </g>
      ))}
      <circle cx="280" cy="90" r="44" stroke={project.accent} strokeWidth="1" strokeOpacity="0.18" fill="none" />
      {[[280,288,"Saudi Banks"],[76,288,"Open API"],[464,288,"Real-time"]].map(([x,y,label],i)=>(
        <text key={i} x={x} y={y} textAnchor="middle" fontSize="11.5" fontWeight="500"
          fill={project.accent} fillOpacity="0.62">{label}</text>
      ))}
    </svg>
  );
}

function ProjectInfoSection({ project }: { project: ProjectData }) {
  return (
    <section style={{ paddingTop: "clamp(64px, 8vw, 112px)" }}>
      <FadeIn>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(32px, 4vw, 64px)",
            alignItems: "start",
          }}
          className="detail-info-grid"
        >
          <div>
            <SectionLabel accent={project.accent}>Overview</SectionLabel>
            <p
              style={{
                fontSize: "clamp(15px, 1.2vw, 17px)",
                color: "var(--text-primary)",
                lineHeight: 1.8,
                transition: "color 0.45s ease",
              }}
            >
              {project.overview}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SectionLabel accent={project.accent}>Project Details</SectionLabel>
            {[
              { label: "Duration", value: project.duration },
              { label: "Role", value: project.role },
              { label: "Year", value: project.year },
              { label: "Tools", value: project.tools.join(", ") },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--border-color)",
                  transition: "border-color 0.45s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                    transition: "color 0.45s ease",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    textAlign: "right",
                    letterSpacing: "-0.01em",
                    transition: "color 0.45s ease",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function ProblemSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>The Problem</SectionLabel>
        <blockquote
          style={{
            fontSize: "clamp(20px, 2.4vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.38,
            borderLeft: `3px solid ${project.accent}`,
            paddingLeft: "clamp(20px, 3vw, 36px)",
            margin: 0,
            transition: "color 0.45s ease",
          }}
        >
          {project.problem}
        </blockquote>
      </FadeIn>
    </section>
  );
}

function GoalSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>The Goal</SectionLabel>
        <div
          style={{
            background: `${project.accent}0C`,
            border: `1px solid ${project.accent}25`,
            borderRadius: 20,
            padding: "clamp(24px, 3.5vw, 44px)",
          }}
        >
          <p
            style={{
              fontSize: "clamp(16px, 1.5vw, 20px)",
              color: "var(--text-primary)",
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              transition: "color 0.45s ease",
            }}
          >
            {project.goal}
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

function ResearchSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>Research Insights</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            marginBottom: "clamp(28px, 3.5vw, 48px)",
            transition: "color 0.45s ease",
          }}
        >
          What the research revealed.
        </h2>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {project.researchInsights.map((insight, i) => (
          <FadeIn key={insight.title} delay={i * 0.1}>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: 20,
                padding: "clamp(20px, 2.5vw, 32px)",
                height: "100%",
                transition: "all 0.45s ease",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${project.accent}18`,
                  border: `1px solid ${project.accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                  fontSize: 16,
                  fontWeight: 800,
                  color: project.accent,
                }}
              >
                {i + 1}
              </div>
              <h3
                style={{
                  fontSize: "clamp(15px, 1.1vw, 17px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.025em",
                  marginBottom: 10,
                  transition: "color 0.45s ease",
                }}
              >
                {insight.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.68,
                  transition: "color 0.45s ease",
                }}
              >
                {insight.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function DesignProcessSection({ project }: { project: ProjectData }) {
  const steps = [
    { step: "01", title: "Wireframes", description: project.designProcess.wireframes },
    { step: "02", title: "User Flows", description: project.designProcess.userFlows },
    { step: "03", title: "Iterations", description: project.designProcess.iterations },
  ];

  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>Design Process</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            marginBottom: "clamp(28px, 3.5vw, 48px)",
            transition: "color 0.45s ease",
          }}
        >
          How it was built.
        </h2>
      </FadeIn>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => (
          <FadeIn key={step.title} delay={i * 0.1}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "clamp(20px, 3vw, 40px)",
                paddingTop: i === 0 ? 0 : "clamp(28px, 3.5vw, 44px)",
                paddingBottom: "clamp(28px, 3.5vw, 44px)",
                borderBottom: i < steps.length - 1 ? "1px solid var(--border-color)" : "none",
                transition: "border-color 0.45s ease",
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: `${project.accent}14`,
                    border: `1px solid ${project.accent}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: project.accent,
                    letterSpacing: "0.04em",
                  }}
                >
                  {step.step}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "clamp(17px, 1.4vw, 20px)",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.025em",
                    marginBottom: 10,
                    transition: "color 0.45s ease",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.05vw, 15px)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                    transition: "color 0.45s ease",
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function FinalSolutionSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>Final Solution</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            marginBottom: 20,
            transition: "color 0.45s ease",
          }}
        >
          The delivered product.
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.2vw, 17px)",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            maxWidth: 680,
            marginBottom: "clamp(28px, 3.5vw, 44px)",
            transition: "color 0.45s ease",
          }}
        >
          {project.finalSolution.description}
        </p>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: "clamp(28px, 3.5vw, 44px)" }}>
        {project.finalSolution.highlights.map((highlight, i) => (
          <FadeIn key={i} delay={i * 0.08}>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: 16,
                padding: "20px 22px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                transition: "all 0.45s ease",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: project.accent,
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.55,
                  letterSpacing: "-0.01em",
                  transition: "color 0.45s ease",
                }}
              >
                {highlight}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.1}>
        <div
          style={{
            background: project.cardBg,
            borderRadius: 24,
            padding: "clamp(32px, 4vw, 56px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            minHeight: 280,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "5%",
              width: "35%",
              paddingBottom: "35%",
              borderRadius: "50%",
              background: project.highlightColor,
              filter: "blur(50px)",
              opacity: 0.65,
              pointerEvents: "none",
            }}
          />
          {project.image ? (
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 20px 56px rgba(0,0,0,0.4)",
                width: "100%",
                maxWidth: 560,
                aspectRatio: "16/10",
                position: "relative",
              }}
            >
              <Image
                src={project.image}
                alt={`${project.title} final solution`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 90vw, 560px"
              />
            </div>
          ) : (
            <div style={{ width: "80%", maxWidth: 460, position: "relative", zIndex: 1 }}>
              <ShowcaseVisual project={project} />
            </div>
          )}
        </div>
      </FadeIn>
    </section>
  );
}

function DesignDecisionsSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>Design Decisions</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            marginBottom: "clamp(28px, 3.5vw, 48px)",
            transition: "color 0.45s ease",
          }}
        >
          Why these choices were made.
        </h2>
      </FadeIn>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {project.designDecisions.map((decision, i) => (
          <FadeIn key={decision.title} delay={i * 0.1}>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: 20,
                padding: "clamp(22px, 3vw, 36px)",
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "clamp(20px, 3vw, 40px)",
                alignItems: "start",
                transition: "all 0.45s ease",
              }}
              className="decision-grid"
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    fontSize: 11,
                    fontWeight: 700,
                    color: project.accent,
                    background: `${project.accent}14`,
                    borderRadius: 100,
                    padding: "4px 12px",
                    marginBottom: 10,
                    letterSpacing: "0.04em",
                  }}
                >
                  Decision {String(i + 1).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    fontSize: "clamp(15px, 1.2vw, 17px)",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.3,
                    transition: "color 0.45s ease",
                  }}
                >
                  {decision.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  transition: "color 0.45s ease",
                }}
              >
                {decision.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function OutcomesSection({ project }: { project: ProjectData }) {
  return (
    <section>
      <FadeIn>
        <SectionLabel accent={project.accent}>Outcomes</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            marginBottom: "clamp(28px, 3.5vw, 48px)",
            transition: "color 0.45s ease",
          }}
        >
          The results.
        </h2>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {project.outcomes.map((outcome, i) => (
          <FadeIn key={outcome.metric} delay={i * 0.1}>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: 20,
                padding: "clamp(22px, 2.5vw, 32px)",
                transition: "all 0.45s ease",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  transition: "color 0.45s ease",
                }}
              >
                {outcome.metric}
              </p>
              <p
                style={{
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 900,
                  color: project.accent,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                  marginBottom: 10,
                }}
              >
                {outcome.value}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  transition: "color 0.45s ease",
                }}
              >
                {outcome.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function ReflectionSection({ project }: { project: ProjectData }) {
  return (
    <section style={{ paddingBottom: "clamp(64px, 8vw, 112px)" }}>
      <FadeIn>
        <SectionLabel accent={project.accent}>Reflection & Next Steps</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: "clamp(32px, 4vw, 64px)",
            alignItems: "start",
          }}
          className="reflection-grid"
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(22px, 2.5vw, 34px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.032em",
                lineHeight: 1.18,
                marginBottom: 20,
                transition: "color 0.45s ease",
              }}
            >
              What I learned.
            </h2>
            <p
              style={{
                fontSize: "clamp(15px, 1.2vw, 16px)",
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                transition: "color 0.45s ease",
              }}
            >
              {project.reflection}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                transition: "color 0.45s ease",
              }}
            >
              Next Steps
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {project.nextSteps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    transition: "all 0.45s ease",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      background: `${project.accent}18`,
                      border: `1px solid ${project.accent}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: project.accent,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.55,
                      letterSpacing: "-0.01em",
                      transition: "color 0.45s ease",
                    }}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function NextProjectSection({ project }: { project: ProjectData }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-color)",
        transition: "all 0.45s ease",
        padding: "clamp(56px, 7vw, 96px) clamp(24px, 5vw, 80px)",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 24,
            transition: "color 0.45s ease",
          }}
        >
          Next Project
        </p>

        <Link href={`/projects/${project.slug}`} style={{ textDecoration: "none", display: "block" }}>
          <motion.div
            whileHover={{ x: 6 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                  transition: "color 0.45s ease",
                }}
              >
                {project.number} — {project.category}
              </p>
              <h3
                style={{
                  fontSize: "clamp(28px, 4vw, 52px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  transition: "color 0.45s ease",
                }}
              >
                {project.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  marginTop: 10,
                  transition: "color 0.45s ease",
                }}
              >
                {project.subtitle}
              </p>
            </div>

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: project.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              →
            </div>
          </motion.div>
        </Link>
      </div>
    </motion.section>
  );
}
