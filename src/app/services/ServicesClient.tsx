"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { LuArrowRight, LuArrowUpRight, LuChevronDown } from "react-icons/lu";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { PremiumCV, LinkedInProfile, PortfolioShowcase, ProductVisualStyles } from "./ProductVisuals";
import { CAREER_SERVICES, CAREER_UPGRADE } from "@/data/careerServices";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CLICK_EVENTS: Record<string, string> = {
  cvReview: "cv_review_click", cvRewrite: "cv_rewrite_click",
  linkedin: "linkedin_click", portfolio: "portfolio_click",
};

const svc = (id: string) => CAREER_SERVICES.find((s) => s.id === id)!;

const COPY = {
  ar: {
    hero: {
      eyebrow: "المسار المهني والهوية الشخصية",
      h: ["اجعل مسيرتك", "تبدو بقوّة", "خبرتك."],
      sub: "خدمات للسيرة الذاتية ولينكدإن والهوية الشخصية، مصممة لتموضعك نحو فرصتك القادمة.",
      cta: "استعرض الخدمات", secondary: "لست متأكدًا مما تحتاجه؟",
    },
    review: { eyebrow: "مراجعة السيرة", h: "اعرف ما الذي يُضعف سيرتك.", sub: "مراجعة احترافية تُظهر بالضبط ما يجب تحسينه قبل أن تتقدّم." },
    rewrite: { eyebrow: "إعادة الكتابة", h: "حوّل الخبرة إلى أثر.", sub: "من صياغة عامة إلى إنجاز واضح وقابل للقياس.", before: "قبل", after: "بعد",
      beforeLine: "مسؤول عن إدارة فريق الجوال.", afterLine: "قدت فريقًا من ٨ مهندسين وأطلقت ٣ تطبيقات إنتاجية يستخدمها أكثر من مليوني عميل." },
    linkedin: { eyebrow: "لينكدإن", h: "كن أسهل في الظهور.", sub: "ملف يفهمه مسؤولو التوظيف في ثوانٍ.", chips: ["أكثر ظهورًا", "تموضع أقوى"] },
    portfolio: { eyebrow: "الموقع الشخصي", h: "اجعل أعمالك يستحيل تجاهلها.", sub: "مشاريعك الحقيقية، معروضة كحضور رقمي متكامل." },
    upgrade: { eyebrow: "الباقة المتكاملة", h: "هوية مهنية واحدة تعمل معًا.", sub: "السيرة الذاتية، ولينكدإن، والموقع الشخصي — قصة واحدة متناسقة.", badge: CAREER_UPGRADE.badge.ar, save: "توفّر" },
    trust: { h: "مبني على خبرة حقيقية.", stats: [["٩+ سنوات", "خبرة هندسية ومنتجية"], ["٢٠+ ورشة", "تدريب مقدَّم"], ["١٬٠٠٠+", "ساعة استشارية"]] },
    finalCta: { h: "جاهز لترتقي بطريقة ظهورك؟", sub: "اختر خدمة، وسأتولى الباقي.", cta: "استعرض الخدمات", secondary: "تحدّث مع تركي" },
    meta: { from: "من", sar: "ريال", details: "ما الذي يتضمنه؟" },
  },
  en: {
    hero: {
      eyebrow: "Career & Personal Brand",
      h: ["Make your career", "look as strong", "as your experience."],
      sub: "CV, LinkedIn and personal-brand services built to position you for your next opportunity.",
      cta: "Explore services", secondary: "Not sure what you need?",
    },
    review: { eyebrow: "CV Review", h: "Know what's holding your CV back.", sub: "An expert review that shows exactly what to improve before you apply." },
    rewrite: { eyebrow: "CV Rewrite", h: "Turn experience into impact.", sub: "From generic phrasing to clear, measurable achievement.", before: "Before", after: "After",
      beforeLine: "Responsible for managing the mobile team.", afterLine: "Led an 8-engineer mobile team, delivering 3 production apps used by 2M+ customers." },
    linkedin: { eyebrow: "LinkedIn", h: "Be easier to find.", sub: "A profile recruiters understand in seconds.", chips: ["More discoverable", "Stronger positioning"] },
    portfolio: { eyebrow: "Personal Portfolio", h: "Make your work impossible to overlook.", sub: "Your real projects, presented as one complete digital presence." },
    upgrade: { eyebrow: "Career Upgrade", h: "One professional identity that works together.", sub: "Your CV, LinkedIn and portfolio — one consistent story.", badge: CAREER_UPGRADE.badge.en, save: "Save" },
    trust: { h: "Built from real experience.", stats: [["9+ Years", "Engineering & Product"], ["20+ Workshops", "Delivered"], ["1,000+", "Consultation Hours"]] },
    finalCta: { h: "Ready to upgrade how you're seen?", sub: "Choose a service and I'll take it from there.", cta: "Explore services", secondary: "Talk to Turki" },
    meta: { from: "From", sar: "SAR", details: "What's included?" },
  },
};

function scrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }

export default function ServicesClient() {
  const { lang } = useLanguage();
  const t = COPY[lang];
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => { trackEvent("services_page_view"); }, []);

  return (
    <>
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="lazyOnload" />
      <ProductVisualStyles />
      <TopBar />
      <Navbar />

      <main className="sv">
        <Hero t={t} reduced={reduced} />

        <ProductStory
          id="cvReview" reversed={false} t={t} lang={lang} reduced={reduced}
          eyebrow={t.review.eyebrow} headline={t.review.h} sub={t.review.sub}
          service={svc("cvReview")}
          visual={
            <div className="pv-frame">
              <PremiumCV lang={lang} variant="strong" />
              <span className="pv-annot pv-annot-a"><i /> ATS 92%</span>
              <span className="pv-annot pv-annot-b"><i /> {lang === "ar" ? "أثر: ضعيف ← قوي" : "Impact: Weak → Strong"}</span>
            </div>
          }
        />

        <ProductStory
          id="cvRewrite" reversed t={t} lang={lang} reduced={reduced}
          eyebrow={t.rewrite.eyebrow} headline={t.rewrite.h} sub={t.rewrite.sub}
          service={svc("cvRewrite")}
          visual={<RewriteVisual t={t.rewrite} lang={lang} reduced={reduced} />}
        />

        <ProductStory
          id="linkedin" reversed={false} t={t} lang={lang} reduced={reduced}
          eyebrow={t.linkedin.eyebrow} headline={t.linkedin.h} sub={t.linkedin.sub}
          service={svc("linkedin")}
          visual={
            <div className="pv-frame">
              <LinkedInProfile lang={lang} />
              {t.linkedin.chips.map((c, i) => (
                <span key={c} className={`pv-annot pv-annot-${i === 0 ? "a" : "b"}`}><i /> {c}</span>
              ))}
            </div>
          }
        />

        <ProductStory
          id="portfolio" reversed t={t} lang={lang} reduced={reduced}
          eyebrow={t.portfolio.eyebrow} headline={t.portfolio.h} sub={t.portfolio.sub}
          service={svc("portfolio")}
          wide
          visual={<PortfolioShowcase lang={lang} />}
        />

        <Upgrade t={t} lang={lang} reduced={reduced} />
        <Trust t={t.trust} reduced={reduced} />
        <FinalCta t={t.finalCta} />
      </main>

      <Footer />

      <style>{`
        .sv { background: var(--bg-primary); color: var(--text-primary); overflow-x: clip; }
        .sv-eyebrow { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted, #999); margin-bottom: 18px; }
        .sv-arrow { flex-shrink: 0; }
        [dir="rtl"] .sv-arrow { transform: scaleX(-1); }
        .sv-cta { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--text-primary); color: var(--bg-primary); font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; text-decoration: none; transition: transform 250ms cubic-bezier(0.16,1,0.3,1), opacity 250ms ease; }
        .sv-cta:hover { transform: translateY(-2px); opacity: 0.92; }
        .sv-cta-ghost { border: none; background: transparent; color: var(--text-secondary); font-family: inherit; font-size: 14.5px; font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--border-subtle, rgba(0,0,0,0.2)); transition: color 250ms ease; }
        .sv-cta-ghost:hover { color: var(--text-primary); }

        /* Shared product visual frame + editorial annotations */
        .pv-frame { position: relative; width: min(420px, 100%); margin: 0 auto; }
        .pv-frame .cv, .pv-frame .li { box-shadow: 0 44px 90px rgba(0,0,0,0.13), 0 10px 30px rgba(0,0,0,0.05); }
        .pv-annot { position: absolute; z-index: 4; display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 999px; background: var(--bg-surface, #fff); box-shadow: 0 16px 36px rgba(0,0,0,0.14); font-size: 12px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
        .pv-annot i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #1495ff); }
        .pv-annot-a { top: 7%; inset-inline-end: -11%; }
        .pv-annot-b { bottom: 11%; inset-inline-end: -7%; }
        @media (max-width: 640px) { .pv-annot { font-size: 11px; padding: 7px 12px; } .pv-annot-a { inset-inline-end: -3%; } .pv-annot-b { inset-inline-end: -2%; } }
      `}</style>
    </>
  );
}

