"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { useLanguage } from "@/i18n/LanguageProvider";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Bi = { ar: string; en: string };

type Post = {
  id: string;
  category: Bi;
  date: Bi;
  title: Bi;
  excerpt: Bi;
  readTime: Bi;
  accent: string;
  bg: string;
};

const POSTS: Post[] = [
  {
    id: "01",
    category: { ar: "تفكير تصميمي", en: "Design Thinking" },
    date: { ar: "مارس 2024", en: "Mar 2024" },
    title: {
      ar: "اليد الخفية في تجربة الاستخدام",
      en: "The invisible hand of great UX",
    },
    excerpt: {
      ar: "لماذا تختفي أفضل الواجهات عن الأنظار — وكيف نصمم منتجات تبدو سهلة دون أن تبدو فارغة.",
      en: "Why the best interfaces disappear — and how to design products that feel effortless without looking empty.",
    },
    readTime: { ar: "5 دقائق", en: "5 min" },
    accent: "#5046B4",
    bg: "linear-gradient(135deg, #EEF0F7 0%, #DDE1F3 100%)",
  },
  {
    id: "02",
    category: { ar: "هندسة", en: "Engineering" },
    date: { ar: "يناير 2024", en: "Jan 2024" },
    title: { ar: "Framer Motion على نطاق واسع", en: "Framer Motion at scale" },
    excerpt: {
      ar: "دروس من إطلاق تطبيقات مليئة بالحركة لملايين المستخدمين دون التضحية بالأداء.",
      en: "Lessons from shipping animation-heavy applications to millions of users without sacrificing performance.",
    },
    readTime: { ar: "8 دقائق", en: "8 min" },
    accent: "#1E64C8",
    bg: "linear-gradient(135deg, #EAF4FD 0%, #D4E8F9 100%)",
  },
  {
    id: "03",
    category: { ar: "حِرفة", en: "Craft" },
    date: { ar: "نوفمبر 2023", en: "Nov 2023" },
    title: { ar: "الخط الطباعي بوصفه شعورًا", en: "Typography as emotion" },
    excerpt: {
      ar: "كيف يوصل اختيار الخط ووزنه وتباعده مزاج المنتج قبل قراءة كلمة واحدة.",
      en: "How font choice, weight, and spacing communicate mood before a single word is read.",
    },
    readTime: { ar: "6 دقائق", en: "6 min" },
    accent: "#B4641E",
    bg: "linear-gradient(135deg, #FDF4EC 0%, #F9E5CC 100%)",
  },
  {
    id: "04",
    category: { ar: "قيادة", en: "Leadership" },
    date: { ar: "سبتمبر 2023", en: "Sep 2023" },
    title: {
      ar: "بناء ثقافة هندسية في المنطقة",
      en: "Building engineering culture in MENA",
    },
    excerpt: {
      ar: "أنماط عملية لتنمية فرق عالية الأداء، من خلاصة أكثر من 9 سنوات في قيادة فرق البرمجيات.",
      en: "Practical patterns for growing high-performance teams from the lessons of 9+ years leading software organisations.",
    },
    readTime: { ar: "10 دقائق", en: "10 min" },
    accent: "#00C8A0",
    bg: "linear-gradient(135deg, #E8FAF5 0%, #C8F0E2 100%)",
  },
  {
    id: "05",
    category: { ar: "تقنية مالية", en: "Fintech" },
    date: { ar: "يوليو 2023", en: "Jul 2023" },
    title: {
      ar: "الخدمات المصرفية المفتوحة في السعودية",
      en: "Open banking in Saudi Arabia",
    },
    excerpt: {
      ar: "كيف يعيد إطار البنك المركزي للخدمات المصرفية المفتوحة تشكيل التمويل الرقمي، وماذا يعني ذلك لبُناة المنتجات.",
      en: "How the SAMA open banking framework is reshaping digital finance and what it means for product builders.",
    },
    readTime: { ar: "7 دقائق", en: "7 min" },
    accent: "#0091FF",
    bg: "linear-gradient(135deg, #EAF4FF 0%, #D0E9FF 100%)",
  },
  {
    id: "06",
    category: { ar: "أنظمة", en: "Systems" },
    date: { ar: "أبريل 2023", en: "Apr 2023" },
    title: {
      ar: "Kubernetes للمنتجات المؤسسية",
      en: "Kubernetes for enterprise products",
    },
    excerpt: {
      ar: "من العنقود المحلي إلى الإنتاج — دليل عملي لتبنّي Kubernetes داخل المؤسسات الكبيرة.",
      en: "From local cluster to production — a practitioner's guide to rolling out K8s inside large organisations.",
    },
    readTime: { ar: "12 دقيقة", en: "12 min" },
    accent: "#326CE5",
    bg: "linear-gradient(135deg, #EDF1FD 0%, #D8E2FC 100%)",
  },
];

const COPY = {
  ar: {
    kicker: "كتابات",
    title: "أفكار وخواطر.",
    lede: "تأملات في التصميم والقيادة الهندسية والتقنية المالية، وبناء منتجات تبقى بعد أن تهدأ الضجّة.",
    readSuffix: "قراءة",
    readMore: "اقرأ المزيد",
  },
  en: {
    kicker: "Writing",
    title: "Thoughts & ideas.",
    lede: "Musings on design, engineering leadership, fintech, and building products that outlast the hype.",
    readSuffix: "read",
    readMore: "Read more",
  },
};

export default function BlogPage() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

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
                color: "var(--text-secondary)",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {copy.kicker}
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
                {copy.title}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              style={{
                fontSize: "clamp(15px, 1.2vw, 17px)",
                color: "var(--text-secondary)",
                lineHeight: 1.72,
                maxWidth: 480,
              }}
            >
              {copy.lede}
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
              <BlogCard
                key={post.id}
                post={post}
                index={i}
                inView={gridInView}
                lang={lang}
                copy={copy}
              />
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
  lang,
  copy,
}: {
  post: Post;
  index: number;
  inView: boolean;
  lang: "ar" | "en";
  copy: (typeof COPY)["ar"];
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
          {post.category[lang]}
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
            style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}
          >
            {post.date[lang]}
          </span>
          <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
            {post.readTime[lang]} {copy.readSuffix}
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
          {post.title[lang]}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.68,
          }}
        >
          {post.excerpt[lang]}
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
          {copy.readMore}
          {/* drawn, not typed: the arrow character is not in Thmanyah Sans and
              would fall back to a system face mid-sentence */}
          <svg
            width="15"
            height="10"
            viewBox="0 0 15 10"
            fill="none"
            aria-hidden="true"
            style={{ transform: lang === "ar" ? "scaleX(-1)" : undefined }}
          >
            <path
              d="M1 5h12M9.4 1.2 13.2 5l-3.8 3.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </motion.article>
  );
}
