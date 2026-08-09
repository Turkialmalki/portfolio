"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  motion,
  cubicBezier,
  useTransform,
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
import { CrumpledSheet } from "./CrumpledSheet";
import { PriceRail } from "./PriceRail";
import ScrollHint from "./ScrollHint";
import TalkSection from "./TalkSection";
import ComingSoon from "./ComingSoon";
import { useScrub } from "./scrub";
import { useReveal, useSectionProgress } from "./scrollDriver";
import CheckoutButton, { CheckoutButtonStyles } from "@/components/CheckoutButton";
import CheckoutAnalytics from "@/components/CheckoutAnalytics";
import { CHECKOUT_ORIGINS, type Price } from "@/config/careerServices";
import {
  CAREER_SERVICES,
  COMPLETE_BUNDLE,
  formatPrice,
  type CareerService,
} from "@/data/careerServices";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   /services — ONE EXPERIENCE, TWO RENDERING TECHNIQUES

   CHAOS → the crumpled CV restores itself → 01 RESUME REVIEW → 02 RESUME
   WRITING → 03 PUBLIC SPEAKING → 04 LINKEDIN → 05 MVP / PORTFOLIO →
   06 REPORT & DASHBOARD → 07 THE COMPLETE PACKAGE.

   There is no phone build and no desktop build. There is ONE tree, with one
   service sequence, one set of scenes, one art direction, one set of assets
   and one copy deck. A phone and a laptop render the same components in the
   same order with the same words. What differs is not the experience — it is
   the machinery underneath it.

   ── THE SPLIT ───────────────────────────────────────────────────────────
   VISUAL EXPERIENCE is CSS, decided by a media query, so it is correct in the
   very first painted frame with no JavaScript involved:

     phone   the scenes flow. Each is a stage — the same composition, at the
             same proportions — followed by its copy. Section heights are
             natural (96–110vh), never forced to the viewport, and there is no
             scroll snapping to fight the finger.
     film    `@media (hover:hover) and (pointer:fine)` turns every scene into
             a tall pinned stage and lifts the copy into it. The cinema.

   RENDERING IMPLEMENTATION is JavaScript, and it is the ONLY thing `useMode`
   decides:

     film    every channel of every object is scrubbed to scroll position.
     phone   exactly ONE scene reads scroll — the crumple, because that is the
             signature and it is worth a thumb. Every other scene animates by
             having a class added once, by IntersectionObserver, after which
             CSS runs a sub-second entrance and the section is inert DOM for
             the rest of the session. Below the hero, no per-scroll-pixel
             computation exists at all.

   ── WHY THIS CANNOT CAUSE THE OLD REMOUNT ──────────────────────────────
   `useMode` never changes which components are rendered. Every element below
   exists in both modes, in the same position in the tree, under the same key,
   with the same hooks called in the same order. Switching modes swaps which
   *style values* are applied and which effects subscribe. Nothing unmounts,
   no asset is fetched twice, no animation resets, and the server HTML is the
   phone layout — which is also what a phone paints, so a phone's first frame
   is already its final layout.

   ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────
   No Lemon.js. No checkout overlay, iframe, readiness race, pending state or
   page freeze — every buy CTA is a server-rendered <a href> pointing at its
   own permanent /checkout/buy/ URL. No scroll snap. No smooth-scrolling
   library on touch. No animated filter, blur or backdrop-filter on the phone
   path, and no continuously running animation anywhere below the hero.
   ═══════════════════════════════════════════════════════════════════════ */

const EASE = cubicBezier(0.62, 0.02, 0.22, 1);
const svc = (id: string) => CAREER_SERVICES.find((s) => s.id === id)!;

/**
 * The one question that decides rendering technique.
 *
 * Pointer, not width: a laptop windowed to 700px still has a wheel and a
 * cursor and can still afford the film; a 1024px tablet has a thumb and
 * cannot. This string is duplicated verbatim in the stylesheet at the bottom
 * of this file — one decides the layout, the other decides the driver for
 * that layout, and they must not drift apart.
 */
const FILM_QUERY = "(hover: hover) and (pointer: fine)";

const subscribeFilm = (cb: () => void) => {
  const mq = window.matchMedia(FILM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * `film` on a pointer device, `phone` everywhere else — resolved on the very
 * first client render rather than inside an effect, so a desktop never paints
 * a frame of phone machinery and a phone never installs any film machinery.
 *
 * The server snapshot is `phone`: it is the cheaper tree to be wrong about
 * and the one whose first paint actually matters. The CSS is media-query
 * driven regardless, so the *layout* is never wrong on either device.
 */
function useMode(): "film" | "phone" {
  return useSyncExternalStore(
    subscribeFilm,
    () => (window.matchMedia(FILM_QUERY).matches ? "film" : "phone"),
    () => "phone" as const,
  );
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

/**
 * True from the first effect onward.
 *
 * The crumple's two renderers each name twenty-two or twelve image sources.
 * Mount the wrong one for a single frame and the browser has already begun
 * fetching a frame set the visitor will never see, in parallel with the one
 * they will. So the sheet waits one frame for a definite answer — the same
 * frame in which the stored language resolves, which also stops an English
 * visitor pulling the Arabic bake. At scroll 0 the ball is still off the edge
 * of the composition, so the visible cost is nothing.
 */
const NEVER = () => () => {};
function useMounted() {
  return useSyncExternalStore(NEVER, () => true, () => false);
}

const COPY = {
  ar: {
    chaosH: "خبرتك تستاهل\nظهور أوضح.",
    chaosSub: "كل شيء عن مسيرتك موجود، لكنه ما يشتغل مع بعض.",
    reviewNotes: [
      ["ATS", "التوافق 38%"],
      ["الوضوح", "ثلاث قصص مختلفة"],
      ["الأثر", "ولا رقم واحد"],
      ["التموضع", "أي وظيفة بالضبط؟"],
    ],
    before: "قبل",
    after: "بعد",
    /* The before line is duty-speak on purpose — it is the same sentence that
       sits in the weak CV sheet. The after line is then built clause by
       clause, and each clause carries the editorial reason it exists, so the
       visitor reads *why* the rewrite is stronger instead of being told. */
    rewriteBefore: "مسؤول عن إدارة الفريق التقني.",
    rewriteBeforeNote: "واجب وظيفي. بلا قيادة، بلا حجم، بلا أثر.",
    /* Two constraints on this line, both deliberate:
       · No team-size figure. Nothing on this site documents how many
         engineers reported to Turki, so the rewrite demo must not invent one
         — a career page that overstates in its own sample is self-defeating.
       · Western digits only, like every other figure in the Arabic build. */
    rewriteAfter: "قدت فريقًا هندسيًا، وأسهمت في إطلاق منتجات رقمية واسعة النطاق.",
    rewriteParts: [
      { t: "قدت", tag: "فعل قيادي أقوى" },
      { t: "فريقًا هندسيًا،", tag: "قيادة واضحة" },
      { t: "وأسهمت في إطلاق", tag: "مساهمة محددة" },
      { t: "منتجات رقمية واسعة النطاق.", tag: "أثر على المنتج" },
    ],
    speakKicker: "هيئة الأدب والنشر والترجمة · مسرعة الأعمال",
    linkedinBefore: "مهندس برمجيات",
    linkedinAfter: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية وتحول رقمي",
    workKicker: "أعمال حقيقية · منشورة فعلًا",
    dataRaw: "بيانات خام",
    dataOut: "قرار واضح",
    dashLive: "شوف اللوحة مباشرة",
    bundleSep: "بدل",
    finalH: "من الفوضى\nإلى الوضوح.",
    finalSub: "اختر اللي تحتاجه، وأنا أكمل الباقي.",
    from: "يبدأ من",
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
    rewriteBefore: "Responsible for managing the technical team.",
    rewriteBeforeNote: "A duty. No leadership, no scale, no impact.",
    // Kept in step with the Arabic: no invented team size (see the note there).
    rewriteAfter:
      "Led an engineering team and contributed to launching large-scale digital products.",
    rewriteParts: [
      { t: "Led", tag: "Stronger action verb" },
      { t: "an engineering team", tag: "Clear leadership" },
      { t: "and contributed to launching", tag: "Specific contribution" },
      { t: "large-scale digital products.", tag: "Product impact" },
    ],
    speakKicker: "Literature, Publishing & Translation Commission",
    linkedinBefore: "Software Engineer",
    linkedinAfter: "Engineering Leader | Product Builder | Fintech & Digital Transformation",
    workKicker: "Real work · already shipped",
    dataRaw: "Raw data",
    dataOut: "Executive decision",
    dashLive: "Open the live dashboard",
    bundleSep: "instead of",
    finalH: "Chaos,\nresolved.",
    finalSub: "Pick what you need. I'll take it from there.",
    from: "From",
  },
};
type Copy = (typeof COPY)["en"];

/* ═════════════════════════ shared primitives ═════════════════════════ */

type Vec = { x: number; y: number; r: number; s: number; o?: number; b?: number };
type Obj = {
  id: string;
  /** width as a fraction of the stage width */
  w: number;
  z: number;
  from: Vec;
  /** absent → the object leaves; bad career elements disappear */
  to?: Vec;
  /** film: staggers the travel. phone: staggers the entrance. */
  delay?: number;
  node: ReactNode;
};

/** A scene's rendering context, threaded down rather than re-derived per child. */
type Ctx = {
  t: Copy;
  lang: Lang;
  /** scroll-scrubbed rather than class-triggered */
  film: boolean;
  reduced: boolean;
  /** the narrow composition — fewer, larger objects. True on every phone. */
  tight: boolean;
};

function useStage(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, active]);
  return size;
}

/**
 * The phone placement of an object: percentages of the stage, plus its
 * entrance vector as custom properties for CSS to consume.
 *
 * `left`/`top` are percentages of the STAGE — a percentage `left` resolves
 * against the containing block — so the same from/to fractions that place an
 * object on a laptop place it here, and it is already in its final position
 * in the server HTML before any script runs.
 *
 * `--ex`/`--ey` are percentages of the OBJECT, which is what makes the
 * entrance size-independent and cheap. They are clamped hard: a phone
 * entrance is a nudge with intent, not a flight across the screen, and a
 * large translate on a large element is a large area to recomposite.
 */
function restStyle(o: Obj, t: Vec): CSSProperties {
  const nudge = (v: number) => Math.max(-34, Math.min(34, v * 90));
  return {
    left: `${50 + t.x * 100}%`,
    top: `${50 + t.y * 100}%`,
    width: `${o.w * 100}%`,
    zIndex: o.z,
    ["--ex" as string]: `${nudge(o.from.x - t.x).toFixed(1)}%`,
    ["--ey" as string]: `${nudge(o.from.y - t.y).toFixed(1)}%`,
    ["--es" as string]: (o.from.s / (t.s || 1)).toFixed(3),
    ["--er" as string]: `${(o.from.r - t.r).toFixed(1)}deg`,
    ["--ed" as string]: `${Math.round((o.delay ?? 0) * 1400)}ms`,
    // the object's resting scale and rotation, which CSS composes the
    // entrance on top of — so the composition survives the animation ending
    ["--os" as string]: (t.s || 1).toFixed(3),
    ["--or" as string]: `${t.r}deg`,
  };
}

/**
 * ONE OBJECT, TWO DRIVERS.
 *
 * The from/to vectors are the object's part in the scene and they are SHARED:
 * the same numbers place it on a laptop and on a phone. What changes is who
 * reads them.
 *
 *   film   every channel is a MotionValue scrubbed across the scene's
 *          progress. Scrolling back plays it backwards.
 *   phone  the object is placed at `to` by plain CSS, and the entrance is a
 *          one-shot CSS transition on the inner element released when the
 *          section's class lands — a translate, a scale and an opacity, for
 *          well under a second, and then never again.
 *
 * The element type, the class names and the children are identical in both,
 * and every hook is called in both, which is what makes flipping free.
 */
function FieldObject({
  p,
  o,
  stage,
  ctx,
  lite = false,
}: {
  p: MotionValue<number>;
  o: Obj;
  stage: { w: number; h: number };
  ctx: Ctx;
  /** drop the depth-of-field blur — a real paint pass for a decorative scrap */
  lite?: boolean;
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

  if (ctx.film) {
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
          ...(f.b && !lite ? { filter: `blur(${f.b}px)` } : null),
        }}
      >
        <div className="fo-e">{o.node}</div>
      </motion.div>
    );
  }

  return (
    <div className="fo" style={restStyle(o, t)}>
      <div className="fo-e">{o.node}</div>
    </div>
  );
}

