"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  cubicBezier,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { LuArrowUpRight, LuArrowRight } from "react-icons/lu";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import {
  CareerObjectStyles,
  CVSheet,
  CrumpleOverlay,
  ReviewMarks,
  LinkedInCard,
  BrowserCard,
  RejectionEmail,
  ATSCard,
  RecruiterSearch,
  StickyNote,
  ScrapSheet,
  PhotoCard,
  type Lang,
} from "./CareerObjects";
import { CAREER_SERVICES, CAREER_UPGRADE } from "@/data/careerServices";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   /services — CAREER CHAOS → CAREER CLARITY → PROFESSIONAL IDENTITY

   One continuous story. The objects scattered across the first viewport are
   the same objects that become the services, and the same objects that lock
   into a single professional identity at the end. Every transformation is
   scrubbed to scroll position — no entrance animations.
   ═══════════════════════════════════════════════════════════════════════ */

const EASE = cubicBezier(0.62, 0.02, 0.22, 1);
const CLICK: Record<string, string> = {
  cvReview: "cv_review_click",
  cvRewrite: "cv_rewrite_click",
  linkedin: "linkedin_click",
  portfolio: "portfolio_click",
};
const svc = (id: string) => CAREER_SERVICES.find((s) => s.id === id)!;

const COPY = {
  ar: {
    chaosH: "خبرتك تستحق\nظهورًا أفضل.",
    chaosSub: "كل شيء عن مسيرتك موجود. لا شيء منه يعمل معًا.",
    orderH: "كل ما تحتاجه.\nيعمل معًا.",
    labels: ["مراجعة السيرة", "إعادة الكتابة", "لينكدإن", "الموقع الشخصي"],
    reviewH: "اعرف ما الذي يُضعف سيرتك.",
    reviewNotes: [
      ["الوضوح", "ثلاث روايات مختلفة"],
      ["الأثر", "لا يوجد رقم واحد"],
      ["ATS", "توافق ٣٨٪"],
      ["التموضع", "أي دور بالضبط؟"],
    ],
    rewriteH: "خبرتك، بصياغة جديدة.",
    rewriteBefore: "مسؤول عن إدارة فريق الجوال.",
    rewriteAfter: "قدت فريقًا من ٨ مهندسين وأطلقت منتجات يستخدمها الملايين.",
    linkedinH: "أسهل في الظهور.\nيستحيل تجاهلك.",
    linkedinBefore: "مهندس برمجيات",
    linkedinAfter: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية وابتكار",
    portfolioH: "أعمالك تتحدث قبلك.",
    identityH: "هوية مهنية واحدة.",
    identitySub: "كل شيء الآن يعمل معًا.",
    upgradeName: CAREER_UPGRADE.name.ar,
    save: "توفّر",
    finalH: "من الفوضى\nإلى الوضوح.",
    finalSub: "اختر ما تحتاجه، وسأتولى الباقي.",
    talk: "تحدّث معي أولًا",
    from: "من",
    sar: "ريال",
    before: "قبل",
    after: "بعد",
    scrollHint: "مرّر",
  },
  en: {
    chaosH: "Your career\ndeserves better.",
    chaosSub: "Everything about your career is here. None of it is working together.",
    orderH: "Everything you need.\nWorking together.",
    labels: ["CV Review", "CV Rewrite", "LinkedIn", "Portfolio"],
    reviewH: "See what's holding your CV back.",
    reviewNotes: [
      ["Clarity", "three different stories"],
      ["Impact", "not one number"],
      ["ATS", "38% compatible"],
      ["Positioning", "targeting which role?"],
    ],
    rewriteH: "Your experience, rewritten.",
    rewriteBefore: "Responsible for managing the mobile team.",
    rewriteAfter: "Led an 8-engineer mobile team delivering products used by millions.",
    linkedinH: "Be easier to find.\nImpossible to overlook.",
    linkedinBefore: "Software Engineer",
    linkedinAfter: "Engineering Leader | Product Builder | Fintech & Digital Innovation",
    portfolioH: "Your work speaks first.",
    identityH: "One professional identity.",
    identitySub: "Everything now works together.",
    upgradeName: CAREER_UPGRADE.name.en,
    save: "Save",
    finalH: "Chaos,\nresolved.",
    finalSub: "Pick what you need. I'll take it from there.",
    talk: "Talk to me first",
    from: "From",
    sar: "SAR",
    before: "Before",
    after: "After",
    scrollHint: "Scroll",
  },
};
type Copy = (typeof COPY)["en"];

