"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogPostPreview = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  publishedAt?: string;
  /** Gradient shown while the image loads or if it's missing */
  gradient: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PREVIEW_POSTS: Record<"ar" | "en", BlogPostPreview[]> = {
  en: [
    {
      slug: "/blog/scaling-frontend-architecture",
      title: "Scaling Frontend Architecture with Next.js and TypeScript",
      excerpt:
        "Practical principles for building maintainable web platforms that can grow across products, teams, and changing business needs.",
      category: "Architecture",
      image: "/blog/frontend-architecture.jpg",
      gradient: "linear-gradient(140deg, #dbe8ff 0%, #b8d0ff 100%)",
    },
    {
      slug: "/blog/leading-cross-functional-teams",
      title: "Leading Cross-Functional Engineering Teams",
      excerpt:
        "Lessons on aligning engineering, product, design, backend, and QA teams around quality, ownership, and successful delivery.",
      category: "Leadership",
      image: "/blog/engineering-leadership.jpg",
      gradient: "linear-gradient(140deg, #d8f5e8 0%, #a8e8c8 100%)",
    },
    {
      slug: "/blog/modernizing-digital-platforms",
      title: "Modernizing Digital Platforms Without Slowing Delivery",
      excerpt:
        "How clean architecture, observability, CI/CD, and thoughtful iteration can modernize products while maintaining delivery momentum.",
      category: "Transformation",
      image: "/blog/platform-modernization.jpg",
      gradient: "linear-gradient(140deg, #ffe8d8 0%, #ffd0b0 100%)",
    },
  ],
  ar: [
    {
      slug: "/blog/scaling-frontend-architecture",
      title: "توسيع معمارية الواجهات مع Next.js و TypeScript",
      excerpt:
        "مبادئ عملية لبناء منصات ويب سهلة الصيانة قادرة على النمو عبر المنتجات والفرق واحتياجات الأعمال المتغيرة.",
      category: "معمارية",
      image: "/blog/frontend-architecture.jpg",
      gradient: "linear-gradient(140deg, #dbe8ff 0%, #b8d0ff 100%)",
    },
    {
      slug: "/blog/leading-cross-functional-teams",
      title: "قيادة فرق هندسية متعددة التخصصات",
      excerpt:
        "دروس في مواءمة فرق الهندسة والمنتج والتصميم والأنظمة الخلفية والجودة حول الجودة والملكية والتسليم الناجح.",
      category: "قيادة",
      image: "/blog/engineering-leadership.jpg",
      gradient: "linear-gradient(140deg, #d8f5e8 0%, #a8e8c8 100%)",
    },
    {
      slug: "/blog/modernizing-digital-platforms",
      title: "تحديث المنصات الرقمية دون إبطاء التسليم",
      excerpt:
        "كيف تُحدّث منتجاتك عبر المعمارية النظيفة والمراقبة و CI/CD والتحسين المستمر مع الحفاظ على سرعة الإنجاز.",
      category: "تحوّل رقمي",
      image: "/blog/platform-modernization.jpg",
      gradient: "linear-gradient(140deg, #ffe8d8 0%, #ffd0b0 100%)",
    },
  ],
};

const COPY = {
  en: {
    pill: "Blog",
    heading: "Insights & Ideas",
    sub1: "Thoughts on engineering leadership, scalable architecture,",
    sub2: "product delivery, and AI-powered innovation.",
    cta: "View All Blog Posts",
  },
  ar: {
    pill: "المدونة",
    heading: "رؤى وأفكار",
    sub1: "خواطر حول القيادة الهندسية والمعمارية القابلة للتوسع،",
    sub2: "وتسليم المنتجات والابتكار المدعوم بالذكاء الاصطناعي.",
    cta: "عرض جميع المقالات",
  },
};