/* ═══ 01 · HERO — real editorial photograph ═══ */
function Hero({ t, reduced }: { t: (typeof COPY)["ar"]; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "12%"]);

  return (
    <section ref={ref} className="hero">
      <div className="hero-copy">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="sv-eyebrow">{t.hero.eyebrow}</motion.span>
        <h1 className="hero-h">
          {t.hero.h.map((line, i) => (
            <span key={i} className="hero-h-line">
              <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.09 }} className={i === 2 ? "hero-h-accent" : ""}>{line}</motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.4 }} className="hero-sub">{t.hero.sub}</motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.5 }} className="hero-actions">
          <button className="sv-cta" onClick={() => scrollToId("cvReview")}>{t.hero.cta}<LuArrowRight size={16} className="sv-arrow" /></button>
          <Link href="/contact" className="sv-cta-ghost" onClick={() => trackEvent("consultation_click", { location: "hero" })}>{t.hero.secondary}</Link>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }} className="hero-visual">
        <div className="hero-photo">
          <motion.div style={{ y }} className="hero-photo-inner">
            <Image src="/h1.jpg" alt="Turki Almalki presenting" fill priority sizes="(max-width: 900px) 92vw, 46vw" className="hero-img" />
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        .hero { width: min(1240px, calc(100% - 48px)); margin: 0 auto; padding-top: clamp(128px, 12vw, 180px); padding-bottom: clamp(56px, 7vw, 96px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr); align-items: center; gap: clamp(40px, 6vw, 88px); }
        .hero-h { margin: 0; font-weight: 900; letter-spacing: -0.035em; line-height: 1.04; font-size: clamp(42px, 6.4vw, 88px); color: var(--text-primary); }
        .hero-h-line { display: block; overflow: hidden; }
        .hero-h-line > span { display: inline-block; }
        .hero-h-accent { color: var(--accent, #1495ff); }
        .hero-sub { max-width: 420px; margin: 26px 0 34px; font-size: clamp(16px, 1.3vw, 18px); line-height: 1.6; color: var(--text-secondary); }
        .hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 24px; }
        .hero-photo { position: relative; width: 100%; aspect-ratio: 4 / 4.4; border-radius: 24px; overflow: hidden; box-shadow: 0 50px 100px rgba(0,0,0,0.18), 0 14px 40px rgba(0,0,0,0.08); }
        .hero-photo-inner { position: absolute; inset: -6% 0; }
        .hero-img { object-fit: cover; object-position: 60% 32%; }
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; text-align: center; padding-top: 112px; gap: 44px; }
          .hero-visual { order: -1; }
          .hero-photo { aspect-ratio: 4 / 3.4; }
          .sv-eyebrow, .hero-sub { margin-inline: auto; }
          .hero-actions { justify-content: center; }
        }
      `}</style>
    </section>
  );
}

/* ═══ Shared product story section (02–05) ═══ */
function ProductStory({
  id, reversed, wide, eyebrow, headline, sub, service, visual, t, lang, reduced,
}: {
  id: string; reversed: boolean; wide?: boolean;
  eyebrow: string; headline: string; sub: string;
  service: (typeof CAREER_SERVICES)[number];
  visual: ReactNode;
  t: (typeof COPY)["ar"]; lang: "ar" | "en"; reduced: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["6%", "-6%"]);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (inView) trackEvent("service_card_view", { service: id }); }, [inView, id]);

  return (
    <section id={id} ref={ref} className={`story${reversed ? " story-rev" : ""}${wide ? " story-wide" : ""}`}>
      <motion.div style={{ y }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, ease: EASE }} className="story-visual">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
          {visual}
        </motion.div>
      </motion.div>

      <div className="story-copy">
        <motion.span initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }} className="sv-eyebrow">{eyebrow}</motion.span>
        <motion.h2 initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE, delay: 0.08 }} className="story-h">{headline}</motion.h2>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, ease: EASE, delay: 0.16 }} className="story-sub">{sub}</motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, ease: EASE, delay: 0.24 }} className="story-foot">
          <a className="lemonsqueezy-button sv-cta" href={service.checkoutUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => { trackEvent(CLICK_EVENTS[id], { service: id }); trackEvent("checkout_started", { service: id }); }}>
            {service.cta[lang]}<LuArrowUpRight size={15} className="sv-arrow" />
          </a>
          <span className="story-price">{t.meta.from} {service.price.toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} {t.meta.sar} · {service.delivery[lang]}</span>
        </motion.div>

        <div className="story-details">
          <button className="story-details-toggle" aria-expanded={open} onClick={() => { const n = !open; setOpen(n); if (n) trackEvent("service_expand", { service: id }); }}>
            {t.meta.details}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.25 }}><LuChevronDown size={15} /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: reduced ? 0 : 0.32, ease: EASE }, opacity: { duration: 0.2 } }} style={{ overflow: "hidden" }} className="story-deliverables">
                {service.deliverables.map((d) => <li key={d.en}>{d[lang]}</li>)}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .story { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding-block: clamp(72px, 10vw, 140px); display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr); align-items: center; gap: clamp(40px, 6vw, 96px); }
        .story-rev .story-visual { order: 2; }
        .story-rev .story-copy { order: 1; }
        .story-wide { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); }
        .story-wide.story-rev .story-copy { order: 1; }
        .story-copy { min-width: 0; }
        .story-h { margin: 0 0 16px; font-size: clamp(30px, 4vw, 56px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.08; color: var(--text-primary); }
        .story-sub { margin: 0 0 30px; max-width: 42ch; font-size: clamp(15.5px, 1.3vw, 18px); line-height: 1.6; color: var(--text-secondary); }
        .story-foot { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .story-price { font-size: 13px; color: var(--text-muted, #999); }
        .story-details { margin-top: 22px; }
        .story-details-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: transparent; color: var(--text-secondary); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: color 200ms ease; }
        .story-details-toggle:hover { color: var(--text-primary); }
        .story-deliverables { margin: 14px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .story-deliverables li { position: relative; padding-inline-start: 16px; font-size: 13.5px; color: var(--text-secondary); }
        .story-deliverables li::before { content: ""; position: absolute; inset-inline-start: 0; top: 7px; width: 4px; height: 4px; border-radius: 50%; background: var(--text-muted, #999); }
        @media (max-width: 900px) {
          .story, .story-wide { grid-template-columns: 1fr; text-align: center; }
          .story-visual, .story-rev .story-visual { order: -1; }
          .story-copy, .story-rev .story-copy { order: 0; }
          .story-sub { max-width: none; margin-inline: auto; }
          .story-foot { justify-content: center; }
          .sv-eyebrow { margin-inline: auto; }
        }
      `}</style>
    </section>
  );
}

