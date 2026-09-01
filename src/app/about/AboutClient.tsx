"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiRedux,
  SiFigma,
  SiNodedotjs,
  SiDynatrace,
} from "react-icons/si";
import { LuTrophy, LuWorkflow, LuChartBar, LuSparkles, LuSmartphone } from "react-icons/lu";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { CONTACT } from "@/config/contact";
import { useLanguage } from "@/i18n/LanguageProvider";
import { WORK_HREF } from "@/config/siteFlags";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/* ── Experience data ─────────────────────────────── */

type Bi = { ar: string; en: string };

type Job = {
  company: Bi;
  role: Bi;
  date: Bi;
  logo?: string;
  logoBg?: string;
  tile?: "M" | "trophy";
  bullets: Bi[];
};

/**
 * Same employers, dates and outcomes as the timeline on the homepage — the
 * Arabic here is a translation of the verified English, not new claims.
 */
const JOBS: Job[] = [
  {
    company: { ar: "منشآت", en: "Monshaat" },
    role: {
      ar: "قائد هندسة برمجيات | مركز الابتكار",
      en: "Engineering Leader | Innovation Center",
    },
    date: { ar: "أكتوبر 2024 — حتى الآن", en: "Oct 2024 – Present" },
    tile: "M",
    bullets: [
      {
        ar: "أقود المبادرات الرقمية داخل مركز الابتكار، وأحوّل احتياجات الأعمال إلى خطط تنفيذية لمنتجات الويب والجوال.",
        en: "Lead digital initiatives inside the Innovation Center, translating business needs into prioritized roadmaps for web and mobile products.",
      },
      {
        ar: "أقيّم الأطر الحديثة والأدوات المدعومة بالذكاء الاصطناعي لتحسين الإنتاجية والجدوى والأثر الهندسي.",
        en: "Evaluate modern frameworks and AI-enabled tools to improve productivity, feasibility, and engineering impact.",
      },
      {
        ar: "أعمل مع فرق المنتج والتصميم والأنظمة الخلفية والأعمال لتسليم المنتجات من الفكرة إلى الإطلاق.",
        en: "Partner with Product, Design, Backend, and business teams to deliver products from concept to launch.",
      },
    ],
  },
  {
    company: { ar: "إمكان", en: "Emkan" },
    role: { ar: "مهندس برمجيات رئيسي", en: "Lead Software Engineer" },
    date: { ar: "يوليو 2022 — أكتوبر 2024", en: "Jul 2022 – Oct 2024" },
    logo: "/emkanlogo.png",
    logoBg: "#ffffff",
    bullets: [
      {
        ar: "قدت تحديث منصات التجار الرقمية الأساسية على الويب والجوال.",
        en: "Led modernization of core digital merchant platforms across web and mobile.",
      },
      {
        ar: "نفّذت تحسينات في تجربة الاستخدام وتكاملات مدعومة بالذكاء الاصطناعي رفعت رضا العملاء بنسبة 150%.",
        en: "Implemented UI/UX improvements and AI-driven integrations that improved customer satisfaction by 150%.",
      },
      {
        ar: "استخدمت بيانات Dynatrace وCountly لتحسين الأداء وسهولة الوصول والتبنّي وقابلية الاستخدام.",
        en: "Used Dynatrace and Countly insights to improve performance, accessibility, adoption, and usability.",
      },
    ],
  },
  {
    company: { ar: "مصرف الراجحي", en: "Alrajhi Bank" },
    role: { ar: "مهندس برمجيات أول", en: "Senior Software Engineer" },
    date: { ar: "أغسطس 2019 — يوليو 2022", en: "Aug 2019 – Jul 2022" },
    logo: "/alrajhilogo.png",
    logoBg: "#ffffff",
    bullets: [
      {
        ar: "قدت تطوير وتحسين تجربة الجوال للعملاء باستخدام React Native وJavaScript وRedux.",
        en: "Led development and enhancement of a customer-facing mobile experience using React Native, JavaScript, and Redux.",
      },
      {
        ar: "أسهمت في تحقيق 95% تقييم إيجابي من المستخدمين وزيادة 90% في تحميلات التطبيق.",
        en: "Helped achieve 95% positive user feedback and a 90% increase in app downloads.",
      },
      {
        ar: "عملت مع فرق التصميم عبر Figma لتحويل متطلبات مصرفية معقّدة إلى رحلات جوال واضحة.",
        en: "Worked with Design teams using Figma to convert complex banking requirements into clean mobile journeys.",
      },
    ],
  },
  {
    company: { ar: "جوائز وابتكار", en: "Awards & Innovation" },
    role: {
      ar: "مسابقات برمجية وشهادات",
      en: "Programming Competitions & Certifications",
    },
    date: { ar: "نموّ مستمر", en: "Continuous Growth" },
    tile: "trophy",
    bullets: [
      {
        ar: "المركز الأول في مسابقة أرامكو «وعد» للبرمجة.",
        en: "1st Place: Aramco Wa\u2019ed Programming Competition.",
      },
      {
        ar: "المركز الثاني في مسابقة كاوست للبرمجة.",
        en: "2nd Place: KAUST Programming Competition.",
      },
      {
        ar: "بكالوريوس علوم حاسب من جامعة الملك فيصل، بتكريم من عميد الكلية.",
        en: "Bachelor of Computer Science from King Faisal University, recognized by the College Dean.",
      },
    ],
  },
];