// ─── Section ──────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function BlogPreview() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  // Hydration-safe: reading the media query during the first client render
  // would emit different inline styles than the server did.
  const reduced = useSafeReducedMotion();
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const posts = PREVIEW_POSTS[lang];

  const fadeUp = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: inView ? { opacity: 1, y: 0 } : {},
          transition: { duration: 0.75, ease: EASE, delay },
        };

  return (
    <section
      id="blog-preview"
      ref={ref}
      style={{ background: "var(--bg-primary)", padding: "clamp(80px, 10vw, 140px) 24px", transition: "background-color 0.35s ease" }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "clamp(44px, 6vw, 72px)" }}>
          <motion.div {...fadeUp(0)} style={{ display: "inline-block" }}>
            <span style={pillStyle}>{copy.pill}</span>
          </motion.div>

          <motion.h2 {...fadeUp(0.07)} style={headingStyle}>
            {copy.heading}
          </motion.h2>

          <motion.p {...fadeUp(0.14)} style={subheadingStyle}>
            {copy.sub1}
            <br className="bp-break" />
            {copy.sub2}
          </motion.p>
        </div>

        {/* ── Cards grid ── */}
        <div style={gridStyle} className="bp-grid">
          {posts.map((post, index) => (
            <BlogPreviewCard
              key={post.slug}
              post={post}
              index={index}
              inView={inView}
              reduced={!!reduced}
            />
          ))}
        </div>

        {/* ── CTA ── */}
        <motion.div
          {...fadeUp(0.36)}
          style={{ display: "flex", justifyContent: "center", marginTop: "clamp(44px, 6vw, 64px)" }}
        >
          <Link href="/blog" style={ctaStyle} className="bp-cta">
            {copy.cta}
          </Link>
        </motion.div>
      </div>

      <style>{`
        .bp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .bp-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bp-break { display: none; }
        }
        @media (max-width: 580px) {
          .bp-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .bp-break { display: none; }
        }
        .bp-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(20,149,255,0.32) !important;
        }
        .bp-cta { transition: transform 0.3s ease, box-shadow 0.3s ease; }
      `}</style>
    </section>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function BlogPreviewCard({
  post,
  index,
  inView,
  reduced,
}: {
  post: BlogPostPreview;
  index: number;
  inView: boolean;
  reduced: boolean;
}) {
  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.18 + index * 0.1 }}
      whileHover={reduced ? {} : { y: -5, boxShadow: "0 20px 44px rgba(0,0,0,0.1)" }}
      style={cardStyle}
    >
      <Link href={post.slug} style={cardLinkStyle}>
        {/* Image */}
        <div style={imageWrapStyle} className="bp-img-wrap">
          <CardImage src={post.image} alt={post.title} gradient={post.gradient} />
        </div>

        {/* Meta row: category + date */}
        <div style={metaRowStyle}>
          <span style={categoryPillStyle}>{post.category}</span>
          {post.publishedAt && (
            <span style={dateStyle}>{post.publishedAt}</span>
          )}
        </div>

        {/* Title */}
        <h3 style={cardTitleStyle}>{post.title}</h3>

        {/* Excerpt */}
        <p style={cardExcerptStyle}>{post.excerpt}</p>
      </Link>

      <style>{`
        .bp-img-wrap img {
          transition: transform 0.4s ease !important;
        }
        article:hover .bp-img-wrap img {
          transform: scale(1.025) !important;
        }
      `}</style>
    </motion.article>
  );
}

// ─── Card image with gradient fallback ────────────────────────────────────────

function CardImage({
  src,
  alt,
  gradient,
}: {
  src: string;
  alt: string;
  gradient: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          borderRadius: 22,
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 580px) 90vw, (max-width: 900px) 44vw, 360px"
      style={{ objectFit: "cover", borderRadius: 22 }}
      onError={() => setErrored(true)}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 18px",
  borderRadius: 999,
  background: "var(--bg-pill)",
  color: "var(--text-secondary)",
  fontSize: 15,
  fontWeight: 500,
  marginBottom: 24,
};

const headingStyle: React.CSSProperties = {
  fontSize: "clamp(44px, 5vw, 68px)",
  fontWeight: 800,
  letterSpacing: "-0.05em",
  lineHeight: 1,
  color: "var(--text-primary)",
  margin: "0 0 18px",
  transition: "color 0.35s ease",
};

const subheadingStyle: React.CSSProperties = {
  fontSize: "clamp(17px, 1.8vw, 22px)",
  fontWeight: 600,
  color: "var(--text-secondary)",
  lineHeight: 1.4,
  margin: 0,
  transition: "color 0.35s ease",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 24,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 28,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  transition: "box-shadow 0.35s ease, background-color 0.35s ease",
};

const cardLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  flex: 1,
  padding: "18px 18px 24px",
  gap: 0,
};

const imageWrapStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 22,
  background: "var(--bg-card-muted)",
  overflow: "hidden",
  marginBottom: 18,
  flexShrink: 0,
  transition: "background-color 0.35s ease",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 14,
};

const categoryPillStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 14px",
  borderRadius: 999,
  background: "var(--chip-bg)",
  color: "var(--chip-text)",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  transition: "background-color 0.35s ease, color 0.35s ease",
};

const dateStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  fontWeight: 400,
  transition: "color 0.35s ease",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "clamp(18px, 1.8vw, 26px)",
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 1.1,
  color: "var(--text-primary)",
  margin: "0 0 12px",
  transition: "color 0.35s ease",
};

const cardExcerptStyle: React.CSSProperties = {
  fontSize: "clamp(14px, 1.1vw, 17px)",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
  margin: 0,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  transition: "color 0.35s ease",
};

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  borderRadius: 999,
  padding: "14px 28px",
  fontSize: 16,
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 12px 30px rgba(20,149,255,0.22)",
};