/* ═══ CV Rewrite before/after visual ═══ */
function RewriteVisual({ t, lang, reduced }: { t: (typeof COPY)["ar"]["rewrite"]; lang: "ar" | "en"; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <div ref={ref} className="rw">
      <motion.div className="rw-line rw-before" initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }}>
        <span className="rw-tag">{t.before}</span>
        <p>{t.beforeLine}</p>
      </motion.div>
      <motion.div className="rw-arrow" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}>
        <LuArrowRight size={20} className="sv-arrow" />
      </motion.div>
      <motion.div className="rw-line rw-after" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}>
        <span className="rw-tag rw-tag-after">{t.after}</span>
        <p>{t.afterLine}</p>
      </motion.div>
      <style>{`
        .rw { width: min(460px, 100%); margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
        .rw-line { position: relative; padding: 22px 24px; border-radius: 16px; }
        .rw-before { background: var(--bg-card, #f3f3f3); border: 1px solid var(--border-subtle, rgba(0,0,0,0.06)); }
        .rw-after { background: var(--bg-surface, #fff); border: 1.5px solid var(--accent, #1495ff); box-shadow: 0 30px 66px rgba(20,149,255,0.14); }
        .rw-tag { display: inline-block; margin-bottom: 10px; padding: 3px 11px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: var(--bg-card-muted, #e8e8e8); color: var(--text-muted, #888); }
        .rw-tag-after { background: var(--accent, #1495ff); color: #fff; }
        .rw-line p { margin: 0; font-size: clamp(15px, 1.4vw, 17px); line-height: 1.55; }
        .rw-before p { color: var(--text-muted, #9aa0aa); }
        .rw-after p { color: var(--text-primary); font-weight: 600; }
        .rw-arrow { display: flex; justify-content: center; color: var(--text-muted, #bbb); transform: rotate(90deg); }
        [dir="rtl"] .rw-arrow { transform: rotate(90deg) scaleX(-1); }
      `}</style>
    </div>
  );
}

