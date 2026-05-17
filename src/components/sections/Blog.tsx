"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.0, 0.0, 0.2, 1.0];

const posts = [
  {
    id: "01",
    category: "Design Thinking",
    date: "Mar 2024",
    title: "The invisible hand of great UX",
    excerpt:
      "Why the best interfaces disappear — and how to design products that feel effortless without looking empty.",
    readTime: "5 min",
    gradient: "linear-gradient(135deg, #EEF0F7 0%, #DDE1F3 100%)",
    accent: "rgba(80,70,180,0.15)",
  },
  {
    id: "02",
    category: "Engineering",
    date: "Jan 2024",
    title: "Framer Motion at scale",
    excerpt:
      "Lessons from shipping animation-heavy applications to millions of users — without sacrificing performance.",
    readTime: "8 min",
    gradient: "linear-gradient(135deg, #EAF4FD 0%, #D4E8F9 100%)",
    accent: "rgba(30,100,200,0.15)",
  },
  {
    id: "03",
    category: "Craft",
    date: "Nov 2023",
    title: "Typography as emotion",
    excerpt:
      "How font choice, weight, and spacing communicate mood before a single word is read.",
    readTime: "6 min",
    gradient: "linear-gradient(135deg, #FDF4EC 0%, #F9E5CC 100%)",
    accent: "rgba(180,100,30,0.15)",
  },
];

export default function Blog() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="blog"
      ref={ref}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(60px, 10vw, 120px) 24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 48,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#666D80",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Insights
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 800,
                color: "#0D0E12",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Writing & Ideas
            </motion.h2>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: "none",
              border: "1px solid #E4E7EC",
              color: "#0D0E12",
              padding: "10px 20px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              transition: "background 0.2s ease",
            }}
            whileHover={{
              backgroundColor: "#0D0E12",
              color: "#FFFFFF",
              borderColor: "#0D0E12",
            }}
          >
            All articles →
          </motion.button>
        </div>

        {/* 3-column blog cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          className="blog-grid"
        >
          {posts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} inView={inView} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .blog-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 580px) {
          .blog-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function BlogCard({
  post,
  index,
  inView,
}: {
  post: (typeof posts)[0];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0], delay: 0.1 + index * 0.08 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        transition: { duration: 0.25 },
      }}
      style={{
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid #E4E7EC",
        background: "#FFFFFF",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: post.gradient,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Abstract blog image decoration */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            padding: 24,
          }}
        >
          {[0.7, 0.5, 0.8, 0.45].map((w, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: `${w * 100}%`,
                background: post.accent,
                borderRadius: 100,
              }}
            />
          ))}
        </div>

        {/* Read time badge */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: 100,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#666D80",
          }}
        >
          {post.readTime} read
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "20px 22px 24px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Date + category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#666D80",
              fontWeight: 400,
            }}
          >
            {post.date}
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#E4E7EC",
              display: "block",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#666D80",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: "clamp(16px, 1.4vw, 19px)",
            fontWeight: 700,
            color: "#0D0E12",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            marginBottom: 10,
          }}
        >
          {post.title}
        </h4>

        {/* Excerpt */}
        <p
          style={{
            fontSize: 14,
            color: "#666D80",
            lineHeight: 1.65,
            flex: 1,
          }}
        >
          {post.excerpt}
        </p>
      </div>
    </motion.article>
  );
}
