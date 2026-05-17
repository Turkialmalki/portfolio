"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const POSTS = [
  {
    id: "01",
    category: "Design Thinking",
    date: "Mar 2024",
    title: "The invisible hand of great UX",
    excerpt:
      "Why the best interfaces disappear — and how to design products that feel effortless without looking empty.",
    readTime: "5 min",
    accent: "#5046B4",
    bg: "linear-gradient(135deg, #EEF0F7 0%, #DDE1F3 100%)",
  },
  {
    id: "02",
    category: "Engineering",
    date: "Jan 2024",
    title: "Framer Motion at scale",
    excerpt:
      "Lessons from shipping animation-heavy applications to millions of users without sacrificing performance.",
    readTime: "8 min",
    accent: "#1E64C8",
    bg: "linear-gradient(135deg, #EAF4FD 0%, #D4E8F9 100%)",
  },
  {
    id: "03",
    category: "Craft",
    date: "Nov 2023",
    title: "Typography as emotion",
    excerpt:
      "How font choice, weight, and spacing communicate mood before a single word is read.",
    readTime: "6 min",
    accent: "#B4641E",
    bg: "linear-gradient(135deg, #FDF4EC 0%, #F9E5CC 100%)",
  },
  {
    id: "04",
    category: "Leadership",
    date: "Sep 2023",
    title: "Building engineering culture in MENA",
    excerpt:
      "Practical patterns for growing high-performance teams from the lessons of 9+ years leading software organisations.",
    readTime: "10 min",
    accent: "#00C8A0",
    bg: "linear-gradient(135deg, #E8FAF5 0%, #C8F0E2 100%)",
  },
  {
    id: "05",
    category: "Fintech",
    date: "Jul 2023",
    title: "Open banking in Saudi Arabia",
    excerpt:
      "How the SAMA open banking framework is reshaping digital finance and what it means for product builders.",
    readTime: "7 min",
    accent: "#0091FF",
    bg: "linear-gradient(135deg, #EAF4FF 0%, #D0E9FF 100%)",
  },
  {
    id: "06",
    category: "Systems",
    date: "Apr 2023",
    title: "Kubernetes for enterprise products",
    excerpt:
      "From local cluster to production — a practitioner's guide to rolling out K8s inside large organisations.",
    readTime: "12 min",
    accent: "#326CE5",
    bg: "linear-gradient(135deg, #EDF1FD 0%, #D8E2FC 100%)",
  },
];

export default function BlogPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

  return (
    <>
      <TopBar />
      <Navbar />
      <main>
        {/* Page hero */}
        <section
          style={{
            backgroundColor: "var(--bg-primary)",
            transition: "background-color 0.45s ease",
            paddingTop: "clamp(120px, 14vw, 180px)",
            paddingBottom: "clamp(60px, 8vw, 100px)",
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              Writing
            </motion.p>

            <div style={{ overflow: "hidden" }}>
              <motion.h1
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.0, ease: EASE, delay: 0.06 }}
                style={{
                  fontSize: "clamp(44px, 6vw, 88px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  marginBottom: 24,
                  transition: "color 0.45s ease",
                }}
              >
                Thoughts & ideas.
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              style={{
                fontSize: "clamp(15px, 1.2vw, 17px)",
                color: "#6B7280",
                lineHeight: 1.72,
                maxWidth: 480,
              }}
            >
              Musings on design, engineering leadership, fintech, and building
              products that outlast the hype.
            </motion.p>
          </div>
        </section>

        {/* Posts grid */}
        <section
          style={{
            backgroundColor: "var(--bg-primary)",
            transition: "background-color 0.45s ease",
            paddingBottom: "clamp(80px, 11vw, 140px)",
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          <div
            ref={gridRef}
            style={{ maxWidth: 1280, margin: "0 auto" }}
            className="blog-grid"
          >
            {POSTS.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} inView={gridInView} />
            ))}
          </div>
        </section>

        <style>{`
          .blog-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
          }
          @media (min-width: 640px) {
            .blog-grid { grid-template-columns: 1fr 1fr; }
          }
          @media (min-width: 1024px) {
            .blog-grid { grid-template-columns: 1fr 1fr 1fr; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}

function BlogCard({
  post,
  index,
  inView,
}: {
  post: (typeof POSTS)[number];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
      whileHover={{ scale: 1.015, boxShadow: "0 24px 48px rgba(0,0,0,0.08)" }}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        transition: "background 0.45s ease",
      }}
    >
      {/* Coloured header */}
      <div
        style={{
          background: post.bg,
          height: 160,
          display: "flex",
          alignItems: "flex-end",
          padding: "24px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: post.bg,
            opacity: 0.7,
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            fontSize: 10,
            fontWeight: 700,
            color: post.accent,
            background: `${post.accent}22`,
            borderRadius: 100,
            padding: "4px 12px",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {post.category}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px 28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <span
            style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}
          >
            {post.date}
          </span>
          <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
          <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
            {post.readTime} read
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(17px, 1.4vw, 20px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.028em",
            lineHeight: 1.25,
            marginBottom: 12,
            transition: "color 0.45s ease",
          }}
        >
          {post.title}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            lineHeight: 1.68,
          }}
        >
          {post.excerpt}
        </p>

        <div
          style={{
            marginTop: 22,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: post.accent,
            letterSpacing: "-0.01em",
          }}
        >
          Read more
          <span style={{ fontSize: 15 }}>→</span>
        </div>
      </div>
    </motion.article>
  );
}