/* ═══ 06 · CAREER UPGRADE — full-width climax ═══ */
function Upgrade({ t, lang, reduced }: { t: (typeof COPY)["ar"]; lang: "ar" | "en"; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const pkg = CAREER_UPGRADE;
  useEffect(() => { if (inView) trackEvent("career_upgrade_view"); }, [inView]);
  const fmt = (n: number) => n.toLocaleString(lang === "ar" ? "ar-SA" : "en-US");

  return (
    <section id="careerUpgrade" ref={ref} className="up">
      <div className="up-inner">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }} className="up-badge">{t.upgrade.badge}</motion.span>
        <motion.h2 initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE, delay: 0.08 }} className="up-h">{t.upgrade.h}</motion.h2>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, ease: EASE, delay: 0.16 }} className="up-sub">{t.upgrade.sub}</motion.p>

        <motion.div className="up-stack" initial={{ opacity: 0, y: 34 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: EASE, delay: 0.22 }}>
          <div className="up-obj up-obj-cv"><PremiumCV lang={lang} variant="strong" /></div>
          <div className="up-obj up-obj-li"><LinkedInProfile lang={lang} /></div>
          <div className="up-obj up-obj-pf"><PortfolioShowcase lang={lang} /></div>
        </motion.div>

        <motion.div className="up-foot" initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, ease: EASE, delay: 0.3 }}>
          <a className="lemonsqueezy-button sv-cta" href={pkg.checkoutUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => { trackEvent("career_upgrade_click", { service: "careerUpgrade" }); trackEvent("checkout_started", { service: "careerUpgrade" }); }}>
            {pkg.cta[lang]}<LuArrowUpRight size={15} className="sv-arrow" />
          </a>
          <span className="up-price">
            <span className="up-price-now">{fmt(pkg.packagePrice)} {t.meta.sar}</span>
            <span className="up-price-was">{fmt(pkg.individualValue)}</span>
            <span className="up-price-save">{t.upgrade.save} {fmt(pkg.savings)}</span>
          </span>
        </motion.div>
      </div>

      <style>{`
        .up { background: var(--bg-surface, #fff); border-block: 1px solid var(--border-subtle, rgba(0,0,0,0.06)); }
        :global([data-theme="dark"]) .up { background: var(--bg-elevated, #16181d); }
        .up-inner { width: min(1080px, calc(100% - 48px)); margin: 0 auto; padding-block: clamp(72px, 10vw, 140px); text-align: center; }
        .up-badge { display: inline-flex; padding: 6px 14px; margin-bottom: 20px; border-radius: 999px; background: rgba(20,149,255,0.1); color: var(--accent, #1495ff); font-size: 11.5px; font-weight: 700; letter-spacing: 0.02em; }
        .up-h { margin: 0 0 14px; font-size: clamp(30px, 4.2vw, 58px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.08; color: var(--text-primary); }
        .up-sub { margin: 0 auto clamp(44px, 5vw, 72px); max-width: 48ch; font-size: clamp(15.5px, 1.3vw, 18px); line-height: 1.6; color: var(--text-secondary); }
        .up-stack { position: relative; height: clamp(320px, 34vw, 440px); margin-bottom: clamp(40px, 5vw, 64px); }
        .up-obj { position: absolute; box-shadow: 0 40px 90px rgba(0,0,0,0.16), 0 12px 34px rgba(0,0,0,0.07); border-radius: 14px; }
        .up-obj-cv { width: clamp(220px, 24vw, 300px); top: 0; inset-inline-start: 8%; transform: rotate(-5deg); z-index: 2; }
        .up-obj-li { width: clamp(200px, 22vw, 270px); top: 12%; inset-inline-end: 8%; transform: rotate(5deg); z-index: 1; }
        .up-obj-pf { width: clamp(300px, 34vw, 440px); bottom: 0; left: 50%; transform: translateX(-50%); z-index: 3; }
        .up-foot { display: inline-flex; align-items: center; gap: 22px; flex-wrap: wrap; justify-content: center; }
        .up-price { display: inline-flex; align-items: baseline; gap: 10px; }
        .up-price-now { font-size: 22px; font-weight: 900; color: var(--text-primary); }
        .up-price-was { font-size: 14px; color: var(--text-muted, #999); text-decoration: line-through; }
        .up-price-save { font-size: 13px; font-weight: 700; color: var(--accent, #1495ff); }
        @media (max-width: 720px) {
          .up-stack { height: 520px; }
          .up-obj-cv { width: 74%; inset-inline-start: 0; top: 0; }
          .up-obj-li { width: 66%; inset-inline-end: 0; top: 26%; }
          .up-obj-pf { width: 92%; bottom: 0; }
        }
      `}</style>
    </section>
  );
}