/** A piece of text that lives inside the field and is scrubbed like an object. */
function FieldText({
  p,
  stage,
  ctx,
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
  ctx: Ctx;
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
      style={
        ctx.film
          ? { opacity, scale, zIndex: z, x: x * stage.w, y: y * stage.h }
          : { zIndex: z, left: `${50 + x * 100}%`, top: `${50 + y * 100}%` }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * An invisible band inside a tall pinned section that tells the price rail
 * "this service owns the screen now". Decoupling the rail from section
 * boundaries lets a 480vh scene hand the rail over exactly when its service
 * is actually on screen. It is also the anchor a `#service` link lands on.
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

/**
 * A service's action, decided by the service — not by the scene.
 *
 * A live service gets the buy link and its price. A coming-soon one gets the
 * badge and the contact link, and no branch in any scene could hand it a
 * checkout URL by mistake: the URL is read from the service here, and a
 * coming-soon service does not have one — by type, not by convention.
 */
function Cta({
  s,
  lang,
  t,
}: {
  s: CareerService;
  lang: Lang;
  t: Copy;
}) {
  if (s.status !== "live" || !s.checkoutUrl) {
    return <ComingSoon serviceId={s.id} label={s.cta[lang]} lang={lang} />;
  }
  return (
    <span className="ctaw">
      <CheckoutButton serviceId={s.id} href={s.checkoutUrl} label={s.cta[lang]} />
      {s.price && (
        <span className="cta-p">
          {t.from} <Money price={s.price} lang={lang} />
        </span>
      )}
    </span>
  );
}

/**
 * Everything a scene shares: its reveal class, its one analytics ping, and
 * its scroll progress — live only when the scene is actually scrubbed.
 *
 * `scrub` is what a scene declares about itself. The hero passes `true` on
 * every device: it is the signature and it is scroll-driven everywhere. Every
 * other scene passes `ctx.film`, so on a phone it installs no scroll
 * subscription at all and takes its movement from the reveal class instead.
 */
function useScene(
  ref: React.RefObject<HTMLElement | null>,
  service: string,
  scrub: boolean,
) {
  const seen = useRef(false);
  const ping = useCallback(() => {
    if (seen.current) return;
    seen.current = true;
    trackEvent("service_card_view", { service });
  }, [service]);
  useReveal(ref, ping);
  return useSectionProgress(ref, scrub);
}

/* ════════════════════════════ the page ════════════════════════════ */

export default function ServicesClient() {
  const { lang } = useLanguage();
  const mode = useMode();
  const film = mode === "film";
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const t = COPY[lang];
  const ctx: Ctx = useMemo(
    () => ({ t, lang, film: film && !reduced, reduced, tight: !film }),
    [t, lang, film, reduced],
  );

  useEffect(() => {
    trackEvent("services_page_view");
  }, []);

  return (
    <>
      {/* The only network hint the purchase path needs: the handshake with the
          store is done before the visitor taps, not during. */}
      {CHECKOUT_ORIGINS.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="" />
      ))}
      <CareerObjectStyles />
      <WorkObjectStyles />
      <TopBar />
      <Navbar />

      <main className={`sv${ctx.film ? " sv-film" : " sv-phone"}`}>
        <SceneRestore ctx={ctx} />
        <SceneRewrite ctx={ctx} />
        <SceneSpeaking ctx={ctx} />
        <SceneLinkedIn ctx={ctx} />
        <SceneWork ctx={ctx} />
        <SceneData ctx={ctx} />
        <SceneBundle ctx={ctx} />
        {/* Everyone the price list did not fit, caught before they leave. */}
        <TalkSection lang={lang} />
        <FinalWord t={t} lang={lang} />
      </main>

      {/* First-load guidance only. It removes itself on the first wheel, drag
          or 40px of scroll and does not come back. */}
      <ScrollHint lang={lang} variant={film ? "scroll" : "swipe"} />
      {/* Pointer devices only, and genuinely absent otherwise: a fixed readout
          that re-renders as you scroll is exactly the kind of permanent,
          low-value motion a phone should never be asked to carry. The price is
          printed in every scene's copy block instead. */}
      {film && !reduced && <PriceRail lang={lang} />}

      <Footer />
      <CheckoutButtonStyles />
      <PageStyles />
      {/* One delegated listener for every buy link on the page. It is not on
          the navigation path and cannot delay it. */}
      <CheckoutAnalytics />
    </>
  );
}

/* ════════════ ACT I — CHAOS · RESTORATION · 01 RESUME REVIEW ════════════

   One scene and one piece of paper. The career noise blows out of frame while
   the crumpled CV travels to the middle of the screen and physically flattens
   itself; by the time it is pristine it has become the product shot for the
   review service.

   THIS IS THE ONE SCENE THAT READS SCROLL ON EVERY DEVICE. It is the
   signature moment and it is worth a thumb. What changes on a phone is the
   renderer — twelve baked frames through one canvas instead of twenty-two
   composited layers — and the cut, which is tighter: the transformation is
   mapped across ~190vh so it completes in about a swipe and a half, with no
   stretch of the scene where a swipe produces nothing.                     */

function SceneRestore({ ctx }: { ctx: Ctx }) {
  const { t, lang, reduced, tight } = ctx;
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef, true);
  // scrubbed on every device — see the header above
  const p = useScene(secRef, "resumeReview", !reduced);
  const D = lang === "ar" ? -1 : 1;
  const s = svc("resumeReview");
  const ready = useMounted();
  /* The hero is scrubbed even on a phone, so its objects take the film driver
     regardless of mode — this is the one place the two deliberately differ. */
  const heroCtx: Ctx = useMemo(() => ({ ...ctx, film: !reduced }), [ctx, reduced]);
  const fx = (v: object) => (reduced ? undefined : v);

  /* The noise — everything that should stop defining this career. All of it
     exits; none of it survives into the services. */
  const noise = useMemo<Obj[]>(() => {
    const mx = (v: number) => v * D;
    return tight
      ? [
          /* Held back on purpose: on a 390px screen the crushed CV has to be
             the largest thing on the page, so the noise gives up size before
             the hero does. */
          { id: "weakcv", w: 0.36, z: 20, from: { x: mx(-0.33), y: -0.27, r: -9, s: 1 }, node: <CVSheet lang={lang} variant="weak" /> },
          { id: "li", w: 0.42, z: 18, from: { x: mx(0.33), y: 0.02, r: 8, s: 1 }, node: <LinkedInCard lang={lang} variant="weak" /> },
          { id: "email", w: 0.46, z: 12, from: { x: mx(-0.12), y: 0.44, r: 5, s: 1 }, node: <RejectionEmail lang={lang} /> },
          { id: "scrapA", w: 0.26, z: 8, from: { x: mx(0.44), y: -0.36, r: 21, s: 1, b: 2 }, node: <ScrapSheet tone={1} /> },
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
  }, [lang, tight, D]);

  /* ── the hero sheet ──────────────────────────────────────────────────
     Travel and growth live here; the crumple physics live inside
     CrumpledSheet and PaperPhysics. Together they read as one object.

     The baked crumple owns the first stretch — ball, opening, badly-flattened
     sheet — and hands the live sheet over already creased; PaperPhysics only
     ever represents the back half of the transformation, never its opening.

     ── the phone gets a tighter cut ──
     A wheel has 380vh of runway, so the story can breathe. A thumb does not:
     every swipe must visibly move the paper or the page reads as
     unresponsive, however smooth the frames are. The whole transformation is
     pulled forward — recognisably a CV by the middle of the scene, flat by
     80% of it, review in the last fifth — against a section that is itself
     ~40% shorter. Same five stages, same order.

        0–15%  crushed        15–35%  opening       35–55%  recognisable CV
       55–78%  flattening     78–86%  clean sheet   86–100% review begins   */
  const crumpleRange: [number, number] = [0, tight ? 0.5 : 0.56];
  const handoff: [number, number] = tight ? [0.44, 0.5] : [0.48, 0.56];
  const restRange: [number, number] = tight ? [0.46, 0.8] : [0.5, 0.85];
  const annAt = tight ? 0.845 : 0.885;
  const annStep = tight ? 0.022 : 0.026;
  const heroW = tight ? 0.58 : 0.235;

  /* …starts half-abandoned with its leading corner already off the edge of
     the frame — discarded things do not sit politely inside a composition —
     then drifts in, centres itself, and steps aside for the copy. Far enough
     out to read as discarded, close enough that the paper ball (a much
     smaller object than the sheet it becomes) is wholly in frame. */
  const heroOut = tight ? 0.24 : 0.3;
  const heroX = useTransform(
    p,
    [0, 0.14, 0.42, 0.74, 0.9],
    [heroOut * D * stage.w, 0.27 * D * stage.w, 0, 0, (tight ? 0 : 0.24 * D) * stage.w],
    { ease: EASE },
  );
  const heroY = useTransform(
    p,
    [0, 0.14, 0.42, 0.74, 0.9],
    [
      (tight ? 0.21 : 0.23) * stage.h,
      0.15 * stage.h,
      0.01 * stage.h,
      0.01 * stage.h,
      /* The phone lifts the finished sheet further than the laptop does and
         shrinks it more: the copy block below it is the whole point of the
         scene ending, and on a 390px screen the sheet has to genuinely get
         out of its way rather than merely lean back. */
      (tight ? -0.235 : 0) * stage.h,
    ],
    { ease: EASE },
  );
  const heroScale = useTransform(
    p,
    [0, 0.2, 0.5, 0.9],
    tight ? [1, 1.05, 1.3, 0.98] : [1, 1.05, 1.34, 1.16],
    { ease: EASE },
  );

  /* The red pen only exists once the page can be read at all — while the CV
     is still a ball there is nothing to annotate. */
  const marksO = useScrub(
    p,
    tight ? [0.5, 0.58, 0.7, 0.78] : [0.56, 0.63, 0.74, 0.81],
    [0, 0.9, 0.9, 0],
  );
  const sheetO = useScrub(p, [handoff[0], handoff[1]], [0, 1]);
  const copyO = useScrub(p, [0.8, 0.9], [0, 1]);
  const copyY = useTransform(p, [0.8, 0.94], [22, 0]);

  return (
    <section ref={secRef} className={`scn scn-hero${reduced ? " is-still" : ""}`}>
      <RailMark id="resumeReview" top="72%" height="28%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {noise.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} ctx={heroCtx} lite={tight} />
          ))}

          <motion.div
            className="fo hero-paper"
            style={
              reduced
                ? { width: `${heroW * 100}%`, zIndex: 32, top: "38%" }
                : { x: heroX, y: heroY, scale: heroScale, width: heroW * stage.w, zIndex: 32 }
            }
          >
            {/* the crushed sheet, and under it the same sheet once it can be
                handled — only one of the two is ever legible at a time */}
            {!reduced && ready && (
              <CrumpledSheet
                p={p}
                lang={lang}
                range={crumpleRange}
                fade={handoff}
                tilt={-12}
                lift={tight ? 2.05 : 1.75}
                mobile={tight}
              />
            )}
            <motion.div style={fx({ opacity: sheetO })}>
              <RestoringPaper
                p={p}
                range={restRange}
                simple={reduced || tight}
                tilt={-12}
                /* The restoration repairs the PAPER, not the writing: the
                   sheet ends up flat, sharp and premium while still carrying
                   the words that are holding it back. That is what the review
                   annotates — and what scene 02 goes on to rewrite. */
                weak={
                  <div className="hp-weak">
                    <CVSheet lang={lang} variant="weak" />
                    <motion.div className="hp-marks" style={fx({ opacity: marksO })}>
                      <ReviewMarks lang={lang} />
                    </motion.div>
                  </div>
                }
                strong={<CVSheet lang={lang} variant="weak" />}
              >
                {/* The sheet finishes settling at 0.85. The review does not
                    start on top of that — it waits, and the held beat is what
                    separates "the paper has been restored" from "now I am
                    reading it". */}
                {!reduced &&
                  t.reviewNotes.map(([k, v], i) => (
                    <Annotation key={k} p={p} at={annAt + i * annStep} i={i} label={k} note={v} />
                  ))}
              </RestoringPaper>
            </motion.div>
          </motion.div>

          <FieldText
            p={p}
            stage={stage}
            ctx={heroCtx}
            y={-0.02}
            range={[0, 0.02, 0.14, 0.24]}
            lit
            className="ft-mid"
          >
            <h1 className="mega">{t.chaosH}</h1>
            <p className="mega-sub">{t.chaosSub}</p>
          </FieldText>
        </div>

        <motion.div className="copy copy-hero" style={fx({ opacity: copyO, y: copyY })}>
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="big">{s.headline[lang]}</h2>
          <p className="lede">{s.outcome[lang]}</p>
          <Cta s={s} lang={lang} t={t} />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * A reviewer's margin note, struck into the sheet's outer column with a
 * leader rule drawn back into the text it is about.
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

