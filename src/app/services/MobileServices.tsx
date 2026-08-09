"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { LuArrowRight } from "react-icons/lu";
import CheckoutButton from "@/components/CheckoutButton";
import { CVSheet, LinkedInCard, type Lang } from "./CareerObjects";
import { DashboardCard, WindowCard } from "./WorkObjects";
import { CRUMPLE_FRAMES_M } from "./CrumpledSheet";
import ScrollHint from "./ScrollHint";
import TalkSection from "./TalkSection";
import ComingSoon from "./ComingSoon";
import {
  CAREER_SERVICES,
  COMPLETE_BUNDLE,
  formatPrice,
  priceLabel,
  type CareerService,
} from "@/data/careerServices";
import { onFreezeChange } from "@/lib/checkout";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   /services ON A PHONE — a different product, not a smaller one.

   The desktop page is a continuous scroll film: seven pinned scenes, dozens of
   scrubbed objects, live filters, springs. That is the right thing on a mouse
   wheel and the wrong thing on a thumb, and shrinking it does not fix it —
   the cost is not the layout, it is the *continuous work*.

   So the phone gets an architecture with a single expensive moment in it:

     ONE scrubbed animation ...... the crumpled CV restoring itself. That is
                                   the signature, it is worth a thumb, and it
                                   is the only thing on this page that reads
                                   scroll position at all.
     THEN nothing continuous ..... every service is a self-contained panel
                                   about one viewport tall. A panel plays a
                                   400ms entrance the first time it is seen and
                                   is then STATIC — permanently. Offscreen
                                   panels have no observer, no timer, no RAF,
                                   no canvas, and their visuals are not even
                                   mounted.

   Consequences that matter on a real device, in order of how much they matter:

   · The hero reads `scrollY` and writes styles. It never reads layout during a
     scroll (geometry is cached and only re-measured on resize), so no scroll
     event can force a synchronous layout. There is no spring, no lerp, no rAF
     hop between the finger and the paper: the frame drawn is the frame the
     scroll position names, this frame.
   · Exactly one canvas exists, and it stops existing once the hero is behind
     the visitor — the decoded frames are released with it.
   · Nothing is `position: fixed` and animated except the dock, which moves
     once.
   · Prices are printed in the panels. There is no rail tracking the scroll.
   ═══════════════════════════════════════════════════════════════════════ */

const M_W = 560, M_H = 706; // the mobile bake's own pixel size
const SHEET_SCALE = 1080 / 600; // the sheet is the middle 1/1.8 of each frame
const srcOf = (lang: string, i: number) =>
  `/cv/crumple-m-${lang}-${String(i).padStart(2, "0")}.webp`;

/** Section height, in viewport heights. 100 of it is the pin; the rest is travel. */
const HERO_VH = 220;

const COPY = {
  ar: {
    heroH: "خبرتك تستاهل\nظهور أوضح.",
    heroSub: "كل شيء عن مسيرتك موجود، لكنه ما يشتغل مع بعض.",
    dock: ["مراجعة", "كتابة", "إلقاء", "لينكدإن", "بناء", "بيانات"],
    before: "قبل",
    after: "بعد",
    rewriteBefore: "مسؤول عن إدارة الفريق التقني.",
    rewriteAfter: "قدت فريقًا هندسيًا، وأسهمت في إطلاق منتجات رقمية واسعة النطاق.",
    speakKicker: "هيئة الأدب والنشر والترجمة · مسرعة الأعمال",
    workKicker: "أعمال حقيقية · منشورة فعلًا",
    dataKicker: "لوحة حقيقية · هيئة الأفلام",
    linkedinBefore: "مهندس برمجيات",
    linkedinAfter: "قائد هندسة برمجيات | منتجات رقمية | تقنية مالية",
    bundleSep: "بدل",
    finalH: "من الفوضى\nإلى الوضوح.",
    finalSub: "اختر اللي تحتاجه، وأنا أكمل الباقي.",
  },
  en: {
    heroH: "Your career\ndeserves better.",
    heroSub: "Everything about your career is here. None of it is working together.",
    dock: ["Review", "CV", "Speak", "LinkedIn", "Build", "Data"],
    before: "Before",
    after: "After",
    rewriteBefore: "Responsible for managing the technical team.",
    rewriteAfter:
      "Led an engineering team and contributed to launching large-scale digital products.",
    speakKicker: "Literature, Publishing & Translation Commission",
    workKicker: "Real work · already shipped",
    dataKicker: "A real dashboard · Saudi Film Commission",
    linkedinBefore: "Software Engineer",
    linkedinAfter: "Engineering Leader | Product Builder | Fintech",
    bundleSep: "instead of",
    finalH: "Chaos,\nresolved.",
    finalSub: "Pick what you need. I'll take it from there.",
  },
};
type Copy = (typeof COPY)["en"];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Piecewise-linear map, clamped at both ends. No easing anywhere on this page. */
function span(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function useReducedMotion() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return on;
}

/* ══════════════════════════ the one animation ══════════════════════════ */

