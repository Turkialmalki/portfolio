"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import {
  DashboardCard,
  DataSheet,
  WindowCard,
  WorkObjectStyles,
  DASHBOARD_URL,
} from "./WorkObjects";
import { RestoringPaper } from "./PaperPhysics";
import { PriceRail } from "./PriceRail";
import { useScrub } from "./scrub";
import { CAREER_SERVICES, COMPLETE_BUNDLE, formatPrice } from "@/data/careerServices";
import type { Price } from "@/config/careerServices";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   /services — ONE SCROLL-DRIVEN FILM

   CHAOS → the crumpled CV physically restores itself → 01 RESUME REVIEW →
   02 RESUME WRITING → 03 PUBLIC SPEAKING → 04 LINKEDIN → 05 MVP / PORTFOLIO →
   06 REPORT & DASHBOARD → THE COMPLETE PACKAGE.

   Two rules hold the whole page together:

   1. Objects hand off. Nothing is introduced and dropped — the sheet that is
      wrecked in the opening is the sheet that gets reviewed, the sheet that
      gets rewritten, and one of the objects that locks into the final
      composition. The same is true of the profile, the products and the
      dashboard.
   2. Everything is scrubbed to scroll position. There are no entrance
      animations and no timers; scrolling back plays the film backwards.
   ═══════════════════════════════════════════════════════════════════════ */

const EASE = cubicBezier(0.62, 0.02, 0.22, 1);
const svc = (id: string) => CAREER_SERVICES.find((s) => s.id === id)!;

const COPY = {
  ar: {
    chaosH: "خبرتك تستحق\nظهورًا أفضل.",
    chaosSub: "كل شيء عن مسيرتك موجود. لا شيء منه يعمل معًا.",
    reviewNotes: [
      ["ATS", "توافق ٣٨٪"],
      ["الوضوح", "ثلاث روايات مختلفة"],
      ["الأثر", "لا يوجد رقم واحد"],
      ["التموضع", "أي دور بالضبط؟"],
    ],
    before: "قبل",
    after: "بعد",
    rewriteBefore: "مسؤول عن إدارة فريق الجوال.",
    rewriteAfter: "قدت فريقًا من ٨ مهندسين وأطلقت منتجات يستخدمها الملايين.",
    speakKicker: "هيئة الأدب والنشر والترجمة · مسرعة الأعمال",
    linkedinBefore: "مهندس برمجيات",
    linkedinAfter: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية وتحول رقمي",
    findable: "أسهل في الظهور",
    memorable: "أصعب في النسيان",
    workKicker: "أعمال حقيقية · شُحنت بالفعل",
    dataRaw: "بيانات خام",
    dataOut: "قرار تنفيذي",
    dashLive: "افتح اللوحة الحقيقية",
    bundleSep: "بدلًا من",
    finalH: "من الفوضى\nإلى الوضوح.",
    finalSub: "اختر ما تحتاجه، وسأتولى الباقي.",
    talk: "تحدّث معي أولًا",
    from: "ابتداءً من",
    scrollHint: "مرّر",
    delivery: "التسليم",
  },
  en: {
    chaosH: "Your career\ndeserves better.",
    chaosSub: "Everything about your career is here. None of it is working together.",
    reviewNotes: [
      ["ATS", "38% compatible"],
      ["Clarity", "three different stories"],
      ["Impact", "not one number"],
      ["Positioning", "targeting which role?"],
    ],
    before: "Before",
    after: "After",
    rewriteBefore: "Responsible for managing the mobile team.",
    rewriteAfter: "Led an 8-engineer mobile team delivering products used by millions.",
    speakKicker: "Literature, Publishing & Translation Commission",
    linkedinBefore: "Software Engineer",
    linkedinAfter: "Engineering Leader | Product Builder | Fintech & Digital Transformation",
    findable: "Easier to find",
    memorable: "Harder to forget",
    workKicker: "Real work · already shipped",
    dataRaw: "Raw data",
    dataOut: "Executive decision",
    dashLive: "Open the live dashboard",
    bundleSep: "instead of",
    finalH: "Chaos,\nresolved.",
    finalSub: "Pick what you need. I'll take it from there.",
    talk: "Talk to me first",
    from: "From",
    scrollHint: "Scroll",
    delivery: "Delivery",
  },
};
type Copy = (typeof COPY)["en"];

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
  const mid = exits ? 0.08 : 0.14 + d;
  const end = exits ? 0.42 + d : 0.86;
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

/**
 * An invisible band inside a tall pinned section that tells the price rail
 * "this service owns the screen now". Decoupling the rail from section
 * boundaries means a 480vh scene can hand the rail over exactly when its
 * service is actually on screen.
 */
function RailMark({ id, top, height = "34%" }: { id: string; top: string; height?: string }) {
  return <span id={id} className="rmark" style={{ top, height }} aria-hidden />;
}

/** Chapter number + service name. The only label a section ever gets. */
function Chapter({ index, name }: { index: string; name: string }) {
  return (
    <span className="chap">
      <i>{index}</i>
      {name}
    </span>
  );
}

function Money({ price, lang, className = "" }: { price: Price; lang: Lang; className?: string }) {
  return <span className={`money ${className}`}>{formatPrice(price, lang)}</span>;
}

function Cta({
  id,
  href,
  label,
  price,
  lang,
  t,
  tone = "solid",
}: {
  id: string;
  href: string;
  label: string;
  price?: Price;
  lang: Lang;
  t: Copy;
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
          trackEvent(`${id}_click`, { service: id });
          trackEvent("checkout_started", { service: id });
        }}
      >
        {label}
        <LuArrowUpRight size={15} className="cta-i" />
      </a>
      {price && (
        <span className="cta-p">
          {t.from} <Money price={price} lang={lang} />
        </span>
      )}
    </span>
  );
}

/** Fires once when a section first reaches the viewport. */
function useSectionView(ref: React.RefObject<HTMLElement | null>, service: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackEvent("service_card_view", { service });
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, service]);
}

/**
 * A line of text that erases itself and is retyped as scroll advances —
 * the document being rewritten, character by character, rather than
 * cross-faded.
 */
function Retype({
  p,
  range,
  before,
  after,
}: {
  p: MotionValue<number>;
  range: [number, number];
  before: string;
  after: string;
}) {
  const [a, b] = range;
  const span = b - a;
  const del = useScrub(p, [a, a + span * 0.4], [before.length, 0]);
  const add = useScrub(p, [a + span * 0.48, b], [0, after.length]);
  // Derived straight from the two scrubbed counters. `useScrub` seeds them
  // from the current scroll position, so a reload part-way down the page
  // renders the right frame without an effect.
  const frame = useCallback(() => {
    const n = Math.round(add.get());
    const d = Math.round(del.get());
    return { txt: n > 0 ? after.slice(0, n) : before.slice(0, d), done: n >= after.length };
  }, [add, del, after, before]);

  const [{ txt, done }, setFrame] = useState(frame);
  const apply = useCallback(
    () =>
      setFrame((prev) => {
        const next = frame();
        return next.txt === prev.txt && next.done === prev.done ? prev : next;
      }),
    [frame],
  );
  useMotionValueEvent(del, "change", apply);
  useMotionValueEvent(add, "change", apply);

  return (
    <span className={`rt${done ? " rt-done" : ""}`}>
      {txt}
      <i className="rt-caret" aria-hidden />
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
      <WorkObjectStyles />
      <TopBar />
      <Navbar />
      <main className="sv">
        <SceneRestore t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <SceneRewrite t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <SceneSpeaking t={t} lang={lang} reduced={reduced} />
        <SceneLinkedIn t={t} lang={lang} reduced={reduced} />
        <SceneWork t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <SceneData t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <SceneBundle t={t} lang={lang} mobile={mobile} reduced={reduced} />
        <FinalWord t={t} lang={lang} />
      </main>
      <PriceRail lang={lang} hidden={reduced} />
      <Footer />
      <PageStyles />
    </>
  );
}

