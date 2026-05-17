"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const posts = [
  {
    category: "Design Thinking",
    title: "The invisible hand of great UX",
    excerpt:
      "Why the best interfaces disappear — and how to design products that feel effortless without looking empty.",
    date: "Mar 2024",
    readTime: "5 min read",
  },
  {
    category: "Engineering",
    title: "Framer Motion at scale",
    excerpt:
      "Lessons from shipping animation-heavy applications to millions of users — without sacrificing performance.",
    date: "Jan 2024",
    readTime: "8 min read",
  },
  {
    category: "Craft",
    title: "Typography as emotion",
    excerpt:
      "How font choice, weight, and spacing communicate mood before a single word is read. A practical exploration.",
    date: "Nov 2023",
    readTime: "6 min read",
  },
];

export default function Blog() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="px-6 md:px-10 lg:px-16 py-28 md:py-40"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-16 md:mb-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[#A1A1AA] text-xs tracking-widest uppercase mb-4"
            >
              Insights
            </motion.p>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-white font-bold leading-tight"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
              >
                Writing & Ideas
              </motion.h2>
            </div>
          </div>
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="hidden md:inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white text-sm transition-colors group"
            data-cursor-hover
          >
            All articles
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {posts.map((post, i) => (
            <BlogCard key={post.title} post={post} index={i} inView={inView} />
          ))}
        </div>
      </div>
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
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group p-6 rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
      }}
      data-cursor-hover
    >
      <div className="mb-6">
        <span className="text-[#A1A1AA] text-xs tracking-widest uppercase">
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-white font-medium leading-snug mb-4 group-hover:text-white/80 transition-colors"
        style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
      >
        {post.title}
      </h3>

      <p className="text-[#A1A1AA] text-sm leading-relaxed mb-8">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{post.date}</span>
          <span className="w-px h-3 bg-white/20" />
          <span>{post.readTime}</span>
        </div>
        <motion.div
          animate={{ opacity: hovered ? 1 : 0.3, x: hovered ? 0 : -4 }}
          transition={{ duration: 0.3 }}
          className="text-white text-sm"
        >
          ↗
        </motion.div>
      </div>
    </motion.article>
  );
}