/* ════════════ 02 — RESUME WRITING (the same sheet, rewritten) ════════════

   Never a static before/after card. The weak line is condemned — struck
   through and told why it fails — and only then does the strong line assemble
   itself clause by clause.

   film   the rewrite is scrubbed: a cut line travels down the sheet and
          everything above it is already the rewritten CV.
   phone  the same sentences in the same order, played once over ~750ms by
          CSS when the section is reached. Transform and opacity only, and
          then it stops for good.                                          */

function SceneRewrite({ ctx }: { ctx: Ctx }) {
  const { t, lang, film, reduced } = ctx;
  const ref = useRef<HTMLElement>(null);
  const p = useScene(ref, "resumeWriting", film);
  const s = svc("resumeWriting");

  // The sheet arrives from where Act I left it and settles.
  const docX = useTransform(p, [0, 0.3], [(lang === "ar" ? -1 : 1) * 60, 0]);
  const docRot = useTransform(p, [0, 0.34], [-3.5, 0]);
  const docScale = useTransform(p, [0, 0.34, 1], [0.94, 1, 1.02]);

  /* A line travels down the page, and everything it has passed is already the
     rewritten CV. The weak sheet is clipped away above it, so the page is
     genuinely being retyped rather than cross-faded. */
  const cut = useScrub(p, [0.14, 0.66], [2, 98]);
  const weakClip = useTransform(cut, (v) => `inset(${v.toFixed(2)}% 0 0 0)`);
  const sweepTop = useTransform(cut, (v) => `${v.toFixed(2)}%`);
  const sweepO = useScrub(p, [0.1, 0.16, 0.62, 0.7], [0, 1, 1, 0]);

  /* The two lines never show the same words: the AFTER slot renders nothing
     but AFTER copy, at every scroll position. */
  const beforeO = useScrub(p, [0.04, 0.16, 0.44, 0.56], [0, 1, 1, 0.24]);
  const strike = useTransform(p, [0.2, 0.34], [0, 1]);
  const beforeNoteO = useScrub(p, [0.26, 0.34, 0.56, 0.64], [0, 1, 1, 0.3]);
  const afterO = useScrub(p, [0.34, 0.42], [0, 1]);
  const ctaO = useScrub(p, [0.78, 0.9], [0, 1]);
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={ref} className="scn scn-rw">
      <RailMark id="resumeWriting" top="30%" height="50%" />
      <div className="pin">
        <div className="stage stage-doc">
          <motion.div className="scn-rw-doc" style={fx({ x: docX, rotate: docRot, scale: docScale })}>
            <div className="rw-stack">
              <CVSheet lang={lang} variant="strong" />
              <motion.div className="rw-abs" style={fx({ clipPath: weakClip })}>
                <CVSheet lang={lang} variant="weak" />
              </motion.div>
              <motion.span className="rw-sweep" style={fx({ top: sweepTop, opacity: sweepO })} />
            </div>
          </motion.div>
        </div>

        <div className="copy">
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="big">{s.headline[lang]}</h2>

          <div className="ba">
            <motion.p className="ba-before" style={fx({ opacity: beforeO })}>
              <span className="ba-k">{t.before}</span>
              <span className="ba-line-wrap">
                {t.rewriteBefore}
                <motion.span
                  className="ba-strike"
                  style={fx({
                    scaleX: strike,
                    transformOrigin: lang === "ar" ? "right center" : "left center",
                  })}
                />
              </span>
              <motion.span className="ba-why" style={fx({ opacity: beforeNoteO })}>
                {t.rewriteBeforeNote}
              </motion.span>
            </motion.p>
            <motion.p className="ba-after" style={fx({ opacity: afterO })}>
              <span className="ba-k ba-k-on">{t.after}</span>
              {reduced ? (
                t.rewriteAfter
              ) : (
                <>
                  <Rewrite p={p} ctx={ctx} from={0.38} to={0.74} parts={t.rewriteParts} />
                  {film && <RewriteNote p={p} from={0.38} to={0.74} parts={t.rewriteParts} />}
                </>
              )}
            </motion.p>
          </div>

          <motion.span className="cta-slot" style={fx({ opacity: ctaO })}>
            <Cta s={s} lang={lang} t={t} />
          </motion.span>
        </div>
      </div>
    </section>
  );
}