/* ── Stack data ──────────────────────────────────── */

type Tool = { name: Bi; icon: IconType; color: string };

const TOOLS: Tool[] = [
  { name: { ar: "React", en: "React" }, icon: SiReact, color: "#61DAFB" },
  { name: { ar: "Next.js", en: "Next.js" }, icon: SiNextdotjs, color: "var(--text-primary)" },
  { name: { ar: "React Native", en: "React Native" }, icon: LuSmartphone, color: "#61DAFB" },
  { name: { ar: "TypeScript", en: "TypeScript" }, icon: SiTypescript, color: "#3178C6" },
  { name: { ar: "JavaScript", en: "JavaScript" }, icon: SiJavascript, color: "#E8C51A" },
  { name: { ar: "Redux", en: "Redux" }, icon: SiRedux, color: "#764ABC" },
  { name: { ar: "Figma", en: "Figma" }, icon: SiFigma, color: "#F24E1E" },
  { name: { ar: "Node.js", en: "Node.js" }, icon: SiNodedotjs, color: "#5FA04E" },
  { name: { ar: "التكامل والنشر المستمر", en: "CI/CD" }, icon: LuWorkflow, color: "#1495FF" },
  { name: { ar: "Dynatrace", en: "Dynatrace" }, icon: SiDynatrace, color: "#1496FF" },
  { name: { ar: "Countly", en: "Countly" }, icon: LuChartBar, color: "#017AFF" },
  { name: { ar: "أدوات الذكاء الاصطناعي", en: "AI Tools" }, icon: LuSparkles, color: "#D97757" },
];

/* ── Skills data ─────────────────────────────────── */

const TECHNICAL_SKILLS: [string, Bi][] = [
  ["🏗️", { ar: "معمارية الواجهات", en: "Frontend Architecture" }],
  ["📱", { ar: "تطوير تطبيقات الجوال", en: "Mobile App Development" }],
  ["⚛️", { ar: "React / Next.js / React Native", en: "React / Next.js / React Native" }],
  ["🧹", { ar: "المعمارية النظيفة", en: "Clean Architecture" }],
  ["🧩", { ar: "تصميم الأنظمة", en: "System Architecture" }],
  ["💡", { ar: "ابتكار المنتجات والخدمات", en: "Product & Service Innovation" }],
  ["🤖", { ar: "تقييم حلول الذكاء الاصطناعي", en: "AI Assessment" }],
  ["📊", { ar: "تحليل البيانات وقياس الأداء", en: "Data Analysis & Performance Measurement" }],
];

const LEADERSHIP_SKILLS: [string, Bi][] = [
  ["🧭", { ar: "القيادة التقنية", en: "Technical Leadership" }],
  ["🌱", { ar: "إرشاد الفرق", en: "Team Mentorship" }],
  ["🤝", { ar: "إدارة أصحاب المصلحة", en: "Stakeholder Management" }],
  ["🚀", { ar: "التسليم عبر الفرق", en: "Cross-functional Delivery" }],
  ["💬", { ar: "التواصل", en: "Communication" }],
  ["🎤", { ar: "العرض والتقديم", en: "Presentation" }],
  ["🏃", { ar: "التنفيذ الرشيق", en: "Agile Execution" }],
  ["🧠", { ar: "حل المشكلات", en: "Problem Solving" }],
];