/* ════════════ ACT I — CHAOS · RESTORATION · 01 RESUME REVIEW ════════════

   One pinned scene and one piece of paper. The career noise blows out of
   frame while the crumpled CV travels to the middle of the screen and
   physically flattens itself; by the time it is pristine it has become the
   product shot for the review service. This is the page's signature moment,
   so it gets the most scroll distance of any scene.                       */

function SceneRestore({
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
  const settled = useMotionValue(1);
  const p = reduced ? settled : scrollYProgress;
  const D = lang === "ar" ? -1 : 1;
  const s = svc("resumeReview");
  useSectionView(secRef, "resumeReview");

  /* The noise — everything that should stop defining this career. All of it
     exits; none of it survives into the services. */
  const noise = useMemo<Obj[]>(() => {
    const mx = (v: number) => v * D;
    return mobile
      ? [
          { id: "weakcv", w: 0.44, z: 20, from: { x: mx(-0.28), y: -0.24, r: -9, s: 1 }, node: <CVSheet lang={lang} variant="weak" /> },
          { id: "li", w: 0.5, z: 18, from: { x: mx(0.27), y: 0.02, r: 8, s: 1 }, node: <LinkedInCard lang={lang} variant="weak" /> },
          { id: "email", w: 0.56, z: 12, from: { x: mx(-0.08), y: 0.42, r: 5, s: 1 }, node: <RejectionEmail lang={lang} /> },
          { id: "scrapA", w: 0.3, z: 8, from: { x: mx(0.42), y: -0.34, r: 21, s: 1, b: 2 }, node: <ScrapSheet tone={1} /> },
        ]
      : [
          { id: "weakcv", w: 0.165, z: 22, from: { x: mx(-0.325), y: -0.185, r: -11, s: 1 }, node: <CVSheet lang={lang} variant="weak" /> },
          { id: "li", w: 0.2, z: 20, from: { x: mx(-0.375), y: 0.29, r: -7, s: 1 }, node: <LinkedInCard lang={lang} variant="weak" /> },
          { id: "web", w: 0.28, z: 18, from: { x: mx(0.395), y: -0.29, r: 8, s: 1 }, node: <BrowserCard lang={lang} variant="weak" /> },
          { id: "email", w: 0.21, z: 14, from: { x: mx(0.02), y: -0.4, r: -5, s: 1 }, node: <RejectionEmail lang={lang} /> },
          { id: "ats", w: 0.145, z: 16, from: { x: mx(-0.2), y: 0.42, r: 6, s: 1 }, node: <ATSCard lang={lang} /> },
          { id: "search", w: 0.19, z: 13, from: { x: mx(0.28), y: 0.4, r: -9, s: 1 }, node: <RecruiterSearch lang={lang} /> },
          { id: "note", w: 0.075, z: 30, from: { x: mx(-0.215), y: -0.375, r: -14, s: 1 }, node: <StickyNote lang={lang} /> },
          { id: "scrapA", w: 0.13, z: 9, from: { x: mx(-0.47), y: -0.02, r: 23, s: 1, b: 2 }, node: <ScrapSheet tone={0} /> },
          { id: "scrapB", w: 0.115, z: 8, from: { x: mx(0.475), y: 0.12, r: -19, s: 1, b: 3.5 }, node: <ScrapSheet tone={2} /> },
          { id: "scrapC", w: 0.1, z: 34, from: { x: mx(0.31), y: 0.45, r: 12, s: 1, b: 1.5 }, node: <ScrapSheet tone={1} /> },
        ];
  }, [lang, mobile, D]);

  /* ── the hero sheet ──────────────────────────────────────────────────
     Travel and growth live here; the crumple physics live inside
     RestoringPaper. Together they read as one object.                    */
  const heroW = mobile ? 0.58 : 0.235;
  const restRange: [number, number] = [0.26, 0.84];

  // …drifts in from the right, centres itself, then steps aside for the copy.
  const heroX = useTransform(
    p,
    [0, 0.14, 0.42, 0.74, 0.9],
    [0.3 * D * stage.w, 0.27 * D * stage.w, 0, 0, (mobile ? 0 : 0.24 * D) * stage.w],
    { ease: EASE },
  );
  const heroY = useTransform(
    p,
    [0, 0.14, 0.42, 0.74, 0.9],
    [0.17 * stage.h, 0.15 * stage.h, 0.01 * stage.h, 0.01 * stage.h, (mobile ? -0.17 : 0) * stage.h],
    { ease: EASE },
  );
  const heroScale = useTransform(
    p,
    [0, 0.2, 0.5, 0.9],
    mobile ? [1, 1.05, 1.3, 1.12] : [1, 1.05, 1.34, 1.16],
    { ease: EASE },
  );

  const hintO = useScrub(p, [0, 0.05], [1, 0]);
  const marksO = useScrub(p, [0.06, 0.3], [0.9, 0]); // the red pen someone already took to it
  const copyO = useScrub(p, [0.8, 0.9], [0, 1]);
  const copyY = useTransform(p, [0.8, 0.94], [22, 0]);

  return (
    <section ref={secRef} className={`act1${reduced ? " unpinned" : ""}`}>
      <RailMark id="resumeReview" top="72%" height="28%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {noise.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} />
          ))}

          <motion.div
            className="fo hero-paper"
            style={{ x: heroX, y: heroY, scale: heroScale, width: heroW * stage.w, zIndex: 32 }}
          >
            <RestoringPaper
              p={p}
              range={restRange}
              simple={reduced || mobile}
              tilt={-12}
              /* The restoration repairs the PAPER, not the writing: the sheet
                 ends up flat, sharp and premium while still carrying the words
                 that are holding it back. That is what the review annotates —
                 and what scene 02 goes on to rewrite. */
              weak={
                <div className="hp-weak">
                  <CVSheet lang={lang} variant="weak" />
                  <motion.div className="hp-marks" style={{ opacity: marksO }}>
                    <ReviewMarks lang={lang} />
                  </motion.div>
                </div>
              }
              strong={<CVSheet lang={lang} variant="weak" />}
            >
              {/* professional review annotations, struck onto the restored sheet */}
              {t.reviewNotes.map(([k, v], i) => (
                <Annotation key={k} p={p} at={0.84 + i * 0.03} i={i} label={k} note={v} />
              ))}
            </RestoringPaper>
          </motion.div>

          <FieldText p={p} stage={stage} y={-0.02} range={[0, 0.02, 0.14, 0.24]} lit className="ft-mid">
            <h1 className="mega">{t.chaosH}</h1>
            <p className="mega-sub">{t.chaosSub}</p>
          </FieldText>

          <motion.div
            className={`svc-copy${mobile ? " svc-copy-low" : " svc-copy-start"}`}
            style={{ opacity: copyO, y: copyY }}
          >
            <Chapter index={s.index} name={s.name[lang]} />
            <h2 className="big">{s.headline[lang]}</h2>
            <p className="lede">{s.outcome[lang]}</p>
            <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
          </motion.div>

          {!reduced && (
            <motion.span className="hint" style={{ opacity: hintO }}>
              {t.scrollHint}
            </motion.span>
          )}
        </div>
      </div>

      <style>{`
        .act1 { position: relative; height: 480vh; }
        .act1.unpinned { height: auto; }
        .act1 .pin { position: sticky; top: 0; height: 100vh; }
        .act1.unpinned .pin { position: static; height: 100vh; }
        .hero-paper { transform-origin: center; }
        .hp-weak { position: relative; }
        .hp-marks { position: absolute; inset: 0; }
        @media (max-width: 820px) { .act1 { height: 420vh; } }
      `}</style>
    </section>
  );
}