type RewritePart = { t: string; tag: string };

/**
 * The strong line as an editor actually builds it: one clause at a time, in
 * the order a professional writer decides them — the verb, then who was led,
 * then the contribution, then what shipped.
 *
 * Every clause is in the DOM from the first frame, so the paragraph reserves
 * its final height and nothing reflows as the sentence assembles.
 * Deliberately NOT character typing: whole ideas land.
 */
function Rewrite({
  p,
  ctx,
  from,
  to,
  parts,
}: {
  p: MotionValue<number>;
  ctx: Ctx;
  from: number;
  to: number;
  parts: RewritePart[];
}) {
  // Clauses overlap slightly, so the sentence flows instead of ticking.
  const step = (to - from) / (parts.length + 0.35);
  return (
    <span className="rw-line">
      {parts.map((part, i) => (
        <RewriteClause
          key={part.t}
          p={p}
          ctx={ctx}
          i={i}
          start={from + i * step}
          span={step}
          text={part.t}
        />
      ))}
    </span>
  );
}

function RewriteClause({
  p,
  ctx,
  i,
  start,
  span,
  text,
}: {
  p: MotionValue<number>;
  ctx: Ctx;
  i: number;
  start: number;
  span: number;
  text: string;
}) {
  const at = (v: number) => start + span * v;
  const opacity = useScrub(p, [at(0), at(0.62)], [0, 1]);
  const y = useTransform(p, [at(0), at(0.7)], [9, 0]);
  const blur = useScrub(p, [at(0), at(0.6)], [4.5, 0]);
  const filter = useTransform(blur, (v) => (v < 0.05 ? "none" : `blur(${v.toFixed(2)}px)`));
  // the editor's highlight, drained once the clause has settled
  const wash = useScrub(p, [at(0), at(0.5), at(1.5)], [0, 1, 0]);
  const backgroundColor = useTransform(wash, (v) => `rgba(20,149,255,${(0.16 * v).toFixed(3)})`);

  /* On a phone the clause is a CSS transition with an index-derived delay:
     four clauses 150ms apart, 380ms each, is a ~750ms sentence that assembles
     and stops. No blur — an animated filter is a full-size paint pass per
     frame and it is the first thing to cut. `--i` is all JS provides. */
  if (!ctx.film) {
    return (
      <>
        <span className="rw-cl" style={{ ["--i" as string]: i }}>
          {text}
        </span>{" "}
      </>
    );
  }
  return (
    <>
      <motion.span className="rw-cl" style={{ opacity, y, filter, backgroundColor }}>
        {text}
      </motion.span>{" "}
    </>
  );
}

/**
 * The margin note: the reason the clause now landing was written that way. It
 * changes with the scroll like a reviewer talking through the edit — a
 * film-only device, so the phone does not render it rather than rendering it
 * frozen on one arbitrary clause.
 */
function RewriteNote({
  p,
  from,
  to,
  parts,
}: {
  p: MotionValue<number>;
  from: number;
  to: number;
  parts: RewritePart[];
}) {
  const step = (to - from) / (parts.length + 0.35);
  const pick = useCallback(
    (v: number) => {
      const i = Math.floor((v - from - step * 0.2) / step);
      return Math.min(parts.length - 1, Math.max(0, i));
    },
    [from, step, parts.length],
  );
  const [i, setI] = useState(() => pick(p.get()));
  useMotionValueEvent(p, "change", (v) => setI((prev) => (pick(v) === prev ? prev : pick(v))));
  const opacity = useScrub(p, [from, from + step * 0.4, to + step * 0.5, to + step], [0, 1, 1, 0]);

  return (
    <motion.span className="rw-note" style={{ opacity }} aria-hidden>
      <i className="rw-dot" />
      <motion.b key={parts[i].tag} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        {parts[i].tag}
      </motion.b>
    </motion.span>
  );
}

/* ════════════ 03 — PUBLIC SPEAKING (real photography) ════════════

   The same dark, full-bleed frame on both devices: the photograph owns the
   section, the copy sits over it in white, and the section keeps the
   cinematic weight it has on a laptop. What changes is that a phone does not
   pin it for 260vh and does not scrub the push-in — the photograph arrives
   once, over ~560ms, with a scale and a clip reveal, and then holds still.

   NOT FOR SALE YET. This service has no price and no checkout URL by type, so
   the section physically cannot render a buy button (see `Cta`). It shows
   قريبًا / COMING SOON and routes to contact.                              */

function SceneSpeaking({ ctx }: { ctx: Ctx }) {
  const { t, lang, film, reduced } = ctx;
  const ref = useRef<HTMLElement>(null);
  const p = useScene(ref, "publicSpeaking", film);
  const s = svc("publicSpeaking");

  // A slow cinematic push-in and drift across the whole scene.
  const scale = useTransform(p, [0, 1], reduced ? [1, 1] : [1.18, 1.02]);
  const shotY = useTransform(p, [0, 1], reduced ? ["0%", "0%"] : ["-3.5%", "3.5%"]);
  const scrim = useScrub(p, [0, 0.35, 1], [0.45, 0.82, 0.9]);
  const titleY = useTransform(p, [0, 1], reduced ? [0, 0] : [70, -70]);
  const titleO = useScrub(p, [0.06, 0.26, 0.94, 1], [0, 1, 1, 0.6]);
  const insetO = useScrub(p, [0.34, 0.5], [0, 1]);
  const insetX = useTransform(p, [0.34, 0.62], [50, 0]);
  const ctaO = useScrub(p, [0.5, 0.66], [0, 1]);
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={ref} className="scn scn-sp">
      <RailMark id="publicSpeaking" top="20%" height="60%" />
      <div className="pin">
        <motion.div className="sp-shot" style={fx({ scale, y: shotY })}>
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
        <motion.div className="sp-scrim" style={fx({ opacity: scrim })} />

        <motion.div className="sp-inset" style={fx({ opacity: insetO, x: insetX })}>
          <PhotoCard
            src="/speaking-portrait.jpg"
            alt={lang === "ar" ? "تركي المالكي أثناء العرض" : "Turki Almalki presenting"}
          />
        </motion.div>

        <motion.div className="copy sp-copy" style={fx({ y: titleY, opacity: titleO })}>
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="mega mega-2 sp-h">{s.headline[lang]}</h2>
          <p className="sp-kicker">{t.speakKicker}</p>
          <motion.span className="cta-slot" style={fx({ opacity: ctaO })}>
            <Cta s={s} lang={lang} t={t} />
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════ 04 — LINKEDIN (the same identity, positioned) ════════════

   Never a dead static card. The weak profile is on screen first; the headline
   transforms; the profile resolves stronger and the recruiter search that
   could not find it runs again and does. ~950ms on a phone, scrubbed on a
   laptop — same four beats, same order.                                    */

function SceneLinkedIn({ ctx }: { ctx: Ctx }) {
  const { t, lang, film } = ctx;
  const ref = useRef<HTMLElement>(null);
  const p = useScene(ref, "linkedinOptimization", film);
  const s = svc("linkedinOptimization");

  const cardY = useTransform(p, [0, 1], [70, -50]);
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
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={ref} className="scn scn-li">
      <RailMark id="linkedinOptimization" top="22%" height="56%" />
      <div className="pin">
        <div className="stage lk-stage">
          <motion.div
            className="lk-card"
            style={fx({ y: cardY, rotate: cardRot, scale: strongScale })}
          >
            <LinkedInCard lang={lang} variant="strong" />
            <motion.div className="lk-card-over" style={fx({ opacity: weakO })}>
              <LinkedInCard lang={lang} variant="weak" />
            </motion.div>
          </motion.div>
          <motion.div className="lk-rank" style={fx({ opacity: srchO, y: srchY })}>
            <RecruiterSearch lang={lang} variant="strong" />
            <motion.div className="lk-rank-over" style={fx({ opacity: srchWeakO })}>
              <RecruiterSearch lang={lang} variant="weak" />
            </motion.div>
          </motion.div>
        </div>

        <div className="copy">
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="big">{s.headline[lang]}</h2>
          <div className="hl">
            <motion.span className="hl-weak" style={fx({ opacity: hlWeakO })}>
              {t.linkedinBefore}
            </motion.span>
            <motion.span className="hl-strong" style={fx({ opacity: hlStrongO, x: hlStrongX })}>
              {t.linkedinAfter}
            </motion.span>
          </div>
          <motion.span className="cta-slot" style={fx({ opacity: ctaO })}>
            <Cta s={s} lang={lang} t={t} />
          </motion.span>
        </div>
      </div>
    </section>
  );
}

/* ════════════ 05 — MVP / PORTFOLIO (real products in space) ════════════

   Not a grid of cards: real products arriving as physical objects, one after
   another, at different depths. A laptop gets the full spatial assembly — six
   shipped products with the portfolio landing in front of them. A phone gets
   the same scene composed for a phone: three surfaces entering 1 → 2 → 3 with
   a small overlap over ~700ms, then still. Same screenshots, same depth
   order, a third of the layers — never six huge browser layers animating.  */

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

