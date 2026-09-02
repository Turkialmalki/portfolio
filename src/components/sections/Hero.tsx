"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { WORK_HREF } from "@/config/siteFlags";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  DOCKS,
  FlightRoute,
  useFlightPlan,
  useFlightStyle,
  type Flight,
  type PlanFeed,
} from "./heroFlight";

/* ════════════════════════════════════════════════════════════════════════
   A CURATED ARCHIVE OF WORK
   ────────────────────────────────────────────────────────────────────────
   The hero is an archive spread, not a screen of floating cards. It holds
   four objects and each one is a different KIND of evidence:

     · the collage   — photography of the work being done (workshops, stages)
     · the showcase  — one product shown properly: a real dashboard in a
                       browser frame with the real banking apps beside it
     · the metadata  — the marks of the places the work was done for

   The identity sits in the middle of that spread in a grid column of its
   own, which is what guarantees the hard rule: nothing can overlap the
   name, the description or the buttons, because nothing else is ever laid
   out in that column. Separation is structural, not hand-tuned.

   And the spread does not end — it DEPARTS. Scrolling files every object in
   it onto a flight plan (see ./heroFlight): each one leaves its resting
   place, flies its own curve, and docks into the stop on the career timeline
   that it belongs to. The archive is not decoration that fades out; it is
   the timeline, before the timeline has been drawn.
   ════════════════════════════════════════════════════════════════════════ */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** the one breakpoint this file switches composition on */
const PHONE_QUERY = "(max-width: 767px)";

type Bi = { ar: string; en: string };

/**
 * True on phones, read synchronously.
 *
 * A useState + useEffect version would start every render as "desktop" and
 * correct itself a frame later — so returning to the homepage through a
 * client-side navigation would show one frame of the desktop spread before
 * the phone composition took over. useSyncExternalStore gives the server the
 * value it must render (false, so hydration matches) and every render after
 * that the real one.
 */