/**
 * The crumpled CV, restoring.
 *
 * Progress mapping (deliberate, and every band does visible work — there is no
 * stretch of this scene where a swipe produces nothing):
 *
 *    0–15%  a crushed ball        15–32%  the outer folds separate
 *   32–52%  recognisably a CV     52–70%  flattening
 *   70–82%  clean, flat sheet     82–90%  a small settle upward
 *   90–100% 01 Resume Review, revealed
 *
 * The frames carry 0 → 74%; the last 8% before the clean sheet is the
 * cross-dissolve into real DOM, which is what lets the restored CV be readable
 * text rather than a 560px image.
 */
function MobileHero({ lang, c, reduced }: { lang: Lang; c: Copy; reduced: boolean }) {
  const secRef = useRef<HTMLElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const cleanRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const s = CAREER_SERVICES[0];

  useEffect(() => {
    /* Every channel this scene drives is an INLINE style, and an inline style
       outranks the .mh-still rules that render the reduced-motion end state.
       So whenever the scrub stops owning the scene — on unmount, or the moment
       the visitor turns reduced motion on — the inline styles have to go with
       it, or the still frame is drawn behind an invisible one. */
    const reset = () => {
      for (const el of [cvsRef, cleanRef, shadeRef, headRef, copyRef]) {
        el.current?.removeAttribute("style");
      }
      paperRef.current?.removeAttribute("style");
    };

    // Reduced motion gets no scrub, no canvas and no listener — the scene is
    // rendered at its end state by CSS and there is nothing here to run.
    if (reduced) {
      reset();
      return;
    }
    const sec = secRef.current;
    const cvs = cvsRef.current;
    const paper = paperRef.current;
    if (!sec || !cvs || !paper) return;

    const ctx = cvs.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    /* ── geometry, cached ──
       Read once here and again only on resize. A scroll handler that calls
       getBoundingClientRect() forces layout on every single scroll event, and
       on a phone that is precisely the "heavy and delayed" feeling. */
    let top = 0;
    let travel = 1;
    const measure = () => {
      top = sec.offsetTop;
      travel = Math.max(1, sec.offsetHeight - window.innerHeight);
    };

    /* ── frames ──
       12 images, ~8 KB each. Only the first four are urgent; the rest arrive
       while the visitor is reading the headline. */
    const imgs: HTMLImageElement[] = [];
    const ready: boolean[] = new Array(CRUMPLE_FRAMES_M).fill(false);
    let live = true;

    let lastFrame = -1;
    let lastMix = -1;
    let lastP = -1;

    const drawFrames = (t: number) => {
      // t^1.25: enough of a slow start that the ball still reads as a ball,
      // not enough to waste a swipe on it.
      const k = Math.pow(t, 1.25) * (CRUMPLE_FRAMES_M - 1);
      const lo = Math.min(CRUMPLE_FRAMES_M - 2, Math.floor(k));
      const f = k - lo;
      // late-weighted dissolve — two silhouettes are least visible that way
      const q = Math.round(f * f * (3 - 2 * f) * f * 100) / 100;
      if (lo === lastFrame && q === lastMix) return;
      lastFrame = lo;
      lastMix = q;
      if (!ready[lo]) return;
      ctx.clearRect(0, 0, M_W, M_H);
      ctx.drawImage(imgs[lo], 0, 0, M_W, M_H);
      if (q > 0 && ready[lo + 1]) {
        ctx.globalAlpha = q;
        ctx.drawImage(imgs[lo + 1], 0, 0, M_W, M_H);
        ctx.globalAlpha = 1;
      }
    };

    /**
     * One write pass. Called straight from the scroll event — no
     * requestAnimationFrame in between, because a rAF hop puts the paper one
     * frame behind the finger and that lag is the entire complaint.
     */
    const paint = () => {
      const p = clamp01((window.scrollY - top) / travel);
      if (p === lastP) return;
      lastP = p;

      // frames own 0 → 0.74
      drawFrames(span(p, 0, 0.74));

      // the crushed sheet hands over to real DOM between 0.66 and 0.78
      const handoff = span(p, 0.66, 0.78);
      cvs.style.opacity = `${1 - handoff}`;
      if (cleanRef.current) {
        cleanRef.current.style.opacity = `${handoff}`;
        // it arrives fractionally over-sized and settles, like paper releasing
        cleanRef.current.style.transform = `scale(${lerp(1.04, 1, handoff)})`;
      }

      /* travel + settle. The ball drifts in from the side, grows to fill the
         screen as it opens, then steps up and back to make room for 01. */
      const inTravel = span(p, 0, 0.42);
      const settle = span(p, 0.8, 0.92);
      const x = lerp(24, 0, inTravel);
      const y = lerp(22, 0, inTravel) + lerp(0, -26, settle);
      /* LIFT. The wrapper is sized for a flat A4, but a crushed ball is only
         about a fifth of the frame it is baked into — at scale 1 it renders as
         a speck on a 390px screen. So the whole object starts at 2.1× and
         shrinks to 1 as it opens, which is also the correct physics: a ball
         that unfolds into a sheet does not grow, the sheet it becomes is
         simply wider than the ball was. The clean DOM sheet shares this
         transform, so the two can never disagree about size. */
      const scale = lerp(2.1, 1, span(p, 0, 0.62)) * lerp(1, 0.62, settle);
      const rot = lerp(-9, 0, span(p, 0, 0.72));
      paper.style.transform = `translate3d(${x * (lang === "ar" ? -1 : 1)}%, ${y}%, 0) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;

      // a grounding shadow that tightens under the ball and spreads as it opens
      if (shadeRef.current) {
        const o = lerp(0.3, 0.12, span(p, 0, 0.74));
        shadeRef.current.style.opacity = `${o.toFixed(3)}`;
        shadeRef.current.style.transform = `scale(${lerp(0.4, 1, span(p, 0, 0.74)).toFixed(3)}, ${lerp(0.34, 0.9, span(p, 0, 0.74)).toFixed(3)})`;
      }

      // headline out early, service copy in at the very end
      if (headRef.current) {
        const o = 1 - span(p, 0.05, 0.18);
        headRef.current.style.opacity = `${o}`;
        headRef.current.style.visibility = o > 0.01 ? "visible" : "hidden";
      }
      if (copyRef.current) {
        const o = span(p, 0.88, 1);
        copyRef.current.style.opacity = `${o}`;
        copyRef.current.style.transform = `translate3d(0, ${lerp(18, 0, o)}px, 0)`;
        copyRef.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
      }
    };

    for (let i = 0; i < CRUMPLE_FRAMES_M; i++) {
      // `window.Image`, not `Image` — the latter is next/image in this module
      const img = new window.Image();
      img.decoding = "async";
      if (i < 4) img.fetchPriority = "high";
      img.onload = () => {
        if (!live) return;
        ready[i] = true;
        if (i === lastFrame || i === lastFrame + 1) {
          lastFrame = -1;
          lastP = -1;
          paint();
        }
      };
      img.src = srcOf(lang, i);
      imgs.push(img);
    }

    /* ── listening only while the hero is on screen ──
       Once the visitor is into the services there is no scroll listener, no
       canvas paint and no work of any kind left from this component. */
    let listening = false;
    let onScreen = false;
    let paused = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) window.addEventListener("scroll", paint, { passive: true });
      else window.removeEventListener("scroll", paint);
    };
    const sync = () => listen(onScreen && !paused);

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) {
          measure();
          lastP = -1;
          paint();
        }
        sync();
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(sec);

    // A purchase outranks the scene: stop painting the moment checkout starts,
    // and pick it back up only if the visitor returns from the overlay.
    const offFreeze = onFreezeChange((frozen) => {
      paused = frozen;
      sync();
      if (!frozen && onScreen) {
        lastP = -1;
        paint();
      }
    });

    const onResize = () => {
      measure();
      lastP = -1;
      paint();
    };
    window.addEventListener("resize", onResize);

    measure();
    paint();

    return () => {
      live = false;
      listen(false);
      io.disconnect();
      offFreeze();
      window.removeEventListener("resize", onResize);
      for (const img of imgs) img.onload = null;
      reset();
    };
  }, [lang, reduced]);

  return (
    <section ref={secRef} className={`mh${reduced ? " mh-still" : ""}`}>
      {/* Where the dock and the closing CTA land when they say "Review": not
          the top of the hero — which would replay the whole restoration — but
          the point in it where the service is actually on screen. */}
      <span id={s.id} className="mh-anchor" aria-hidden />
      <div className="mh-pin">
        <div className="mh-stage">
          <div ref={headRef} className="mh-head">
            <h1 className="mh-h1">{c.heroH}</h1>
            <p className="mh-sub">{c.heroSub}</p>
          </div>

          <div ref={paperRef} className="mh-paper">
            <span ref={shadeRef} className="mh-shade" aria-hidden />
            {!reduced && (
              <canvas ref={cvsRef} width={M_W} height={M_H} className="mh-canvas" aria-hidden />
            )}
            <div ref={cleanRef} className="mh-clean">
              <CVSheet lang={lang} variant="strong" />
            </div>
          </div>

          <div ref={copyRef} className="mh-copy">
            {/* No supporting paragraph here, unlike the panels below. The
                restored sheet IS the argument, and on an 844px screen the two
                lines it would add are the difference between the buy button
                being on screen and being under the navigation. */}
            <ServiceHead index={s.index} name={s.name[lang]} />
            <h2 className="mp-h">{s.headline[lang]}</h2>
            <PriceLine priceText={priceLabel(s.price, lang)} note={s.delivery[lang]} />
            {/* 01 is live and has been since this page existed; the guard is
                here so the hero cannot outlive that fact silently. */}
            {s.checkoutUrl && (
              <CheckoutButton
                serviceId={s.id}
                href={s.checkoutUrl}
                label={s.cta[lang]}
                lang={lang}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════ product panels ══════════════════════════ */

/**
 * Mount-when-near + animate-once. Two questions, two answers, two margins:
 *
 *   near  (±90% of a viewport)  → mount the visual. One chapter ahead, one
 *                                 behind; everything else is an empty box of
 *                                 the right size, so nothing ever reflows when
 *                                 a visual appears or is released.
 *   seen  (12% into the screen) → run the entrance. ONCE. This observer then
 *                                 disconnects itself and the panel is inert
 *                                 DOM for the rest of the session — no timer,
 *                                 no observer, no animation, nothing.
 *
 * They are separate observers on purpose: an observer with a positive root
 * margin cannot also answer "is it actually visible", because once the element
 * is inside the padded root it stops producing callbacks.
 */
function usePanelState(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mount = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "90% 0px 90% 0px",
    });
    mount.observe(el);

    const enter = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        enter.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    enter.observe(el);

    return () => {
      mount.disconnect();
      enter.disconnect();
    };
  }, [ref]);

  return { near, seen };
}

function ServiceHead({ index, name }: { index: string; name: string }) {
  return (
    <span className="mp-k">
      <i>{index}</i>
      {name}
    </span>
  );
}

function PriceLine({ priceText, note }: { priceText: string; note?: string }) {
  return (
    <span className="mp-price">
      <b>{priceText}</b>
      {note && <em>{note}</em>}
    </span>
  );
}

/**
 * One service, one screen. Visual, number, name, one line, price, buy.
 *
 * The entrance is three CSS properties for 420ms and then it is over — the
 * class is added once and never removed, so the panel holds no state, runs no
 * timer, and is never touched again for the life of the page.
 */
function ProductPanel({
  s,
  lang,
  visual,
  tall = false,
  fade = false,
}: {
  /** The service itself — the panel reads its own price, URL and status. */
  s: CareerService;
  lang: Lang;
  /** Rendered only while the panel is the current or an adjacent chapter. */
  visual: (near: boolean) => ReactNode;
  /** Visuals that need more room than the default box. */
  tall?: boolean;
  /** The visual is taller than its box on purpose — fade the crop. */
  fade?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { near, seen } = usePanelState(ref);
  const tracked = useRef(false);

  useEffect(() => {
    if (seen && !tracked.current) {
      tracked.current = true;
      trackEvent("service_card_view", { service: s.id });
    }
  }, [seen, s.id]);

  return (
    <section ref={ref} id={s.id} className={`mp${seen ? " is-in" : ""}`}>
      <div className={`mp-vis${tall ? " mp-vis-tall" : ""}${fade ? " mv-fade" : ""}`}>
        {visual(near)}
      </div>
      <div className="mp-body">
        <ServiceHead index={s.index} name={s.name[lang]} />
        {/* A panel headline is one line of a phone screen; the film's line
            breaks are not its line breaks. */}
        <h2 className="mp-h">{s.headline[lang].replace("\n", " ")}</h2>
        <p className="mp-o">{s.outcome[lang]}</p>
        {/* The panel does not decide whether a service can be bought — the
            service does, and a coming-soon one has no price and no URL to
            render even if this were wrong. */}
        {s.status === "live" && s.checkoutUrl ? (
          <>
            <PriceLine priceText={priceLabel(s.price, lang)} note={s.delivery[lang]} />
            <CheckoutButton serviceId={s.id} href={s.checkoutUrl} label={s.cta[lang]} lang={lang} />
          </>
        ) : (
          <ComingSoon serviceId={s.id} label={s.cta[lang]} lang={lang} />
        )}
      </div>
    </section>
  );
}

/* ── the six visuals. One strong image each, none of them animated. ── */

function BeforeAfter({ c }: { c: Copy }) {
  return (
    <div className="ba2">
      <div className="ba2-row ba2-before">
        <span className="ba2-k">{c.before}</span>
        <p>{c.rewriteBefore}</p>
      </div>
      <div className="ba2-row ba2-after">
        <span className="ba2-k">{c.after}</span>
        <p>{c.rewriteAfter}</p>
      </div>
    </div>
  );
}

const PROJECTS: { src: string; url: string; alt: string }[] = [
  { src: "/alrajhi2026.png", url: "alrajhibank.com.sa", alt: "Al Rajhi Bank" },
  { src: "/wijhut2026.png", url: "wijhut.com", alt: "Wijhut" },
  { src: "/munasib2026.png", url: "munaaseb.com", alt: "Munaaseb" },
  { src: "/ithnin2026.png", url: "ithnain.com", alt: "Ithnain" },
];

/* ══════════════════════════ the service dock ══════════════════════════ */

/**
 * Six words and a thumb. It appears once the signature moment is behind the
 * visitor and then never moves again — the only fixed element on the page.
 * Tapping scrolls natively; the page is not animated to get there.
 */
function ServiceDock({ c, lang }: { c: Copy; lang: Lang }) {
  const [on, setOn] = useState(false);
  const ids = useMemo(() => CAREER_SERVICES.map((s) => s.id), []);

  /* The dock arrives once the hero — and the hero's own buy button with it —
     is genuinely off the top of the screen, and then never moves again. It is
     hidden during checkout by CSS (.checkout-open), not by state, so dismissing
     the overlay brings it straight back.

     The hero section is the observed element rather than a marker after it: a
     1px marker is a zero-area target, and a zero-area target is exactly the
     case IntersectionObserver is least dependable about. */
  useEffect(() => {
    const hero = document.querySelector(".mh");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setOn(!e.isIntersecting && e.boundingClientRect.bottom <= 0),
      { rootMargin: "0px 0px -70% 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const go = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("service_dock_nav", { service: id });
  }, []);

  return (
    <nav className={`mdk${on ? " mdk-on" : ""}`} aria-label={lang === "ar" ? "الخدمات" : "Services"}>
      <div className="mdk-scroll">
        {ids.map((id, i) => (
          <button key={id} type="button" className="mdk-i" onClick={() => go(id)}>
            {c.dock[i]}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ══════════════════════════════ the page ══════════════════════════════ */

export default function MobileServices({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const reduced = useReducedMotion();
  const b = COMPLETE_BUNDLE;
  const bundleRef = useRef<HTMLElement>(null);
  const { near: bundleNear, seen: bundleSeen } = usePanelState(bundleRef);

  const [review, writing, speaking, linkedin, build, data] = CAREER_SERVICES;

  return (
    <main className="mv">
      <MobileHero lang={lang} c={c} reduced={reduced} />

      <ProductPanel
        s={writing}
        lang={lang}
        visual={() => <BeforeAfter c={c} />}
      />

      <ProductPanel
        s={speaking}
        lang={lang}
        visual={(near) =>
          near ? (
            <figure className="mv-photo">
              <Image
                src="/speaking-stage.jpg"
                alt={lang === "ar" ? "تركي المالكي على المسرح" : "Turki Almalki on stage"}
                fill
                sizes="100vw"
              />
              <figcaption>{c.speakKicker}</figcaption>
            </figure>
          ) : null
        }
      />

      <ProductPanel
        s={linkedin}
        lang={lang}
        fade
        visual={(near) =>
          near ? (
            <div className="mv-stack">
              <span className="mv-hl mv-hl-weak">{c.linkedinBefore}</span>
              <span className="mv-hl mv-hl-strong">{c.linkedinAfter}</span>
              <div className="mv-card">
                <LinkedInCard lang={lang} variant="strong" />
              </div>
            </div>
          ) : null
        }
      />

      <ProductPanel
        s={build}
        lang={lang}
        fade
        visual={(near) =>
          near ? (
            <div className="mv-work">
              <span className="mv-kick">{c.workKicker}</span>
              {/* The other shipped products are NAMED, not shown: four more
                  screenshots do not fit the screen budget and would each be too
                  small to read. They sit above the shot so the crop, when it
                  happens, only ever falls on the screenshot. */}
              <span className="mv-more">
                {PROJECTS.slice(1).map((pr) => (
                  <i key={pr.src}>{pr.alt}</i>
                ))}
              </span>
              <WindowCard {...PROJECTS[0]} />
            </div>
          ) : null
        }
        tall
      />

      <ProductPanel
        s={data}
        lang={lang}
        fade
        visual={(near) =>
          near ? (
            <div className="mv-dash">
              <span className="mv-kick">{c.dataKicker}</span>
              <DashboardCard lang={lang} />
            </div>
          ) : null
        }
        tall
      />

      {/* ── 07 the bundle ──
          Everything above, assembled. Four static tiles built from visuals the
          visitor has already met, one entrance, a headline, a price, a button.
          No second film. */}
      <section ref={bundleRef} id={b.id} className={`mp mp-bundle${bundleSeen ? " is-in" : ""}`}>
        <div className="mp-vis mp-vis-tall">
          {bundleNear && (
            <div className="mv-grid">
              <span className="mv-tile mv-tile-cv">
                <CVSheet lang={lang} variant="strong" />
              </span>
              <span className="mv-tile">
                <LinkedInCard lang={lang} variant="strong" />
              </span>
              <span className="mv-tile mv-tile-ph">
                <Image
                  src="/speaking-portrait.jpg"
                  alt={lang === "ar" ? "تركي المالكي" : "Turki Almalki"}
                  fill
                  sizes="45vw"
                />
              </span>
              <span className="mv-tile mv-tile-ph">
                <Image src="/alrajhi2026.png" alt="Al Rajhi Bank" fill sizes="45vw" />
              </span>
            </div>
          )}
        </div>
        <div className="mp-body">
          <ServiceHead index={b.index} name={b.name[lang]} />
          <h2 className="mp-h">{b.headline[lang].replace("\n", " ")}</h2>
          <p className="mp-o">{b.outcome[lang]}</p>
          <span className="mp-price mp-price-xl">
            <b>{formatPrice(b.price, lang)}</b>
            <em>
              {c.bundleSep} <s>{formatPrice(b.individualTotal, lang)}</s>
            </em>
          </span>
          <CheckoutButton
            serviceId={b.id}
            href={b.checkoutUrl}
            label={b.cta[lang]}
            lang={lang}
            size="lg"
          />
        </div>
      </section>

      {/* Everyone the price list did not fit, caught before they leave. */}
      <TalkSection lang={lang} />

      <section className="mv-fin">
        <h2 className="mv-fin-h">{c.finalH}</h2>
        <p className="mp-o">{c.finalSub}</p>
        <div className="mv-fin-a">
          <button
            type="button"
            className="cta"
            onClick={() =>
              document
                .getElementById(review.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {review.name[lang]}
            <LuArrowRight size={15} className="cta-i" />
          </button>
          {/* No second "talk to me" here: the consultation section directly
              above this one is that offer, made properly. */}
        </div>
      </section>

      <ServiceDock c={c} lang={lang} />
      {/* First-load guidance only. It removes itself on the first drag or
          40px of scroll and does not come back. */}
      <ScrollHint lang={lang} variant="swipe" />
      <MobileStyles />
    </main>
  );
}

/* ══════════════════════════════ styles ══════════════════════════════ */

function MobileStyles() {
  return (
    <style>{`
      .mv { background: #FBFBF9; color: #0d0e12; overflow-x: clip; }
      [data-theme="dark"] .mv { background: #0d0e12; color: #f0f0ef; }

      /* Gentle, never mandatory. A panel is exactly one screen and asks to line
         up with the top of it — but the browser is free to ignore that whenever
         the finger disagrees, which is the whole reason it is proximity. */
      html:has(.mv) { scroll-snap-type: y proximity; scroll-behavior: auto; }
      html:has(.mv) .mp { scroll-snap-align: start; scroll-snap-stop: normal; }

      /* ─────────────── hero ─────────────── */
      .mh { position: relative; height: ${HERO_VH}vh; }
      /* reduced motion: one still frame of the same scene, at its end state */
      .mh-still { height: auto; }
      .mh-still .mh-pin { position: static; }
      .mh-still .mh-head { display: none; }
      .mh-still .mh-clean { opacity: 1; }
      .mh-still .mh-shade { display: none; }
      .mh-still .mh-paper { transform: translate3d(0, -26%, 0) scale(0.62); }
      .mh-still .mh-copy { opacity: 1; }
      .mh-pin { position: sticky; top: 0; height: 100svh; }
      .mh-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
      /* Scrolling this to the top of the viewport puts the scene at ~90% —
         the point where 01 is revealed. It is a fraction of the SECTION, and
         the section is (HERO_VH - 100)vh of travel followed by the pin, so
         0.9 of the travel is 0.9 * (HERO_VH - 100) / HERO_VH of the height. */
      .mh-anchor {
        position: absolute; inset-inline: 0; height: 1px; visibility: hidden;
        top: ${((0.9 * (HERO_VH - 100)) / HERO_VH) * 100}%;
      }

      .mh-head {
        position: absolute; z-index: 5; inset-inline: 0; top: 9svh;
        padding-inline: 22px; text-align: center; pointer-events: none;
      }
      /* The paper travels under the headline for the first fifth of the scene.
         A radial wash keeps the type readable without a box around it — the
         same device the desktop film uses, and it costs one static gradient. */
      .mh-head::before {
        content: ""; position: absolute; left: 50%; top: 46%; z-index: -1;
        width: 130%; height: 190%; transform: translate(-50%, -50%); border-radius: 50%;
        background: radial-gradient(closest-side, rgba(251,251,249,0.92) 0%, rgba(251,251,249,0.6) 56%, rgba(251,251,249,0) 100%);
      }
      [data-theme="dark"] .mh-head::before {
        background: radial-gradient(closest-side, rgba(13,14,18,0.92) 0%, rgba(13,14,18,0.6) 56%, rgba(13,14,18,0) 100%);
      }
      .mh-h1 { margin: 0; font-size: clamp(34px, 10.5vw, 58px); font-weight: 900; letter-spacing: -0.04em; line-height: 0.98; white-space: pre-line; }
      .mh-sub { max-width: 26ch; margin: 16px auto 0; font-size: 14.5px; line-height: 1.55; color: var(--text-secondary); }

      .mh-paper {
        position: absolute; z-index: 3; left: 50%; top: 50%;
        width: 62vw; max-width: 340px; aspect-ratio: 600 / 848;
        margin-left: -31vw; margin-top: -18svh;
        container-type: inline-size;
        transform-origin: center; will-change: transform;
      }
      @media (min-width: 549px) { .mh-paper { margin-left: -170px; } }

      /* Both renderings occupy the same box; only their opacity differs. The
         canvas overhangs because the sheet is the middle 1/1.8 of the bake. */
      .mh-canvas {
        position: absolute; left: -${((SHEET_SCALE - 1) / 2) * 100}%; top: 50%;
        width: ${SHEET_SCALE * 100}%; max-width: none; height: auto;
        transform: translateY(-50%);
      }
      .mh-clean { position: absolute; inset: 0; opacity: 0; transform-origin: center; }
      .mh-clean .sheet { height: 100%; }
      .mh-shade {
        position: absolute; left: 50%; top: 64%; width: 80%; aspect-ratio: 2.6 / 1;
        margin-left: -40%; border-radius: 50%; transform-origin: center;
        background: radial-gradient(closest-side, rgba(30,26,20,0.85) 0%, rgba(30,26,20,0.4) 52%, rgba(30,26,20,0) 100%);
      }

      .mh-copy {
        /* clears the site's own fixed navigation pill */
        position: absolute; z-index: 6; inset-inline: 0;
        bottom: calc(116px + env(safe-area-inset-bottom, 0px));
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        width: min(460px, calc(100% - 36px)); margin-inline: auto;
        text-align: center; opacity: 0;
      }
      /* The hero headline is one notch smaller than a panel's: it shares its
         screen with the restored sheet, which a panel headline never does. */
      .mh-copy .mp-h { font-size: clamp(24px, 7vw, 32px); }
      .mh-copy .ck { width: 100%; justify-content: center; margin-top: 4px;
      }

      /* ─────────────── product panels ─────────────── */
      .mp {
        display: flex; flex-direction: column; justify-content: center; gap: 18px;
        /* Bottom padding clears BOTH the service dock and the site's own nav
           pill beneath it. Every panel is budgeted so its buy button lands
           above that line — a CTA you have to scroll to find is a CTA that
           does not exist. */
        min-height: 100svh; padding: 52px 22px calc(202px + env(safe-area-inset-bottom, 0px));
      }
      /* Deliberately NOT content-visibility:auto here. The heavy part of a
         panel — the visual — is already unmounted when it is far away, and
         content-visibility on a snap target makes the browser estimate heights
         it is simultaneously trying to snap to, which is how a page ends up
         shifting under a thumb. The cheap win is not worth that. */
      /* A HEIGHT budget, not an aspect ratio: the panel's job is to fit one
         screen, so the visual gets a fixed share of it and whatever is inside
         adapts. Anything naturally taller is cropped, deliberately, with a
         fade (see .mv-fade) that reads as "there is more of this". */
      .mp-vis {
        position: relative; width: 100%; max-width: 420px; margin-inline: auto;
        height: 30svh; max-height: 310px; overflow: hidden;
        display: grid; place-items: center; container-type: inline-size;
      }
      .mp-vis-tall { height: 35svh; max-height: 360px; }
      /* cropped visuals hang from the top, so the crop is always at the bottom */
      .mv-fade > * { align-self: start; }
      .mv-fade {
        -webkit-mask-image: linear-gradient(180deg, #000 76%, rgba(0,0,0,0.25) 94%, transparent 100%);
                mask-image: linear-gradient(180deg, #000 76%, rgba(0,0,0,0.25) 94%, transparent 100%);
      }
      .mp-body { display: flex; flex-direction: column; align-items: flex-start; gap: 11px; width: 100%; max-width: 460px; margin-inline: auto; }
      .mp-body .ck { margin-top: 6px; width: 100%; justify-content: center; }

      .mp-k { display: inline-flex; align-items: center; gap: 10px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted, #8b8b8b); }
      .mp-k i { font-style: normal; padding-inline-end: 10px; border-inline-end: 1px solid currentColor; opacity: 0.5; }
      .mp-h { margin: 0; font-size: clamp(25px, 7.2vw, 34px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; }
      .mp-o { margin: 0; max-width: 34ch; font-size: 14px; line-height: 1.55; color: var(--text-secondary); }
      .mp-price { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
      .mp-price b { font-size: 28px; font-weight: 900; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; }
      .mp-price em { font-size: 12.5px; font-style: normal; color: var(--text-muted, #8b8b8b); }
      .mp-price-xl b { font-size: 34px; }

      /* ── the entrance. Once, 420ms, then permanently static. ── */
      .mp > * {
        opacity: 0; transform: translate3d(0, 16px, 0) scale(0.98);
        transition: opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 460ms cubic-bezier(0.22,1,0.36,1);
      }
      .mp > .mp-body { transition-delay: 70ms; }
      .mp.is-in > * { opacity: 1; transform: none; }
      @media (prefers-reduced-motion: reduce) {
        .mp > * { opacity: 1; transform: none; transition: none; }
      }

      /* ─────────────── the visuals ─────────────── */
      .ba2 { display: flex; flex-direction: column; gap: 18px; width: 100%; }
      .ba2-row { padding: 18px 18px 20px; border-radius: 14px; border: 1px solid var(--border-subtle, rgba(0,0,0,0.09)); background: rgba(255,255,255,0.6); }
      [data-theme="dark"] .ba2-row { background: rgba(255,255,255,0.03); }
      .ba2-k { display: block; margin-bottom: 9px; font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted, #a5a5a0); }
      .ba2-row p { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.4; }
      .ba2-before p { color: var(--text-muted, #a5a5a0); text-decoration: line-through; text-decoration-thickness: 1px; }
      .ba2-after { border-color: rgba(20,149,255,0.4); }
      .ba2-after .ba2-k { color: var(--accent, #1495ff); }

      .mv-photo { position: relative; width: 100%; height: 100%; margin: 0; border-radius: 16px; overflow: hidden; background: #e9e9e6; }
      .mv-photo img { object-fit: cover; }
      .mv-photo figcaption {
        position: absolute; inset-inline: 0; bottom: 0; padding: 34px 16px 14px;
        background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 100%);
        color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; line-height: 1.5;
      }

      .mv-stack { display: flex; flex-direction: column; align-items: center; gap: 14px; width: 100%; }
      .mv-card { width: 100%; container-type: inline-size; }
      .mv-hl { font-size: 12.5px; font-weight: 700; line-height: 1.5; text-align: center; }
      .mv-hl-weak { color: var(--text-muted, #a5a5a0); text-decoration: line-through; }
      .mv-hl-strong { color: var(--accent, #1495ff); }

      .mv-work { display: flex; flex-direction: column; gap: 14px; width: 100%; }
      .mv-dash { display: flex; flex-direction: column; gap: 12px; width: 100%; container-type: inline-size; }
      .mv-more { display: flex; flex-wrap: wrap; gap: 6px; }
      .mv-more i {
        padding: 4px 10px; border-radius: 999px; font-style: normal; font-size: 11px;
        font-weight: 700; color: var(--text-muted, #8b8b8b);
        border: 1px solid var(--border-subtle, rgba(0,0,0,0.09));
      }
      .mv-kick { font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted, #a5a5a0); }

      .mv-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 12px; width: 100%; height: 100%; }
      .mv-tile { position: relative; overflow: hidden; border-radius: 12px; background: #fff; border: 1px solid var(--border-subtle, rgba(0,0,0,0.08)); container-type: inline-size; }
      [data-theme="dark"] .mv-tile { background: #14161c; }
      /* The documents keep their real proportions and are cropped by the tile,
         which reads as a stack of finished work rather than squashed artwork. */
      .mv-tile > .sheet,
      .mv-tile > .li { position: absolute; inset-inline: 0; top: 0; }
      .mv-tile-ph img { object-fit: cover; }

      /* ─────────────── dock ─────────────── */
      /* Sits directly above the site's own navigation pill — never on top of
         it — and is the only fixed element this page adds. It moves once, when
         it arrives, and then holds still for the rest of the session. */
      .mdk {
        position: fixed; z-index: 42; inset-inline: 0;
        bottom: calc(96px + env(safe-area-inset-bottom, 0px));
        padding: 0; pointer-events: none;
        transform: translate3d(0, 16px, 0); opacity: 0;
        transition: transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease;
      }
      .mdk-on { transform: none; opacity: 1; }
      .mdk-scroll {
        display: flex; gap: 6px; overflow-x: auto; padding: 6px 14px;
        pointer-events: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;
        overscroll-behavior-x: contain;
        -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
                mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
      }
      .mdk-scroll::-webkit-scrollbar { display: none; }
      .mdk-i {
        flex: none; padding: 9px 15px; border: 1px solid var(--border-subtle, rgba(0,0,0,0.09));
        border-radius: 999px; box-shadow: 0 6px 18px -10px rgba(20,22,30,0.4);
        background: color-mix(in srgb, var(--bg-primary, #fff) 86%, transparent);
        backdrop-filter: saturate(1.5) blur(12px);
        color: var(--text-primary); font-family: inherit;
        font-size: 12.5px; font-weight: 700; white-space: nowrap; cursor: pointer;
        touch-action: manipulation; -webkit-tap-highlight-color: transparent;
      }
      [data-theme="dark"] .mdk-i { background: rgba(24,26,33,0.86); }
      .mdk-i:active { transform: scale(0.96); }
      /* The overlay owns the screen while it is up. */
      .checkout-open .mdk { opacity: 0; pointer-events: none; }

      /* ─────────────── closing ─────────────── */
      .mv-fin { padding: 92px 22px calc(190px + env(safe-area-inset-bottom, 0px)); text-align: center; content-visibility: auto; contain-intrinsic-size: auto 460px; }
      .mv-fin-h { margin: 0 0 16px; font-size: clamp(30px, 9vw, 46px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.04; white-space: pre-line; }
      .mv-fin .mp-o { margin-inline: auto; }
      .mv-fin-a { display: flex; flex-direction: column; align-items: center; gap: 18px; margin-top: 32px; }
      .mv-fin-g { font-size: 14px; font-weight: 500; color: var(--text-secondary); text-decoration: underline; text-underline-offset: 4px; }

      /* ══ Arabic pass ══
         Same numbers as the desktop film: Thmanyah's Arabic content box is
         1.25em before line-height, so display tracking has to be relaxed or
         two-line headings collide. */
      [dir="rtl"] .mh-h1 { line-height: 1.2; }
      [dir="rtl"] .mp-h { line-height: 1.3; }
      [dir="rtl"] .mv-fin-h { line-height: 1.24; }
      [dir="rtl"] .mh-sub,
      [dir="rtl"] .mp-o { line-height: 1.85; max-width: 32ch; }
      [dir="rtl"] .mp-k,
      [dir="rtl"] .mv-kick,
      [dir="rtl"] .ba2-k { line-height: 1.7; }
      [dir="rtl"] .mp-k i { unicode-bidi: isolate; }
      [dir="rtl"] .mp-price b { unicode-bidi: isolate; line-height: 1.4; }
      [dir="rtl"] .mp-price em { line-height: 1.7; }
      [dir="rtl"] .ba2-row p { line-height: 1.65; }
      [dir="rtl"] .mv-hl { line-height: 1.65; }
      [dir="rtl"] .mdk-i { line-height: 1.5; }
      [dir="rtl"] .mv-photo figcaption { line-height: 1.7; }
      [dir="rtl"] .mv-fin-g { line-height: 1.7; }
    `}</style>
  );
}