const REEL = [
  { img: "/emkan2026.png", name: { ar: "إمكان", en: "Emkan" }, cat: { ar: "تقنية مالية", en: "Fintech" } },
  { img: "/alrajhi2026.png", name: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" }, cat: { ar: "تطبيقات مصرفية", en: "Mobile Banking" } },
  { img: "/munasib2026.png", name: { ar: "مناسب", en: "Munaseb" }, cat: { ar: "تقنية مالية", en: "Fintech" } },
  { img: "/ithnin2026.png", name: { ar: "اثنين", en: "Ithnain" }, cat: { ar: "تطبيق اجتماعي", en: "Social" } },
  { img: "/wijhut2026.png", name: { ar: "وجهات", en: "Wijhut" }, cat: { ar: "سفر", en: "Travel" } },
  { img: "/casdd.png", name: { ar: "BaseBox", en: "BaseBox" }, cat: { ar: "منصة SaaS", en: "SaaS Platform" } },
];

/* ─────────────────────────── primitives ─────────────────────────── */

type Vec = { x: number; y: number; r: number; s: number; o?: number; b?: number };
type Obj = {
  id: string;
  w: number; // width as a fraction of the stage width
  z: number;
  from: Vec;
  to?: Vec; // absent → the object leaves; bad career elements disappear
  delay?: number;
  node: ReactNode;
};

function useStage(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function useMedia(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return on;
}

/** Piecewise-linear sample of `stops → out`, clamped at both ends. */
function sample(v: number, stops: number[], out: number[], ease?: (t: number) => number) {
  const last = stops.length - 1;
  if (v <= stops[0]) return out[0];
  if (v >= stops[last]) return out[last];
  for (let i = 1; i <= last; i++) {
    if (v <= stops[i]) {
      let t = (v - stops[i - 1]) / (stops[i] - stops[i - 1]);
      if (ease) t = ease(t);
      return out[i - 1] + (out[i] - out[i - 1]) * t;
    }
  }
  return out[last];
}

/**
 * Scroll-scrubbed value written straight into a MotionValue.
 * `useTransform` is used for transform channels, but its derived values never
 * reach `opacity` in this tree — this drives those channels explicitly.
 */
function useScrub(p: MotionValue<number>, stops: number[], out: number[], ease?: (t: number) => number) {
  const mv = useMotionValue(sample(p.get(), stops, out, ease));
  const spec = useRef({ stops, out, ease });
  useEffect(() => {
    spec.current = { stops, out, ease };
    mv.set(sample(p.get(), stops, out, ease));
  });
  useMotionValueEvent(p, "change", (v) => mv.set(sample(v, spec.current.stops, spec.current.out, spec.current.ease)));
  return mv;
}

/** One scattered object, physically driven by the scene's scroll progress. */
function FieldObject({
  p,
  o,
  stage,
}: {
  p: MotionValue<number>;
  o: Obj;
  stage: { w: number; h: number };
}) {
  const exits = !o.to;
  const f = o.from;
  const t: Vec = o.to ?? {
    x: f.x * 1.5,
    y: f.y * 1.6 - 0.18,
    r: f.r * 1.7,
    s: f.s * 0.84,
    o: 0,
    b: 6,
  };
  // A touch of drift before the real travel begins, so the very first scroll
  // already moves everything — and a per-object delay so they don't arrive
  // as one block.
  const d = o.delay ?? 0;
  const mid = exits ? 0.1 : 0.14 + d;
  const end = exits ? 0.52 + d : 0.86;
  const stops = [0, mid, end];
  const drift = (from: number, to: number, k: number) => from + (to - from) * k;

  const x = useTransform(p, stops, [f.x * stage.w, drift(f.x, t.x, 0.06) * stage.w, t.x * stage.w], { ease: EASE });
  const y = useTransform(p, stops, [f.y * stage.h, drift(f.y, t.y, 0.06) * stage.h, t.y * stage.h], { ease: EASE });
  const rotate = useTransform(p, stops, [f.r, drift(f.r, t.r, 0.1), t.r], { ease: EASE });
  const scale = useTransform(p, stops, [f.s, drift(f.s, t.s, 0.06), t.s], { ease: EASE });
  const opacity = useScrub(p, stops, [f.o ?? 1, f.o ?? 1, t.o ?? 1], EASE);

  return (
    <motion.div
      className="fo"
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex: o.z,
        width: o.w * stage.w,
        ...(f.b ? { filter: `blur(${f.b}px)` } : null),
      }}
    >
      {o.node}
    </motion.div>
  );
}

/** A piece of text that lives inside the field and is scrubbed like an object. */
function FieldText({
  p,
  stage,
  x = 0,
  y = 0,
  range,
  z = 40,
  lit = false,
  className,
  children,
}: {
  p: MotionValue<number>;
  stage: { w: number; h: number };
  x?: number;
  y?: number;
  range: [number, number, number, number];
  z?: number;
  /** already on screen when the scene starts — never fades in */
  lit?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const opacity = useScrub(p, range, [lit ? 1 : 0, 1, 1, 0]);
  const scale = useTransform(p, [range[0], range[3]], [1, 0.97]);
  return (
    <motion.div
      className={`fo ft ${className ?? ""}`}
      style={{ opacity, scale, zIndex: z, x: x * stage.w, y: y * stage.h }}
    >
      {children}
    </motion.div>
  );
}

function Cta({
  id,
  href,
  label,
  price,
  t,
  lang,
  tone = "solid",
}: {
  id: string;
  href: string;
  label: string;
  price?: number;
  t: Copy;
  lang: Lang;
  tone?: "solid" | "big";
}) {
  return (
    <span className={`ctaw${tone === "big" ? " ctaw-big" : ""}`}>
      <a
        className="lemonsqueezy-button cta"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackEvent(CLICK[id] ?? "career_upgrade_click", { service: id });
          trackEvent("checkout_started", { service: id });
        }}
      >
        {label}
        <LuArrowUpRight size={15} className="cta-i" />
      </a>
      {price !== undefined && (
        <span className="cta-p">
          {t.from} {price.toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} {t.sar}
        </span>
      )}
    </span>
  );
}

/* ════════════════════════════ page ════════════════════════════ */

export default function ServicesClient() {
  const { lang } = useLanguage();
  const t = COPY[lang];
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const mobile = useMedia("(max-width: 820px)");

  useEffect(() => {
    trackEvent("services_page_view");
  }, []);

  return (
    <>
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="lazyOnload" />
      <CareerObjectStyles />
      <TopBar />
      <Navbar />
      <main className="sv">
        <SceneChaos t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <SceneReview t={t} lang={lang} reduced={reduced} />
        <SceneRewrite t={t} lang={lang} reduced={reduced} />
        <SceneLinkedIn t={t} lang={lang} reduced={reduced} />
        <ScenePortfolio t={t} lang={lang} reduced={reduced} />
        <SceneIdentity t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <FinalWord t={t} />
      </main>
      <Footer />
      <PageStyles />
    </>
  );
}

/* ════════════ SCENE 01 — CHAOS becoming CLARITY ════════════ */