/**
 * A reviewer's margin note, struck into the sheet's outer column with a
 * leader rule drawn back into the text it is about. Kept inside the page so
 * it can never collide with the copy, whatever the viewport.
 */
function Annotation({
  p,
  at,
  i,
  label,
  note,
}: {
  p: MotionValue<number>;
  at: number;
  i: number;
  label: string;
  note: string;
}) {
  const o = useScrub(p, [at, at + 0.05], [0, 1]);
  const w = useTransform(p, [at, at + 0.07], [0, 1]);
  const top = ["13%", "35%", "58%", "80%"][i];
  return (
    <motion.div className="ann" style={{ top, opacity: o }}>
      <motion.span className="ann-line" style={{ scaleX: w }} />
      <span className="ann-txt">
        <b>{label}</b>
        <i>{note}</i>
      </span>
    </motion.div>
  );
}

/* ════════════ 02 — RESUME WRITING (the same sheet, rewritten) ════════════ */

function SceneRewrite({
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const p = reduced ? done : scrollYProgress;
  const s = svc("resumeWriting");
  useSectionView(ref, "resumeWriting");

  // The sheet arrives from where Act I left it and settles.
  const docX = useTransform(p, [0, 0.3], [(lang === "ar" ? -1 : 1) * 60, 0]);
  const docRot = useTransform(p, [0, 0.34], [-3.5, 0]);
  const docScale = useTransform(p, [0, 0.34, 1], [0.94, 1, 1.02]);

  /* The rewrite itself: a line travels down the page, and everything it has
     passed is already the rewritten CV. The weak sheet is clipped away above
     it, so the page is genuinely being retyped rather than cross-faded. */
  const cut = useScrub(p, [0.14, 0.66], [2, 98]);
  const weakClip = useTransform(cut, (v) => `inset(${v.toFixed(2)}% 0 0 0)`);
  const sweepTop = useTransform(cut, (v) => `${v.toFixed(2)}%`);
  const sweepO = useScrub(p, [0.1, 0.16, 0.62, 0.7], [0, 1, 1, 0]);

  const beforeO = useScrub(p, [0.04, 0.16, 0.36, 0.46], [0, 1, 1, 0.22]);
  const strike = useTransform(p, [0.24, 0.36], [0, 1]);
  const afterO = useScrub(p, [0.34, 0.44], [0, 1]);
  const ctaO = useScrub(p, [0.74, 0.86], [0, 1]);

  return (
    <section ref={ref} className={`sc-rw${reduced ? " unpinned" : ""}`}>
      <RailMark id="resumeWriting" top="30%" height="50%" />
      <div className="pin">
        <div className="sc-rw-in">
          <motion.div className="sc-rw-doc" style={{ x: docX, rotate: docRot, scale: docScale }}>
            <div className="rw-stack">
              <CVSheet lang={lang} variant="strong" />
              <motion.div className="rw-abs" style={{ clipPath: weakClip }}>
                <CVSheet lang={lang} variant="weak" />
              </motion.div>
              <motion.span className="rw-sweep" style={{ top: sweepTop, opacity: sweepO }} />
            </div>
          </motion.div>

          <div className="svc-copy">
            <Chapter index={s.index} name={s.name[lang]} />
            <h2 className="big">{s.headline[lang]}</h2>

            <div className="ba">
              <motion.p className="ba-before" style={{ opacity: beforeO }}>
                <span className="ba-k">{t.before}</span>
                <span className="ba-line-wrap">
                  {t.rewriteBefore}
                  <motion.span className="ba-strike" style={{ scaleX: strike }} />
                </span>
              </motion.p>
              <motion.p className="ba-after" style={{ opacity: afterO }}>
                <span className="ba-k ba-k-on">{t.after}</span>
                {reduced ? (
                  t.rewriteAfter
                ) : (
                  <Retype p={p} range={[0.3, 0.66]} before={t.rewriteBefore} after={t.rewriteAfter} />
                )}
              </motion.p>
            </div>

            <motion.span style={{ opacity: ctaO }}>
              <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
            </motion.span>
          </div>
        </div>
      </div>
      <style>{`
        .sc-rw { position: relative; height: 300vh; }
        .sc-rw.unpinned { height: auto; }
        .sc-rw .pin { position: sticky; top: 0; min-height: 100vh; display: flex; align-items: center; }
        .sc-rw.unpinned .pin { position: static; padding-block: 96px; }
        .sc-rw-in { width: min(1220px, calc(100% - 48px)); margin: 0 auto; display: grid; grid-template-columns: minmax(0,0.8fr) minmax(0,1fr); gap: clamp(44px, 8vw, 116px); align-items: center; }
        .sc-rw-doc { width: min(370px, 84%); margin-inline: auto; }
        .rw-stack { position: relative; container-type: inline-size; }
        .rw-abs { position: absolute; inset: 0; container-type: inline-size; }
        .rw-sweep { position: absolute; z-index: 4; inset-inline: -2%; height: 2px; translate: 0 -1px; background: linear-gradient(90deg, rgba(20,149,255,0) 0%, rgba(20,149,255,0.85) 18%, rgba(20,149,255,0.85) 82%, rgba(20,149,255,0) 100%); box-shadow: 0 0 18px rgba(20,149,255,0.55); }
        @media (max-width: 900px) {
          .sc-rw { height: ${mobile ? 260 : 300}vh; }
          .sc-rw-in { grid-template-columns: 1fr; gap: 36px; }
          .sc-rw-doc { width: min(260px, 58%); }
          .sc-rw .svc-copy { align-items: center; text-align: center; }
        }
      `}</style>
    </section>
  );
}

/* ════════════ 03 — PUBLIC SPEAKING (real photography) ════════════ */

function SceneSpeaking({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const mid = useMotionValue(0.55);
  const p = reduced ? mid : scrollYProgress;
  const s = svc("publicSpeaking");
  useSectionView(ref, "publicSpeaking");

  // A slow cinematic push-in and drift across the whole scene.
  const scale = useTransform(p, [0, 1], reduced ? [1, 1] : [1.18, 1.02]);
  const shotY = useTransform(p, [0, 1], reduced ? ["0%", "0%"] : ["-3.5%", "3.5%"]);
  const scrim = useScrub(p, [0, 0.35, 1], [0.45, 0.82, 0.9]);
  const titleY = useTransform(p, [0, 1], reduced ? [0, 0] : [70, -70]);
  const titleO = useScrub(p, [0.06, 0.26, 0.94, 1], [0, 1, 1, 0.6]);
  const insetO = useScrub(p, [0.34, 0.5], [0, 1]);
  const insetX = useTransform(p, [0.34, 0.62], [50, 0]);
  const ctaO = useScrub(p, [0.5, 0.66], [0, 1]);

  return (
    <section ref={ref} className={`sc-sp${reduced ? " unpinned" : ""}`}>
      <RailMark id="publicSpeaking" top="20%" height="60%" />
      <div className="pin">
        <motion.div className="sp-shot" style={{ scale, y: shotY }}>
          <Image
            src="/speaking-stage.jpg"
            alt={
              lang === "ar"
                ? "تركي المالكي يقدّم على المسرح في هيئة الأدب والنشر والترجمة"
                : "Turki Almalki presenting on stage at the Literature, Publishing & Translation Commission"
            }
            fill
            sizes="100vw"
            className="sp-img"
          />
        </motion.div>
        <motion.div className="sp-scrim" style={{ opacity: scrim }} />

        <motion.div className="sp-inset" style={{ opacity: insetO, x: insetX }}>
          <PhotoCard
            src="/speaking-portrait.jpg"
            alt={lang === "ar" ? "تركي المالكي أثناء العرض" : "Turki Almalki presenting"}
          />
        </motion.div>

        <motion.div className="sp-copy" style={{ y: titleY, opacity: titleO }}>
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="mega mega-2 sp-h">{s.headline[lang]}</h2>
          <p className="sp-kicker">{t.speakKicker}</p>
          <motion.span style={{ opacity: ctaO }}>
            <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
          </motion.span>
        </motion.div>
      </div>
      <style>{`
        .sc-sp { position: relative; height: 260vh; background: #08090c; }
        .sc-sp.unpinned { height: auto; }
        .sc-sp .pin { position: sticky; top: 0; height: 100vh; overflow: hidden; }
        .sc-sp.unpinned .pin { position: static; height: 82vh; }
        .sp-shot { position: absolute; inset: -6%; }
        .sp-img { object-fit: cover; object-position: 46% 36%; }
        .sp-scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(6,7,10,0.97) 0%, rgba(6,7,10,0.86) 22%, rgba(6,7,10,0.4) 58%, rgba(6,7,10,0.14) 100%); }
        .sp-copy { position: absolute; z-index: 3; inset-inline-start: max(24px, calc((100vw - 1320px) / 2)); bottom: clamp(90px, 14vh, 150px); width: min(720px, calc(100% - 48px)); display: flex; flex-direction: column; align-items: flex-start; gap: 22px; color: #fff; }
        .sp-copy .chap, .sp-kicker { color: rgba(255,255,255,0.62); }
        .sp-h { color: #fff; text-shadow: 0 2px 40px rgba(0,0,0,0.4); }
        .sp-kicker { margin: -6px 0 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
        .sp-copy .cta { background: #fff; color: #0d0e12; }
        .sp-copy .cta-p { color: rgba(255,255,255,0.68); }
        .sp-inset .ph-img { object-position: 45% 42%; scale: 1.35; }
        .sp-inset { position: absolute; z-index: 3; inset-inline-end: clamp(24px, 5vw, 96px); bottom: clamp(90px, 16vh, 170px); width: clamp(150px, 17vw, 250px); }
        @media (max-width: 900px) {
          .sc-sp { height: 220vh; }
          .sp-inset { display: none; }
          .sp-copy { bottom: clamp(70px, 12vh, 110px); gap: 16px; }
        }
      `}</style>
    </section>
  );
}

/* ════════════ 04 — LINKEDIN (the same identity, positioned) ════════════ */

function SceneLinkedIn({ t, lang, reduced }: { t: Copy; lang: Lang; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(0.8);
  const p = reduced ? done : scrollYProgress;
  const s = svc("linkedinOptimization");
  useSectionView(ref, "linkedinOptimization");

  const cardY = useTransform(p, [0, 1], reduced ? [0, 0] : [70, -50]);
  const cardRot = useTransform(p, [0, 0.4], [4, 0]);
  const weakO = useScrub(p, [0.28, 0.46], [1, 0]);
  const strongScale = useTransform(p, [0.3, 0.55], [0.985, 1]);

  const hlWeakO = useScrub(p, [0.24, 0.4], [1, 0]);
  const hlStrongO = useScrub(p, [0.36, 0.52], [0, 1]);
  const hlStrongX = useTransform(p, [0.36, 0.58], [18, 0]);

  // Discoverability: the same recruiter search, run again.
  const srchO = useScrub(p, [0.34, 0.44], [0, 1]);
  // Sequential, never overlapping: two different orderings cross-faded on top
  // of each other just reads as broken text.
  const srchWeakO = useScrub(p, [0.52, 0.58], [1, 0]);
  const srchY = useTransform(p, [0.34, 1], [40, -30]);
  const ctaO = useScrub(p, [0.6, 0.74], [0, 1]);

  return (
    <section ref={ref} className={`sc-li${reduced ? " unpinned" : ""}`}>
      <RailMark id="linkedinOptimization" top="22%" height="56%" />
      <div className="pin">
        <div className="sc-li-in">
          <div className="lk-stage">
            <motion.div className="lk-card" style={{ y: cardY, rotate: cardRot, scale: strongScale }}>
              <LinkedInCard lang={lang} variant="strong" />
              <motion.div className="lk-card-over" style={{ opacity: weakO }}>
                <LinkedInCard lang={lang} variant="weak" />
              </motion.div>
            </motion.div>
            <motion.div className="lk-rank" style={{ opacity: srchO, y: srchY }}>
              <RecruiterSearch lang={lang} variant="strong" />
              <motion.div className="lk-rank-over" style={{ opacity: srchWeakO }}>
                <RecruiterSearch lang={lang} variant="weak" />
              </motion.div>
            </motion.div>
          </div>

          <div className="svc-copy">
            <Chapter index={s.index} name={s.name[lang]} />
            <h2 className="big">{s.headline[lang]}</h2>
            <div className="hl">
              <motion.span className="hl-weak" style={{ opacity: hlWeakO }}>
                {t.linkedinBefore}
              </motion.span>
              <motion.span className="hl-strong" style={{ opacity: hlStrongO, x: hlStrongX }}>
                {t.linkedinAfter}
              </motion.span>
            </div>
            <motion.span style={{ opacity: ctaO }}>
              <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
            </motion.span>
          </div>
        </div>
      </div>
      <style>{`
        .sc-li { position: relative; height: 280vh; }
        .sc-li.unpinned { height: auto; }
        .sc-li .pin { position: sticky; top: 0; min-height: 100vh; display: flex; align-items: center; }
        .sc-li.unpinned .pin { position: static; padding-block: 96px; }
        .sc-li-in { width: min(1240px, calc(100% - 48px)); margin: 0 auto; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(44px, 7vw, 110px); align-items: center; }
        .lk-stage { position: relative; aspect-ratio: 4 / 3.5; }
        .lk-card { position: absolute; inset-inline-start: 0; top: 2%; width: 74%; container-type: inline-size; }
        .lk-card-over { position: absolute; inset: 0; container-type: inline-size; }
        .lk-rank { position: absolute; inset-inline-end: 0; bottom: 6%; width: 56%; container-type: inline-size; z-index: 3; }
        .lk-rank-over { position: absolute; inset: 0; container-type: inline-size; }
        .hl { display: flex; flex-direction: column; gap: 10px; }
        .hl-weak { font-size: clamp(15px, 1.6vw, 20px); font-weight: 600; color: var(--text-muted, #9aa0aa); }
        .hl-strong { font-size: clamp(18px, 2.2vw, 29px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.3; }
        @media (max-width: 900px) {
          .sc-li { height: 240vh; }
          .sc-li-in { grid-template-columns: 1fr; gap: 40px; }
          .lk-stage { aspect-ratio: 4 / 3.6; }
          .sc-li .svc-copy { align-items: center; text-align: center; }
        }
      `}</style>
    </section>
  );
}

/* ════════════ 05 — MVP / PORTFOLIO (real products in space) ════════════

   Not a grid of six cards: six real products arriving as physical objects,
   one after another, at different depths — a browser window, then another
   sliding behind it, then a phone in front, and finally turkialmalki.com
   assembling at the front of the stack.                                   */

type Prod = {
  id: string;
  /** a real screenshot in a browser frame, or the portfolio itself */
  kind: "window" | "site";
  src?: string;
  url: string;
  alt: string;
  /** entry point and resting place, as fractions of the stage */
  from: Vec;
  to: Vec;
  z: number;
  w: number;
  /** the slice of scene progress over which it travels */
  at: [number, number];
  blur?: number;
};

function SceneWork({
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
  const s = svc("mvpPortfolio");
  useSectionView(secRef, "mvpPortfolio");

  const prods = useMemo<Prod[]>(() => {
    const mx = (v: number) => v * D;
    /* Depth first: the oldest work arrives furthest back and stays soft, the
       most recent comes forward, and turkialmalki.com lands in front of all
       of it. Everything is a real screenshot of shipped work. */
    const all: Prod[] = [
      {
        id: "alrajhi",
        kind: "window",
        src: "/alrajhi2026.png",
        url: "alrajhibank.com.sa",
        alt: lang === "ar" ? "مصرف الراجحي" : "Al Rajhi Bank",
        from: { x: mx(-0.66), y: -0.36, r: -13, s: 0.72, o: 0 },
        to: { x: mx(-0.3), y: -0.21, r: -7, s: 0.72 },
        z: 10,
        w: 0.3,
        at: [0.02, 0.3],
        blur: 2.6,
      },
      {
        id: "wijhut",
        kind: "window",
        src: "/wijhut2026.png",
        url: "wijhut.com",
        alt: lang === "ar" ? "وجهات" : "Wijhut",
        from: { x: mx(0.68), y: -0.34, r: 13, s: 0.72, o: 0 },
        to: { x: mx(0.3), y: -0.2, r: 7, s: 0.72 },
        z: 11,
        w: 0.3,
        at: [0.06, 0.34],
        blur: 2.6,
      },
      {
        id: "ithnain",
        kind: "window",
        src: "/ithnin2026.png",
        url: "ithnain.app",
        alt: lang === "ar" ? "اثنين" : "Ithnain",
        from: { x: mx(-0.66), y: 0.44, r: 11, s: 0.78, o: 0 },
        to: { x: mx(-0.335), y: 0.17, r: 5, s: 0.78 },
        z: 14,
        w: 0.28,
        at: [0.12, 0.42],
        blur: 1.3,
      },
      {
        id: "basebox",
        kind: "window",
        src: "/casdd.png",
        url: "basebox.io",
        alt: "BaseBox",
        from: { x: mx(0.68), y: 0.46, r: -11, s: 0.78, o: 0 },
        to: { x: mx(0.335), y: 0.18, r: -5, s: 0.78 },
        z: 15,
        w: 0.28,
        at: [0.16, 0.46],
        blur: 1.3,
      },
      {
        id: "emkan",
        kind: "window",
        src: "/emkan2026.png",
        url: "emkan.com.sa",
        alt: lang === "ar" ? "إمكان" : "Emkan",
        from: { x: mx(-0.58), y: 0.06, r: -8, s: 0.86, o: 0 },
        to: { x: mx(-0.215), y: 0.015, r: -3, s: 0.9 },
        z: 20,
        w: 0.26,
        at: [0.26, 0.54],
        blur: 0.5,
      },
      {
        id: "munaseb",
        kind: "window",
        src: "/munasib2026.png",
        url: "munaseb.com",
        alt: lang === "ar" ? "مناسب" : "Munaseb",
        from: { x: mx(0.6), y: 0.08, r: 8, s: 0.86, o: 0 },
        to: { x: mx(0.215), y: 0.025, r: 3, s: 0.9 },
        z: 21,
        w: 0.26,
        at: [0.3, 0.58],
        blur: 0.5,
      },
      {
        id: "site",
        kind: "site",
        url: "turkialmalki.com",
        alt: "turkialmalki.com",
        from: { x: 0, y: 0.66, r: 5, s: 0.7, o: 0 },
        to: { x: 0, y: -0.03, r: 0, s: 1 },
        z: 30,
        w: mobile ? 0.74 : 0.38,
        at: [0.44, 0.74],
      },
    ];
    // On a phone the stack has to thin out or it is just noise.
    return mobile
      ? all
          .filter((pr) => ["alrajhi", "wijhut", "emkan", "site"].includes(pr.id))
          .map((pr) => ({ ...pr, w: pr.w * 1.55 }))
      : all;
  }, [lang, mobile, D]);

  /* A rack focus at the end: the work settles back and softens so the offer
     can own the frame — nothing has to be moved out of the way. */
  const layerY = useTransform(p, [0.7, 0.86], [0, -0.19 * stage.h]);
  const layerScale = useTransform(p, [0.7, 0.86], [1, 0.86]);
  const layerO = useScrub(p, [0.72, 0.88], [1, 0.42]);
  const layerBlurPx = useScrub(p, [0.72, 0.88], [0, 3]);
  const layerBlur = useTransform(layerBlurPx, (v) => (v < 0.05 ? "none" : `blur(${v.toFixed(2)}px)`));

  const copyO = useScrub(p, [0.76, 0.88], [0, 1]);
  const copyY = useTransform(p, [0.76, 0.92], [22, 0]);
  const kickO = useScrub(p, [0.06, 0.18, 0.62, 0.72], [0, 1, 1, 0]);

  return (
    <section ref={secRef} className={`sc-wk${reduced ? " unpinned" : ""}`}>
      <RailMark id="mvpPortfolio" top="18%" height="62%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          <motion.div
            className="wk-layer"
            style={{ y: layerY, scale: layerScale, opacity: layerO, filter: layerBlur }}
          >
            {prods.map((pr) => (
              <ProductObject key={pr.id} p={p} pr={pr} stage={stage} lang={lang} />
            ))}
          </motion.div>

          <motion.span className="wk-kick" style={{ opacity: kickO }}>
            {t.workKicker}
          </motion.span>

          <motion.div className="wk-copy" style={{ opacity: copyO, y: copyY }}>
            <Chapter index={s.index} name={s.name[lang]} />
            <h2 className="big">{s.headline[lang]}</h2>
            <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc-wk { position: relative; height: 400vh; }
        .sc-wk.unpinned { height: auto; }
        .sc-wk .pin { position: sticky; top: 0; height: 100vh; }
        .sc-wk.unpinned .pin { position: static; height: 100vh; }
        .wk-layer { position: absolute; inset: 0; will-change: transform, opacity, filter; }
        .wk-kick { position: absolute; z-index: 40; top: clamp(78px, 12vh, 118px); inset-inline: 0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
        .wk-copy { position: absolute; z-index: 42; inset-inline: 0; margin-inline: auto; bottom: clamp(74px, 11vh, 122px); width: min(760px, calc(100% - 44px)); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; }
        .wk-copy::before { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 128%; height: 240%; z-index: -1; border-radius: 50%; background: radial-gradient(closest-side, rgba(251,251,249,0.94) 0%, rgba(251,251,249,0.6) 56%, rgba(251,251,249,0) 100%); }
        [data-theme="dark"] .wk-copy::before { background: radial-gradient(closest-side, rgba(13,14,18,0.94) 0%, rgba(13,14,18,0.6) 56%, rgba(13,14,18,0) 100%); }
        @media (max-width: 900px) { .sc-wk { height: 340vh; } }
      `}</style>
    </section>
  );
}

function ProductObject({
  p,
  pr,
  stage,
  lang,
}: {
  p: MotionValue<number>;
  pr: Prod;
  stage: { w: number; h: number };
  lang: Lang;
}) {
  const [a, b] = pr.at;
  const stops = [a, b];
  const x = useTransform(p, stops, [pr.from.x * stage.w, pr.to.x * stage.w], { ease: EASE });
  const y = useTransform(p, stops, [pr.from.y * stage.h, pr.to.y * stage.h], { ease: EASE });
  const rotate = useTransform(p, stops, [pr.from.r, pr.to.r], { ease: EASE });
  const scale = useTransform(p, stops, [pr.from.s, pr.to.s], { ease: EASE });
  const opacity = useScrub(p, [a, a + (b - a) * 0.35], [pr.from.o ?? 1, 1], EASE);
  const blur = useScrub(p, stops, [(pr.blur ?? 0) + 3, pr.blur ?? 0], EASE);
  const filter = useTransform(blur, (v) => (v < 0.05 ? "none" : `blur(${v.toFixed(2)}px)`));

  return (
    <motion.div
      className="fo"
      style={{ x, y, rotate, scale, opacity, filter, zIndex: pr.z, width: pr.w * stage.w }}
    >
      {pr.kind === "site" ? (
        <BrowserCard lang={lang} variant="strong" />
      ) : (
        <WindowCard src={pr.src!} alt={pr.alt} url={pr.url} />
      )}
    </motion.div>
  );
}

/* ════════════ 06 — REPORT & DASHBOARD (raw data → decisions) ════════════

   The raw table is real: the Saudi Film Commission's 20-company accelerator
   batch. The dashboard it collapses into is the one that was actually built
   from it, so the visitor can follow the link and check.                   */

function SceneData({
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
  const s = svc("dashboardReporting");
  useSectionView(secRef, "dashboardReporting");

  // Fragments of the raw table, drifting in from the edges and converging.
  const frags = useMemo(
    () =>
      (mobile
        ? [
            { x: -0.3, y: -0.28, r: -9, w: 0.62, z: 6, d: 0 },
            { x: 0.31, y: 0.24, r: 8, w: 0.6, z: 5, d: 0.05 },
          ]
        : [
            { x: -0.33, y: -0.24, r: -8, w: 0.3, z: 6, d: 0 },
            { x: 0.34, y: -0.2, r: 7, w: 0.28, z: 5, d: 0.04 },
            { x: -0.29, y: 0.26, r: 6, w: 0.26, z: 4, d: 0.08 },
            { x: 0.32, y: 0.28, r: -7, w: 0.29, z: 3, d: 0.12 },
          ]
      ).map((f, i) => ({ ...f, id: `frag${i}`, x: f.x * D })),
    [mobile, D],
  );

  // The dashboard itself: rises out of the convergence and assembles.
  /* The dashboard is the proof, so it never dims or blurs — it simply steps
     back and up, and the offer takes the space it vacates. */
  const dashO = useScrub(p, [0.3, 0.42], [0, 1]);
  const dashScale = useTransform(p, [0.3, 0.56, 0.82, 0.96], [0.86, 1, 1, 0.78]);
  const dashY = useTransform(p, [0.3, 0.56, 0.82, 0.96], [0.16 * stage.h, 0, 0, -0.17 * stage.h]);
  const kpi = useScrub(p, [0.44, 0.62], [0, 1]);
  const bars = useScrub(p, [0.56, 0.78], [0, 1]);
  const ring = useScrub(p, [0.62, 0.84], [0, 1]);

  const rawO = useScrub(p, [0, 0.1, 0.34, 0.44], [0, 1, 1, 0]);
  const outO = useScrub(p, [0.46, 0.6, 0.78, 0.86], [0, 1, 1, 0]);
  const copyO = useScrub(p, [0.84, 0.93], [0, 1]);
  const copyY = useTransform(p, [0.84, 0.96], [22, 0]);

  return (
    <section ref={secRef} className={`sc-db${reduced ? " unpinned" : ""}`}>
      <RailMark id="dashboardReporting" top="20%" height="60%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {frags.map((f) => (
            <DataFragment key={f.id} p={p} f={f} stage={stage} lang={lang} />
          ))}

          <motion.div
            className="db-hero"
            style={{
              opacity: dashO,
              scale: dashScale,
              y: dashY,              width: (mobile ? 0.92 : 0.66) * stage.w,
            }}
          >
            <motion.div
              className="db-vars"
              style={
                {
                  ["--kpi"]: kpi,
                  ["--bars"]: bars,
                  ["--ring"]: ring,
                } as never
              }
            >
              <DashboardCard lang={lang} />
            </motion.div>
          </motion.div>

          <motion.span className="db-tag db-tag-raw" style={{ opacity: rawO }}>
            {t.dataRaw}
          </motion.span>
          <motion.span className="db-tag db-tag-out" style={{ opacity: outO }}>
            {t.dataOut}
          </motion.span>

          <motion.div className="db-copy" style={{ opacity: copyO, y: copyY }}>
            <Chapter index={s.index} name={s.name[lang]} />
            <h2 className="big">{s.headline[lang]}</h2>
            <p className="lede">{s.outcome[lang]}</p>
            <div className="db-acts">
              <Cta id={s.id} href={s.checkoutUrl} label={s.cta[lang]} price={s.price} lang={lang} t={t} />
              <a
                className="ghost"
                href={DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("dashboard_proof_click", { service: "dashboardReporting" })}
              >
                {t.dashLive}
                <LuArrowUpRight size={14} className="cta-i" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc-db { position: relative; height: 380vh; }
        .sc-db.unpinned { height: auto; }
        .sc-db .pin { position: sticky; top: 0; height: 100vh; }
        .sc-db.unpinned .pin { position: static; height: 100vh; }
        .db-hero { position: absolute; z-index: 20; left: 50%; top: 50%; translate: -50% -50%; container-type: inline-size; }
        .db-vars { width: 100%; container-type: inline-size; }
        .db-tag { position: absolute; z-index: 30; inset-inline: 0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
        .db-tag-raw { top: clamp(80px, 13vh, 130px); }
        .db-tag-out { top: clamp(80px, 13vh, 130px); color: var(--accent, #1495ff); }
        .db-copy { position: absolute; z-index: 32; inset-inline: 0; margin-inline: auto; top: 58%; width: min(780px, calc(100% - 44px)); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; }
        .db-copy::before { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 132%; height: 260%; z-index: -1; border-radius: 50%; background: radial-gradient(closest-side, rgba(251,251,249,0.95) 0%, rgba(251,251,249,0.66) 54%, rgba(251,251,249,0) 100%); }
        [data-theme="dark"] .db-copy::before { background: radial-gradient(closest-side, rgba(13,14,18,0.95) 0%, rgba(13,14,18,0.66) 54%, rgba(13,14,18,0) 100%); }
        .db-acts { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 22px; }
        @media (max-width: 900px) { .sc-db { height: 330vh; } .db-copy { top: 54%; } }
      `}</style>
    </section>
  );
}

function DataFragment({
  p,
  f,
  stage,
  lang,
}: {
  p: MotionValue<number>;
  f: { id: string; x: number; y: number; r: number; w: number; z: number; d: number };
  stage: { w: number; h: number };
  lang: Lang;
}) {
  const a = 0.16 + f.d;
  const b = 0.46 + f.d;
  const x = useTransform(p, [0, a, b], [f.x * stage.w, f.x * 0.94 * stage.w, 0], { ease: EASE });
  const y = useTransform(p, [0, a, b], [f.y * stage.h, f.y * 0.94 * stage.h, 0], { ease: EASE });
  const rotate = useTransform(p, [0, a, b], [f.r, f.r * 0.9, 0], { ease: EASE });
  const scale = useTransform(p, [0, a, b], [1, 1.02, 0.46], { ease: EASE });
  const opacity = useScrub(p, [0, 0.06, a, b - 0.06], [0, 1, 1, 0], EASE);
  return (
    <motion.div
      className="fo"
      style={{ x, y, rotate, scale, opacity, zIndex: f.z, width: f.w * stage.w }}
    >
      <DataSheet lang={lang} />
    </motion.div>
  );
}

/* ════════════ THE COMPLETE PACKAGE — everything, together ════════════ */

function SceneBundle({
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
  const b = COMPLETE_BUNDLE;
  useSectionView(secRef, "completeBundle");

  /* Every object here has already appeared once: the restored CV, the
     positioned profile, the stage photograph, the shipped product, the phone
     and the dashboard. They arrive from the direction they left in. */
  const objects = useMemo<Obj[]>(() => {
    const mx = (v: number) => v * D;
    /* One object per service, in journey order: the restored and rewritten
       CV, the positioned profile, the stage, the shipped product, the
       dashboard. */
    const lock = mobile
      ? [
          { x: -0.25, y: -0.235, s: 0.4, w: 0.44 },
          { x: 0.2, y: -0.215, s: 0.36, w: 0.5 },
          { x: -0.26, y: -0.05, s: 0.38, w: 0.34 },
          { x: 0.19, y: -0.045, s: 0.34, w: 0.5 },
          { x: 0, y: 0.075, s: 0.46, w: 0.56 },
        ]
      : [
          { x: -0.315, y: -0.02, s: 0.66, w: 0.15 },
          { x: -0.155, y: -0.045, s: 0.66, w: 0.15 },
          { x: 0, y: -0.03, s: 0.62, w: 0.12 },
          { x: 0.165, y: -0.045, s: 0.62, w: 0.2 },
          { x: 0.335, y: -0.015, s: 0.62, w: 0.22 },
        ];
    const nodes: ReactNode[] = [
      <CVSheet key="cv" lang={lang} variant="strong" />,
      <LinkedInCard key="li" lang={lang} variant="strong" />,
      <PhotoCard key="ph" src="/speaking-portrait.jpg" alt={lang === "ar" ? "تركي المالكي" : "Turki Almalki"} />,
      <BrowserCard key="wb" lang={lang} variant="strong" />,
      <div key="db" className="bd-dash">
        <DashboardCard lang={lang} />
      </div>,
    ];
    const entry: Vec[] = [
      { x: mx(-0.62), y: -0.34, r: -14, s: 0.9 },
      { x: mx(-0.58), y: 0.42, r: 11, s: 0.9 },
      { x: mx(0.6), y: -0.4, r: 12, s: 0.9 },
      { x: mx(0.66), y: 0.34, r: -10, s: 0.9 },
      { x: 0, y: 0.66, r: 4, s: 0.9 },
    ];
    return nodes.map((node, i) => ({
      id: `bd${i}`,
      w: lock[i].w,
      z: 20 + i,
      from: entry[i],
      to: { x: mx(lock[i].x), y: lock[i].y, r: 0, s: lock[i].s },
      delay: i * 0.035,
      node,
    }));
  }, [lang, mobile, D]);

  const footO = useScrub(p, [0.78, 0.92], [0, 1]);
  const footY = useTransform(p, [0.78, 0.94], [20, 0]);

  return (
    <section ref={secRef} className={`sc-bd${reduced ? " unpinned" : ""}`}>
      <RailMark id="completeBundle" top="40%" height="58%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {objects.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} />
          ))}

          <FieldText p={p} stage={stage} y={mobile ? -0.4 : -0.34} range={mobile ? [0.3, 0.5, 0.7, 0.8] : [0.3, 0.5, 2, 2.1]} className="ft-mid">
            <h2 className="mega mega-2">{b.headline[lang]}</h2>
          </FieldText>

          <motion.div className="bd-foot" style={{ opacity: footO, y: footY }}>
            <span className="bd-name">{b.name[lang]}</span>
            <span className="bd-price">
              <Money price={b.price} lang={lang} className="money-xl" />
              <em>
                {t.bundleSep} <s><Money price={b.individualTotal} lang={lang} /></s>
              </em>
            </span>
            <a
              className="lemonsqueezy-button cta cta-big"
              href={b.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("completeBundle_click", { service: "completeBundle" });
                trackEvent("checkout_started", { service: "completeBundle" });
              }}
            >
              {b.cta[lang]}
              <LuArrowUpRight size={16} className="cta-i" />
            </a>
          </motion.div>
        </div>
      </div>
      <style>{`
        .sc-bd { position: relative; height: 320vh; }
        .sc-bd.unpinned { height: auto; }
        .sc-bd .pin { position: sticky; top: 0; height: 100vh; }
        .sc-bd.unpinned .pin { position: static; height: 100vh; }
        .bd-dash { width: 100%; container-type: inline-size; }
        .bd-foot { position: absolute; z-index: 44; inset-inline: 0; margin-inline: auto; width: min(600px, calc(100% - 40px)); bottom: clamp(104px, 15vh, 152px); display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        .bd-name { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
        .bd-price { display: inline-flex; align-items: baseline; flex-wrap: wrap; justify-content: center; gap: 12px; }
        .bd-price em { font-size: 12.5px; font-style: normal; color: var(--text-muted, #8b8b8b); }
        .bd-price s { text-decoration-thickness: 1px; }
        @media (max-width: 900px) { .sc-bd { height: 280vh; } .bd-foot { bottom: clamp(118px, 17vh, 156px); } }
      `}</style>
    </section>
  );
}

/* ════════════ CLOSING WORD ════════════ */

function FinalWord({ t, lang }: { t: Copy; lang: Lang }) {
  return (
    <section className="fin">
      <h2 className="mega mega-2">{t.finalH}</h2>
      <p className="mega-sub">{t.finalSub}</p>
      <div className="fin-a">
        <button
          className="cta"
          onClick={() => document.getElementById("resumeReview")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {CAREER_SERVICES[0].name[lang]} <LuArrowRight size={15} className="cta-i" />
        </button>
        <Link
          href="/contact"
          className="fin-ghost"
          onClick={() => trackEvent("consultation_click", { location: "final_cta" })}
        >
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

      /* the rail's hand-off bands — invisible, never interactive */
      .rmark { position: absolute; inset-inline: 0; pointer-events: none; visibility: hidden; }

      /* Every slot an object can occupy is a size container, so the objects'
         own cqw-based typography scales to the slot, not to the viewport. */
      .fo, .obj-abs, .obj-stack, .obj-cv, .sc-rw-doc, .srow figure { container-type: inline-size; }
      .obj-stack, .obj-cv { position: relative; width: 100%; }
      .obj-abs { position: absolute; inset: 0; }

      /* typography */
      .mega { margin: 0; font-size: clamp(38px, 7.6vw, 116px); font-weight: 900; letter-spacing: -0.045em; line-height: 0.95; white-space: pre-line; }
      .mega-2 { font-size: clamp(32px, 5.6vw, 86px); letter-spacing: -0.04em; line-height: 1.0; }
      .mega-sub { max-width: 34ch; margin: clamp(18px, 2vw, 28px) auto 0; font-size: clamp(14px, 1.25vw, 18px); line-height: 1.55; color: var(--text-secondary); }
      .big { margin: 0; font-size: clamp(28px, 3.9vw, 58px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.04; white-space: pre-line; }
      .lede { margin: 0; max-width: 42ch; font-size: clamp(14px, 1.15vw, 17px); line-height: 1.55; color: var(--text-secondary); }

      /* chapter mark */
      .chap { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .chap i { font-style: normal; padding-inline-end: 10px; border-inline-end: 1px solid currentColor; opacity: 0.5; }

      /* the copy block every service shares */
      .svc-copy { display: flex; flex-direction: column; align-items: flex-start; gap: clamp(18px, 2.2vw, 28px); }
      .svc-copy-start { position: absolute; z-index: 42; inset-inline-start: max(24px, calc((100vw - 1300px) / 2)); top: 50%; translate: 0 -50%; width: min(500px, 44vw); }
      .svc-copy-low { position: absolute; z-index: 42; inset-inline: 0; margin-inline: auto; bottom: clamp(52px, 8vh, 92px); width: min(560px, calc(100% - 40px)); align-items: center; text-align: center; }

      .hint { position: absolute; bottom: 26px; inset-inline-start: 28px; z-index: 38; font-size: 10.5px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--text-muted, #a0a0a0); }

      /* prices */
      .money { font-variant-numeric: tabular-nums; }
      .money-xl { font-size: clamp(28px, 3.4vw, 44px); font-weight: 900; letter-spacing: -0.035em; }

      /* CTAs */
      .ctaw { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 10px; }
      .cta { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--text-primary); color: var(--bg-primary); font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; text-decoration: none; transition: transform 260ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease; }
      .cta:hover { transform: translateY(-2px); opacity: 0.9; }
      .cta-big { min-height: 58px; padding: 16px 34px; font-size: 16px; }
      @media (max-width: 480px) { .cta { padding: 14px 22px; font-size: 14px; } .cta-big { padding: 15px 24px; font-size: 15px; } }
      .cta-i { flex-shrink: 0; }
      [dir="rtl"] .cta-i { transform: scaleX(-1); }
      .cta-p { font-size: 13px; color: var(--text-muted, #8b8b8b); }
      .ctaw-big .cta-p { font-size: 14px; }
      .ghost { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; color: var(--text-secondary); text-decoration: underline; text-underline-offset: 4px; }
      .ghost:hover { color: var(--text-primary); }

      /* reviewer's margin notes, printed into the sheet's outer column */
      .ann {
        position: absolute; z-index: 12; inset-inline-end: 4%;
        display: flex; align-items: center; gap: 5px; pointer-events: none;
      }
      .ann-line { flex: 0 0 auto; width: 15cqw; height: 1px; background: var(--accent, #1495ff); opacity: 0.5; transform-origin: right center; }
      [dir="rtl"] .ann-line { transform-origin: left center; }
      .ann-txt {
        display: flex; flex-direction: column; gap: 1px; text-align: end; white-space: nowrap;
        padding: 0.5cqw 1.2cqw; border-radius: 2px; background: rgba(252,251,248,0.88);
      }
      .ann-txt b { font-size: 2.9cqw; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent, #1495ff); }
      .ann-txt i { font-size: 2.7cqw; font-style: italic; color: #6f6c66; }
      @media (max-width: 900px) { .ann-txt i { display: none; } }

      /* before → after */
      .ba { display: flex; flex-direction: column; gap: clamp(16px, 2.2vw, 28px); }
      .ba-before, .ba-after { margin: 0; font-size: clamp(18px, 2.3vw, 31px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.32; }
      .ba-before { color: var(--text-muted, #a5a5a0); }
      .ba-line-wrap { position: relative; display: inline; }
      .ba-strike { position: absolute; left: 0; right: 0; top: 52%; height: 2px; background: currentColor; opacity: 0.6; transform-origin: left center; }
      .ba-after { color: var(--text-primary); min-height: 2.6em; }
      .ba-k { display: block; margin-bottom: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted, #a5a5a0); }
      .ba-k-on { color: var(--accent, #1495ff); }

      /* the retyped line */
      .rt-caret { display: inline-block; width: 2px; height: 0.95em; margin-inline-start: 3px; translate: 0 0.1em; background: var(--accent, #1495ff); }
      .rt-done .rt-caret { opacity: 0; }

      @media (max-width: 820px) {
        .mega { font-size: clamp(34px, 10.5vw, 60px); letter-spacing: -0.04em; }
        .mega-2 { font-size: clamp(28px, 8.6vw, 52px); }
        .ctaw { align-items: center; }
        .svc-copy { align-items: center; text-align: center; }
      }

      @media (prefers-reduced-motion: reduce) {
        .fo { will-change: auto; }
      }
    `}</style>
  );
}