/* ═══ 07 · TRUST — full-bleed real photograph band ═══ */
function Trust({ t, reduced }: { t: (typeof COPY)["ar"]["trust"]; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} className="tr">
      <Image src="/turki.jpg" alt="Turki Almalki presenting at an innovation event" fill sizes="100vw" className="tr-img" />
      <div className="tr-overlay" />
      <div className="tr-inner">
        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }} className="tr-h">{t.h}</motion.h2>
        <div className="tr-stats">
          {t.stats.map(([v, l], i) => (
            <motion.div key={l} initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.08 }} className="tr-stat">
              <span className="tr-v">{v}</span><span className="tr-l">{l}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        .tr { position: relative; min-height: clamp(420px, 48vw, 560px); display: flex; align-items: center; overflow: hidden; }
        .tr-img { object-fit: cover; object-position: 62% 30%; }
        .tr-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8,10,14,0.82) 0%, rgba(8,10,14,0.62) 42%, rgba(8,10,14,0.28) 100%); }
        [dir="rtl"] .tr-overlay { background: linear-gradient(270deg, rgba(8,10,14,0.82) 0%, rgba(8,10,14,0.62) 42%, rgba(8,10,14,0.28) 100%); }
        .tr-inner { position: relative; z-index: 1; width: min(1080px, calc(100% - 48px)); margin: 0 auto; color: #fff; }
        .tr-h { margin: 0 0 clamp(28px, 4vw, 44px); font-size: clamp(28px, 3.6vw, 48px); font-weight: 900; letter-spacing: -0.03em; max-width: 16ch; }
        .tr-stats { display: flex; gap: clamp(28px, 5vw, 64px); flex-wrap: wrap; }
        .tr-stat { display: flex; flex-direction: column; gap: 5px; }
        .tr-v { font-size: clamp(24px, 2.8vw, 34px); font-weight: 900; letter-spacing: -0.02em; color: #fff; }
        .tr-l { font-size: 12.5px; color: rgba(255,255,255,0.72); }
      `}</style>
    </section>
  );
}

/* ═══ 08 · FINAL CTA ═══ */
function FinalCta({ t }: { t: (typeof COPY)["ar"]["finalCta"] }) {
  return (
    <section className="fin">
      <h2 className="fin-h">{t.h}</h2>
      <p className="fin-sub">{t.sub}</p>
      <div className="fin-actions">
        <button className="sv-cta" onClick={() => scrollToId("cvReview")}>{t.cta}<LuArrowRight size={16} className="sv-arrow" /></button>
        <Link href="/contact" className="sv-cta-ghost" onClick={() => trackEvent("consultation_click", { location: "final_cta" })}>{t.secondary}</Link>
      </div>
      <style>{`
        .fin { width: min(760px, calc(100% - 48px)); margin: 0 auto; padding-block: clamp(88px, 12vw, 168px); text-align: center; }
        .fin-h { margin: 0; font-size: clamp(34px, 5vw, 66px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.06; color: var(--text-primary); }
        .fin-sub { max-width: 420px; margin: 22px auto 36px; font-size: clamp(15px, 1.3vw, 18px); line-height: 1.6; color: var(--text-secondary); }
        .fin-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 24px; }
      `}</style>
    </section>
  );
}