function SceneWork({ ctx }: { ctx: Ctx }) {
  const { t, lang, film, tight } = ctx;
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef, film);
  const p = useScene(secRef, "mvpPortfolio", film);
  const D = lang === "ar" ? -1 : 1;
  const s = svc("mvpPortfolio");

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
        w: tight ? 0.8 : 0.38,
        at: [0.44, 0.74],
      },
    ];
    /* On a phone the stack thins to three surfaces — two shipped products and
       the portfolio itself — arriving in the same depth order they do on a
       laptop. Six browser layers on a 390px screen is not a richer scene, it
       is six unreadable ones. */
    if (!tight) return all;
    return all
      .filter((pr) => ["alrajhi", "wijhut", "site"].includes(pr.id))
      .map((pr) =>
        pr.id === "site"
          ? { ...pr, to: { ...pr.to, y: 0.14 } }
          : { ...pr, w: pr.w * 1.55, to: { ...pr.to, y: pr.to.y - 0.06 } },
      );
  }, [lang, tight, D]);

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
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={secRef} className="scn scn-wk">
      <RailMark id="mvpPortfolio" top="18%" height="62%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          <motion.div
            className="wk-layer"
            style={fx({ y: layerY, scale: layerScale, opacity: layerO, filter: layerBlur })}
          >
            {prods.map((pr, i) => (
              <ProductObject key={pr.id} p={p} pr={pr} i={i} stage={stage} ctx={ctx} />
            ))}
          </motion.div>

          <motion.span className="wk-kick" style={fx({ opacity: kickO })}>
            {t.workKicker}
          </motion.span>
        </div>

        <motion.div className="copy copy-center" style={fx({ opacity: copyO, y: copyY })}>
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="big">{s.headline[lang]}</h2>
          <p className="lede">{s.outcome[lang]}</p>
          <Cta s={s} lang={lang} t={t} />
        </motion.div>
      </div>
    </section>
  );
}

function ProductObject({
  p,
  pr,
  i,
  stage,
  ctx,
}: {
  p: MotionValue<number>;
  pr: Prod;
  i: number;
  stage: { w: number; h: number };
  ctx: Ctx;
}) {
  const [a, b] = pr.at;
  const stops = [a, b];
  const x = useTransform(p, stops, [pr.from.x * stage.w, pr.to.x * stage.w], { ease: EASE });
  const y = useTransform(p, stops, [pr.from.y * stage.h, pr.to.y * stage.h], { ease: EASE });
  const rotate = useTransform(p, stops, [pr.from.r, pr.to.r], { ease: EASE });
  const scale = useTransform(p, stops, [pr.from.s, pr.to.s], { ease: EASE });
  const opacity = useScrub(p, [a, a + (b - a) * 0.35], [pr.from.o ?? 1, 1], EASE);
  /* Depth is carried by the blur on a laptop and by scale and stacking order
     on a phone: several products each running their own animated blur is
     several full-size paint passes per scroll frame. */
  const blur = useScrub(p, stops, [(pr.blur ?? 0) + 3, pr.blur ?? 0], EASE);
  const filter = useTransform(blur, (v) => (v < 0.05 ? "none" : `blur(${v.toFixed(2)}px)`));

  const node =
    pr.kind === "site" ? (
      <BrowserCard lang={ctx.lang} variant="strong" />
    ) : (
      <WindowCard src={pr.src!} alt={pr.alt} url={pr.url} />
    );

  if (!ctx.film) {
    // 1 → 2 → 3, 190ms apart, ~520ms each: a ~700ms assembly, then static.
    const obj: Obj = { id: pr.id, w: pr.w, z: pr.z, from: pr.from, to: pr.to, delay: i * 0.136, node };
    return (
      <div className="fo" style={restStyle(obj, pr.to)}>
        <div className="fo-e">{node}</div>
      </div>
    );
  }
  return (
    <motion.div
      className="fo"
      style={{ x, y, rotate, scale, opacity, filter, zIndex: pr.z, width: pr.w * stage.w }}
    >
      <div className="fo-e">{node}</div>
    </motion.div>
  );
}

/* ════════════ 06 — REPORT & DASHBOARD (raw data → decisions) ════════════

   The raw table is real: the Saudi Film Commission's 20-company accelerator
   batch. The dashboard it collapses into is the one that was actually built
   from it, so the visitor can follow the link and check.

   Both devices tell the same sequence — raw data first, then the KPI tiles,
   then the charts, then the finished dashboard settling. A laptop scrubs it.
   A phone plays it once over ~850ms through three registered custom
   properties the dashboard already exposes, and then the chart is a picture.
   Nothing here animates continuously on either device.                     */

function SceneData({ ctx }: { ctx: Ctx }) {
  const { t, lang, film, tight } = ctx;
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef, film);
  const p = useScene(secRef, "dashboardReporting", film);
  const D = lang === "ar" ? -1 : 1;
  const s = svc("dashboardReporting");

  // Fragments of the raw table, drifting in from the edges and converging.
  const frags = useMemo(
    () =>
      (tight
        ? [
            { x: -0.2, y: -0.32, r: -7, w: 0.66, z: 6, d: 0 },
            { x: 0.22, y: -0.2, r: 6, w: 0.6, z: 5, d: 0.05 },
          ]
        : [
            { x: -0.33, y: -0.24, r: -8, w: 0.3, z: 6, d: 0 },
            { x: 0.34, y: -0.2, r: 7, w: 0.28, z: 5, d: 0.04 },
            { x: -0.29, y: 0.26, r: 6, w: 0.26, z: 4, d: 0.08 },
            { x: 0.32, y: 0.28, r: -7, w: 0.29, z: 3, d: 0.12 },
          ]
      ).map((f, i) => ({ ...f, id: `frag${i}`, x: f.x * D })),
    [tight, D],
  );

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
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={secRef} className="scn scn-db">
      <RailMark id="dashboardReporting" top="20%" height="60%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {frags.map((f) => (
            <DataFragment key={f.id} p={p} f={f} stage={stage} ctx={ctx} />
          ))}

          <motion.div
            className="db-hero"
            style={fx({
              opacity: dashO,
              scale: dashScale,
              y: dashY,
              width: (tight ? 0.92 : 0.66) * stage.w,
            })}
          >
            <motion.div
              className="db-vars"
              style={fx({ ["--kpi"]: kpi, ["--bars"]: bars, ["--ring"]: ring } as never)}
            >
              <DashboardCard lang={lang} />
            </motion.div>
          </motion.div>

          <motion.span className="db-tag db-tag-raw" style={fx({ opacity: rawO })}>
            {t.dataRaw}
          </motion.span>
          <motion.span className="db-tag db-tag-out" style={fx({ opacity: outO })}>
            {t.dataOut}
          </motion.span>
        </div>

        <motion.div className="copy copy-center" style={fx({ opacity: copyO, y: copyY })}>
          <Chapter index={s.index} name={s.name[lang]} />
          <h2 className="big">{s.headline[lang]}</h2>
          <p className="lede">{s.outcome[lang]}</p>
          <div className="db-acts">
            <Cta s={s} lang={lang} t={t} />
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
    </section>
  );
}

function DataFragment({
  p,
  f,
  stage,
  ctx,
}: {
  p: MotionValue<number>;
  f: { id: string; x: number; y: number; r: number; w: number; z: number; d: number };
  stage: { w: number; h: number };
  ctx: Ctx;
}) {
  const a = 0.16 + f.d;
  const b = 0.46 + f.d;
  const x = useTransform(p, [0, a, b], [f.x * stage.w, f.x * 0.94 * stage.w, 0], { ease: EASE });
  const y = useTransform(p, [0, a, b], [f.y * stage.h, f.y * 0.94 * stage.h, 0], { ease: EASE });
  const rotate = useTransform(p, [0, a, b], [f.r, f.r * 0.9, 0], { ease: EASE });
  const scale = useTransform(p, [0, a, b], [1, 1.02, 0.46], { ease: EASE });
  const opacity = useScrub(p, [0, 0.06, a, b - 0.06], [0, 1, 1, 0], EASE);
  const node = <DataSheet lang={ctx.lang} />;

  /* On a phone the raw data does not converge and vanish — it is the FIRST
     thing on screen and it stays, above and behind the dashboard that was
     built from it. "This became that" is told by the stacking rather than by
     a scrub, which is the same statement for none of the cost. */
  if (!ctx.film) {
    return (
      <div
        className="fo fo-raw"
        style={{
          left: `${50 + f.x * 100}%`,
          top: `${50 + f.y * 100}%`,
          width: `${f.w * 100}%`,
          zIndex: f.z,
          ["--ex" as string]: "0%",
          ["--ey" as string]: "-12%",
          ["--es" as string]: "0.96",
          ["--er" as string]: "0deg",
          ["--ed" as string]: `${Math.round(f.d * 900)}ms`,
          ["--or" as string]: `${f.r}deg`,
        }}
      >
        <div className="fo-e">{node}</div>
      </div>
    );
  }
  return (
    <motion.div
      className="fo"
      style={{ x, y, rotate, scale, opacity, zIndex: f.z, width: f.w * stage.w }}
    >
      <div className="fo-e">{node}</div>
    </motion.div>
  );
}

/* ════════════ 07 — THE COMPLETE PACKAGE (everything, together) ════════════

   Every object here has already appeared once: the restored CV, the
   positioned profile, the stage photograph, the shipped product and the
   dashboard. They arrive from the direction they left in and lock into one
   composition. Translate, scale and opacity only — no blur, no filter, no
   continuous animation, on either device.                                  */