function useIsPhone() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(PHONE_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* The archive                                                         */
/* ------------------------------------------------------------------ */

/**
 * Where an object sits inside its frame.
 *
 * `x` and `y` offset it from the centre of the frame as a percentage of the
 * frame's width and height, and `w` is its width as a percentage of the
 * frame's width. Every clearance in this file is therefore a RATIO, not a
 * pixel gap: the ~32px separating the two prints at a 372px column is the same
 * fraction of the picture at 1440px and at 320px, so nothing can drift into a
 * collision at a width nobody thought to test.
 */
type Spot = { w: number; x: number; y: number };

/**
 * One photograph in the collage.
 *
 * Every source is a real photograph already in this repository, cropped to
 * the tile it sits in by scripts/bake-archive-photos.mjs — the site is a
 * static export with `images.unoptimized`, so the file in public/ is exactly
 * what a phone downloads. Nothing here is stock and nothing is generated.
 */
type Tile = {
  id: string;
  src: string;
  alt: Bi;
  ratio: number;
  rotate: number;
  /** depth: higher is nearer the front, and drifts further under the pointer */
  z: number;
  /** entrance order, and idle-float phase */
  step: number;
  /** desktop and tablet placement */
  at: Spot;
  /** phone placement — a column, not the fan squeezed */
  atPhone: Spot;
};

/**
 * Two photographs, not four.
 *
 * The fan used to hold four prints and two of them were the problem: one was
 * shot through glass and is soft at any size, and the other was a second
 * standing portrait saying nothing the first did not. What is left is what
 * this column is actually about — the room (a hall full of people, the work
 * being done) with one speaking frame supporting it. A clear primary and a
 * clear secondary is a collage; four similar cards is a stack.
 */
const TILES: Tile[] = [
  {
    id: "room",
    src: "/hero/archive/room.jpg",
    alt: {
      ar: "ورشة المنتج القابل للتنفيذ في مركز الابتكار — منشآت",
      en: "MVP workshop at the Innovation Center — Monsha'at",
    },
    ratio: 3 / 2,
    rotate: -1.8,
    z: 1,
    step: 0,
    at: { w: 84, x: -8, y: -22 },
    atPhone: { w: 92, x: -4, y: -25 },
  },
  {
    id: "stage",
    src: "/hero/archive/stage.jpg",
    alt: {
      ar: "على منصة هيئة الأدب والنشر والترجمة",
      en: "On stage at the Literature, Publishing & Translation Commission",
    },
    ratio: 4 / 5,
    rotate: 3.2,
    z: 3,
    step: 1,
    at: { w: 36, x: 30, y: 25 },
    atPhone: { w: 40, x: 26, y: 27 },
  },
];

/**
 * The organisations the work was done for.
 *
 * One row, one height, natural widths: the marks that are icons stay square
 * and the ones that are lockups stay wide, which is how a real client row
 * reads.
 * Every file is the organisation's official logo. The Monsha'at and Aramco
 * artwork ships square with heavy baked-in whitespace, so
 * scripts/bake-archive-photos.mjs trims each to its measured ink box — that
 * is the only reason those two point at hero/archive rather than the source
 * file. Nothing here is redrawn or stood in for.
 */
type Mark = {
  id: string;
  src: string;
  label: Bi;
  /** intrinsic size of the source file, so the chip can hug its aspect */
  nw: number;
  nh: number;
  /** breathing room inside the chip — marks that ship their own background
      run edge to edge instead */
  pad: number;
  /** the last of the tilt. The chips used to sit at five different heights
      and five real angles, which is what made them read as loose stickers
      under the composition rather than as stops on a line. They share one
      baseline now, and keep barely enough angle to stay hand-set. */
  rotate: number;
};

const MARKS: Mark[] = [
  {
    id: "aramco",
    src: "/hero/archive/mark-aramco.png",
    label: { ar: "أرامكو السعودية", en: "Saudi Aramco" },
    nw: 327,
    nh: 119,
    pad: 9,
    rotate: -1.1,
  },
  {
    id: "alrajhi",
    src: "/alrajhilogo.png",
    label: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
    nw: 1566,
    nh: 1527,
    pad: 11,
    rotate: 0.9,
  },
  {
    id: "emkan",
    src: "/emkanlogo.png",
    label: { ar: "إمكان", en: "Emkan Finance" },
    nw: 209,
    nh: 192,
    pad: 10,
    rotate: -0.7,
  },
  {
    id: "monshaat",
    src: "/hero/archive/mark-monshaat.png",
    label: { ar: "منشآت — الهيئة العامة للمنشآت الصغيرة والمتوسطة", en: "Monsha'at" },
    nw: 640,
    nh: 341,
    pad: 9,
    rotate: 1.2,
  },
  {
    id: "munasib",
    src: "/munasiblogo.jpeg",
    label: { ar: "مناسب", en: "Munasib" },
    nw: 100,
    nh: 100,
    pad: 7,
    rotate: -1.0,
  },
];

/* ------------------------------------------------------------------ */
/* The showcase                                                        */
/* ------------------------------------------------------------------ */

/**
 * The platform window — the anchor of the right column, and the only object
 * in it that is deliberately kept STRAIGHT.
 *
 * The file is the Munaseb landing page lifted out of the laptop render it
 * ships in (see the bake script): screen area only, no bezel, no camera, no
 * reflection. That is the whole reason the hero can draw its own chrome around
 * it — a page still wearing a device frame, inside a second frame, reads as a
 * mockup of a mockup. The timeline keeps the laptop shot, so the same product
 * is framed two different ways rather than pasted in twice.
 *
 * It is also the one artifact that carries words at rest: a caption naming the
 * product and what it is. A screenshot without a name is decoration.
 */
const WINDOW = {
  src: "/hero/archive/window-munaseb.jpg",
  ratio: 16 / 9,
  alt: {
    ar: "الصفحة الرئيسية لمنصة مناسب",
    en: "The Munaseb platform home page",
  } satisfies Bi,
  name: { ar: "مناسب", en: "Munaseb" } satisfies Bi,
  kind: {
    ar: "منصة خدمات مصرفية مفتوحة",
    en: "Open banking platform",
  } satisfies Bi,
  /** width as a percentage of the showcase frame */
  w: 87,
  wPhone: 96,
};

/**
 * The two banking apps, in the foreground.
 *
 * Both files are true full-bleed app screens at the same aspect, which is what
 * makes an honest drawn bezel possible: the UI runs edge to edge inside it and
 * nothing is stretched or letterboxed. The pair used to be one phone and one
 * framed PLATE — a two-phone product shot cropped square — because there was
 * no clean single Al Rajhi screen to hand. There is: the bake script cuts the
 * right-hand phone of that pair out of the render, so both products now stand
 * in the same kind of body at two different sizes.
 *
 * `b` is the distance from the frame's floor, so the pair keeps a common
 * ground while sitting at two different heights.
 */
type Handset = {
  id: string;
  src: string;
  alt: Bi;
  /** intrinsic size of the screen file — the bezel is drawn around it */
  nw: number;
  nh: number;
  rotate: number;
  z: number;
  at: { w: number; x: number; b: number };
  atPhone: { w: number; x: number; b: number };
};

const PHONES: Handset[] = [
  {
    id: "alrajhi",
    src: "/hero/archive/alrajhi-screen.jpg",
    alt: { ar: "تطبيق مصرف الراجحي", en: "The Al Rajhi Bank app" },
    nw: 330,
    nh: 736,
    rotate: -2.8,
    z: 4,
    at: { w: 28, x: 2, b: 0 },
    atPhone: { w: 31, x: 2, b: 0 },
  },
  {
    id: "emkan",
    src: "/hero/emkan-screen.png",
    alt: { ar: "تطبيق إمكان للتمويل", en: "The Emkan Finance app" },
    nw: 538,
    nh: 1200,
    rotate: 3.4,
    z: 3,
    at: { w: 19, x: 39, b: 12 },
    atPhone: { w: 21, x: 43, b: 12 },
  },
];

/* ------------------------------------------------------------------ */
/* Flight plans                                                        */
/* ------------------------------------------------------------------ */

const TILT = {
  ...Object.fromEntries(TILES.map((tile) => [`tile-${tile.id}`, tile.rotate])),
  ...Object.fromEntries(MARKS.map((mark) => [`mark-${mark.id}`, mark.rotate])),
  ...Object.fromEntries(PHONES.map((phone) => [`phone-${phone.id}`, phone.rotate])),
  /* the window is straight at rest and straight when it lands: the anchor of
     the composition is the one thing that never needs to be unwound */
  window: 0,
} as Record<string, number>;

/**
 * Who flies where.
 *
 * Every `dock` is the id of a real stop in the timeline below, so the rule the
 * composition is built on holds all the way through: an object is only in the
 * hero if the career has a place to put it.
 *
 * The windows overlap but never coincide. Reading down this list is watching
 * the archive empty from the earliest work to the latest, which is the same
 * order the route is drawn in — the spread does not scatter, it files.
 *
 * `bow` bends each route sideways at its midpoint and `spin` turns it a little
 * in the air. They are what separate a flight path from a linear tween: with
 * both at zero every object would slide down the same straight diagonal.
 */
function leg(
  id: string,
  dock: string,
  into: "frame" | "mark",
  start: number,
  end: number,
  bow: number,
  spin: number,
  blur: number,
  extra?: Partial<Flight>,
): Flight {
  return { id, dock, into, start, end, bow, spin, blur, tilt: TILT[id] ?? 0, ...extra };
}

const FLIGHTS: Flight[] = [
  leg("mark-aramco", "aramco", "mark", 0.10, 0.48, -44, -8, 1.4),
  /* the banking pair leaves first and separately — one bank, one lender, two
     stops a year apart, so they must not travel as a couple */
  leg("mark-alrajhi", "alrajhi", "mark", 0.13, 0.53, -32, 7, 1.4),
  leg("phone-alrajhi", "alrajhi", "frame", 0.16, 0.57, 72, 9, 2.4, { phone: true }),
  leg("mark-emkan", "emkan", "mark", 0.17, 0.58, -26, -6, 1.4),
  leg("phone-emkan", "emkan", "frame", 0.20, 0.63, 56, -12, 2.2, { phone: true }),
  /* the collage separates in the air: the speaking frame files under the
     practice, the room under the centre it was photographed in */
  leg("tile-stage", "practice", "frame", 0.23, 0.68, -62, -12, 2.4),
  leg("mark-monshaat", "monshaat", "mark", 0.25, 0.71, -22, -5, 1.4),
  leg("tile-room", "monshaat", "frame", 0.28, 0.75, -54, 8, 2.6),
  leg("mark-munasib", "ventures", "mark", 0.30, 0.78, 32, 9, 1.4),
  /* the anchor leaves last and lands last, so the composition empties from
     its edges inwards rather than collapsing all at once */
  leg("window", "ventures", "frame", 0.34, 0.85, 68, -6, 2.8, { phone: true }),
];

/**
 * The phone route: the three product artifacts, one simple column.
 *
 * The collage and the marks stay where they are here and leave with the page
 * as normal — a phone has neither the width for ten curves nor the height to
 * show them without something being clipped, and the collage's box would be
 * left as a screen-tall hole above the route if its prints flew out of it.
 */
const PHONE_FLIGHTS: Flight[] = FLIGHTS.filter((flight) => flight.phone).map((flight) => ({
  ...flight,
  /* one column, so the bow is a nudge rather than a detour */
  bow: flight.bow * 0.22,
  start: flight.start * 0.8,
  end: Math.min(0.88, flight.end * 0.95),
}));

/**
 * The phone route.
 *
 * It shows five stops — the three the travelling artifacts land on, and the two
 * between them — because the route is laid over the box the showcase just
 * emptied and three rows would leave most of it blank. Only docks that actually
 * receive an artifact keep a frame; the rest are the stops ahead, listed.
 */
const PHONE_ROUTE = new Set(["alrajhi", "emkan", "practice", "monshaat", "ventures"]);
const PHONE_FRAMED = new Set(
  PHONE_FLIGHTS.filter((flight) => flight.into === "frame").map((flight) => flight.dock),
);

const PHONE_DOCKS = DOCKS.filter((dock) => PHONE_ROUTE.has(dock.id)).map((dock) => ({
  ...dock,
  mark: false,
  lead: false,
  ratio: PHONE_FRAMED.has(dock.id) ? dock.ratio : undefined,
}));

/* ------------------------------------------------------------------ */

type HeroProps = { ready?: boolean };

export default function Hero({ ready = true }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { t, lang } = useLanguage();
  const reduced = useSafeReducedMotion();
  const isPhone = useIsPhone();
  const still = Boolean(reduced);

  /* ---------------------------------------------------------------- */
  /* The transition                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * One number drives the whole departure.
   *
   * It is read from `.arc-pin` — the box that holds the pinned screen and the
   * runway underneath it — with `start start → end end`, which is exactly the
   * span a `position: sticky` child stays stuck for. So progress 0 is the
   * moment the spread fills the screen and progress 1 is the moment the pin
   * lets go, whatever the runway's height happens to be at this width.
   *
   * Because every pose is a pure function of this value (see `poseAt`), the
   * choreography is reversible, survives a refresh at any offset, and cannot
   * drift out of step with the scrollbar — there is no hijack and no easing
   * that outlives the gesture.
   */
  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });
  /* A light spring only takes the jitter off a trackpad; it converges on the
     scroll value, so the animation stays a function of scroll position. */
  const progress = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 38,
    mass: 0.32,
  });

  const flying = !still;
  const docks = isPhone ? PHONE_DOCKS : DOCKS;
  const flights = isPhone ? PHONE_FLIGHTS : FLIGHTS;

  const {
    stageRef,
    centerRef,
    collageRef,
    showcaseRef,
    railRef,
    tailRef,
    registerCraft,
    registerSlot,
    registerNode,
    plan,
  } = useFlightPlan(flights, flying, ready);

  /**
   * The identity climbs to the head of the route and shrinks about its own top
   * edge, so the name is the first thing read at both ends of the transition —
   * and never lands on top of a dock, because the docks only ever occupy the
   * band below the headroom the plan measured for it.
   */
  const centerPose = useTransform<number, { y: number; scale: number }>(
    [progress, plan.version],
    ([p]) => {
      const { dy, scale } = plan.read().center;
      const t = Math.min(1, Math.max(0, (p - 0.05) / 0.5));
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return { y: dy * e, scale: 1 + (scale - 1) * e };
    },
  );
  const centerY = useTransform(centerPose, (v) => v.y);
  const centerScale = useTransform(centerPose, (v) => v.scale);
  /* the supporting copy stands down early: at 0.58 scale it would be unreadable
     anyway, and the buttons must be out of the docks' way long before they
     arrive */
  const supportOpacity = useTransform(progress, [0.03, 0.24], [1, 0]);

  /**
   * Faded controls must stop being controls. One boolean, flipped once in each
   * direction, is cheaper and far more reliable than trying to keep
   * `pointer-events` in sync with an animating opacity.
   */
  const [supportLive, setSupportLive] = useState(true);
  useMotionValueEvent(progress, "change", (p) => {
    const live = p < 0.2;
    setSupportLive((prev) => (prev === live ? prev : live));
  });

  const atmosphere = useTransform(progress, [0.05, 0.62], [0, 1]);

  /**
   * Every artifact asks for its own plan by id and runs its own transform, so
   * the two routes can file completely different timings for the same object
   * without either of them changing how many hooks this tree runs.
   */
  const flightFor = (id: string) =>
    flying ? flights.find((flight) => flight.id === id) : undefined;

  /* pointer parallax — mouse only, and only ever a few pixels */
  const finePointer = useRef<boolean | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 130, damping: 24, mass: 0.4 });
  const smy = useSpring(my, { stiffness: 130, damping: 24, mass: 0.4 });

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (still || event.pointerType !== "mouse" || !rootRef.current) return;
    if (finePointer.current === null) {
      finePointer.current = window.matchMedia("(pointer: fine)").matches;
    }
    if (!finePointer.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    mx.set(0);
    my.set(0);
  };

  const enter = (delay: number, distance = 18) => ({
    initial: { opacity: 0, y: distance },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: still ? { duration: 0 } : { duration: 0.72, ease: EASE, delay },
  });

  const marksLabel =
    lang === "ar" ? "جهات ومنتجات عملت معها" : "Organisations and products I have worked with";
  /* The row used to be five logos hanging under the composition with nothing
     to say what they were. It is a titled rail now — the horizontal head of
     the vertical route the same marks fly into. */
  const railLabel = lang === "ar" ? "محطات الرحلة" : "Stops on the route";
  /* the phone route carries the three product artifacts only, so on a phone
     the marks never take off — see PHONE_FLIGHTS */
  const marksFly = MARKS.some((mark) => Boolean(flightFor(`mark-${mark.id}`)));

  return (
    <section
      id="home"
      ref={rootRef}
      className="hero-root"
      data-flight={flying ? "on" : "off"}
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      style={{ "--doc-dir": lang === "ar" ? "rtl" : "ltr" } as CSSProperties}
    >
      <div className="hero-field" aria-hidden="true">
        <div className="hero-dots" />
        <div className="hero-aurora hero-aurora-a" />
        <div className="hero-aurora hero-aurora-b" />
        {/* the hero's air giving way to the timeline's, on the same scroll
            that carries the archive down into it */}
        <motion.div
          className="hero-dusk"
          style={flying ? { opacity: atmosphere } : undefined}
        />
        <div className="hero-grain" />
      </div>

      <div className="arc-inner">
        {/*
          The pin. `.arc-screen` sticks to the top of the viewport for exactly
          as long as `.hero-runway` is still passing underneath, which is the
          window the departure plays in. The runway is empty on purpose: it is
          scroll distance, not content, so the page never grows a section the
          reader has to get past — and with the runway at zero height (phones,
          reduced motion) this collapses back into an ordinary hero.
        */}
        <div className="arc-pin" ref={pinRef}>
          <div className="arc-screen" ref={stageRef}>
            {/* Three grid columns: photography, identity, product. */}
            <div className="arc-stage">
              <motion.div className="arc-cell arc-collage" ref={collageRef} {...enter(0.22, 22)}>
                <Collage
                  tiles={TILES}
                  isPhone={isPhone}
                  lang={lang}
                  mx={smx}
                  my={smy}
                  still={still}
                  progress={progress}
                  plan={plan}
                  flightFor={flightFor}
                  registerCraft={registerCraft}
                />
              </motion.div>

              <motion.div
                className="arc-cell arc-center"
                ref={centerRef}
                style={flying ? { y: centerY, scale: centerScale } : undefined}
              >
                <motion.h1 className="hero-name-title" {...enter(0.12, 16)}>
                  {t.hero.name}
                </motion.h1>

                {/*
                  The supporting copy and the buttons stand down together as the
                  identity shrinks, on a wrapper of their own: the entrance
                  animation owns opacity on the elements themselves, and two
                  things driving one property is how a name ends up flickering.
                */}
                <motion.div
                  className="hero-support"
                  data-live={supportLive ? "1" : "0"}
                  style={flying ? { opacity: supportOpacity } : undefined}
                >
                  <motion.p className="hero-positioning" {...enter(0.2, 14)}>
                    {t.hero.positioning}
                  </motion.p>

                  <motion.div className="hero-cta-row" {...enter(0.28, 12)}>
                    <Link
                      href="/services"
                      className="hero-cta-primary"
                      onClick={() => trackEvent("quick_service_cta_click", { location: "hero" })}
                    >
                      {t.hero.ctaPrimary}
                    </Link>

                    <Link
                      href={WORK_HREF}
                      className="hero-cta-secondary"
                      onClick={() => trackEvent("portfolio_cta_click", { location: "hero" })}
                    >
                      {t.hero.ctaSecondary}
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div className="arc-cell arc-showcase" ref={showcaseRef} {...enter(0.3, 22)}>
                <Showcase
                  isPhone={isPhone}
                  lang={lang}
                  mx={smx}
                  my={smy}
                  still={still}
                  progress={progress}
                  plan={plan}
                  flightFor={flightFor}
                  registerCraft={registerCraft}
                />
              </motion.div>
            </div>

            {/* The marks of the places the work was actually done — and, once
                the departure starts, the metadata each stop is labelled with.

                The rule either side of the title is doing real work: it is
                what turns a horizontal row of other people's logos into the
                HEAD of the route, so the reader meets the same five marks
                twice in one movement rather than meeting a logo wall and then
                a timeline. */}
            <motion.div className="arc-rail" {...enter(0.42, 12)}>
              {/* The title stands down with the buttons — but only where the
                  marks actually leave. Left up on a desktop it would still be
                  sitting across the middle of the route long after the five
                  marks it names had flown out from under it; faded out on a
                  phone, where they stay put, it would strand exactly the row
                  of context-free logos it is there to prevent. */}
              <motion.p
                className="arc-rail-head"
                aria-hidden="true"
                style={marksFly ? { opacity: supportOpacity } : undefined}
              >
                <span className="arc-rail-rule" />
                <span className="arc-rail-label">{railLabel}</span>
                <span className="arc-rail-rule" />
              </motion.p>

              <ul className="arc-marks" aria-label={marksLabel}>
                {MARKS.map((mark, index) => (
                  <MarkChip
                    key={mark.id}
                    mark={mark}
                    index={index}
                    lang={lang}
                    progress={progress}
                    plan={plan}
                    flight={flightFor(`mark-${mark.id}`)}
                    registerCraft={registerCraft}
                  />
                ))}
              </ul>
            </motion.div>

            <FlightRoute
              docks={docks}
              flights={flights}
              lang={lang}
              progress={progress}
              railRef={railRef}
              tailRef={tailRef}
              registerSlot={registerSlot}
              registerNode={registerNode}
              still={still}
            />
          </div>

          <div className="hero-runway" aria-hidden="true" />
        </div>
      </div>

      <style>{`
        .hero-root {
          --hero-dot-color: rgba(0,0,0,.075);
          --arc-border: rgba(0,0,0,.08);
          --arc-mount: #fff;
          --arc-surface: #fff;
          /* ONE shadow system, three depths.

             Every object in the hero is lit from the same place and drops on
             to the same floor; what changes between them is only how far off
             that floor they are. Back sits almost on it — a wide, faint,
             barely-offset cast. Front is furthest from it and throws the
             tightest, darkest contact under itself. Reading the composition
             back to front is reading these three in order, which is why they
             are never mixed and never picked per element. */
          --arc-lift-back: 0 26px 52px -30px rgba(15,23,42,.30), 0 5px 14px -9px rgba(15,23,42,.11);
          --arc-lift-mid: 0 22px 38px -22px rgba(15,23,42,.34), 0 5px 12px -8px rgba(15,23,42,.15);
          --arc-lift-front: 0 32px 50px -24px rgba(15,23,42,.42), 0 8px 18px -10px rgba(15,23,42,.20);
          --arc-shadow-soft: 0 16px 32px -20px rgba(15,23,42,.24);
          --arc-muted: var(--text-muted,#8a8a8a);
          --arc-accent: #1e8fff;
          position: relative;
          width: 100%;
          max-width: 100vw;
          overflow-x: clip;
          background: var(--bg-primary,#fff);
          color: var(--text-primary,#090909);
        }

        [data-theme="dark"] .hero-root {
          --hero-dot-color: rgba(255,255,255,.07);
          --arc-border: rgba(255,255,255,.10);
          --arc-mount: #23262e;
          --arc-surface: #171a21;
          --arc-lift-back: 0 28px 56px -30px rgba(0,0,0,.72), 0 5px 14px -9px rgba(0,0,0,.44);
          --arc-lift-mid: 0 24px 42px -22px rgba(0,0,0,.76), 0 5px 12px -8px rgba(0,0,0,.5);
          --arc-lift-front: 0 34px 54px -24px rgba(0,0,0,.82), 0 8px 18px -10px rgba(0,0,0,.56);
          --arc-shadow-soft: 0 18px 36px -20px rgba(0,0,0,.6);
          --arc-accent: #46a7ff;
        }

        /* ---------- field ---------- */

        .hero-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }

        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle,var(--hero-dot-color) 1px,transparent 1.55px);
          background-size: 27px 27px;
          -webkit-mask-image: radial-gradient(ellipse 72% 54% at 50% 34%,transparent 0%,#000 78%);
          mask-image: radial-gradient(ellipse 72% 54% at 50% 34%,transparent 0%,#000 78%);
        }

        .hero-aurora {
          position: absolute;
          width: 44vw;
          aspect-ratio: 1;
          border-radius: 50%;
          filter: blur(120px);
          opacity: .1;
        }

        .hero-aurora-a { left: 20%; top: 10%; background: #55a9ff; }
        .hero-aurora-b { right: 18%; top: 34%; background: #7d5cff; opacity: .06; }

        /* The timeline's air, arriving underneath the hero's on the same
           scroll that carries the archive down into it. */
        .hero-dusk {
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            radial-gradient(ellipse 90% 60% at 50% 108%,
              color-mix(in srgb, var(--arc-accent) 16%, transparent) 0%,
              transparent 70%),
            linear-gradient(180deg,
              transparent 0%,
              color-mix(in srgb, var(--arc-accent) 4%, transparent) 60%,
              color-mix(in srgb, var(--arc-accent) 9%, transparent) 100%);
        }

        .hero-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 140px 140px;
          mix-blend-mode: overlay;
          opacity: .045;
        }

        [data-theme="dark"] .hero-grain { opacity: .08; mix-blend-mode: soft-light; }

        /* ---------- the spread ---------- */

        .arc-inner {
          position: relative;
          z-index: 2;
          width: min(1240px, calc(100% - 48px));
          margin: 0 auto;
        }

        /* svh, not vh: on iOS Safari the toolbar makes vh taller than the
           visible viewport, which would push the cue under the dock on exactly
           the device the dock matters most on. */
        .arc-screen {
          position: relative;
          display: flex;
          flex-direction: column;
          /* the spread and the marks are centred TOGETHER as one block: if the
             grid were allowed to grow instead, the extra height opened up as a
             gap between the buttons and the logos rather than as margin around
             the whole composition */
          justify-content: center;
          min-height: 100svh;
          padding-top: clamp(104px, 12vh, 156px);
          padding-bottom: var(--dock-clear);
        }

        /* Three columns, pinned left to right in BOTH scripts: the
           photography always sits on the left of the spread and the product
           always on the right, exactly as the composition was drawn. Each
           cell hands the document's own direction back to its text. */
        .arc-stage {
          direction: ltr;
          display: grid;
          /* the two side columns are the same width so the identity column
             lands on the page's true centre line */
          grid-template-columns: minmax(0, 372px) minmax(0, 1fr) minmax(0, 372px);
          column-gap: clamp(22px, 3.4vw, 56px);
          align-items: center;
          flex: 0 0 auto;
        }

        .arc-cell { direction: var(--doc-dir, ltr); min-width: 0; }

        /* the identity shrinks about its own top edge, so the name keeps its
           place at the head of the composition instead of drifting through it */
        .arc-center { transform-origin: 50% 0%; }

        .hero-support {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        /* a faded control is not a control */
        .hero-support[data-live="0"] { pointer-events: none; }

        .arc-pin { position: relative; }

        /* Scroll distance, not content. The transition plays out over this and
           nothing is laid out inside it, so the reader never has to travel
           past a section to reach the timeline — they arrive at it. */
        .hero-runway { height: 0; pointer-events: none; }

        /* ---------- centre: identity ---------- */

        .arc-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-inline: clamp(0px, 1vw, 16px);
        }





        /* The name is the anchor. It is free to wrap, it is never given a
           height, and it carries real descender room above and below — the
           tail of ي reaches the floor of Thmanyah's 1.25em glyph box. */
        .hero-name-title {
          width: 100%;
          max-width: 14ch;
          margin: 0 auto;
          color: var(--text-primary,#090909);
          font-size: clamp(52px, 5.8vw, 94px);
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -.042em;
          text-align: center;
          text-wrap: balance;
          padding-block: .04em .1em;
        }

        [dir="rtl"] .hero-name-title {
          max-width: 12ch;
          font-size: clamp(56px, 6.2vw, 100px);
          letter-spacing: 0;
          line-height: 1.24;
          padding-block: .06em .16em;
        }

        .hero-positioning {
          width: 100%;
          max-width: 42ch;
          margin: clamp(12px, 1.6vh, 20px) auto 0;
          color: var(--text-secondary,#656565);
          font-size: clamp(15px, 1.15vw, 17.5px);
          line-height: 1.72;
          text-wrap: balance;
        }

        [dir="rtl"] .hero-positioning { max-width: 38ch; line-height: 1.85; }

        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 11px;
          margin-top: clamp(22px, 3vh, 32px);
        }

        .hero-cta-primary,
        .hero-cta-secondary {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 260ms cubic-bezier(.16,1,.3,1), box-shadow 260ms ease, border-color 260ms ease;
        }

        .hero-cta-primary {
          color: var(--bg-primary,#fff);
          background: var(--text-primary,#0c0d10);
          box-shadow: 0 12px 26px -10px rgba(0,0,0,.44);
        }

        .hero-cta-secondary {
          color: var(--text-primary,#0c0d10);
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
        }

        .hero-cta-primary:hover,
        .hero-cta-secondary:hover { transform: translateY(-2px); }
        .hero-cta-primary:hover { box-shadow: 0 18px 34px -12px rgba(0,0,0,.5); }

        .hero-cta-primary:focus-visible,
        .hero-cta-secondary:focus-visible {
          outline: 3px solid rgba(20,149,255,.4);
          outline-offset: 3px;
        }




        /* ---------- the two frames ---------- */

        /*
          The left column and the right column are given the SAME proportions
          on purpose. They hold completely different things — two prints
          against a window and two handsets — but a person reads the hero as
          two masses either side of a name, and two masses of different height
          read as one of them having been left unfinished.

          Both are also allowed to shrink as one on a short screen: the width
          is capped by the height the screen can actually give them, so the
          composition scales down whole instead of being cropped by the pin.
          Everything inside is a percentage of the frame, so scaling the frame
          scales every clearance with it.
        */
        .arc-collage-frame,
        .arc-showcase-frame {
          /*
            Set by the tallest thing the right column has to hold, in this
            order: the window and its caption (≈240px at a 372px column), the
            ~30px of air under it, and a 230px handset standing on the floor.
            Change the window's crop, its width or the front phone's and this
            number moves with them — too small and the phone drops out of the
            bottom of the frame on to the rail of marks, too large and the air
            under the caption opens past the point where the three objects
            still read as one group.
          */
          --frame-ar: 1.35;
          position: relative;
          width: min(100%, calc((100svh - 340px) / var(--frame-ar)));
          margin-inline: auto;
          aspect-ratio: 1 / var(--frame-ar);
        }

        /* ---------- left: the photo collage ---------- */

        /* --x is a percentage of the FRAME's width and --y of its height,
           which is why they live on left/top: a percentage inside translate()
           would resolve against the tile's own box instead, and the pair would
           collapse into a stack. */
        .arc-tile {
          position: absolute;
          left: calc(50% + var(--x));
          top: calc(50% + var(--y));
          width: var(--w);
          z-index: var(--z);
          transform: translate(-50%, -50%) rotate(var(--r));
        }

        /* Three layers, three owners of the transform property, never the
           same one:
           .-fly is the departure, .-drift is the pointer, .-float is the idle
           keyframes. A CSS animation beats an inline style in the cascade, so
           sharing an element with arc-float silently kills whatever else was
           trying to move it. */
        .arc-tile-fly,
        .arc-tile-drift { display: block; width: 100%; }
        .arc-tile-fly { will-change: transform; }

        .arc-tile-float {
          display: block;
          animation: arc-float 11s ease-in-out infinite;
          animation-delay: calc(var(--step) * -3.4s);
        }

        /* The two prints are mounted the same way and are not the same object:
           the primary carries a wider mount and a rounder corner because it is
           a bigger print, and it sits further back. */
        .arc-tile-inner {
          position: relative;
          display: block;
          width: 100%;
          padding: 5.2%;
          border-radius: 13px;
          background: var(--arc-mount);
          box-shadow: var(--arc-lift-mid);
        }

        .arc-tile[data-tile="room"] .arc-tile-inner {
          padding: 4.2%;
          border-radius: 15px;
          box-shadow: var(--arc-lift-back);
        }

        .arc-tile-shot {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: var(--ar);
          overflow: hidden;
          border-radius: 7px;
          background: #e9ebef;
        }

        [data-theme="dark"] .arc-tile-shot { background: #1b1e25; }

        /* Photography, and the only thing in the hero that is cropped to fill:
           a real photograph has no correct letterbox. There is no
           object-position here on purpose — the optical crop is baked, not
           nudged in CSS. Each file already carries its tile's exact aspect and
           was cut around the subject by the "focus" point in
           scripts/bake-archive-photos.mjs, so a position here would be a
           no-op that later reads as a setting somebody can tune. */
        .arc-tile-shot img { object-fit: cover; }

        /* ---------- right: the product showcase ---------- */

        /* The window is the back layer and the only object here kept straight.
           It is anchored to the frame's outer edge, which is what opens the
           diagonal the two phones then stand in. */
        .arc-window-stack {
          position: absolute;
          z-index: 1;
          inset-inline-end: 0;
          top: 0;
          width: var(--w);
        }

        .arc-window-fly,
        .arc-window-drift { display: block; width: 100%; }
        .arc-window-fly { will-change: transform; }
        /* the measured craft — the window and nothing else */
        .arc-window-hold { display: block; width: 100%; }

        .arc-window {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          box-shadow: var(--arc-lift-back);
        }

        /* real chrome: lights, a secure address pill, and a bar deep enough to
           hold both without either touching an edge */
        .arc-window-bar {
          /* Chrome is chrome. The lights belong on the left of the bar in
             both scripts — mirroring them is the one place where following
             the document's direction makes the frame LESS recognisable as a
             browser, which is the only job this bar has. */
          direction: ltr;
          display: flex;
          align-items: center;
          gap: 9px;
          /* The bar and the caption are the only two things in this column
             that are NOT a fraction of the frame, so on a short screen — where
             the frame shrinks to fit the pin — they are what would eat the air
             under the window. They give a few pixels back instead. */
          height: clamp(24px, 3.3vh, 30px);
          padding-inline: 10px;
          background: color-mix(in srgb, var(--arc-surface) 94%, #6d7689);
          border-bottom: 1px solid var(--arc-border);
        }

        .arc-window-lights { display: flex; flex: 0 0 auto; gap: 5px; }
        .arc-window-lights-ghost { visibility: hidden; }

        .arc-window-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
        .arc-window-dot:nth-child(1) { background: #f0625a; }
        .arc-window-dot:nth-child(2) { background: #f4bd4f; }
        .arc-window-dot:nth-child(3) { background: #4fc35c; }

        [data-theme="dark"] .arc-window-dot:nth-child(1) { background: #d9534c; }
        [data-theme="dark"] .arc-window-dot:nth-child(2) { background: #d8a63f; }
        [data-theme="dark"] .arc-window-dot:nth-child(3) { background: #44a94f; }

        .arc-window-address {
          flex: 1 1 auto;
          min-width: 0;
          max-width: 148px;
          height: 15px;
          margin-inline: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding-inline: 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--arc-surface) 82%, #7d8698);
          color: var(--arc-muted);
        }

        .arc-window-lock { width: 6px; height: 7.5px; flex: 0 0 auto; opacity: .72; }

        /* Deliberately not a domain. Writing a URL under someone else's
           product would be inventing a fact about it; a muted address line is
           what chrome looks like and claims nothing. */
        .arc-window-address-line {
          flex: 0 1 58px;
          height: 3px;
          border-radius: 2px;
          background: currentColor;
          opacity: .34;
        }

        .arc-window-shot {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: var(--ar);
          background: #16302c;
        }

        /* product UI is never cropped: the container carries the file's own
           aspect, so contain fits it exactly and there is nothing to letterbox */
        .arc-window-shot img { object-fit: contain; }

        /* The caption. A screenshot with no name is decoration — this is what
           makes the window a piece of work with a subject and a category. */
        .arc-window-caption {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 8px;
          margin: clamp(8px, 1.2vh, 11px) 2px 0;
          line-height: 1.35;
        }

        .arc-window-caption b {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: -.01em;
          color: var(--text-primary,#090909);
        }

        .arc-window-caption span {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--arc-muted);
        }

        /* the hairline that ties the two halves of the caption together */
        .arc-window-caption b::after {
          content: "";
          display: inline-block;
          width: 12px;
          height: 1px;
          margin-inline-start: 8px;
          vertical-align: middle;
          background: var(--arc-border);
        }

        /*
          The handsets, in front.

          Anchored to the frame's floor and its inner edge, so the pair keeps
          one ground under two different heights. --b lifts the second one
          off that floor rather than shrinking the gap to the window, which is
          what keeps the ~30px of air under the caption intact while the two
          phones still sit at two different levels.
        */
        .arc-phone {
          position: absolute;
          z-index: var(--z);
          inset-inline-start: var(--x);
          bottom: var(--b);
          width: var(--w);
          transform: rotate(var(--r));
        }

        .arc-phone-fly,
        .arc-phone-drift { display: block; width: 100%; }
        .arc-phone-fly { will-change: transform; }

        .arc-phone-float {
          display: block;
          animation: arc-float 13s ease-in-out infinite;
        }

        /* the pair does not breathe in step — that is what stops them reading
           as one object with a seam down it */
        .arc-phone[data-lead="1"] .arc-phone-float { animation-duration: 15s; animation-delay: -3s; }
        .arc-phone[data-lead="0"] .arc-phone-float { animation-duration: 12s; animation-delay: -8s; }

        .arc-phone-body {
          position: relative;
          display: block;
          padding: 2.6%;
          border-radius: 15% / 6.9%;
          background: linear-gradient(148deg,#8f949e 0%,#2a2d34 16%,#585d67 38%,#1d2026 62%,#6e737d 84%,#232630 100%);
          box-shadow: var(--arc-lift-mid);
        }

        /* the front phone is the only object in the hero on the front lift */
        .arc-phone[data-lead="1"] .arc-phone-body { box-shadow: var(--arc-lift-front); }

        .arc-phone-screen {
          position: relative;
          display: block;
          overflow: hidden;
          border-radius: 13.2% / 6.1%;
          background: #000;
        }

        .arc-phone-shot {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: var(--ar);
        }

        .arc-phone-shot img { object-fit: contain; }

        .arc-phone-gloss {
          position: absolute;
          inset: 0;
          border-radius: 15% / 6.9%;
          background: linear-gradient(118deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,0) 34%);
          pointer-events: none;
        }

        /* ---------- the rail of marks ---------- */

        /*
          Not a logo wall. The rule either side of the title is what makes this
          the horizontal head of the vertical route below it: the reader is
          told what the five marks are before the departure turns each of them
          into the label beside a year.
        */
        .arc-rail {
          flex: 0 0 auto;
          position: relative;
          z-index: 2;
          padding-top: clamp(22px, 3.2vh, 38px);
        }

        .arc-rail-head {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(10px, 1.4vw, 16px);
          margin: 0 0 clamp(12px, 1.7vh, 18px);
        }

        .arc-rail-rule {
          flex: 0 1 clamp(26px, 8vw, 104px);
          height: 1px;
          background: linear-gradient(to right, transparent, var(--arc-border) 55%);
        }

        .arc-rail-rule:last-child {
          background: linear-gradient(to left, transparent, var(--arc-border) 55%);
        }

        .arc-rail-label {
          flex: 0 0 auto;
          color: var(--arc-muted);
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: .17em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* Arabic letters join. Tracking them apart breaks the word into
           unconnected glyphs, and there is no upper case to reach for. */
        [dir="rtl"] .arc-rail-label {
          letter-spacing: 0;
          text-transform: none;
          font-size: 11.5px;
        }

        /* One baseline, one height, natural widths: the marks that are icons
           stay square and the ones that are lockups stay wide, which is how a
           real client row reads. */
        .arc-marks {
          --mark-h: 52px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: clamp(10px, 1.4vw, 18px);
          margin: 0;
          padding: 0;
          list-style: none;
        }

        /* The float animation owns the transform property, so the tilt lives
           on the chip and the drift on a wrapper inside it — otherwise the
           keyframes overwrite the placement immediately. */
        .arc-mark {
          height: var(--mark-h);
          transform: rotate(var(--r));
        }

        .arc-mark-fly {
          display: flex;
          height: 100%;
          will-change: transform;
        }

        .arc-mark-float {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          aspect-ratio: var(--ar);
          min-width: var(--mark-h);
          padding: var(--pad);
          border-radius: 13px;
          overflow: hidden;
          /* The chips stay white in BOTH themes. These are other people's
             logos in other people's colours — Al Rajhi's and Emkan's navy
             marks disappear against a dark surface, and one of the two files
             carries a white background of its own, so a themed chip made the
             row inconsistent as well as unreadable. A white plate is how a
             client row is normally set, and it keeps every mark on the ground
             it was drawn for. */
          background: #fff;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow: var(--arc-shadow-soft);
          animation: arc-float 12s ease-in-out infinite;
          animation-delay: calc(var(--i) * -2.3s);
        }

        .arc-mark img {
          display: block;
          width: auto;
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        /* ═══════════════════════════════════════════════════════════════
           THE ROUTE — where the archive lands

           One dock per stop on the timeline below, laid out as the head of that
           timeline before it has been drawn. The layer is aria-hidden and never
           takes a pointer: every word in it is a shortened echo of the section
           underneath, so a screen reader meets the career exactly once, in the
           section that owns it.
           ═══════════════════════════════════════════════════════════════ */

        /* The archive flies OVER the route and settles onto it: the spread
           keeps the higher layer, so a label being crossed mid-flight is
           occluded by the work rather than tangled with it. */
        .fl-route { z-index: 1; }
        .arc-stage,
        .arc-rail { position: relative; z-index: 2; }

        .fl-route {
          --fl-slot: 50px;
          --fl-mark: 24px;
          --fl-node: 20px;
          --fl-berth: clamp(96px, 13vw, 134px);
          /* Laid over the box the archive just left — see --fl-anchor. Never in
             flow: an emptied column left in the layout is a screen-tall hole. */
          position: absolute;
          inset-inline: 0;
          top: var(--fl-anchor, 40%);
          height: var(--fl-anchor-h, auto);
          display: flex;
          align-items: center;
          justify-content: center;
          direction: var(--doc-dir, ltr);
          pointer-events: none;
        }

        .fl-track { position: relative; width: min(568px, 100%); }

        /* measured between the first and last node, exactly as the timeline
           measures its own rail — never guessed, so it lands right in both
           scripts and at every width */
        .fl-rail {
          position: absolute;
          inset-inline-start: calc(var(--fl-node) / 2);
          width: 1.5px;
          margin-inline-start: -.75px;
          border-radius: 2px;
          background: var(--arc-border);
          overflow: hidden;
        }

        .fl-rail-fill {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: 50% 0%;
          background: linear-gradient(to bottom,
            color-mix(in srgb, var(--arc-accent) 30%, transparent),
            var(--arc-accent));
        }

        .fl-list {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(4px, 1.3vh, 14px);
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .fl-dock {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: var(--fl-slot);
        }

        .fl-node {
          flex: 0 0 var(--fl-node);
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--fl-node);
        }

        .fl-node-core {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--arc-border);
          transition: transform 420ms cubic-bezier(.2,1.5,.4,1),
                      background-color 300ms ease,
                      box-shadow 420ms ease;
        }

        /* the arrival: a settle, a soft glow, and the label reading itself in */
        .fl-dock[data-open="1"] .fl-node-core {
          transform: scale(1.5);
          background: var(--arc-accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--arc-accent) 18%, transparent),
                      0 0 14px 2px color-mix(in srgb, var(--arc-accent) 42%, transparent);
        }

        .fl-berth {
          flex: 0 0 var(--fl-berth);
          display: flex;
          align-items: center;
          gap: 9px;
        }

        /* The landing pads. They are laid out at all times — that is what the
           travel is measured against — and only their outline fades in. */
        .fl-frame,
        .fl-mark {
          display: block;
          flex: 0 0 auto;
          aspect-ratio: var(--ar, 1);
          border-radius: 5px;
          border: 1px dashed color-mix(in srgb, var(--arc-accent) 26%, transparent);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .fl-frame { height: var(--fl-slot); }
        .fl-mark { height: var(--fl-mark); border-radius: 4px; }

        .fl-dock[data-open="0"] .fl-frame,
        .fl-dock[data-open="0"] .fl-mark { opacity: .34; }

        .fl-meta {
          min-width: 0;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
          opacity: 0;
          transform: translateY(7px);
          transition: opacity 420ms ease 60ms,
                      transform 520ms cubic-bezier(.2,1.3,.4,1) 60ms;
        }

        .fl-dock[data-open="1"] .fl-meta { opacity: 1; transform: none; }

        .fl-meta-top {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }

        .fl-year {
          flex: 0 0 auto;
          color: var(--arc-accent);
          font-size: 11px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          letter-spacing: .04em;
        }

        .fl-org {
          min-width: 0;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fl-role,
        .fl-lead {
          color: var(--arc-muted);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* the first milestone opens as it docks — the timeline's first card,
           arriving a beat before the timeline does */
        .fl-lead {
          max-width: 34ch;
          margin-top: 3px;
          color: var(--text-secondary,#656565);
          font-size: 11.5px;
          font-weight: 500;
          white-space: normal;
        }

        .fl-dock[data-lead="1"] .fl-org { font-size: 14.5px; }

        /* The line leaving the last dock. It fades out rather than stopping,
           and the timeline's entry curve picks it up from the same x — see
           --hero-rail-x in heroFlight.tsx. */
        .fl-rail-tail {
          position: absolute;
          inset-inline-start: calc(var(--fl-node) / 2);
          width: 1.5px;
          margin-inline-start: -.75px;
          border-radius: 2px;
          background: linear-gradient(to bottom,
            var(--arc-accent),
            color-mix(in srgb, var(--arc-accent) 55%, transparent) 55%,
            color-mix(in srgb, var(--arc-accent) 18%, transparent) 100%);
          opacity: .8;
        }

        /* ---------- idle drift ----------
           Six pixels over eleven seconds, on transform only: enough to keep
           the spread alive, not enough to read as movement. */
        @keyframes arc-float {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-6px,0); }
        }

        /* ---------- the departure, desktop ---------- */

        /* The pin only exists above the phone breakpoint and only when motion
           is allowed. Everywhere else the runway is zero-height, the screen is
           an ordinary block, and the route is a quiet list at the end of the
           hero — the composition degrades to what it was, not to something
           broken. */
        /* The pin belongs to the width where the spread is genuinely one
           screen tall. Between 768 and 1099 the composition is already two
           rows and taller than the viewport, so pinning it would crop the
           work; there the route simply follows the marks and the artifacts
           fly down the page into it — the same choreography, unpinned. */
        @media (min-width: 1100px) {
          .hero-root[data-flight="on"] .arc-screen {
            position: sticky;
            top: 0;
            height: 100svh;
            min-height: 0;
          }

          .hero-root[data-flight="on"] .hero-runway { height: 150vh; }

          /* Pinned, the route owns the band under the identity for the whole
             viewport rather than tracking any one column. */
          .hero-root[data-flight="on"] .fl-route {
            top: 34%;
            height: auto;
            bottom: var(--dock-clear);
          }
        }

        /*
          Unpinned widths still need somewhere to do the travelling, and how
          much they already have depends entirely on how tall the hero happens
          to be at that size.

          On a tablet the composition is SHORTER than the screen, so the hero
          used to end before it had scrolled at all: the pin measured less than
          one viewport, the scroll range came out negative and the whole
          departure silently never ran. Filling the screen and adding a runway
          fixes it without opening a hole, because the space goes into the
          composition rather than under it.

          A phone is the opposite — its hero is already half again as tall as
          the screen — so it is given no runway at all and travels on the scroll
          it already had. The min-height on the pin is only a floor, for a
          hypothetical short-hero phone; where the hero is taller it costs
          nothing and adds no blank page.
        */
        @media (max-width: 767px) {
          .hero-root[data-flight="on"] .arc-pin { min-height: calc(100svh + 18vh); }
        }

        @media (max-width: 1099px) {
          /* the docks start at the top of the box the archive left, so the
             route follows straight on from whatever is still above it */
          .fl-route { --fl-slot: 40px; --fl-mark: 20px; align-items: center; }
          .fl-list { gap: clamp(3px, .8vh, 9px); }
        }

        /* short laptop screens: the route keeps its shape, at less of it */
        /*
          Tablets, split by whether the composition fits on one screen.

          A tall one does, so it gets the pin — and that is what stops the
          runway becoming blank page: while the screen is stuck the runway is
          scrolling underneath it, so the distance is spent on the transition
          instead of on empty margin. A short one (a landscape tablet) cannot
          hold the two-row spread in a viewport, so pinning it would crop the
          work; it keeps the unpinned treatment, and its hero is already taller
          than the screen so it needs only a little runway on top.
        */
        @media (min-width: 768px) and (max-width: 1099px) and (min-height: 1000px) {
          .hero-root[data-flight="on"] .arc-screen {
            position: sticky;
            top: 0;
            height: 100svh;
            min-height: 0;
          }

          .hero-root[data-flight="on"] .hero-runway { height: 130vh; }

          /* top-aligned rather than centred: a portrait tablet has far more
             height than six docks need, and centring them in it opened a hole
             between the identity and the route */
          .hero-root[data-flight="on"] .fl-route {
            top: 24%;
            height: auto;
            bottom: var(--dock-clear);
            align-items: flex-start;
          }
        }

        @media (min-width: 768px) and (max-width: 1099px) and (max-height: 999px) {
          .hero-root[data-flight="on"] .hero-runway { height: 12vh; }
        }

        @media (min-width: 1100px) and (max-height: 820px) {
          .hero-root[data-flight="on"] .fl-route {
            --fl-slot: 42px;
            --fl-mark: 21px;
            top: 32%;
          }
          .fl-org { font-size: 12.5px; }
        }

        @media (min-width: 1100px) and (max-height: 700px) {
          .hero-root[data-flight="on"] .fl-route {
            --fl-slot: 34px;
            --fl-mark: 18px;
            top: 30%;
          }
          .fl-lead { display: none; }
        }

        /* ---------- laptop / tablet ---------- */

        @media (max-width: 1099px) and (min-width: 768px) {
          /* The two-row grid is taller than a screen here, so the screen block
             stops pinning height. The cue goes with it: at this width the
             spread already runs past the fold, so "there is more below" is
             self-evident — and the only place the label could sit is inside
             the floating dock's band. */
          .arc-screen { min-height: 0; padding-bottom: clamp(20px, 3vh, 36px); }

          .arc-stage {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            row-gap: clamp(30px, 5vh, 52px);
            align-items: start;
          }

          .arc-center { grid-column: 1 / -1; grid-row: 1; }
          .arc-collage { grid-column: 1; grid-row: 2; }
          .arc-showcase { grid-column: 2; grid-row: 2; padding-top: 6px; }

          /*
            The two columns are wide here and the composition is NOT stretched
            to fill them. It keeps the proportions it was drawn at and is
            centred in the column instead — a 500px-wide window with the same
            two phones under it is the same picture with the air pumped up,
            and the clearances would grow past the point where the group still
            reads as one object.

            The screen no longer pins at this width, so the frames also stop
            being capped by the viewport height.
          */
          .arc-collage-frame,
          .arc-showcase-frame { width: min(100%, 372px); }
        }

        /* ═══════════════════════════════════════════════════════════════
           PHONE — its own composition.

           Not the spread scaled down: the three-column grid becomes one
           column, the identity comes first and complete, and only the two
           strongest objects follow it — the collage cropped to three frames,
           and the product showcase. The wide strip stands down here; the
           flight-path timeline directly below carries the same products at
           full size a screen later.
           ═══════════════════════════════════════════════════════════════ */

        @media (max-width: 767px) {
          .arc-inner {
            width: 100%;
            padding-inline: clamp(18px, 5.6vw, 26px);
          }

          /* the phone composition is taller than a screen by design — pinning
             it to 100svh would only strand the collage below the fold */
          .arc-screen {
            display: block;
            min-height: 0;
            padding-top: calc(104px + env(safe-area-inset-top, 0px));
            padding-bottom: 0;
          }

          .arc-stage {
            direction: var(--doc-dir, ltr);
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .arc-center { order: 1; padding-inline: 0; }
          .arc-collage { order: 2; margin-top: clamp(40px, 11vw, 58px); }
          .arc-showcase { order: 3; margin-top: clamp(46px, 13vw, 70px); }

          .hero-name-title {
            max-width: none;
            font-size: clamp(38px, 11.4vw, 56px);
            line-height: 1.14;
            padding-block: .06em .14em;
          }

          [dir="rtl"] .hero-name-title {
            max-width: none;
            font-size: clamp(42px, 12.6vw, 64px);
            line-height: 1.34;
            padding-block: .08em .24em;
          }

          .hero-positioning {
            max-width: 33ch;
            margin-top: clamp(12px, 3.4vw, 18px);
            padding-inline: 6px;
            font-size: clamp(14.5px, 4vw, 16.5px);
            line-height: 1.68;
          }

          [dir="rtl"] .hero-positioning { max-width: 34ch; line-height: 1.85; }

          .hero-cta-row {
            width: 100%;
            max-width: 380px;
            margin-inline: auto;
            flex-wrap: nowrap;
            gap: 10px;
            margin-top: clamp(22px, 6vw, 30px);
          }

          .hero-cta-primary,
          .hero-cta-secondary {
            flex: 1 1 0;
            min-width: 0;
            min-height: 50px;
            padding: 13px 12px;
            font-size: 14px;
          }

          /*
            The phone composition is not the desktop cluster compressed — each
            group is re-proportioned for one narrow column, and both are taller
            than their desktop selves rather than wider.

            The collage becomes a print with a second print clearly below and
            beside it, ~35px of daylight between them, and the showcase becomes
            a window with the pair standing under it at ~30px. Nothing is
            allowed to lap over the window here at all: at 346px of column the
            same overlap that reads as depth on a desktop reads as a collision.
            Both frames drop the viewport-height cap — the phone hero is a
            column that scrolls, not a screen that has to fit.
          */
          .arc-collage-frame {
            --frame-ar: 1.42;
            width: 100%;
          }

          .arc-showcase-frame {
            --frame-ar: 1.5;
            width: 100%;
          }

          /* the caption sits under a nearly full-width window here, so it can
             afford to be a touch larger */
          .arc-window-caption { margin-top: 12px; }
          .arc-window-caption b { font-size: 13px; }
          .arc-window-caption span { font-size: 12px; }

          /* Five marks cannot sit on one line at phone widths, so the rail is
             allowed to wrap into two — which is exactly why the chips share a
             baseline now: a wrapped row of vertically-offset chips collides
             with the row above it instead of reading as a rail. */
          .arc-rail { padding-top: clamp(30px, 8vw, 42px); }

          .arc-rail-head { gap: 10px; }
          .arc-rail-rule { flex-basis: clamp(20px, 12vw, 60px); }

          .arc-marks {
            --mark-h: 42px;
            gap: 12px 10px;
          }

          /* The phone route: one column, five stops, three of them receiving an
             artifact. The berth narrows and the labels wrap rather than
             truncate — there is no width here to spend on an ellipsis. */
          .fl-route {
            --fl-slot: 40px;
            --fl-berth: 78px;
            --fl-node: 18px;
          }

          .fl-track { width: 100%; }
          .fl-dock { gap: 10px; }
          .fl-list { gap: clamp(8px, 2.6vw, 14px); }

          .fl-org,
          .fl-role { white-space: normal; overflow: visible; }
          .fl-org { font-size: 13px; line-height: 1.32; }
          .fl-role { font-size: 11px; }
        }

        /*
          The wide phones. Everything in the showcase is a fraction of the
          frame except the chrome bar and the caption, which are type and stay
          the size type has to be — so as the column grows past ~400px those
          two stop keeping up and the air under the caption opens past the 40px
          the group is allowed. A slightly shallower frame gives it back.
        */
        @media (min-width: 400px) and (max-width: 767px) {
          .arc-showcase-frame { --frame-ar: 1.45; }
        }

        @media (max-width: 359px) {
          .hero-cta-row { flex-direction: column; max-width: 260px; }
        }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          .arc-tile-float,
          .arc-phone-float,
          .arc-mark-float { animation: none !important; }
          .hero-cta-primary,
          .hero-cta-secondary { transition: none !important; }

          /* The calm alternative: nothing flies, nothing pins, nothing is
             pulled out from under the reader. The archive stays in the hero
             and the route below it settles in once, already complete — the
             same information, arrived at rather than travelled to. */
          .hero-dusk { opacity: .6 !important; }
          .fl-berth { display: none; }

          /* nothing flies, so the archive never leaves the box the route would
             have been laid over — it follows the composition instead */
          .fl-route {
            position: static;
            height: auto;
            padding-top: clamp(34px, 7vh, 58px);
          }
          .fl-node-core,
          .fl-meta { transition: none !important; }
          .fl-route { animation: fl-settle 620ms ease-out both; }
        }

        @keyframes fl-settle {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        /* Belt and braces on the pin.
           data-flight is decided after hydration, so for one paint a
           reduced-motion visitor is served the markup everyone else gets. These
           two rules mean the runway and the stickiness are never applied to
           them at all, not even for that paint. They sit after the flight's own
           media queries and match their specificity, which is what lets them
           win without !important. */
        @media (prefers-reduced-motion: reduce) {
          .hero-root[data-flight] .hero-runway { height: 0; }
        }

        @media (prefers-reduced-motion: reduce) and (min-width: 1100px) {
          .hero-root[data-flight] .arc-screen {
            position: relative;
            height: auto;
            min-height: 100svh;
          }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared flight wiring                                                */
/* ------------------------------------------------------------------ */

/**
 * What every artifact needs to fly.
 *
 * `registerCraft` is handed the artifact's CONTAINER — the element carrying the
 * static placement — while the animation is applied to a wrapper inside it.
 * That separation is the whole trick behind measuring correctly: the container
 * is never transformed by the transition, so its box is the artifact's resting
 * position no matter how far through the departure the reader already is, and
 * a resize (or a refresh) halfway down measures exactly the same numbers as a
 * resize at the top.
 */
type FlightProps = {
  progress: MotionValue<number>;
  plan: PlanFeed;
  registerCraft: (id: string) => (node: HTMLElement | null) => void;
};

/* ------------------------------------------------------------------ */
/* The collage                                                         */
/* ------------------------------------------------------------------ */

function Collage({
  tiles,
  isPhone,
  lang,
  mx,
  my,
  still,
  progress,
  plan,
  flightFor,
  registerCraft,
}: {
  tiles: Tile[];
  isPhone: boolean;
  lang: "ar" | "en";
  mx: MotionValue<number>;
  my: MotionValue<number>;
  still: boolean;
  flightFor: (id: string) => Flight | undefined;
} & FlightProps) {
  return (
    <div className="arc-collage-frame">
      {tiles.map((tile) => (
        <CollageTile
          key={tile.id}
          tile={tile}
          spot={isPhone ? tile.atPhone : tile.at}
          lang={lang}
          mx={mx}
          my={my}
          still={still}
          progress={progress}
          plan={plan}
          flight={flightFor(`tile-${tile.id}`)}
          registerCraft={registerCraft}
        />
      ))}
    </div>
  );
}

function CollageTile({
  tile,
  spot,
  lang,
  mx,
  my,
  still,
  progress,
  plan,
  flight,
  registerCraft,
}: {
  tile: Tile;
  spot: Spot;
  lang: "ar" | "en";
  mx: MotionValue<number>;
  my: MotionValue<number>;
  still: boolean;
  flight: Flight | undefined;
} & FlightProps) {
  /* the nearer a tile sits to the front, the further it travels under the
     pointer — a few pixels of depth, nothing more */
  const depth = 3 + tile.z * 1.6;
  const px = useTransform(mx, [-0.5, 0.5], [-depth, depth]);
  const py = useTransform(my, [-0.5, 0.5], [-depth * 0.5, depth * 0.5]);
  const fly = useFlightStyle(flight, progress, plan);

  return (
    <div
      className="arc-tile"
      data-tile={tile.id}
      ref={registerCraft(`tile-${tile.id}`)}
      style={
        {
          "--w": `${spot.w}%`,
          "--x": `${spot.x}%`,
          "--y": `${spot.y}%`,
          "--r": `${tile.rotate}deg`,
          "--z": tile.z,
          "--step": tile.step,
        } as CSSProperties
      }
    >
      {/*
        Three wrappers, three jobs, and none of them fighting for `transform`:
        the flight, then the pointer drift, then the idle keyframes. A CSS
        animation outranks an inline style in the cascade, so anything sharing
        an element with `arc-float` simply loses.
      */}
      <motion.div className="arc-tile-fly" style={flight ? fly : undefined}>
        <motion.div className="arc-tile-drift" style={still ? undefined : { x: px, y: py }}>
          <span className="arc-tile-float">
            <span className="arc-tile-inner">
              <span className="arc-tile-shot" style={{ "--ar": tile.ratio } as CSSProperties}>
                <Image
                  src={tile.src}
                  alt={tile.alt[lang]}
                  fill
                  sizes="(max-width: 767px) 92vw, 320px"
                />
              </span>
            </span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The marks                                                           */
/* ------------------------------------------------------------------ */

/**
 * An organisation's mark, which is also the label its stop is filed under.
 *
 * On the way down it stops being a logo and becomes the metadata beside a
 * year: the same object, in a different role.
 */
function MarkChip({
  mark,
  index,
  lang,
  progress,
  plan,
  flight,
  registerCraft,
}: {
  mark: Mark;
  index: number;
  lang: "ar" | "en";
  flight: Flight | undefined;
} & FlightProps) {
  const fly = useFlightStyle(flight, progress, plan);

  return (
    <li
      className="arc-mark"
      ref={registerCraft(`mark-${mark.id}`)}
      style={
        {
          "--ar": `${mark.nw} / ${mark.nh}`,
          "--pad": `${mark.pad}px`,
          "--r": `${mark.rotate}deg`,
          "--i": index,
        } as CSSProperties
      }
    >
      <motion.span className="arc-mark-fly" style={flight ? fly : undefined}>
        <span className="arc-mark-float">
          <Image
            src={mark.src}
            alt={mark.label[lang]}
            width={mark.nw}
            height={mark.nh}
            sizes="140px"
          />
        </span>
      </motion.span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* The product showcase                                                */
/* ------------------------------------------------------------------ */

/**
 * Three objects, three depths, one ground.
 *
 *   back    the platform window, straight, flush to the outer edge
 *   middle  the second app, smaller and a little higher
 *   front   the first app, largest of the two and standing on the floor
 *
 * They are placed inside ONE frame of fixed proportions, so every clearance in
 * the group — the ~30px of air under the window's caption, the ~15px the front
 * phone laps over the one behind it — is a fraction of the picture and holds
 * at every column width. Nothing here is a nudge in pixels that survives only
 * at the width it was tuned on.
 *
 * The window never touches the phones. Depth in this composition comes from
 * three different sizes, three different lifts off the same floor and one
 * controlled overlap inside the pair — not from stacking the artifacts on top
 * of each other, which is what made the group read as a pile of screenshots.
 */
function Showcase({
  isPhone,
  lang,
  mx,
  my,
  still,
  progress,
  plan,
  flightFor,
  registerCraft,
}: {
  isPhone: boolean;
  lang: "ar" | "en";
  mx: MotionValue<number>;
  my: MotionValue<number>;
  still: boolean;
  flightFor: (id: string) => Flight | undefined;
} & FlightProps) {
  const wx = useTransform(mx, [-0.5, 0.5], [-5, 5]);
  const wy = useTransform(my, [-0.5, 0.5], [-2.5, 2.5]);
  const windowFlight = flightFor("window");
  const fly = useFlightStyle(windowFlight, progress, plan);
  /* The caption is the one thing in the composition that cannot travel: at the
     scale the window lands on the route it would be two illegible grey lines
     under a 50px frame. It stands down with the buttons, long before the
     window reaches anything. */
  const captionOpacity = useTransform(progress, [0.02, 0.16], [1, 0]);

  return (
    <div className="arc-showcase-frame">
      <div
        className="arc-window-stack"
        style={{ "--w": `${isPhone ? WINDOW.wPhone : WINDOW.w}%` } as CSSProperties}
      >
        {/*
          The craft is the window ALONE. The caption sits outside it on purpose:
          the landing scale is measured as slot height over artifact height, so
          a caption inside this box would make the window itself dock short by
          exactly the height of two lines of type.
        */}
        <div className="arc-window-hold" ref={registerCraft("window")}>
          <motion.div className="arc-window-fly" style={windowFlight ? fly : undefined}>
            <motion.div
              className="arc-window-drift"
              style={still ? undefined : { x: wx, y: wy }}
            >
              <div className="arc-window">
                <div className="arc-window-bar" aria-hidden="true">
                  <span className="arc-window-lights">
                    <span className="arc-window-dot" />
                    <span className="arc-window-dot" />
                    <span className="arc-window-dot" />
                  </span>

                  <span className="arc-window-address">
                    <svg className="arc-window-lock" viewBox="0 0 8 10">
                      <path
                        d="M2.1 4.2V2.7a1.9 1.9 0 0 1 3.8 0v1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.05"
                      />
                      <rect x=".7" y="4.1" width="6.6" height="5.2" rx="1.3" fill="currentColor" />
                    </svg>
                    <span className="arc-window-address-line" />
                  </span>

                  {/* balances the lights, so the address pill sits on the
                      bar's true centre rather than being pushed off it */}
                  <span className="arc-window-lights arc-window-lights-ghost" aria-hidden="true">
                    <span className="arc-window-dot" />
                    <span className="arc-window-dot" />
                    <span className="arc-window-dot" />
                  </span>
                </div>

                <span className="arc-window-shot" style={{ "--ar": WINDOW.ratio } as CSSProperties}>
                  <Image
                    src={WINDOW.src}
                    alt={WINDOW.alt[lang]}
                    fill
                    sizes="(max-width: 767px) 96vw, 400px"
                    priority
                  />
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          className="arc-window-caption"
          style={windowFlight ? { opacity: captionOpacity } : undefined}
        >
          <b>{WINDOW.name[lang]}</b>
          <span>{WINDOW.kind[lang]}</span>
        </motion.p>
      </div>

      {PHONES.map((phone, index) => (
        <ShowcasePhone
          key={phone.id}
          phone={phone}
          spot={isPhone ? phone.atPhone : phone.at}
          lead={index === 0}
          lang={lang}
          mx={mx}
          my={my}
          still={still}
          progress={progress}
          plan={plan}
          flight={flightFor(`phone-${phone.id}`)}
          registerCraft={registerCraft}
        />
      ))}
    </div>
  );
}

function ShowcasePhone({
  phone,
  spot,
  lead,
  lang,
  mx,
  my,
  still,
  progress,
  plan,
  flight,
  registerCraft,
}: {
  phone: Handset;
  spot: Handset["at"];
  /** the dominant one of the pair — it drifts further and floats slower */
  lead: boolean;
  lang: "ar" | "en";
  mx: MotionValue<number>;
  my: MotionValue<number>;
  still: boolean;
  flight: Flight | undefined;
} & FlightProps) {
  const depth = lead ? 11 : 7;
  const px = useTransform(mx, [-0.5, 0.5], [-depth, depth]);
  const py = useTransform(my, [-0.5, 0.5], [-depth / 2, depth / 2]);
  const fly = useFlightStyle(flight, progress, plan);

  return (
    <div
      className="arc-phone"
      data-phone={phone.id}
      data-lead={lead ? "1" : "0"}
      ref={registerCraft(`phone-${phone.id}`)}
      style={
        {
          "--w": `${spot.w}%`,
          "--x": `${spot.x}%`,
          "--b": `${spot.b}%`,
          "--r": `${phone.rotate}deg`,
          "--z": phone.z,
          "--ar": `${phone.nw} / ${phone.nh}`,
        } as CSSProperties
      }
    >
      <motion.div className="arc-phone-fly" style={flight ? fly : undefined}>
        <motion.div className="arc-phone-drift" style={still ? undefined : { x: px, y: py }}>
          <span className="arc-phone-float">
            <span className="arc-phone-body">
              <span className="arc-phone-screen">
                <span className="arc-phone-shot">
                  <Image
                    src={phone.src}
                    alt={phone.alt[lang]}
                    fill
                    sizes="(max-width: 767px) 32vw, 120px"
                  />
                </span>
              </span>
              <span className="arc-phone-gloss" aria-hidden="true" />
            </span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