function SceneChaos({
  t,
  lang,
  mobile,
  reduced,
}: {
  t: Copy;
  lang: Lang;
  mobile: boolean;
  reduced: boolean;
}) {
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef);
  const { scrollYProgress } = useScroll({ target: secRef, offset: ["start start", "end end"] });
  const still = useMotionValue(0);
  const p = reduced ? still : scrollYProgress;
  const D = lang === "ar" ? -1 : 1;

  const objects = useMemo<Obj[]>(() => {
    const row = mobile
      ? [
          { x: -0.235, y: -0.13 },
          { x: 0.235, y: -0.13 },
          { x: -0.235, y: 0.15 },
          { x: 0.235, y: 0.15 },
        ]
      : [
          { x: -0.345, y: 0.115 },
          { x: -0.115, y: 0.115 },
          { x: 0.115, y: 0.115 },
          { x: 0.345, y: 0.115 },
        ];
    const mx = (v: number) => v * D;

    /* The four survivors — these become the four services. */
    const survivors: Obj[] = [
      {
        // CV REVIEW — a printed CV somebody already scribbled over
        id: "review",
        w: mobile ? 0.5 : 0.185,
        z: 22,
        from: { x: mx(-0.315), y: -0.19, r: -11, s: 1 },
        to: { x: mx(row[0].x), y: row[0].y, r: 0, s: mobile ? 0.62 : 0.8 },
        delay: 0.02,
        node: (
          <div className="obj-cv">
            <CVSheet lang={lang} variant="weak" />
            <ReviewMarksFade p={p} lang={lang} />
          </div>
        ),
      },
      {
        // CV REWRITE — the crumpled one. It unfolds; it never gets swapped out.
        id: "rewrite",
        w: mobile ? 0.58 : 0.235,
        z: 26,
        from: { x: mx(0.3), y: 0.16, r: 14, s: 1 },
        to: { x: mx(row[1].x), y: row[1].y, r: 0, s: mobile ? 0.535 : 0.63 },
        delay: 0.06,
        node: <CrumpledCV p={p} lang={lang} />,
      },
      {
        // LINKEDIN — a weak profile that nobody finds
        id: "linkedin",
        w: mobile ? 0.52 : 0.2,
        z: 20,
        from: { x: mx(-0.375), y: 0.3, r: -7, s: 1 },
        to: { x: mx(row[2].x), y: row[2].y, r: 0, s: mobile ? 0.6 : 0.75 },
        delay: 0.11,
        node: <MorphLinkedIn p={p} lang={lang} />,
      },
      {
        // PORTFOLIO — a dead link where the work should be
        id: "portfolio",
        w: mobile ? 0.66 : 0.3,
        z: 18,
        from: { x: mx(0.395), y: -0.3, r: 8, s: 1 },
        to: { x: mx(row[3].x), y: row[3].y, r: 0, s: mobile ? 0.52 : 0.63 },
        delay: 0.15,
        node: <MorphBrowser p={p} lang={lang} />,
      },
    ];

    /* The noise — everything that should stop defining this career. */
    const noise: Obj[] = mobile
      ? [
          {
            id: "email",
            w: 0.56,
            z: 12,
            from: { x: mx(-0.06), y: 0.44, r: 5, s: 1 },
            node: <RejectionEmail lang={lang} />,
          },
          {
            id: "scrapA",
            w: 0.3,
            z: 8,
            from: { x: mx(0.42), y: -0.05, r: 21, s: 1, b: 2 },
            node: <ScrapSheet tone={1} />,
          },
        ]
      : [
          {
            id: "email",
            w: 0.21,
            z: 14,
            from: { x: mx(0.02), y: -0.4, r: -5, s: 1 },
            node: <RejectionEmail lang={lang} />,
          },
          {
            id: "ats",
            w: 0.145,
            z: 16,
            from: { x: mx(-0.2), y: 0.42, r: 6, s: 1 },
            node: <ATSCard lang={lang} />,
          },
          {
            id: "search",
            w: 0.19,
            z: 13,
            from: { x: mx(0.175), y: 0.41, r: -9, s: 1 },
            node: <RecruiterSearch lang={lang} />,
          },
          {
            id: "note",
            w: 0.075,
            z: 30,
            from: { x: mx(-0.215), y: -0.375, r: -14, s: 1 },
            node: <StickyNote lang={lang} />,
          },
          {
            id: "scrapA",
            w: 0.13,
            z: 9,
            from: { x: mx(-0.47), y: -0.02, r: 23, s: 1, b: 2 },
            node: <ScrapSheet tone={0} />,
          },
          {
            id: "scrapB",
            w: 0.115,
            z: 8,
            from: { x: mx(0.475), y: 0.12, r: -19, s: 1, b: 3.5 },
            node: <ScrapSheet tone={2} />,
          },
          {
            id: "scrapC",
            w: 0.1,
            z: 34,
            from: { x: mx(0.31), y: 0.45, r: 12, s: 1, b: 1.5 },
            node: <ScrapSheet tone={1} />,
          },
        ];

    return [...survivors, ...noise];
  }, [lang, mobile, p, D]);

  const hintO = useScrub(p, [0, 0.06], [1, 0]);
  const labelsO = useScrub(p, [0.82, 0.94], [0, 1]);
  const rowY = mobile ? 0.2 : 0.115;

  return (
    <section ref={secRef} className={`sc1${reduced ? " unpinned" : ""}`}>
      <div className="pin">
        <div ref={stageRef} className="stage">
          {objects.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} />
          ))}

          <FieldText p={p} stage={stage} y={-0.015} range={[0, 0.02, 0.4, 0.56]} lit className="ft-mid">
            <h1 className="mega">{t.chaosH}</h1>
            <p className="mega-sub">{t.chaosSub}</p>
          </FieldText>

          <FieldText
            p={p}
            stage={stage}
            y={mobile ? -0.36 : -0.285}
            range={[0.6, 0.78, 0.98, 1]}
            className="ft-mid"
          >
            <h2 className="mega mega-2">{t.orderH}</h2>
          </FieldText>

          <motion.div className="labels" style={{ opacity: labelsO }}>
            {t.labels.map((l, i) => {
              const col = mobile ? (i % 2 === 0 ? -0.235 : 0.235) : [-0.345, -0.115, 0.115, 0.345][i];
              const line = mobile ? (i < 2 ? -0.13 : 0.15) : rowY;
              return (
                <span
                  key={l}
                  className="label"
                  style={{
                    transform: `translate(-50%, -50%) translate(${col * D * stage.w}px, ${
                      line * stage.h + (mobile ? 0.128 : 0.185) * stage.h
                    }px)`,
                  }}
                >
                  {l}
                </span>
              );
            })}
          </motion.div>

          {!reduced && (
            <motion.span className="hint" style={{ opacity: hintO }}>
              {t.scrollHint}
            </motion.span>
          )}
        </div>
      </div>

      {reduced && (
        <div className="pin pin-static">
          <div className="stage">
            <StaticRow lang={lang} labels={t.labels} title={t.orderH} />
          </div>
        </div>
      )}

      <style>{`
        .sc1 { height: 300vh; }
        .sc1.unpinned { height: auto; }
        .sc1 .pin { position: sticky; top: 0; height: 100vh; }
        .sc1.unpinned .pin { position: static; height: 100vh; }
        .sc1 .pin-static { height: auto; padding-block: 80px; }
      `}</style>
    </section>
  );
}