function SceneBundle({ ctx }: { ctx: Ctx }) {
  const { t, lang, film, tight } = ctx;
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStage(stageRef, film);
  const p = useScene(secRef, "completeBundle", film);
  const D = lang === "ar" ? -1 : 1;
  const b = COMPLETE_BUNDLE;

  const objects = useMemo<Obj[]>(() => {
    const mx = (v: number) => v * D;
    /* One object per service, in journey order: the restored and rewritten
       CV, the positioned profile, the stage, the shipped product, the
       dashboard. */
    const lock = tight
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
      delay: i * 0.075,
      node,
    }));
  }, [lang, tight, D]);

  const footO = useScrub(p, [0.78, 0.92], [0, 1]);
  const footY = useTransform(p, [0.78, 0.94], [20, 0]);
  const fx = (v: object) => (film ? v : undefined);

  return (
    <section ref={secRef} className="scn scn-bd">
      <RailMark id="completeBundle" top="40%" height="58%" />
      <div className="pin">
        <div ref={stageRef} className="stage">
          {objects.map((o) => (
            <FieldObject key={o.id} p={p} o={o} stage={stage} ctx={ctx} />
          ))}

          <FieldText
            p={p}
            stage={stage}
            ctx={ctx}
            y={tight ? -0.42 : -0.34}
            range={tight ? [0.3, 0.5, 0.7, 0.8] : [0.3, 0.5, 2, 2.1]}
            className="ft-mid ft-bd"
          >
            <h2 className="mega mega-2">{b.headline[lang]}</h2>
          </FieldText>
        </div>

        <motion.div className="copy copy-center bd-foot" style={fx({ opacity: footO, y: footY })}>
          <span className="bd-name">{b.name[lang]}</span>
          <span className="bd-price">
            <Money price={b.price} lang={lang} className="money-xl" />
            <em>
              {t.bundleSep}{" "}
              <s>
                <Money price={b.individualTotal} lang={lang} />
              </s>
            </em>
          </span>
          <CheckoutButton serviceId={b.id} href={b.checkoutUrl} label={b.cta[lang]} size="lg" />
        </motion.div>
      </div>
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
        {/* A real anchor to the first service's rail mark: no handler, no
            smooth-scroll script, and it works before hydration. */}
        <a className="cta" href="#resumeReview">
          {CAREER_SERVICES[0].name[lang]} <LuArrowRight size={15} className="cta-i" />
        </a>
        {/* No second "talk to me" here: the consultation section directly
            above this one is that offer, made properly. */}
      </div>
      <style>{`
        .fin { width: min(880px, calc(100% - 48px)); margin: 0 auto; padding-block: clamp(100px, 14vw, 190px); text-align: center; }
        .fin-a { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 26px; margin-top: 40px; }
      `}</style>
    </section>
  );
}

/* ════════════════════════ the stylesheet ════════════════════════

   Read this as two documents in one.

   THE FIRST is unconditional and describes the PHONE: scenes that flow, a
   stage with its own proportions followed by its copy, natural section
   heights, and one-shot entrances waiting on `.is-in`. It is also the
   server-rendered layout, so it is what every device paints first and what a
   phone paints for good.

   THE SECOND lives inside `@media (hover:hover) and (pointer:fine)` and turns
   that into the film: sections become tall, `.pin` becomes sticky and
   viewport-tall, `.stage` fills it absolutely, and `.copy` is lifted into the
   stage and positioned. Every entrance transition is cancelled there, because
   the film scrubs those same channels itself and two animations on one
   property is one animation too many.

   The media query string is the one `useMode` asks matchMedia. They must not
   drift apart.                                                             */