const COPY = {
  ar: {
    aboutPill: "عنّي",
    name: "تركي المالكي",
    title: "مدير هندسة | ابتكار رقمي وابتكار منتجات",
    intro:
      "قائد هندسي ورقمي بخبرة تتجاوز 9 سنوات في بناء منتجات ويب وجوال عالية الأداء عبر القطاع الحكومي والتقنية المالية والمصارف ومنظومات الابتكار. أجمع بين React وNext.js وReact Native وابتكار الذكاء الاصطناعي وتجربة العميل وتنفيذ المنتج لتحويل الأفكار إلى تجارب رقمية قابلة للتوسع.",
    viewPortfolio: "استعرض أعمالي",
    connect: "لنتواصل",
    experiencePill: "الخبرة",
    experienceTitle: "رحلتي الهندسية",
    experienceSub: "نظرة على الفرق والمنتجات والأعمال التي شكّلت مساري.",
    workHistory: "السجل المهني",
    stack: "الأدوات التقنية",
    skillsTitle: "مهارات الهندسة والابتكار",
    technicalSkills: "المهارات التقنية",
    leadershipSkills: "المهارات القيادية",
    contactMe: "تواصل معي",
    lifestylePill: "خارج الشاشة",
    lifestyleTitle: "ما وراء الشاشة",
    lifestyleSub: "لمحة عن الأفكار واللحظات والتجارب التي تغذّي إبداعي.",
  },
  en: {
    aboutPill: "About Me",
    name: "Turki Almalki",
    title: "Engineering Manager | Digital Innovation & Product Innovation",
    intro:
      "Engineering and digital innovation leader with 9+ years of experience building high-performance web and mobile products across government, fintech, banking, and innovation ecosystems. I combine React, Next.js, React Native, AI innovation, CX, and product execution to turn ideas into scalable digital experiences.",
    viewPortfolio: "View My Portfolio",
    connect: "Let's Connect",
    experiencePill: "Experience",
    experienceTitle: "My Engineering Journey",
    experienceSub: "A look into the teams, products, and work that shaped my path.",
    workHistory: "Work History",
    stack: "Stack",
    skillsTitle: "Engineering & Innovation Skills",
    technicalSkills: "Technical Skills",
    leadershipSkills: "Leadership Skills",
    contactMe: "Contact Me",
    lifestylePill: "Lifestyle",
    lifestyleTitle: "Beyond the Screen",
    lifestyleSub:
      "A glimpse into the ideas, moments, and experiences that drive my creativity.",
  },
};

/* ── Gallery data ────────────────────────────────── */

const GALLERY = {
  large: {
    src: "/1.jpg",
    alt: {
      ar: "تركي المالكي على المسرح في فعالية ابتكار",
      en: "Turki Almalki on stage at an innovation event",
    },
    position: "center 20%",
  },
  wide: {
    src: "/turki.jpg",
    alt: {
      ar: "تركي المالكي يقدّم ورشة MVP",
      en: "Turki Almalki leading an MVP workshop",
    },
    position: "center 30%",
  },
  small: [
    {
      src: "/IMG-20181201-WA0054.jpg",
      alt: {
        ar: "الفريق الفائز في هاكاثون وعد",
        en: "Winning team at the Wa'ed Hackathon",
      },
      position: "center center",
    },
    {
      src: "/screenshot.jpg",
      alt: {
        ar: "تركي المالكي يقدّم جلسة عن المنتجات",
        en: "Turki Almalki presenting a product session",
      },
      position: "center 30%",
    },
  ],
} as const;