/** Reduced-motion fallback: the resolved composition, no movement. */
function StaticRow({ lang, labels, title }: { lang: Lang; labels: string[]; title: string }) {
  return (
    <div className="srow">
      <h2 className="mega mega-2 srow-h">{title}</h2>
      <div className="srow-items">
        <figure>
          <CVSheet lang={lang} variant="strong" />
          <figcaption className="label">{labels[0]}</figcaption>
        </figure>
        <figure>
          <CVSheet lang={lang} variant="strong" />
          <figcaption className="label">{labels[1]}</figcaption>
        </figure>
        <figure>
          <LinkedInCard lang={lang} />
          <figcaption className="label">{labels[2]}</figcaption>
        </figure>
        <figure>
          <BrowserCard lang={lang} />
          <figcaption className="label">{labels[3]}</figcaption>
        </figure>
      </div>
      <style>{`
        .srow { width: min(1180px, calc(100% - 48px)); margin: 0 auto; }
        .srow-h { text-align: center; margin-bottom: clamp(48px, 7vw, 88px); }
        .srow-items { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; align-items: center; }
        .srow figure { margin: 0; width: 100%; max-width: 250px; margin-inline: auto; display: flex; flex-direction: column; gap: 14px; align-items: center; }
      `}</style>
    </div>
  );
}

/* ── objects that transform in place, sharing the scene's progress ── */

function CrumpledCV({ p, lang }: { p: MotionValue<number>; lang: Lang }) {
  const crumple = useScrub(p, [0.18, 0.62], [1, 0]);
  const weak = useScrub(p, [0.42, 0.66], [1, 0]);
  const strong = useScrub(p, [0.46, 0.74], [0, 1]);
  const rx = useTransform(p, [0.18, 0.66], [7, 0]);
  const ry = useTransform(p, [0.18, 0.66], [-9, 0]);
  return (
    <motion.div className="obj-cv obj-3d" style={{ rotateX: rx, rotateY: ry }}>
      <motion.div className="obj-abs" style={{ opacity: weak }}>
        <CVSheet lang={lang} variant="weak" />
      </motion.div>
      <motion.div style={{ opacity: strong }}>
        <CVSheet lang={lang} variant="strong" />
      </motion.div>
      <motion.div className="obj-abs obj-crumple" style={{ opacity: crumple }}>
        <CrumpleOverlay />
      </motion.div>
    </motion.div>
  );
}

function ReviewMarksFade({ p, lang }: { p: MotionValue<number>; lang: Lang }) {
  const o = useScrub(p, [0.4, 0.7], [1, 0]);
  return (
    <motion.div className="obj-abs" style={{ opacity: o }}>
      <ReviewMarks lang={lang} />
    </motion.div>
  );
}

function MorphLinkedIn({ p, lang }: { p: MotionValue<number>; lang: Lang }) {
  const weak = useScrub(p, [0.44, 0.68], [1, 0]);
  const strong = useScrub(p, [0.48, 0.76], [0, 1]);
  return (
    <div className="obj-stack">
      <motion.div className="obj-abs" style={{ opacity: weak }}>
        <LinkedInCard lang={lang} variant="weak" />
      </motion.div>
      <motion.div style={{ opacity: strong }}>
        <LinkedInCard lang={lang} variant="strong" />
      </motion.div>
    </div>
  );
}

function MorphBrowser({ p, lang }: { p: MotionValue<number>; lang: Lang }) {
  const weak = useScrub(p, [0.46, 0.7], [1, 0]);
  const strong = useScrub(p, [0.5, 0.78], [0, 1]);
  return (
    <div className="obj-stack">
      <motion.div className="obj-abs" style={{ opacity: weak }}>
        <BrowserCard lang={lang} variant="weak" />
      </motion.div>
      <motion.div style={{ opacity: strong }}>
        <BrowserCard lang={lang} variant="strong" />
      </motion.div>
    </div>
  );
}

/* ════════════ SCENE 02 — CV REVIEW ════════════ */

const NOTE_POS = [
  { top: "13%", side: "start" },
  { top: "38%", side: "end" },
  { top: "62%", side: "start" },
  { top: "84%", side: "end" },
] as const;