function PageStyles() {
  return (
    <style>{`
      .sv { background: #FBFBF9; color: #0d0e12; overflow-x: clip; }
      [data-theme="dark"] .sv { background: #0d0e12; color: #f0f0ef; }

      /* ═══════════════ 1 · THE PHONE (and the server HTML) ═══════════════ */

      /* NO scroll snapping. Not mandatory, not proximity, not anywhere. The
         page must never resist the finger. */
      .scn { position: relative; }
      .scn .pin {
        display: flex; flex-direction: column; justify-content: center;
        gap: clamp(26px, 6vw, 40px);
        /* clears the site's own fixed navigation pill */
        padding: clamp(56px, 12vw, 84px) 22px calc(96px + env(safe-area-inset-bottom, 0px));
      }
      /* Deliberately min-height, and deliberately NOT the same number twice.
         A page where all seven panels are exactly 100vh reads as a slideshow
         you are being marched through; content allowed its own height reads
         as a page. */
      .scn-rw .pin { min-height: 92vh; }
      .scn-li .pin { min-height: 100vh; }
      .scn-wk .pin { min-height: 104vh; }
      .scn-db .pin { min-height: 108vh; }
      .scn-bd .pin { min-height: 110vh; }

      /* The stage keeps the composition's proportions instead of being handed
         a viewport. Objects inside are placed as percentages of it, so the
         same from/to vectors that compose the film compose this. */
      .stage {
        position: relative; width: 100%; max-width: 460px; margin-inline: auto;
        aspect-ratio: var(--ar, 1 / 0.86);
      }
      /* Each ratio is the one its own composition actually needs, measured
         rather than guessed. A stage that is shorter than its contents does
         not clip on a phone — it spills into the copy underneath, and a
         headline with a CV sheet lying across it is the single most obvious
         way for this page to look broken. */
      .scn-rw .stage { --ar: 1 / 1.42; max-width: 240px; }
      .scn-li .stage { --ar: 1 / 0.98; }
      .scn-wk .stage { --ar: 1 / 1.0; }
      .scn-db .stage { --ar: 1 / 1.34; }
      .scn-bd .stage { --ar: 1 / 1.12; }

      .copy {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        gap: clamp(14px, 3.4vw, 20px);
        width: 100%; max-width: 480px; margin-inline: auto;
      }
      .copy .ck { width: 100%; }
      .ctaw { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }
      .cta-slot { display: contents; }

      /* ── the entrance ──
         ONE class, added once by IntersectionObserver, never removed. What
         follows is CSS: a transform and an opacity for well under a second,
         and then the section is inert DOM for the rest of the session. No
         filter, no blur, no backdrop-filter, no animated box-shadow and no
         spring — those are what turn a "premium" entrance into a dropped
         frame. */
      .fo-e {
        transform: translate3d(var(--ex, 0), var(--ey, 14%), 0)
                   scale(calc(var(--os, 1) * var(--es, 0.94)))
                   rotate(var(--er, 0deg));
        opacity: 0;
        transition:
          transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--ed, 0ms),
          opacity 420ms ease var(--ed, 0ms);
      }
      .is-in .fo-e {
        transform: scale(var(--os, 1)) rotate(var(--or, 0deg));
        opacity: 1;
      }
      /* The copy follows its scene in, a beat behind the objects. */
      .scn > .pin > .copy {
        opacity: 0; transform: translate3d(0, 14px, 0);
        transition: opacity 460ms ease 200ms, transform 520ms cubic-bezier(0.22,1,0.36,1) 200ms;
      }
      .scn.is-in > .pin > .copy { opacity: 1; transform: none; }

      /* ── 02 · the rewrite, played once ──
         Four clauses, 150ms apart, 380ms each — a ~750ms sentence that
         assembles and then stops. */
      .sv-phone .rw-cl {
        opacity: 0; transform: translate3d(0, 8px, 0);
        transition: opacity 380ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1);
        transition-delay: calc(560ms + var(--i, 0) * 150ms);
      }
      .sv-phone .is-in .rw-cl { opacity: 1; transform: none; }
      /* The weak line is struck through just before the strong one starts. */
      .sv-phone .ba-strike {
        transform: scaleX(0); transform-origin: left center;
        transition: transform 420ms cubic-bezier(0.22,1,0.36,1) 300ms;
      }
      [dir="rtl"] .sv-phone .ba-strike { transform-origin: right center; }
      .sv-phone .is-in .ba-strike { transform: scaleX(1); }
      .sv-phone .ba-before { transition: opacity 400ms ease 720ms; }
      .sv-phone .is-in .ba-before { opacity: 0.45; }
      .sv-phone .ba-why { opacity: 0; transition: opacity 380ms ease 480ms; }
      .sv-phone .is-in .ba-why { opacity: 0.85; }

      /* ── 04 · the LinkedIn headline, transformed ──
         The weak headline is struck and dimmed; the strong one arrives behind
         it; the weak profile card and the failed search dissolve to reveal the
         strong ones underneath — the same hand-off the film scrubs. */
      .sv-phone .hl-weak { transition: opacity 360ms ease 560ms; }
      .sv-phone .is-in .hl-weak { opacity: 0.4; text-decoration: line-through; }
      .sv-phone .hl-strong {
        opacity: 0; transform: translate3d(0, 10px, 0);
        transition: opacity 420ms ease 560ms, transform 520ms cubic-bezier(0.22,1,0.36,1) 560ms;
      }
      .sv-phone .is-in .hl-strong { opacity: 1; transform: none; }
      .sv-phone .lk-card-over,
      .sv-phone .lk-rank-over { transition: opacity 460ms ease 420ms; }
      .sv-phone .is-in .lk-card-over,
      .sv-phone .is-in .lk-rank-over { opacity: 0; }

      /* ── 03 · the photograph, revealed ──
         Scale 1.04 → 1, a small lift, and a clip that opens from the bottom.
         ~560ms, then it is a photograph and nothing more. */
      .sv-phone .sp-shot {
        transform: scale(1.04) translate3d(0, 10px, 0);
        clip-path: inset(0 0 12% 0);
        transition:
          transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
          clip-path 560ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .sv-phone .is-in .sp-shot { transform: none; clip-path: inset(0 0 0 0); }

      /* ── 06 · raw data → dashboard ──
         The three registered properties the dashboard exposes: the KPI tiles
         settle, then the charts grow, then the ring fills. ~850ms end to end,
         then absolutely still — no chart on this page animates twice. */
      .sv-phone .db-vars {
        --kpi: 0; --bars: 0; --ring: 0;
        transition: --kpi 300ms ease 300ms, --bars 420ms ease 460ms, --ring 380ms ease 600ms;
      }
      .sv-phone .is-in .db-vars { --kpi: 1; --bars: 1; --ring: 1; }
      .sv-phone .db-hero {
        position: absolute; z-index: 20; left: 50%; top: 58%; translate: -50% -50%;
        width: 100%;
      }
      .sv-phone .fo-raw { z-index: 4; }
      .sv-phone .db-tag { display: none; }

      /* ── 05 · the kicker rides above the stack ── */
      .sv-phone .wk-kick {
        position: absolute; z-index: 40; top: -4px; inset-inline: 0; text-align: center;
        font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
        color: var(--text-muted, #a5a5a0);
      }

      /* ── 03 · the speaking scene keeps its dark, full-bleed frame ── */
      .scn-sp { background: #08090c; color: #fff; }
      .scn-sp .pin {
        position: relative; min-height: 94vh; padding: 0; overflow: hidden; display: block;
      }
      .sp-shot { position: absolute; inset: 0; }
      .sp-img { object-fit: cover; object-position: 46% 36%; }
      .sp-scrim {
        position: absolute; inset: 0; opacity: 0.88;
        background: linear-gradient(to top, rgba(6,7,10,0.97) 0%, rgba(6,7,10,0.86) 24%, rgba(6,7,10,0.4) 60%, rgba(6,7,10,0.12) 100%);
      }
      .sp-inset { display: none; }
      .scn-sp .copy {
        position: absolute; z-index: 3; inset-inline: 0;
        bottom: calc(104px + env(safe-area-inset-bottom, 0px));
        padding-inline: 22px; color: #fff;
        /* driven by its own reveal, not the shared copy transition */
        opacity: 1; transform: none; transition: none;
      }
      .scn-sp .chap, .sp-kicker { color: rgba(255,255,255,0.62); }
      .sp-h { color: #fff; text-shadow: 0 2px 40px rgba(0,0,0,0.4); }
      .sp-kicker { margin: -4px 0 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
      .scn-sp .cta { background: #fff; color: #0d0e12; }
      .scn-sp .cta-p { color: rgba(255,255,255,0.68); }

      /* ── 01 · the hero is scrubbed on EVERY device ──
         ~190vh: 100 of it is the pin, 90 is travel — at a typical swipe that
         is about a swipe and a half from crushed ball to reviewed CV, with no
         stretch of it that produces nothing. */
      .scn-hero { height: 190vh; }
      .scn-hero .pin { position: sticky; top: 0; height: 100svh; padding: 0; display: block; }
      .scn-hero .stage {
        position: absolute; inset: 0; max-width: none; margin: 0;
        aspect-ratio: auto; overflow: hidden;
      }
      .scn-hero .copy-hero {
        position: absolute; z-index: 42; inset-inline: 0; margin-inline: auto;
        bottom: calc(96px + env(safe-area-inset-bottom, 0px));
        width: min(460px, calc(100% - 36px)); padding: 0; gap: 12px;
        /* driven by the scrub, never by the reveal class */
        opacity: 1; transform: none; transition: none;
      }
      /* On an 844px screen those two extra lines are the difference between
         the buy button being on screen and being under the navigation. */
      .scn-hero .copy-hero .lede { display: none; }
      .scn-hero .copy-hero .big { font-size: clamp(24px, 7vw, 32px); }
      .hero-paper { transform-origin: center; }
      .hp-weak { position: relative; }
      .hp-marks { position: absolute; inset: 0; }

      /* reduced motion: the same scene at its end state, nothing running */
      .scn-hero.is-still { height: auto; }
      .scn-hero.is-still .pin { position: static; height: 88vh; }

      /* ═══════════════ 2 · THE FILM (pointer devices) ═══════════════ */
      @media (hover: hover) and (pointer: fine) {
        .scn .pin {
          position: sticky; top: 0; height: 100vh; display: block; padding: 0; min-height: 0;
        }
        .stage {
          position: absolute; inset: 0; max-width: none; margin: 0;
          aspect-ratio: auto; overflow: hidden;
        }
        /* The per-scene proportions and widths above are the PHONE's, and they
           are written with a two-class selector, so the one-class reset just
           above cannot undo them. Restated here at matching specificity — and
           later in the sheet, which is what decides it — so a laptop gets a
           stage that fills the pin rather than a 240px phone box. */
        .scn-rw .stage, .scn-li .stage, .scn-wk .stage,
        .scn-db .stage, .scn-bd .stage { --ar: auto; max-width: none; }

        /* scene lengths — the film's runway */
        .scn-hero { height: 480vh; }
        .scn-rw   { height: 300vh; }
        .scn-sp   { height: 260vh; }
        .scn-li   { height: 280vh; }
        .scn-wk   { height: 400vh; }
        .scn-db   { height: 380vh; }
        .scn-bd   { height: 320vh; }

        /* Nothing waits for a reveal class here: the film owns these channels
           and writes them every frame. A transition left switched on would be
           a second animation fighting the first. */
        .fo-e, .scn > .pin > .copy, .rw-cl, .ba-strike, .ba-before, .ba-why,
        .hl-weak, .hl-strong, .lk-card-over, .lk-rank-over, .sp-shot, .db-vars {
          transition: none;
        }
        .fo-e { transform: none; opacity: 1; }
        .scn > .pin > .copy { opacity: 1; transform: none; }

        /* the copy blocks, lifted into the stage */
        .copy {
          position: absolute; z-index: 42; align-items: flex-start; text-align: start;
          gap: clamp(18px, 2.2vw, 28px); max-width: none; padding: 0;
        }
        .copy .ck { width: auto; }
        .ctaw { display: inline-flex; align-items: flex-start; width: auto; }
        .copy-center {
          inset-inline: 0; margin-inline: auto; bottom: clamp(74px, 11vh, 122px);
          width: min(760px, calc(100% - 44px)); align-items: center; text-align: center;
        }
        .copy-center::before {
          content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 128%; height: 240%; z-index: -1; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(251,251,249,0.94) 0%, rgba(251,251,249,0.6) 56%, rgba(251,251,249,0) 100%);
        }
        [data-theme="dark"] .copy-center::before {
          background: radial-gradient(closest-side, rgba(13,14,18,0.94) 0%, rgba(13,14,18,0.6) 56%, rgba(13,14,18,0) 100%);
        }

        .scn-hero .copy-hero {
          inset-inline-start: max(24px, calc((100vw - 1300px) / 2));
          top: 50%; translate: 0 -50%; bottom: auto;
          width: min(500px, 44vw); align-items: flex-start; text-align: start;
        }
        .scn-hero .copy-hero .lede { display: block; }
        .scn-hero .copy-hero .big { font-size: clamp(28px, 3.9vw, 58px); }

        /* 02 and 04 are two-column scenes rather than pinned stages */
        .scn-rw .pin, .scn-li .pin {
          display: flex; flex-direction: row; align-items: center;
          height: auto; min-height: 100vh;
        }
        .scn-rw .stage-doc, .scn-li .lk-stage {
          position: relative; inset: auto; overflow: visible; aspect-ratio: auto;
          width: 42%; margin-inline: max(24px, calc((100vw - 1240px) / 2)) 0;
        }
        .scn-li .lk-stage { aspect-ratio: 4 / 3.5; }
        .scn-rw .copy, .scn-li .copy {
          position: relative; z-index: 1; inset: auto; translate: none;
          width: 48%; margin-inline: clamp(44px, 7vw, 110px) 0;
        }
        .scn-rw .scn-rw-doc { width: min(370px, 88%); }

        .scn-sp .pin { min-height: 0; height: 100vh; overflow: hidden; }
        .scn-sp .copy {
          inset-inline-start: max(24px, calc((100vw - 1320px) / 2));
          bottom: clamp(90px, 14vh, 150px); padding-inline: 0;
          width: min(720px, calc(100% - 48px));
        }
        .sp-inset {
          display: block; position: absolute; z-index: 3;
          inset-inline-end: clamp(24px, 5vw, 96px); bottom: clamp(90px, 16vh, 170px);
          width: clamp(150px, 17vw, 250px);
        }
        .sp-inset .ph-img { object-position: 45% 42%; scale: 1.35; }
        .sp-shot { inset: -6%; }

        .db-hero {
          position: absolute; z-index: 20; left: 50%; top: 50%; translate: -50% -50%;
        }
        .db-tag { display: block; }
        .scn-db .copy-center { bottom: auto; top: 58%; width: min(780px, calc(100% - 44px)); }
        .wk-kick {
          position: absolute; z-index: 40; top: clamp(78px, 12vh, 118px); inset-inline: 0;
          text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--text-muted, #8b8b8b);
        }
        .bd-foot { bottom: clamp(104px, 15vh, 152px); width: min(600px, calc(100% - 40px)); }
      }

      /* ═══════════════ shared object & typography rules ═══════════════ */

      .fo { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
      .fo-e { width: 100%; }
      .ft { width: min(1100px, 88vw); text-align: center; pointer-events: none; }
      .ft-mid::before {
        content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
        width: 112%; height: 210%; z-index: -1; border-radius: 50%;
        background: radial-gradient(closest-side, rgba(251,251,249,0.86) 0%, rgba(251,251,249,0.52) 58%, rgba(251,251,249,0) 100%);
      }
      [data-theme="dark"] .ft-mid::before {
        background: radial-gradient(closest-side, rgba(13,14,18,0.86) 0%, rgba(13,14,18,0.52) 58%, rgba(13,14,18,0) 100%);
      }
      .sv-phone .ft-bd { width: 100%; }

      /* the rail's hand-off bands — invisible, never interactive, and the
         anchor a #service link lands on */
      .rmark { position: absolute; inset-inline: 0; pointer-events: none; visibility: hidden; }

      /* Every slot an object can occupy is a size container, so the objects'
         own cqw-based typography scales to the slot, not to the viewport. */
      .fo, .fo-e, .obj-abs, .obj-stack, .obj-cv, .scn-rw-doc, .srow figure,
      .lk-card, .lk-card-over, .lk-rank, .lk-rank-over, .rw-stack, .rw-abs,
      .db-vars, .bd-dash, .db-hero { container-type: inline-size; }
      .obj-stack, .obj-cv { position: relative; width: 100%; }
      .obj-abs { position: absolute; inset: 0; }

      /* 02 · the document */
      .scn-rw-doc { width: 100%; margin-inline: auto; }
      .rw-stack { position: relative; }
      .rw-abs { position: absolute; inset: 0; }
      .rw-sweep { position: absolute; z-index: 4; inset-inline: -2%; height: 2px; translate: 0 -1px; background: linear-gradient(90deg, rgba(20,149,255,0) 0%, rgba(20,149,255,0.85) 18%, rgba(20,149,255,0.85) 82%, rgba(20,149,255,0) 100%); box-shadow: 0 0 18px rgba(20,149,255,0.55); }
      /* Film-only: the sweep is the visual form of a scrub, and there is no
         scrub here to be the form of. */
      .sv-phone .rw-sweep { display: none; }
      /* …so on a phone the weak sheet simply is not stacked over the strong
         one; the rewrite is told by the sentences instead. */
      .sv-phone .rw-abs { display: none; }

      /* 04 · the profile */
      .lk-stage { position: relative; }
      .lk-card { position: absolute; inset-inline-start: 0; top: 2%; width: 74%; }
      .lk-card-over { position: absolute; inset: 0; }
      .lk-rank { position: absolute; inset-inline-end: 0; bottom: 6%; width: 56%; z-index: 3; }
      .lk-rank-over { position: absolute; inset: 0; }
      .hl { display: flex; flex-direction: column; gap: 10px; }
      .hl-weak { font-size: clamp(14px, 1.6vw, 20px); font-weight: 600; color: var(--text-muted, #9aa0aa); }
      .hl-strong { font-size: clamp(17px, 2.2vw, 29px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.3; }

      /* 05 · the stack */
      .wk-layer { position: absolute; inset: 0; }

      /* 06 · the dashboard */
      .db-vars { width: 100%; }
      .db-tag { position: absolute; z-index: 30; inset-inline: 0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .db-tag-raw { top: clamp(80px, 13vh, 130px); }
      .db-tag-out { top: clamp(80px, 13vh, 130px); color: var(--accent, #1495ff); }
      .db-acts { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 22px; }

      /* 07 · the package */
      .bd-dash { width: 100%; }
      .bd-name { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .bd-price { display: inline-flex; align-items: baseline; flex-wrap: wrap; justify-content: center; gap: 12px; }
      .bd-price em { font-size: 12.5px; font-style: normal; color: var(--text-muted, #8b8b8b); }
      .bd-price s { text-decoration-thickness: 1px; }

      /* typography */
      .mega { margin: 0; font-size: clamp(34px, 10.5vw, 116px); font-weight: 900; letter-spacing: -0.045em; line-height: 0.95; white-space: pre-line; }
      .mega-2 { font-size: clamp(28px, 8.6vw, 86px); letter-spacing: -0.04em; line-height: 1.0; }
      .mega-sub { max-width: 34ch; margin: clamp(16px, 2vw, 28px) auto 0; font-size: clamp(14px, 1.25vw, 18px); line-height: 1.55; color: var(--text-secondary); }
      .big { margin: 0; font-size: clamp(25px, 7.2vw, 58px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.04; white-space: pre-line; }
      .lede { margin: 0; max-width: 42ch; font-size: clamp(14px, 1.15vw, 17px); line-height: 1.55; color: var(--text-secondary); }
      @media (hover: hover) and (pointer: fine) {
        .mega { font-size: clamp(38px, 7.6vw, 116px); }
        .mega-2 { font-size: clamp(32px, 5.6vw, 86px); }
        .big { font-size: clamp(28px, 3.9vw, 58px); }
      }

      /* chapter mark */
      .chap { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .chap i { font-style: normal; padding-inline-end: 10px; border-inline-end: 1px solid currentColor; opacity: 0.5; }

      /* prices */
      .money { font-variant-numeric: tabular-nums; }
      .money-xl { font-size: clamp(28px, 3.4vw, 44px); font-weight: 900; letter-spacing: -0.035em; }
      .cta-p { font-size: 13px; color: var(--text-muted, #8b8b8b); }
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
      .ba { display: flex; flex-direction: column; gap: clamp(16px, 2.2vw, 28px); text-align: start; width: 100%; }
      .ba-before, .ba-after { margin: 0; font-size: clamp(17px, 2.3vw, 31px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.32; }
      .ba-before { color: var(--text-muted, #a5a5a0); }
      .ba-line-wrap { position: relative; display: inline; }
      .ba-strike { position: absolute; left: 0; right: 0; top: 52%; height: 2px; background: currentColor; opacity: 0.6; }
      .ba-after { color: var(--text-primary); }
      .ba-k { display: block; margin-bottom: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted, #a5a5a0); }
      .ba-k-on { color: var(--accent, #1495ff); }
      .ba-why { display: block; margin-top: 10px; font-size: clamp(12px, 1.05vw, 14px); font-weight: 600; letter-spacing: 0; line-height: 1.5; color: var(--text-muted, #a5a5a0); opacity: 0.85; }

      /* the rewritten line, assembled clause by clause */
      .rw-line { display: inline; }
      /* inline-block, not inline: transforms do not apply to inline boxes,
         and each clause needs to lift as it lands */
      .rw-cl { display: inline-block; border-radius: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; padding: 0.04em 0.1em; margin-inline: -0.1em; }
      .rw-note { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: clamp(11px, 1vw, 13px); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent, #1495ff); }
      .rw-note b { font-weight: 700; display: inline-block; }
      .rw-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #1495ff); box-shadow: 0 0 0 4px rgba(20,149,255,0.16); }

      /* ── GPU LAYER DISCIPLINE ──
         will-change is a promise to the compositor that costs a texture per
         element. On a laptop, promoting objects that genuinely all move at
         once is a good trade. On a phone the same declaration asks for
         twenty-plus full-size layers, and past a certain count the compositor
         spends longer managing them than it saved — which is why "add
         will-change" can make a page slower. So the phone promotes ONE thing:
         the hero paper, the only object it animates per frame. Everything
         else moves on transform and opacity for half a second, and the
         compositor promotes those on demand perfectly well. */
      .sv-phone .hero-paper { will-change: transform; }
      @media (hover: hover) and (pointer: fine) {
        .fo { will-change: transform, opacity; }
        .wk-layer { will-change: transform, opacity, filter; }
        .rw-cl { will-change: opacity, transform, filter; }
      }

      /* The closing section is genuinely independent — no sticky, no scrubbed
         value, nothing measured against the viewport — so it can be skipped
         until it is near. Deliberately NOT applied to the scenes:
         content-visibility establishes containment, and containment breaks
         sticky positioning. */
      .fin { content-visibility: auto; contain-intrinsic-size: auto 620px; }

      /* ── no placeholders, ever ──
         Every stage reserves its box through aspect-ratio and every object is
         sized as a percentage of that box, so an image that has not decoded
         yet leaves the composition it is going to occupy, never a grey
         skeleton and never a gap that collapses and re-expands. */
      .stage img { background: transparent; }

      @media (prefers-reduced-motion: reduce) {
        .fo-e, .scn > .pin > .copy, .rw-cl, .ba-strike, .ba-why, .hl-strong,
        .lk-card-over, .lk-rank-over, .sp-shot, .db-vars {
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
          clip-path: none !important;
        }
        .sv-phone .db-vars { --kpi: 1; --bars: 1; --ring: 1; }
        .fo { will-change: auto; }
      }

      /* ══════════════════ ARABIC PASS ══════════════════

         The display scale above is tuned for Latin: 0.95–1.04 line-heights
         and -0.04em tracking. Thmanyah's Arabic content box is 1.25em tall
         before line-height applies, so those numbers make two-line Arabic
         headings overlap — and a stage is overflow: hidden, which turns the
         overlap into clipping. Arabic gets its own numbers, not extra
         padding: headings 1.15–1.3, body 1.7–1.85, and buttons that grow
         through line-height so the pills stay the height they are in
         English. */

      [dir="rtl"] .mega { line-height: 1.18; }
      [dir="rtl"] .mega-2 { line-height: 1.22; }
      [dir="rtl"] .big { line-height: 1.26; }
      [dir="rtl"] .mega-sub,
      [dir="rtl"] .lede { line-height: 1.8; max-width: 40ch; }

      /* Chapter marks and kickers: uppercase does nothing in Arabic, and the
         tracking is already neutralised globally — what they need is room. */
      [dir="rtl"] .chap,
      [dir="rtl"] .wk-kick,
      [dir="rtl"] .db-tag,
      [dir="rtl"] .bd-name,
      [dir="rtl"] .sp-kicker { line-height: 1.7; }
      /* "01 · مراجعة السيرة" — the divider rule belongs on the start side of
         the number in both directions; the number just needs isolating. */
      [dir="rtl"] .chap i { unicode-bidi: isolate; }

      [dir="rtl"] .cta-p,
      [dir="rtl"] .ghost { line-height: 1.7; }

      [dir="rtl"] .ba-before,
      [dir="rtl"] .ba-after { line-height: 1.6; }
      /* Reserves the two lines the Arabic "after" needs while it assembles,
         so the CTA below it doesn't jump — in em, so it tracks the font. */
      [dir="rtl"] .ba-after { min-height: 3.2em; }
      [dir="rtl"] .ba-k { line-height: 1.7; }
      /* The strike sweeps from the start edge, which is the right in Arabic —
         otherwise it crosses the sentence backwards. */
      [dir="rtl"] .ba-strike { transform-origin: right center; }

      [dir="rtl"] .hl-strong { line-height: 1.45; }
      [dir="rtl"] .hl-weak { line-height: 1.6; }

      /* Prices: the figure is Latin, the currency word is Arabic. Isolating
         the pair keeps "1,499 ريال" from reordering next to punctuation. */
      [dir="rtl"] .money { unicode-bidi: isolate; }
      [dir="rtl"] .money-xl { line-height: 1.35; }
      [dir="rtl"] .bd-price em { font-style: normal; line-height: 1.7; }

      [dir="rtl"] .ann-txt i { font-style: normal; }
      [dir="rtl"] .ann-txt b,
      [dir="rtl"] .ann-txt i { line-height: 1.55; }
    `}</style>
  );
}