export default function AboutClient() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <TopBar />
      <Navbar />

      <main className="ab-page">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="ab-hero">
          <motion.div
            className="ab-hero-avatar"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: EASE }}
          >
            <Image
              src="/avatar.jpg"
              alt="Turki Almalki"
              fill
              sizes="(max-width: 640px) 200px, 300px"
              preload
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </motion.div>

          <motion.span
            className="ab-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          >
            {copy.aboutPill}
          </motion.span>

          <motion.h1
            className="ab-hero-heading"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
          >
            {copy.name}
          </motion.h1>

          <motion.p
            className="ab-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.26 }}
          >
            {copy.title}
          </motion.p>

          <motion.p
            className="ab-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
          >
            {copy.intro}
          </motion.p>

          <motion.div
            className="ab-hero-ctas"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
          >
            <Link href={WORK_HREF} className="ab-btn-primary">
              {copy.viewPortfolio}
            </Link>
            <a href={`mailto:${CONTACT.email}`} className="ab-btn-secondary">
              {copy.connect}
            </a>
          </motion.div>
        </section>

        {/* ── Experience ───────────────────────────── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <motion.span className="ab-pill" {...fadeUp} transition={{ duration: 0.6, ease: EASE }}>
              {copy.experiencePill}
            </motion.span>
            <motion.h2
              className="ab-h2"
              {...fadeUp}
              transition={{ duration: 0.75, ease: EASE, delay: 0.06 }}
            >
              {copy.experienceTitle}
            </motion.h2>
            <motion.p
              className="ab-section-sub"
              {...fadeUp}
              transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            >
              {copy.experienceSub}
            </motion.p>
          </div>

          <motion.h3 className="ab-h3" {...fadeUp} transition={{ duration: 0.7, ease: EASE }}>
            {copy.workHistory}
          </motion.h3>

          <div className="ab-jobs-grid">
            {JOBS.map((job, i) => (
              <motion.article
                key={job.company.en}
                className="ab-card ab-job-card"
                {...fadeUp}
                transition={{ duration: 0.7, ease: EASE, delay: (i % 2) * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <div className="ab-job-head">
                  {job.logo ? (
                    <span className="ab-job-logo" style={{ background: job.logoBg }}>
                      <Image
                        src={job.logo}
                        alt=""
                        width={44}
                        height={44}
                        style={{ objectFit: "contain" }}
                      />
                    </span>
                  ) : job.tile === "trophy" ? (
                    <span className="ab-job-logo ab-job-logo-tile ab-job-logo-trophy">
                      <LuTrophy size={30} />
                    </span>
                  ) : (
                    <span className="ab-job-logo ab-job-logo-tile">
                      {/* brand monogram, in the reading script */}
                      {lang === "ar" ? "م" : job.tile}
                    </span>
                  )}
                  <div>
                    <h4 className="ab-job-company">{job.company[lang]}</h4>
                    <p className="ab-job-role">{job.role[lang]}</p>
                    <p className="ab-job-date">{job.date[lang]}</p>
                  </div>
                </div>
                <ul className="ab-job-bullets">
                  {job.bullets.map((b) => (
                    <li key={b.en}>{b[lang]}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Stack ────────────────────────────────── */}
        <section className="ab-section">
          <motion.h2
            className="ab-h2 ab-h2-center"
            {...fadeUp}
            transition={{ duration: 0.75, ease: EASE }}
          >
            {copy.stack}
          </motion.h2>

          <div className="ab-stack-grid">
            {TOOLS.map(({ name, icon: Icon, color }, i) => (
              <motion.div
                key={name.en}
                className="ab-card ab-stack-card"
                {...fadeUp}
                transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.07 }}
                whileHover={{ y: -5 }}
              >
                <span className="ab-stack-icon">
                  <Icon size={26} style={{ color }} />
                </span>
                <span className="ab-stack-name">{name[lang]}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Skills ───────────────────────────────── */}
        <section className="ab-section">
          <motion.h2
            className="ab-h2 ab-h2-center"
            {...fadeUp}
            transition={{ duration: 0.75, ease: EASE }}
          >
            {copy.skillsTitle}
          </motion.h2>

          <div className="ab-skills-grid">
            {(
              [
                [copy.technicalSkills, TECHNICAL_SKILLS],
                [copy.leadershipSkills, LEADERSHIP_SKILLS],
              ] as const
            ).map(([title, items], i) => (
              <motion.div
                key={title}
                className="ab-card ab-skills-card"
                {...fadeUp}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
              >
                <p className="ab-skills-title">{title}</p>
                <ul className="ab-skills-list">
                  {items.map(([emoji, label]) => (
                    <li key={label.en}>
                      <span className="ab-skills-emoji" aria-hidden>
                        {emoji}
                      </span>
                      {label[lang]}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="ab-skills-cta"
            {...fadeUp}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          >
            <a href={`mailto:${CONTACT.email}`} className="ab-btn-primary">
              {copy.contactMe}
            </a>
          </motion.div>
        </section>

        {/* ── Beyond the Screen ────────────────────── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <motion.span className="ab-pill" {...fadeUp} transition={{ duration: 0.6, ease: EASE }}>
              {copy.lifestylePill}
            </motion.span>
            <motion.h2
              className="ab-h2"
              {...fadeUp}
              transition={{ duration: 0.75, ease: EASE, delay: 0.06 }}
            >
              {copy.lifestyleTitle}
            </motion.h2>
            <motion.p
              className="ab-section-sub"
              {...fadeUp}
              transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            >
              {copy.lifestyleSub}
            </motion.p>
          </div>

          <div className="ab-gallery">
            <motion.div
              className="ab-gallery-large"
              {...fadeUp}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <Image
                src={GALLERY.large.src}
                alt={GALLERY.large.alt[lang]}
                fill
                sizes="(max-width: 900px) 100vw, 46vw"
                style={{ objectFit: "cover", objectPosition: GALLERY.large.position }}
              />
            </motion.div>

            <div className="ab-gallery-right">
              <motion.div
                className="ab-gallery-wide"
                {...fadeUp}
                transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
              >
                <Image
                  src={GALLERY.wide.src}
                  alt={GALLERY.wide.alt[lang]}
                  fill
                  sizes="(max-width: 900px) 100vw, 54vw"
                  style={{ objectFit: "cover", objectPosition: GALLERY.wide.position }}
                />
              </motion.div>

              <div className="ab-gallery-pair">
                {GALLERY.small.map((img, i) => (
                  <motion.div
                    key={img.src}
                    className="ab-gallery-small"
                    {...fadeUp}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.14 + i * 0.06 }}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt[lang]}
                      fill
                      sizes="(max-width: 900px) 100vw, 27vw"
                      style={{ objectFit: "cover", objectPosition: img.position }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        /* ── Page shell ─────────────────────────────── */

        .ab-page {
          background: var(--bg-primary);
          transition: background-color 0.45s ease;
          padding-bottom: clamp(100px, 12vw, 160px);
          overflow-x: clip;
        }

        .ab-pill {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 15px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: background-color 0.45s ease, color 0.45s ease;
        }

        /* ── Hero ───────────────────────────────────── */

        .ab-hero {
          padding:
            clamp(110px, 13vw, 168px)
            clamp(20px, 5vw, 40px)
            clamp(70px, 8vw, 120px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ab-hero-avatar {
          position: relative;
          width: clamp(190px, 26vw, 300px);
          height: clamp(190px, 26vw, 300px);
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 34px;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.12);
        }

        .ab-hero-heading {
          margin: 22px 0 20px;
          font-size: clamp(52px, 8.5vw, 104px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.05em;
          line-height: 0.98;
          transition: color 0.45s ease;
        }

        .ab-hero-title {
          margin: 0 0 16px;
          font-size: clamp(15px, 1.6vw, 19px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          max-width: 720px;
          transition: color 0.45s ease;
        }

        .ab-hero-sub {
          margin: 0 0 38px;
          max-width: 720px;
          font-size: clamp(15px, 1.4vw, 17.5px);
          color: var(--text-secondary);
          line-height: 1.7;
          transition: color 0.45s ease;
        }

        .ab-hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ab-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 30px;
          border-radius: 999px;
          background: #0091ff;
          color: #ffffff;
          font-size: 15.5px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 26px rgba(0, 145, 255, 0.34);
          transition: box-shadow 240ms ease, transform 240ms ease;
        }

        .ab-btn-primary:hover {
          box-shadow: 0 12px 34px rgba(0, 145, 255, 0.46);
          transform: translateY(-2px);
        }

        .ab-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 30px;
          border-radius: 999px;
          background: var(--bg-pill);
          color: var(--text-primary);
          font-size: 15.5px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: background-color 240ms ease, transform 240ms ease;
        }

        .ab-btn-secondary:hover {
          background: var(--bg-card-muted);
          transform: translateY(-2px);
        }

        /* ── Sections ───────────────────────────────── */

        .ab-section {
          max-width: 1240px;
          margin: 0 auto;
          padding:
            clamp(48px, 6vw, 90px)
            clamp(20px, 5vw, 40px)
            0;
        }

        .ab-section-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: clamp(40px, 5vw, 64px);
        }

        .ab-h2 {
          margin: 20px 0 18px;
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.045em;
          line-height: 1.02;
          transition: color 0.45s ease;
        }

        .ab-h2-center {
          display: block;
          text-align: center;
          margin: 0 0 clamp(36px, 4.5vw, 56px);
        }

        .ab-section-sub {
          margin: 0;
          max-width: 480px;
          font-size: clamp(16px, 1.7vw, 21px);
          color: var(--text-secondary);
          line-height: 1.5;
          transition: color 0.45s ease;
        }

        .ab-h3 {
          margin: 0 0 clamp(28px, 3.5vw, 44px);
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.04em;
          text-align: center;
          transition: color 0.45s ease;
        }

        /* ── Cards (shared) ─────────────────────────── */

        .ab-card {
          background: var(--bg-card);
          border-radius: 40px;
          transition: background-color 0.45s ease, box-shadow 300ms ease;
        }

        .ab-card:hover {
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }

        /* ── Experience cards ───────────────────────── */

        .ab-jobs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(20px, 2.5vw, 32px);
        }

        .ab-job-card {
          padding: clamp(26px, 3vw, 40px);
        }

        .ab-job-head {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .ab-job-logo {
          flex-shrink: 0;
          width: 68px;
          height: 68px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }

        .ab-job-logo-tile {
          background: linear-gradient(145deg, #0091ff, #006ee0);
          color: #ffffff;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .ab-job-logo-trophy {
          background: linear-gradient(145deg, #f5b432, #e08c0d);
        }

        .ab-job-company {
          margin: 2px 0 4px;
          font-size: clamp(20px, 2vw, 24px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          transition: color 0.45s ease;
        }

        .ab-job-role {
          margin: 0 0 3px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.45s ease;
        }

        .ab-job-date {
          margin: 0;
          font-size: 14px;
          color: var(--text-muted);
          transition: color 0.45s ease;
        }

        .ab-job-bullets {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ab-job-bullets li {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.62;
          transition: color 0.45s ease;
        }

        /* ── Stack ──────────────────────────────────── */

        .ab-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-stack-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: clamp(34px, 4vw, 56px) 24px;
        }

        .ab-stack-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: var(--bg-primary);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
          transition: background-color 0.45s ease;
        }

        .ab-stack-name {
          font-size: clamp(17px, 1.8vw, 21px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.025em;
          transition: color 0.45s ease;
        }

        /* ── Skills ─────────────────────────────────── */

        .ab-skills-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(20px, 2.5vw, 32px);
        }

        .ab-skills-card {
          padding: clamp(28px, 3vw, 42px);
        }

        .ab-skills-title {
          margin: 0 0 26px;
          font-size: clamp(18px, 1.9vw, 22px);
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.45s ease;
        }

        .ab-skills-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ab-skills-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: clamp(16px, 1.7vw, 20px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          transition: color 0.45s ease;
        }

        .ab-skills-emoji {
          font-size: 20px;
          line-height: 1;
        }

        .ab-skills-cta {
          display: flex;
          justify-content: center;
          margin-top: clamp(36px, 4.5vw, 56px);
        }

        /* ── Gallery ────────────────────────────────── */

        .ab-gallery {
          display: grid;
          grid-template-columns: 46fr 54fr;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-large {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          min-height: 420px;
        }

        .ab-gallery-right {
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-wide {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          height: clamp(220px, 24vw, 330px);
        }

        .ab-gallery-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(16px, 2vw, 26px);
        }

        .ab-gallery-small {
          position: relative;
          border-radius: 36px;
          overflow: hidden;
          height: clamp(200px, 22vw, 300px);
        }

        /* ── Tablet ─────────────────────────────────── */

        @media (max-width: 1024px) {
          .ab-stack-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile ─────────────────────────────────── */

        @media (max-width: 900px) {
          .ab-jobs-grid { grid-template-columns: 1fr; }
          .ab-skills-grid { grid-template-columns: 1fr; }

          .ab-gallery { grid-template-columns: 1fr; }
          .ab-gallery-large { min-height: 0; height: clamp(300px, 60vw, 460px); }
        }

        @media (max-width: 640px) {
          .ab-stack-grid { grid-template-columns: 1fr; }
          .ab-stack-card { padding: 28px 20px; }

          .ab-card { border-radius: 30px; }
          .ab-job-card, .ab-skills-card { padding: 24px; }

          .ab-job-logo { width: 58px; height: 58px; border-radius: 17px; }
          .ab-job-logo-tile { font-size: 26px; }

          .ab-hero-ctas { width: 100%; flex-direction: column; align-items: stretch; }
          .ab-btn-primary, .ab-btn-secondary { width: 100%; }

          .ab-gallery-pair { grid-template-columns: 1fr; }
          .ab-gallery-small { height: clamp(240px, 62vw, 320px); }
          .ab-gallery-wide { height: clamp(200px, 52vw, 280px); }
          .ab-gallery-large, .ab-gallery-wide, .ab-gallery-small { border-radius: 26px; }
        }
      `}</style>
    </>
  );
}