function SceneReview({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const p = reduced ? done : scrollYProgress;
  useEffect(() => {
    trackEvent("service_card_view", { service: "cvReview" });
  }, []);

  const y = useTransform(p, [0, 1], ["3%", "-3%"]);

  return (
    <section id="cvReview" ref={ref} className={`sc2${reduced ? " unpinned" : ""}`}>
      <div className="pin">
        <div className="sc2-in">
          <div className="sc2-copy">
            <h2 className="big">{t.reviewH}</h2>
            <Cta
              id="cvReview"
              href={svc("cvReview").checkoutUrl}
              label={lang === "ar" ? "راجِع سيرتي" : "Review my CV"}
              price={svc("cvReview").price}
              t={t}
              lang={lang}
            />
          </div>
          <motion.div className="sc2-doc" style={{ y }}>
            <CVSheet lang={lang} variant="strong" />
            {t.reviewNotes.map(([k, v], i) => (
              <Annotation key={k} p={p} i={i} label={k} note={v} />
            ))}
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc2 { height: 230vh; }
        .sc2.unpinned { height: auto; }
        .sc2 .pin { position: sticky; top: 0; min-height: 100vh; display: flex; align-items: center; }
        .sc2.unpinned .pin { position: static; padding-block: 96px; }
        .sc2-in { width: min(1180px, calc(100% - 48px)); margin: 0 auto; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,0.86fr); gap: clamp(48px, 9vw, 130px); align-items: center; }
        .sc2-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 40px; }
        .sc2-doc { position: relative; width: min(360px, 78%); margin-inline: auto; }
        @media (max-width: 900px) {
          .sc2-in { grid-template-columns: 1fr; gap: 44px; }
          .sc2-copy { order: 2; align-items: center; text-align: center; }
          .sc2-doc { width: min(300px, 64%); }
        }
      `}</style>
    </section>
  );
}

function Annotation({ p, i, label, note }: { p: MotionValue<number>; i: number; label: string; note: string }) {
  const a = 0.16 + i * 0.15;
  const o = useScrub(p, [a, a + 0.1], [0, 1]);
  const w = useTransform(p, [a, a + 0.16], [0, 1]);
  const pos = NOTE_POS[i];
  return (
    <motion.div className={`ann ann-${pos.side}`} style={{ top: pos.top, opacity: o }}>
      <motion.span className="ann-line" style={{ scaleX: w }} />
      <span className="ann-txt">
        <b>{label}</b>
        <i>{note}</i>
      </span>
    </motion.div>
  );
}

/* ════════════ SCENE 03 — CV REWRITE (the crumpled one returns) ════════════ */

function SceneRewrite({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const p = reduced ? done : scrollYProgress;
  useEffect(() => {
    trackEvent("service_card_view", { service: "cvRewrite" });
  }, []);

  const crumple = useScrub(p, [0.08, 0.56], [1, 0]);
  const weak = useScrub(p, [0.34, 0.58], [1, 0]);
  const strong = useScrub(p, [0.4, 0.68], [0, 1]);
  const rx = useTransform(p, [0.06, 0.6], [11, 0]);
  const ry = useTransform(p, [0.06, 0.6], [-14, 0]);
  const rz = useTransform(p, [0.06, 0.72], [-9, 0]);
  const scale = useTransform(p, [0.06, 0.72, 1], [0.9, 1, 1.02]);

  const beforeO = useScrub(p, [0.1, 0.24, 0.46, 0.56], [0, 1, 1, 0.18]);
  const beforeLine = useTransform(p, [0.4, 0.56], [0, 1]);
  const afterO = useScrub(p, [0.56, 0.72], [0, 1]);
  const afterY = useTransform(p, [0.56, 0.76], [16, 0]);
  const ctaO = useScrub(p, [0.78, 0.9], [0, 1]);

  return (
    <section id="cvRewrite" ref={ref} className={`sc3${reduced ? " unpinned" : ""}`}>
      <div className="pin">
        <div className="sc3-in">
          <motion.div className="sc3-doc obj-3d" style={{ rotateX: rx, rotateY: ry, rotate: rz, scale }}>
            <motion.div className="obj-abs" style={{ opacity: weak }}>
              <CVSheet lang={lang} variant="weak" />
            </motion.div>
            <motion.div style={{ opacity: strong }}>
              <CVSheet lang={lang} variant="strong" />
            </motion.div>
            <motion.div className="obj-abs obj-crumple" style={{ opacity: crumple }}>
              <CrumpleOverlay />
            </motion.div>
          </motion.div>

          <div className="sc3-copy">
            <h2 className="big">{t.rewriteH}</h2>
            <div className="ba">
              <motion.p className="ba-before" style={{ opacity: beforeO }}>
                <span className="ba-k">{t.before}</span>
                <span className="ba-line-wrap">
                  {t.rewriteBefore}
                  <motion.span className="ba-strike" style={{ scaleX: beforeLine }} />
                </span>
              </motion.p>
              <motion.p className="ba-after" style={{ opacity: afterO, y: afterY }}>
                <span className="ba-k ba-k-on">{t.after}</span>
                {t.rewriteAfter}
              </motion.p>
            </div>
            <motion.span style={{ opacity: ctaO }}>
              <Cta
                id="cvRewrite"
                href={svc("cvRewrite").checkoutUrl}
                label={lang === "ar" ? "أعد كتابة سيرتي" : "Rewrite my CV"}
                price={svc("cvRewrite").price}
                t={t}
                lang={lang}
              />
            </motion.span>
          </div>
        </div>
      </div>
      <style>{`
        .sc3 { height: 260vh; }
        .sc3.unpinned { height: auto; }
        .sc3 .pin { position: sticky; top: 0; min-height: 100vh; display: flex; align-items: center; }
        .sc3.unpinned .pin { position: static; padding-block: 96px; }
        .sc3-in { width: min(1220px, calc(100% - 48px)); margin: 0 auto; display: grid; grid-template-columns: minmax(0,0.82fr) minmax(0,1fr); gap: clamp(48px, 8vw, 120px); align-items: center; }
        .sc3-doc { position: relative; width: min(380px, 82%); margin-inline: auto; }
        .sc3-copy { display: flex; flex-direction: column; align-items: flex-start; gap: clamp(30px, 4vw, 46px); }
        @media (max-width: 900px) {
          .sc3-in { grid-template-columns: 1fr; gap: 40px; }
          .sc3-doc { width: min(280px, 62%); }
          .sc3-copy { align-items: center; text-align: center; }
        }
      `}</style>
    </section>
  );
}

/* ════════════ SCENE 04 — LINKEDIN ════════════ */

function SceneLinkedIn({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const done = useMotionValue(0.5);
  const p = reduced ? done : scrollYProgress;
  useEffect(() => {
    trackEvent("service_card_view", { service: "linkedin" });
  }, []);

  const photoY = useTransform(p, [0, 1], reduced ? ["0%", "0%"] : ["-6%", "6%"]);
  const cardY = useTransform(p, [0, 1], reduced ? [0, 0] : [70, -70]);
  const weakO = useScrub(p, [0.34, 0.5], [1, 0]);
  const strongO = useScrub(p, [0.44, 0.6], [0, 1]);
  const strongX = useTransform(p, [0.44, 0.64], [18, 0]);

  return (
    <section id="linkedin" ref={ref} className="sc4">
      <div className="sc4-photo">
        <motion.div className="sc4-photo-in" style={{ y: photoY }}>
          <Image src="/1.jpg" alt="Turki Almalki" fill sizes="(max-width: 900px) 100vw, 52vw" className="sc4-img" priority={false} />
        </motion.div>
        <motion.div className="sc4-card" style={{ y: cardY }}>
          <LinkedInCard lang={lang} variant="strong" />
        </motion.div>
      </div>
      <div className="sc4-copy">
        <h2 className="big">{t.linkedinH}</h2>
        <div className="hl">
          <motion.span className="hl-weak" style={{ opacity: weakO }}>
            {t.linkedinBefore}
          </motion.span>
          <motion.span className="hl-strong" style={{ opacity: strongO, x: strongX }}>
            {t.linkedinAfter}
          </motion.span>
        </div>
        <Cta
          id="linkedin"
          href={svc("linkedin").checkoutUrl}
          label={lang === "ar" ? "طوّر ملفي" : "Elevate my profile"}
          price={svc("linkedin").price}
          t={t}
          lang={lang}
        />
      </div>
      <style>{`
        .sc4 { display: grid; grid-template-columns: 1.02fr 0.98fr; align-items: center; gap: clamp(40px, 6vw, 92px); padding: clamp(80px, 9vw, 130px) max(24px, calc((100vw - 1320px) / 2)); }
        .sc4-photo { position: relative; aspect-ratio: 4 / 5; max-height: 62vh; place-self: center; width: 100%; border-radius: 6px; overflow: visible; }
        .sc4-photo-in { position: absolute; inset: -8% 0; border-radius: 6px; overflow: hidden; background: #eae7e1; box-shadow: 0 40px 90px -30px rgba(20,22,30,0.4); }
        .sc4-img { object-fit: cover; object-position: 50% 16%; }
        .sc4-card { position: absolute; z-index: 3; bottom: 4%; inset-inline-end: -14%; width: 62%; }
        .sc4-copy { display: flex; flex-direction: column; align-items: flex-start; gap: clamp(30px, 3.6vw, 44px); }
        .hl { display: flex; flex-direction: column; gap: 10px; }
        .hl-weak { font-size: clamp(16px, 1.7vw, 21px); font-weight: 600; color: var(--text-muted, #9aa0aa); }
        .hl-strong { font-size: clamp(19px, 2.3vw, 30px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.3; color: var(--text-primary); }
        @media (max-width: 900px) {
          .sc4 { grid-template-columns: 1fr; padding-inline: 24px; }
          .sc4-photo { aspect-ratio: 3 / 4; margin-bottom: 56px; }
          .sc4-card { inset-inline-end: -4%; bottom: -10%; width: 66%; }
        }
      `}</style>
    </section>
  );
}

/* ════════════ SCENE 05 — PORTFOLIO ════════════ */

function ScenePortfolio({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(0);
  const p = reduced ? done : scrollYProgress;
  // The track is laid out LTR; in Arabic the reel is reversed and travels the
  // other way so the first project is the right-most one.
  const rtl = lang === "ar";
  const reel = rtl ? [...REEL].reverse() : REEL;
  const x = useTransform(p, [0.06, 0.94], rtl ? [-maxX, 0] : [0, -maxX]);

  useEffect(() => {
    trackEvent("service_card_view", { service: "portfolio" });
  }, []);
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const view = viewRef.current;
      if (!track || !view) return;
      setMaxX(Math.max(0, track.scrollWidth - view.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (viewRef.current) ro.observe(viewRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section id="portfolio" ref={ref} className={`sc5${reduced ? " unpinned" : ""}`}>
      <div className="pin">
        <div className="sc5-head">
          <h2 className="big">{t.portfolioH}</h2>
          <Cta
            id="portfolio"
            href={svc("portfolio").checkoutUrl}
            label={lang === "ar" ? "ابنِ موقعي" : "Build my presence"}
            price={svc("portfolio").price}
            t={t}
            lang={lang}
          />
        </div>
        <div ref={viewRef} className="sc5-view">
          <motion.div ref={trackRef} className="sc5-track" style={reduced ? undefined : { x }}>
            {reel.map((r, i) => (
              <ReelPanel
                key={r.img}
                p={p}
                order={rtl ? reel.length - 1 - i : i}
                n={reel.length}
                r={r}
                lang={lang}
                reduced={reduced}
              />
            ))}
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc5 { height: 300vh; }
        .sc5.unpinned { height: auto; }
        .sc5 .pin { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; justify-content: center; gap: clamp(32px, 4vw, 56px); overflow: hidden; }
        .sc5.unpinned .pin { position: static; height: auto; padding-block: 96px; }
        .sc5-head { width: min(1240px, calc(100% - 48px)); margin: 0 auto; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 28px; }
        .sc5-view { width: 100%; overflow: ${reduced ? "auto" : "hidden"}; direction: ltr; scrollbar-width: none; }
        .sc5-view::-webkit-scrollbar { display: none; }
        .sc5-track { display: flex; align-items: center; gap: clamp(20px, 2.4vw, 40px); width: max-content; padding-inline: max(24px, calc((100vw - 1240px) / 2)); }
        @media (max-width: 900px) { .sc5-head { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </section>
  );
}

function ReelPanel({
  p,
  order,
  n,
  r,
  lang,
  reduced,
}: {
  p: MotionValue<number>;
  /** position in the travel sequence, not in the DOM */
  order: number;
  n: number;
  r: (typeof REEL)[number];
  lang: Lang;
  reduced: boolean;
}) {
  const step = 0.88 / (n - 1);
  const c = 0.06 + order * step;
  // Keep the window inside [0,1] — the first and last panel would otherwise
  // ask for offsets outside the scroll range.
  const win = [Math.max(0, c - step), Math.max(0.001, c - step * 0.3), c + step * 0.3, Math.min(1, c + step)];
  const scale = useTransform(p, win, reduced ? [1, 1, 1, 1] : [0.86, 1, 1, 0.86]);
  const o = useScrub(p, win, reduced ? [1, 1, 1, 1] : [0.38, 1, 1, 0.38]);
  return (
    <motion.figure className="panel" style={{ scale, opacity: o }}>
      <Image src={r.img} alt={r.name[lang]} fill sizes="(max-width: 900px) 84vw, 46vw" className="panel-img" />
      <figcaption className="panel-cap">
        <b>{r.name[lang]}</b>
        <i>{r.cat[lang]}</i>
      </figcaption>
    </motion.figure>
  );
}

/* ════════════ SCENE 06 — ONE PROFESSIONAL IDENTITY ════════════ */

function SceneIdentity({
  t,
  lang,
  mobile,
  reduced,
}: {
  t: Copy;
  lang: Lang;
  mobile: boolean;
  reduced: boolean;
}) {
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef);
  const { scrollYProgress } = useScroll({ target: secRef, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const p = reduced ? done : scrollYProgress;
  const D = lang === "ar" ? -1 : 1;
  const pkg = CAREER_UPGRADE;
  useEffect(() => {
    trackEvent("career_upgrade_view");
  }, []);

  const objects = useMemo<Obj[]>(() => {
    const mx = (v: number) => v * D;
    const lock = mobile
      ? [
          { x: -0.2, y: -0.19, s: 0.44, w: 0.46 },
          { x: 0.16, y: -0.15, s: 0.42, w: 0.5 },
          { x: -0.17, y: 0.01, s: 0.4, w: 0.52 },
          { x: 0.19, y: 0.04, s: 0.38, w: 0.5 },
        ]
      : [
          { x: -0.235, y: -0.035, s: 0.68, w: 0.16 },
          { x: -0.055, y: -0.01, s: 0.74, w: 0.15 },
          { x: 0.115, y: -0.035, s: 0.68, w: 0.16 },
          { x: 0.275, y: 0.005, s: 0.62, w: 0.2 },
        ];
    return [
      {
        id: "photo",
        w: lock[0].w,
        z: 24,
        from: { x: mx(-0.44), y: -0.22, r: -13, s: 1 },
        to: { x: mx(lock[0].x), y: lock[0].y, r: 0, s: lock[0].s },
        node: <PhotoCard alt="Turki Almalki" />,
      },
      {
        id: "cv",
        w: lock[1].w,
        z: 28,
        from: { x: mx(0.36), y: 0.28, r: 12, s: 1 },
        to: { x: mx(lock[1].x), y: lock[1].y, r: 0, s: lock[1].s },
        delay: 0.05,
        node: <CVSheet lang={lang} variant="strong" />,
      },
      {
        id: "li",
        w: lock[2].w,
        z: 22,
        from: { x: mx(0.42), y: -0.3, r: 9, s: 1 },
        to: { x: mx(lock[2].x), y: lock[2].y, r: 0, s: lock[2].s },
        delay: 0.1,
        node: <LinkedInCard lang={lang} variant="strong" />,
      },
      {
        id: "web",
        w: lock[3].w,
        z: 20,
        from: { x: mx(-0.4), y: 0.32, r: -10, s: 1 },
        to: { x: mx(lock[3].x), y: lock[3].y, r: 0, s: lock[3].s },
        delay: 0.15,
        node: <BrowserCard lang={lang} variant="strong" />,
      },
    ];
  }, [lang, mobile, D]);

  const footO = useScrub(p, [0.82, 0.95], [0, 1]);
  const footY = useTransform(p, [0.82, 0.95], [18, 0]);
  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-SA" : "en-US");

  return (
    <section id="careerUpgrade" ref={secRef} className={`sc6${reduced ? " unpinned" : ""}`}>
      <div className="pin">
        <div ref={stageRef} className="stage">
          {objects.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} />
          ))}
          <FieldText p={p} stage={stage} y={mobile ? -0.35 : -0.3} range={[0.28, 0.46, 0.98, 1]} className="ft-mid">
            <h2 className="mega mega-2">{t.identityH}</h2>
            <p className="mega-sub">{t.identitySub}</p>
          </FieldText>

          <motion.div className="up-foot" style={{ opacity: footO, y: footY }}>
            <span className="up-name">{t.upgradeName}</span>
            <span className="up-price">
              <b>
                {fmt(pkg.packagePrice)} {t.sar}
              </b>
              <s>{fmt(pkg.individualValue)}</s>
              <em>
                {t.save} {fmt(pkg.savings)}
              </em>
            </span>
            <a
              className="lemonsqueezy-button cta cta-big"
              href={pkg.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("career_upgrade_click", { service: "careerUpgrade" });
                trackEvent("checkout_started", { service: "careerUpgrade" });
              }}
            >
              {lang === "ar" ? "طوّر حضورك المهني" : "Upgrade my career presence"}
              <LuArrowUpRight size={16} className="cta-i" />
            </a>
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc6 { height: 280vh; }
        .sc6.unpinned { height: auto; }
        .sc6 .pin { position: sticky; top: 0; height: 100vh; }
        .sc6.unpinned .pin { position: static; height: 100vh; }
      `}</style>
    </section>
  );
}

/* ════════════ CLOSING WORD ════════════ */

function FinalWord({ t }: { t: Copy }) {
  return (
    <section className="fin">
      <h2 className="mega mega-2">{t.finalH}</h2>
      <p className="mega-sub">{t.finalSub}</p>
      <div className="fin-a">
        <button
          className="cta"
          onClick={() => document.getElementById("cvReview")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {t.labels[0]} <LuArrowRight size={15} className="cta-i" />
        </button>
        <Link href="/contact" className="fin-ghost" onClick={() => trackEvent("consultation_click", { location: "final_cta" })}>
          {t.talk}
        </Link>
      </div>
      <style>{`
        .fin { width: min(880px, calc(100% - 48px)); margin: 0 auto; padding-block: clamp(100px, 14vw, 190px); text-align: center; }
        .fin-a { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 26px; margin-top: 40px; }
        .fin-ghost { color: var(--text-secondary); font-size: 14.5px; font-weight: 500; text-decoration: underline; text-underline-offset: 4px; }
        .fin-ghost:hover { color: var(--text-primary); }
      `}</style>
    </section>
  );
}

/* ════════════════════════ shared page styles ════════════════════════ */

function PageStyles() {
  return (
    <style>{`
      .sv { background: #FBFBF9; color: #0d0e12; overflow-x: clip; }
      [data-theme="dark"] .sv { background: #0d0e12; color: #f0f0ef; }

      /* stage & scattered objects */
      .stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
      .fo { position: absolute; left: 50%; top: 50%; translate: -50% -50%; will-change: transform, opacity; }
      .ft { width: min(1100px, 88vw); text-align: center; pointer-events: none; }
      .ft-mid::before {
        content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
        width: 112%; height: 210%; z-index: -1; border-radius: 50%;
        background: radial-gradient(closest-side, rgba(251,251,249,0.86) 0%, rgba(251,251,249,0.52) 58%, rgba(251,251,249,0) 100%);
      }
      [data-theme="dark"] .ft-mid::before {
        background: radial-gradient(closest-side, rgba(13,14,18,0.86) 0%, rgba(13,14,18,0.52) 58%, rgba(13,14,18,0) 100%);
      }

      /* Every slot an object can occupy is a size container, so the objects'
         own cqw-based typography scales to the slot, not to the viewport. */
      .fo, .obj-abs, .obj-stack, .obj-cv, .sc2-doc, .sc3-doc, .sc4-card, .srow figure { container-type: inline-size; }
      .obj-stack, .obj-cv { position: relative; width: 100%; }
      .obj-abs { position: absolute; inset: 0; }
      .obj-3d { transform-style: preserve-3d; perspective: 1200px; }
      .obj-crumple { pointer-events: none; }

      /* typography */
      .mega { margin: 0; font-size: clamp(38px, 7.6vw, 116px); font-weight: 900; letter-spacing: -0.045em; line-height: 0.95; white-space: pre-line; }
      .mega-2 { font-size: clamp(32px, 5.6vw, 86px); letter-spacing: -0.04em; line-height: 1.0; }
      .mega-sub { max-width: 34ch; margin: clamp(18px, 2vw, 28px) auto 0; font-size: clamp(14px, 1.25vw, 18px); line-height: 1.55; color: var(--text-secondary); }
      .big { margin: 0; font-size: clamp(30px, 4.2vw, 62px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.03; white-space: pre-line; }

      /* the four names under the assembled row */
      .labels { position: absolute; inset: 0; z-index: 36; pointer-events: none; }
      .label { position: absolute; left: 50%; top: 50%; font-size: 11.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); white-space: nowrap; }
      .srow .label { position: static; transform: none; }

      .hint { position: absolute; bottom: 26px; inset-inline-start: 28px; z-index: 38; font-size: 10.5px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--text-muted, #a0a0a0); }

      /* CTAs */
      .ctaw { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 10px; }
      .cta { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--text-primary); color: var(--bg-primary); font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; text-decoration: none; transition: transform 260ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease; }
      .cta:hover { transform: translateY(-2px); opacity: 0.9; }
      .cta-big { min-height: 58px; padding: 16px 34px; font-size: 16px; }
      @media (max-width: 480px) { .cta { padding: 14px 22px; font-size: 14px; } .cta-big { padding: 15px 24px; font-size: 15px; } }
      .cta-i { flex-shrink: 0; }
      [dir="rtl"] .cta-i { transform: scaleX(-1); }
      .cta-p { font-size: 12.5px; color: var(--text-muted, #8b8b8b); }
      .ctaw-big .cta-p { font-size: 14px; }

      /* editorial annotations (scene 02) */
      .ann { position: absolute; display: flex; align-items: center; gap: 12px; }
      .ann-start { inset-inline-end: 100%; flex-direction: row-reverse; }
      .ann-end { inset-inline-start: 100%; }
      .ann-line { height: 1px; width: clamp(30px, 6vw, 80px); background: var(--text-muted, #b9b9b5); flex: 0 0 auto; transform-origin: left center; }
      .ann-start .ann-line { width: clamp(24px, 5vw, 64px); transform-origin: right center; }
      .ann-txt { display: flex; flex-direction: column; gap: 3px; white-space: nowrap; }
      .ann-txt b { font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-primary); }
      .ann-txt i { font-size: 12.5px; font-style: italic; color: var(--text-secondary); }
      @media (max-width: 900px) { .ann-txt i { display: none; } .ann-line, .ann-start .ann-line { width: 22px; } .ann-txt b { font-size: 10px; } }

      /* before → after (scene 03) */
      .ba { display: flex; flex-direction: column; gap: clamp(18px, 2.4vw, 30px); }
      .ba-before, .ba-after { margin: 0; font-size: clamp(19px, 2.5vw, 34px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.3; }
      .ba-before { color: var(--text-muted, #a5a5a0); }
      .ba-line-wrap { position: relative; display: inline; }
      .ba-strike { position: absolute; left: 0; right: 0; top: 52%; height: 2px; background: currentColor; opacity: 0.6; transform-origin: left center; }
      .ba-after { color: var(--text-primary); }
      .ba-k { display: block; margin-bottom: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted, #a5a5a0); }
      .ba-k-on { color: var(--accent, #1495ff); }

      /* portfolio reel (scene 05) */
      .panel { position: relative; flex: 0 0 auto; margin: 0; width: clamp(300px, 47vw, 700px); aspect-ratio: 16 / 10; border-radius: 22px; overflow: hidden; background: #efefec; box-shadow: 0 40px 90px -30px rgba(20,22,30,0.42); will-change: transform, opacity; }
      .panel-img { object-fit: cover; }
      .panel-cap { position: absolute; bottom: 18px; inset-inline-start: 18px; display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border-radius: 14px; background: rgba(10,12,18,0.58); backdrop-filter: blur(8px); color: #fff; }
      .panel-cap b { font-size: 15px; font-weight: 700; }
      .panel-cap i { font-size: 11.5px; font-style: normal; opacity: 0.76; }
      @media (max-width: 900px) { .panel { width: 82vw; } }

      /* career upgrade footer (scene 06) */
      .up-foot { position: absolute; z-index: 44; inset-inline: 0; margin-inline: auto; width: min(560px, calc(100% - 40px)); bottom: clamp(104px, 13vh, 150px); display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
      .up-name { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .up-price { display: inline-flex; align-items: baseline; gap: 12px; }
      .up-price b { font-size: clamp(26px, 3.2vw, 40px); font-weight: 900; letter-spacing: -0.03em; }
      .up-price s { font-size: 14px; color: var(--text-muted, #8b8b8b); }
      .up-price em { font-size: 13px; font-style: normal; font-weight: 700; color: var(--accent, #1495ff); }

      @media (max-width: 820px) {
        .mega { font-size: clamp(34px, 10.5vw, 60px); letter-spacing: -0.04em; }
        .mega-2 { font-size: clamp(28px, 8.6vw, 52px); }
        .ctaw { align-items: center; }
      }

      @media (prefers-reduced-motion: reduce) {
        .fo, .panel { will-change: auto; }
      }
    `}</style>
  );
}
