"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
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
 * Where an object rests on the PHONE stage.
 *
 * A phone has no room for two columns either side of the identity, so it does
 * not get them: it gets ONE stage, with the identity in the middle of it and
 * the archive laid around the outside — photography down the left, product
 * down the right, exactly the relationship the desktop spread is built on,
 * folded into a single column.
 *
 * `w` and `x` are fractions of that stage's width, as they are of a desktop
 * frame. The vertical anchor deliberately is NOT a fraction of its height:
 * `top` measures down from the stage's head and `bottom` up from its floor,
 * both in cqw — hundredths of the stage's own WIDTH, read off the artifact
 * layer's container. So the upper group always hugs the head of the stage and
 * the lower group always hugs its floor, at the same size relative to each
 * other, while the band between them — the one the name, the description and
 * the buttons live in — is free to be as tall as the copy needs. That is the
 * whole reason nothing here can ever land on the type: the two are laid out in
 * different rows of the same grid, not in one box with hand-tuned gaps.
 */
type Berth = { w: number; x: number; top?: number; bottom?: number };

/**
 * The custom properties one berth resolves to.
 *
 * `--t` and `--bt` are handed straight to `top` and `bottom`, so an artifact
 * declares which edge of the stage it belongs to and the CSS never has to know
 * which of the two it was given.
 */
function berthVars(spot: Berth): Record<string, string> {
  return {
    "--w": `${spot.w}%`,
    "--x": `${spot.x}%`,
    "--t": spot.top === undefined ? "auto" : `${spot.top}cqw`,
    "--bt": spot.bottom === undefined ? "auto" : `${spot.bottom}cqw`,
  };
}

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
  /** phone placement — the outer zones of the one stage */
  atPhone: Berth;
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
    /* Upper LEFT of the phone stage — the same corner of the composition it
       holds on a desktop, at the size a hand can still read a room full of
       people at. It sits a little lower than the window opposite it so the two
       upper objects are a pair rather than a lintel. */
    atPhone: { w: 48, x: -24, top: 8 },
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
    at: { w: 36, x: 30, y: 23 },
    /* lower LEFT, under the speaking frame's own half of the stage */
    atPhone: { w: 29, x: -27, bottom: 6 },
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
    /* the baked file's own size. The chip hangs its aspect off these, so they
       have to follow the crop — get them wrong and the mark is letterboxed
       inside a box of the wrong shape. */
    nw: 640,
    nh: 356,
    pad: 9,
    rotate: 1.2,
  },
];

/* ------------------------------------------------------------------ */
/* The showcase                                                        */
/* ------------------------------------------------------------------ */

/**
 * The platform window — the anchor of the right column, and the only object
 * in it that is deliberately kept STRAIGHT.
 *
 * The Film Business Accelerator's sign-in, shown whole. The file is already a
 * real browser viewport (1700×1012) with nothing running off an edge, so it
 * needs no crop and — unlike a page photographed inside a laptop — no bezel
 * removed before this frame can put its own chrome around it. At the size the
 * hero actually draws it, "Sign in", both fields, the orange button and the
 * bilingual lockup all still read, which is more than a dashboard survives at
 * 324px.
 *
 * It is also the one artifact that carries words at rest: a caption naming the
 * product and who it was built for. A screenshot without a name is decoration.
 */
const WINDOW = {
  src: "/hero/archive/window-fba.jpg",
  ratio: 1700 / 1012,
  alt: {
    ar: "شاشة الدخول إلى منصة مسرّعة أعمال الأفلام",
    en: "The Film Business Accelerator sign-in screen",
  } satisfies Bi,
  name: {
    ar: "مسرّعة أعمال الأفلام",
    en: "Film Business Accelerator",
  } satisfies Bi,
  kind: { ar: "هيئة الأفلام السعودية", en: "Saudi Film Commission" } satisfies Bi,
  /** width as a percentage of the showcase frame */
  w: 87,
  /* Upper RIGHT of the phone stage — the anchor of the product side, kept on
     the side of the composition it holds on a desktop. Hung from the head of
     the stage rather than centred on a point, because the caption underneath
     it is type and therefore a fixed height: anchoring the group by its top is
     what keeps the daylight between the caption and the name the same at every
     width instead of growing and shrinking with the caption's leading. */
  atPhone: { w: 47, x: 25.5, top: 2 } satisfies Berth,
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
  atPhone: Berth;
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
    /* Lower RIGHT, standing on the stage's floor. A handset is over twice as
       tall as it is wide, so this width is set by the height the lower band
       has to give it — 19% of the stage is 41% of it back again in height,
       which is the deepest object in the band and therefore what sizes it. */
    atPhone: { w: 19, x: 22, bottom: 3 },
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
    /* the second of the pair, smaller and lifted off the same floor — the same
       lap over the one in front of it that the desktop pair keeps */
    atPhone: { w: 14, x: 36, bottom: 10 },
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
  leg("phone-alrajhi", "alrajhi", "frame", 0.16, 0.57, 72, 9, 2.4),
  leg("mark-emkan", "emkan", "mark", 0.17, 0.58, -26, -6, 1.4),
  leg("phone-emkan", "emkan", "frame", 0.20, 0.63, 56, -12, 2.2),
  /* the collage separates in the air: the speaking frame files under the
     practice, the room under the centre it was photographed in */
  leg("tile-stage", "practice", "frame", 0.23, 0.68, -62, -12, 2.4),
  leg("mark-monshaat", "monshaat", "mark", 0.25, 0.71, -22, -5, 1.4),
  leg("tile-room", "monshaat", "frame", 0.28, 0.75, -54, 8, 2.6),
  /* The anchor leaves last and lands last, so the composition empties from its
     edges inwards rather than collapsing all at once — and it files past the
     ventures stop to the film one, because that is whose platform it is. An
     object that lands on a stop it does not belong to is the one thing this
     whole arrangement is built to make impossible. */
  leg("window", "film", "frame", 0.34, 0.85, 68, -6, 2.8),
];

/**
 * The phone route — every artifact the desktop files, into every stop it has.
 *
 * It used to be three product screens filing into a five-stop stub while the
 * photographs and the marks stayed behind. That emptied the composition on one
 * side and left it as a screen-tall hole on the other, and half of the archive
 * never departed at all. Nothing about a narrow screen makes an object belong
 * to the career any less, so nothing is dropped here.
 *
 * What a phone genuinely cannot carry is the WIDTH of the desktop curves — a
 * 72px bow across a 342px column is a detour off the side of the screen — nor
 * the desktop's leisure: the identity has already scrolled off by the time the
 * screen is held, so the reader is looking straight at the composition when the
 * departure starts and the whole thing is filed a little earlier.
 */
/*
   No motion blur on a phone at all.

   Two reasons, and the second is the one that settles it. A narrow stage means
   the artifacts cross each other far more than they do across a desktop
   spread, so a smear on each of them turns the middle of the transition into
   fog rather than into speed. And `filter: blur()` is the single most
   expensive thing this transition can ask a phone GPU for: nine artifacts each
   re-rasterising a blurred layer on every frame is exactly the stutter the
   scroll had. Depth on a phone is carried by scale, overlap and the shadow
   ladder — none of which cost a repaint.
*/
const PHONE_BLUR = 0;

/**
 * Who leaves first on a phone — which is not who left first on a desktop.
 *
 * The head of the phone's route is the band the upper two artifacts are resting
 * in, and it is also where the identity goes. On a desktop the identity climbs
 * up its own empty column and meets nothing; here the band has to be emptying
 * while the identity is arriving in it, and the two objects in it are the
 * window and the room.
 *
 * So on the phone route those two are given the earliest DEPARTURES, and
 * nothing else changes: every `end` is untouched, so the order the archive
 * ARRIVES in — which is the order that tells the story, earliest work to
 * latest — is exactly the desktop's. What changes is only the order it empties
 * in, and it empties from the top of the composition down, which is the one
 * thing a phone needs it to do.
 */
const PHONE_LEAVES_FIRST: Record<string, number> = {
  window: 0.02,
  "tile-room": 0.05,
};

const PHONE_FLIGHTS: Flight[] = FLIGHTS.map((flight) => ({
  ...flight,
  /* one narrow column, so the bow is a nudge rather than a detour */
  bow: flight.bow * 0.3,
  blur: flight.blur * PHONE_BLUR,
  start: PHONE_LEAVES_FIRST[flight.id] ?? flight.start * 0.86,
  end: Math.min(0.94, flight.end * 0.98),
}));

/** Every stop the desktop route has, because every artifact still flies. */
const PHONE_DOCKS = DOCKS;


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
  const flying = !still;
  const docks = isPhone ? PHONE_DOCKS : DOCKS;
  const flights = isPhone ? PHONE_FLIGHTS : FLIGHTS;

  const {
    pinRef,
    stageRef,
    centerRef,
    collageRef,
    showcaseRef,
    marksRef,
    probeRef,
    railRef,
    tailRef,
    registerCraft,
    registerSlot,
    registerNode,
    plan,
  } = useFlightPlan(flights, flying, ready, isPhone);

  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });
  /* A light spring only takes the jitter off a trackpad; it converges on the
     scroll value, so the animation stays a function of scroll position. */
  const scrolled = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 38,
    mass: 0.32,
  });

  /**
   * The pin's progress, less the part of it spent getting the screen stuck.
   *
   * On every width where the composition is a screen tall this is the identity
   * function — the screen is held from the first pixel, and `lead` is zero. A
   * phone cannot hold the identity AND both artifact columns AND the row of
   * marks at 320x568, so its screen is pinned with a measured negative offset
   * and the identity is what scrolls off first (see `lift` in ./heroFlight).
   * Remapping past that is what keeps the choreography honest there: nothing
   * takes off while the ground underneath it is still moving, so an artifact
   * still lands exactly on its dock, and the transition is still a pure
   * function of scroll position — reversible, and correct after a refresh at
   * any offset.
   */
  const progress = useTransform<number, number>([scrolled, plan.version], ([p]) => {
    const { lead } = plan.read();
    if (lead <= 0.001) return p;
    return Math.min(1, Math.max(0, (p - lead) / (1 - lead)));
  });

  /**
   * The identity climbs to the head of the route and shrinks about its own top
   * edge, so the name is the first thing read at both ends of the transition —
   * and never lands on top of a dock, because the docks only ever occupy the
   * band below the headroom the plan measured for it.
   */
  /*
    A phone's identity climbs from the MIDDLE of the stage to the head of the
    route, and the band it has to pass through is where the upper two artifacts
    are resting. So on a phone it goes early and it goes quickly — up and clear
    of them by 0.26, while they are still barely under way (see
    PHONE_LEAVES_FIRST) — and they then descend past a band it has already left.
    The two are never in the same place at the same time in either direction,
    which is the only version of this that also survives being scrolled
    backwards.

    Everywhere else the identity shrinks in its own empty column, meets nothing
    on the way, and can take its time.
  */
  const climb = isPhone ? { from: 0.04, span: 0.22 } : { from: 0.05, span: 0.5 };
  const centerPose = useTransform<number, { y: number; scale: number }>(
    [progress, plan.version],
    ([p]) => {
      const { dy, scale } = plan.read().center;
      const t = Math.min(1, Math.max(0, (p - climb.from) / climb.span));
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
  /*
    Stable across renders, so every memoised artifact below actually stays
    memoised: `flights` is one of two module-level arrays and changes only when
    the composition crosses the phone breakpoint.
  */
  const flightFor = useCallback(
    (id: string) => (flying ? flights.find((flight) => flight.id === id) : undefined),
    [flights, flying],
  );

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
  /* true at every width now that the phone flies the whole archive; still read
     from the plan rather than assumed, so reduced motion keeps the rule */
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
            {/* The only honest way to ask this device how tall one small
                viewport is once the floating navigation has taken its share:
                `svh` is not innerHeight on iOS and --dock-clear is a calc()
                around env(). Everything the phone pin measures is measured
                against this, which is why no artifact and no dock can end up
                underneath the navigation. */}
            <span className="arc-probe" ref={probeRef} aria-hidden="true" />
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
            <motion.div className="arc-rail" ref={marksRef} {...enter(0.42, 12)}>
              {/* One hairline, no words.

                  It is still what stops the marks reading as five logos loose
                  under the composition — it draws the ground they stand on and
                  separates them from the work above — and it stands down with
                  the buttons where the marks actually leave. On a phone, where
                  they stay put, it stays with them. */}
              <motion.span
                className="arc-rail-rule"
                aria-hidden="true"
                style={marksFly ? { opacity: supportOpacity } : undefined}
              />

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

        /*
          The ruler. Its only job is to be exactly as tall as the band the
          composition is allowed to use — one small viewport, less the strip the
          floating navigation owns — so heroFlight.tsx can read that number off
          the browser instead of deriving it from innerHeight and a hard-coded
          dock height. svh is not innerHeight on iOS, and --dock-clear is a
          calc() around env(); this is the only way to be right about both.
        */
        .arc-probe {
          position: absolute;
          top: 0;
          inset-inline-start: 0;
          width: 0;
          height: calc(100svh - var(--dock-clear));
          visibility: hidden;
          pointer-events: none;
        }

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
            order: the window and its two-line caption (≈266px at a 372px
            column), the ~30px of air under it, and a 230px handset standing
            on the floor.
            Change the window's crop, its width or the front phone's and this
            number moves with them — too small and the phone drops out of the
            bottom of the frame on to the rail of marks, too large and the air
            under the caption opens past the point where the three objects
            still read as one group.
          */
          --frame-ar: 1.43;
          position: relative;
          /* The frame is the unit.

             Everything placed in it is already a percentage of it — but the
             chrome bar and the caption are type, and type was still being
             sized against the viewport. That is the whole reason the air under
             the caption used to measure 27px on one screen and 44px on
             another at the same column width: two fixed things inside an
             otherwise proportional column. Sizing them in cqw makes the
             column scale as one object, and the clamps keep the caption
             readable when the frame gets small. */
          container-type: inline-size;
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
          height: clamp(23px, 8.1cqw, 31px);
          padding-inline: 2.7cqw;
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
          /* only ever seen for the instant before the file paints — the page's
             own paper, so there is no flash of a colour it does not contain */
          background: #f4f1ec;
        }

        [data-theme="dark"] .arc-window-shot { background: #1b1e25; }

        /* product UI is never cropped: the container carries the file's own
           aspect, so contain fits it exactly and there is nothing to letterbox */
        .arc-window-shot img { object-fit: contain; }

        /* The caption. A screenshot with no name is decoration — this is what
           makes the window a piece of work with a subject and a category. */
        /*
          Two stacked lines rather than a name and a category side by side.
          The pair used to sit on one line with a rule between them, which read
          well at 372px and wrapped — unpredictably, and into the air under the
          window — everywhere narrower. Stacked, the caption is the same two
          lines at every width, so the ~30px it leaves above the handsets is a
          number this file can rely on.
        */
        .arc-window-caption {
          margin: clamp(8px, 2.9cqw, 12px) 2px 0;
          padding-inline-start: 9px;
          border-inline-start: 2px solid var(--arc-accent);
          line-height: 1.36;
        }

        .arc-window-caption b {
          display: block;
          font-size: clamp(11px, 3.36cqw, 13px);
          font-weight: 800;
          letter-spacing: -.01em;
          color: var(--text-primary,#090909);
        }

        .arc-window-caption span {
          display: block;
          font-size: clamp(10px, 2.96cqw, 11.5px);
          font-weight: 600;
          color: var(--arc-muted);
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

        /* A rule that fades out at both ends rather than stopping: it grounds
           the row without drawing a box under it. It is set a little stronger
           than the hairlines elsewhere in the hero because it is now carrying
           on its own what a title used to help it do — at border weight it
           read as a rendering artifact rather than a line somebody drew. */
        .arc-rail-rule {
          display: block;
          width: min(420px, 46%);
          height: 1px;
          margin: 0 auto clamp(15px, 2.1vh, 23px);
          background: linear-gradient(to right,
            transparent,
            color-mix(in srgb, var(--arc-muted) 34%, transparent) 26%,
            color-mix(in srgb, var(--arc-muted) 34%, transparent) 74%,
            transparent);
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
        }

        /*
          The hint goes on the four wrappers that are ACTUALLY driven by the
          scroll, and only while there is a departure to drive them. Under
          reduced motion — and for the paint before data-flight is decided —
          nothing here moves, and a permanently promoted layer per artifact is
          eleven compositor layers a phone is holding for nothing.
        */
        .hero-root[data-flight="on"] .arc-tile-fly,
        .hero-root[data-flight="on"] .arc-window-fly,
        .hero-root[data-flight="on"] .arc-phone-fly,
        .hero-root[data-flight="on"] .arc-mark-fly { will-change: transform; }

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

          A phone pins too, and the way it does is its own block below.
        */

        /* ---------- the departure, phone ---------- */
        /*
          A phone is pinned exactly as a desktop is — the same sticky screen,
          the same empty runway scrolling underneath it, the same single scroll
          value driving every artifact — with one difference, and it is
          measured rather than chosen.

          The desktop spread is a screen tall, so its screen sticks at the top
          of the viewport. A phone's is not: the identity is a full-width block
          ABOVE two artifact columns and a row of marks, and at 320×568 those
          four things cannot share one screen at any size worth looking at. So
          a phone's screen sticks at a NEGATIVE offset — --phone-lift, the exact
          number of pixels by which the composition overruns the band the
          navigation leaves it, measured in heroFlight.tsx against a probe of
          100svh minus --dock-clear rather than guessed at from innerHeight
          and a hard-coded dock height.

          The identity is therefore what leaves. It is above the work, it has
          been read by the time anything takes off, and it comes back down to
          the head of the route as it shrinks — the same move it makes on a
          desktop, from the other side. Everything that has to be WATCHED — both
          artifact columns, the marks, and every dock they fly into — is held
          perfectly still for the whole transition, inside the band above the
          navigation.

          --phone-lift is 0 on any phone tall enough not to need it, and every
          rule here then collapses into the desktop's own.
        */
        @media (max-width: 767px) {
          .hero-root[data-flight="on"] .arc-screen {
            position: sticky;
            top: calc(-1 * var(--phone-lift, 0px));
            /* the held band is one viewport, whatever was lifted out above it */
            min-height: calc(var(--phone-lift, 0px) + 100svh);
          }

          .hero-root[data-flight="on"] .hero-runway { height: 145vh; }

          /*
            The route owns the band under the name for the whole held viewport,
            exactly as it does on a pinned desktop. That is what closes the hole
            the old phone treatment left: the box the collage empties, the box
            the showcase empties and the strip the marks empty are one
            continuous landing area with the route drawn over all three, rather
            than a route laid over one column and a screen-tall gap above it.

            --fl-head is measured, not guessed: it is the headroom plus the
            height of the shrunk name, so no dock can ever open underneath the
            identity. --dock-clear at the other end is the same number the
            navigation itself is built from, so no dock can hide behind it.
          */
          .hero-root[data-flight="on"] .fl-route {
            top: calc(var(--phone-lift, 0px) + var(--fl-head, 76px));
            height: auto;
            bottom: var(--dock-clear);
          }
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
          /* The row of marks is the last thing in the composition and the dock
             floats over the bottom of the screen, so the clearance has to be
             the dock's own number — a flat 36px put four logos behind the
             navigation on a portrait tablet at rest. */
          .arc-screen {
            min-height: 0;
            padding-bottom: calc(var(--dock-clear) + clamp(4px, 1.4vh, 16px));
          }

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
           PHONE — one stage, with the identity standing in the middle of it.

           Not the desktop spread stacked, and not a reduced set of it: the
           same eleven artifacts, the same seven docks, the same choreography,
           the same reversible scroll. What changes is the SHAPE of the page
           they are laid out on.

           A phone cannot give the identity a column with an artifact column on
           either side of it — at 360px there is no such thing as three
           columns. So the spread folds: the two side columns become one stage
           the width of the screen, the artifacts take its four outer zones —
           photography down the left, product down the right, exactly the
           relationship the desktop composition is built on — and the identity
           stands in the band between them.

           The separation is structural, as it is on a desktop, just along the
           other axis. The stage is a three-row grid: an upper band the height
           of the upper artifacts, the copy, and a lower band the height of the
           lower ones. The artifact LAYER is absolutely positioned across the
           whole stage and hangs each object off the head or the floor of it,
           so nothing an artifact does can push, cover or be covered by a word
           of the copy — there is no artifact laid out where the type is, at
           any width, in either script.

           Every measurement here is a fraction of something the browser was
           asked for: the stage's own width, one small viewport, and the strip
           the floating navigation owns. Nothing is a pixel nudge that happens
           to work at 390.
           ═══════════════════════════════════════════════════════════════ */

        @media (max-width: 767px) {
          .hero-root {
            /* ---- the phone's reserves, one definition each ----

               Every one of these is read by more than one rule, and by the
               measurement in heroFlight.tsx through the probe. A number that
               appears twice is a number that goes wrong on one phone. */
            --arc-pad: clamp(15px, 4.4vw, 24px);
            --arc-head-pad: calc(clamp(94px, 11.8vh, 118px) + env(safe-area-inset-top, 0px));

            /* the strip of marks, built from the parts it is actually made of
               so the band below can be reserved exactly rather than guessed */
            --arc-mark-h: clamp(26px, 7.6vw, 36px);
            --arc-rail-top: clamp(14px, 4vw, 22px);
            --arc-rail-gap: clamp(8px, 2.4vw, 13px);
            --arc-marks-band: calc(
              var(--arc-rail-top) + var(--arc-rail-gap) + var(--arc-mark-h) + 1px
            );

            /*
              The height the composition may actually use.

              One small viewport — svh, because on iOS Safari vh is taller than
              what is on screen — less every strip of it that is already spoken
              for: the header's own padding at the top, the strip the marks
              stand on at the bottom, and under that the SAME
              --mobile-nav-reserve the floating dock itself is built from.

              What is left is the band, and the stage is never allowed to be
              taller than it. That is the whole guarantee: at rest, before the
              reader has moved at all, the identity and every artifact and the
              row of marks are inside one screen with the navigation clear
              underneath them. Nothing is behind the dock waiting to be
              scrolled out from under it.
            */
            --arc-band: calc(
              100svh
                - var(--arc-head-pad)
                - var(--arc-marks-band)
                - var(--mobile-nav-reserve)
            );

            /*
              The FLOOR under the height the middle row is given.

              The stage has to decide how wide it may be before the copy exists
              — its artifact bands are fractions of its width, so a wider stage
              is a taller one, and what is left for the type is what is left of
              the band. This clamp is what that decision is made from on the
              first paint, before anything has been measured.

              It is a floor and not the answer: heroFlight.tsx measures the
              identity block for real — on layout, on font load, on resize,
              on orientation change and whenever the block itself changes size —
              and publishes it as --arc-copy-measured. The stage reserves
              whichever is larger, so a longer strapline, a third line of
              Arabic or a language that sets the same sentence taller widens
              the reservation instead of running into the artifacts.

              Erring high here costs a few pixels of composition. Erring low
              would put an artifact on the name, which is why the two are
              combined with max() rather than the measurement simply winning.
            */
            --arc-copy-h: clamp(162px, 44vw, 216px);
          }

          .arc-inner {
            width: 100%;
            padding-inline: var(--arc-pad);
          }

          .arc-screen {
            display: block;
            min-height: 0;
            /* The fixed header's own strip, safe area included. It has to clear
               the plane-window toggle, which is the tallest control up there and
               sits in the corner the long Latin form of the name reaches into —
               at 74px "Turki Almalki" came within three pixels of it. */
            padding-top: var(--arc-head-pad);
            padding-bottom: 0;
          }

          /* ---------- the stage ---------- */

          /*
            Three rows: the upper artifacts, the identity, the lower artifacts.

            The two artifact rows hold no content — they are ::before and
            ::after, reserving height and nothing else, because the artifacts
            themselves are absolutely positioned across the whole stage. That is
            what makes the guarantee structural: the copy is the only thing ever
            laid out in row two, and the artifacts only ever hang off the outer
            edges of rows one and three, so an overlap is not something this
            layout can express.

            The reserves are percentages, which on a grid item resolve against
            the grid area's width — so both bands are a fraction of the stage's
            own width and the whole composition scales as one object.
          */
          .arc-stage {
            direction: ltr;
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto auto auto;
            column-gap: 0;
            row-gap: 0;
            align-items: stretch;
            /*
              Capped three ways, and the third is the one that matters.

              100% is the column. 430px stops the composition growing past
              the size it was drawn at on the widest phones. And the last term
              is what keeps a SHORT screen honest: the bands are 55% and 48% of
              the width, so a stage this wide is a stage --arc-band tall, and
              the whole composition — every artifact, the identity, the marks —
              fits in the band above the navigation with at most the header's
              own padding scrolled out of the way. The composition scales down
              WHOLE on a short phone rather than being cropped or pushed under
              the dock.
            */
            width: min(
              100%,
              430px,
              calc(
                (
                  var(--arc-band)
                    - max(var(--arc-copy-h), calc(var(--arc-copy-measured, 0px) + 6px))
                ) / 1.03
              )
            );
            margin-inline: auto;
          }

          /*
            The upper band — set by the deepest thing hanging from the head of
            the stage, which is the window and its caption. Measured across
            every width and both scripts, that group runs to between 42% and
            48% of the stage's width — the top of that range being the narrow
            stages, where the credit under the window is a fixed line of type
            rather than a fraction of anything. The reserve is that plus the
            daylight the name is owed underneath it.
          */
          .arc-stage::before {
            content: "";
            grid-row: 1;
            grid-column: 1;
            width: 0;
            padding-top: 55%;
            pointer-events: none;
          }

          /* the lower band — set by the front handset, which is over twice as
             tall as it is wide and is therefore the only thing this number is
             about: the group runs to 44.6% of the stage's width, at every width
             and in both scripts, because every part of it is a fraction of that
             same width */
          .arc-stage::after {
            content: "";
            grid-row: 3;
            grid-column: 1;
            width: 0;
            padding-top: 48%;
            pointer-events: none;
          }

          /*
            The identity, in the only row anything is laid out in.

            It is allowed to be WIDER than the stage: on a short screen the
            stage shrinks so the artifacts still fit above the navigation, and
            the name and the description have no reason to shrink with them.
            Centred on the same axis, so the copy fills the column while the
            composition is centred inside it.
          */
          .arc-center {
            grid-row: 2;
            grid-column: 1;
            justify-self: center;
            align-self: center;
            z-index: 3;
            width: min(430px, calc(100vw - var(--arc-pad) * 2));
            padding-inline: 0;
          }

          /*
            The artifact layer. Absolute over the whole stage, never in flow,
            and never a pointer target — the buttons underneath it stay
            hittable at every width whatever passes over them mid-flight.

            direction: ltr on both, so photography stays on the left of the
            composition and product on the right in Arabic exactly as in
            English — the same rule the desktop spread is pinned by. Only the
            caption inside it takes the document's own direction back.
          */
          .arc-collage,
          .arc-showcase {
            position: absolute;
            inset: 0;
            direction: ltr;
            pointer-events: none;
          }

          .arc-collage { z-index: 1; }
          .arc-showcase { z-index: 2; }

          /*
            The frames stop being two boxes side by side and become one box the
            size of the stage — which is also the container every berth below is
            measured in cqw against.
          */
          .arc-collage-frame,
          .arc-showcase-frame {
            position: absolute;
            inset: 0;
            width: auto;
            margin: 0;
            aspect-ratio: auto;
            container: arc-stage / inline-size;
          }

          /*
            Where each artifact hangs.

            --x is a fraction of the stage's width from its centre line, and
            --t / --bt are hundredths of that same width measured down from
            the stage's head or up from its floor. One of the two is always
            auto, so an artifact belongs to the upper band or the lower one
            and cannot drift between them as the copy changes height.
          */
          /* the logical inset the desktop anchors by is cleared FIRST: it
             resolves to left in a left-to-right layer, so clearing it after
             would take the placement straight back off again */
          .arc-tile,
          .arc-phone {
            inset-inline: auto;
            left: calc(50% + var(--x));
            right: auto;
            top: var(--t);
            bottom: var(--bt);
            transform: translate(-50%, 0) rotate(var(--r));
          }

          .arc-window-stack {
            inset-inline: auto;
            left: calc(50% + var(--x));
            right: auto;
            top: var(--t);
            bottom: var(--bt);
            transform: translate(-50%, 0);
            /* the window's own chrome is sized against the WINDOW, not against
               the stage: a browser bar is a fraction of its browser */
            container-type: inline-size;
          }

          /* the one piece of the composition that reads in the document's own
             direction, because it is a sentence rather than a picture */
          .arc-window-caption { direction: var(--doc-dir, ltr); }

          /*
            And the one piece of it that cannot scale.

            The caption is type: it is set to the window's width and it is the
            same two lines whatever that width is. Below a stage this narrow the
            window is under 130px across and neither line fits on one — the
            product's name breaks into three lines under a thumbnail and the
            block is taller than the window it belongs to.

            It does not stand down. A screenshot with no name is decoration, and
            a phone is where that matters most, so what changes is the SHAPE of
            the credit rather than whether there is one: it comes out of the
            window's column, hangs under it on one line, and is allowed to run
            inward across the stage — anchored to the window's outer edge, so it
            grows toward the middle of the composition where there is nothing
            and can never reach the edge of the screen. The commissioner's name
            is the line that goes, and it goes to screen readers rather than
            away: the product still says what it is and who it was built for,
            in a form 79px of window can carry.
          */
          @container arc-stage (max-width: 300px) {
            .arc-window-caption {
              position: absolute;
              top: 100%;
              right: 0;
              left: auto;
              width: max-content;
              /* twice the window, which from the window's outer edge still
                 stops short of the far side of the stage */
              max-width: 200%;
              margin: 5px 0 0;
              /* the rule sits on the outer edge in both scripts here, because
                 the block is anchored to that edge rather than to the start of
                 its own text */
              border-inline-start: 0;
              border-right: 2px solid var(--arc-accent);
              padding-inline: 0 6px;
              text-align: right;
            }

            .arc-window-caption b {
              font-size: 10px;
              line-height: 1.3;
              white-space: nowrap;
            }

            /* present, named, and not drawn: there is no width here for a
               second line, and dropping it from the document as well would be
               taking the fact away rather than the pixels */
            .arc-window-caption span {
              position: absolute;
              width: 1px;
              height: 1px;
              margin: -1px;
              padding: 0;
              overflow: hidden;
              white-space: nowrap;
              clip-path: inset(50%);
            }
          }

          /* Chrome at the size the window is actually drawn at. The desktop
             clamps floor at 23px, which is a seventh of a 169px window — a
             browser bar that deep reads as a title bar with the page in a
             letterbox under it. */
          .arc-window-bar {
            height: clamp(13px, 9cqw, 22px);
            gap: 6px;
            padding-inline: 3.4cqw;
          }

          .arc-window-lights { gap: 3.5px; }
          .arc-window-dot { width: 5px; height: 5px; }
          .arc-window-address { max-width: 84px; height: 11px; gap: 4px; }
          .arc-window-address-line { flex-basis: 34px; height: 2px; }

          /* ---------- the identity ---------- */

          .hero-name-title {
            max-width: none;
            font-size: clamp(34px, 10.2vw, 50px);
            line-height: 1.14;
            padding-block: .06em .14em;
          }

          [dir="rtl"] .hero-name-title {
            max-width: none;
            font-size: clamp(36px, 11.6vw, 54px);
            line-height: 1.28;
            padding-block: .08em .2em;
          }

          .hero-positioning {
            max-width: 32ch;
            margin-top: clamp(8px, 2.4vw, 13px);
            padding-inline: 4px;
            font-size: clamp(13px, 3.6vw, 15px);
            line-height: 1.6;
          }

          [dir="rtl"] .hero-positioning { max-width: 33ch; line-height: 1.75; }

          .hero-cta-row {
            width: 100%;
            max-width: 344px;
            margin-inline: auto;
            flex-wrap: nowrap;
            gap: 9px;
            margin-top: clamp(14px, 4vw, 22px);
          }

          .hero-cta-primary,
          .hero-cta-secondary {
            flex: 1 1 0;
            min-width: 0;
            min-height: 46px;
            padding: 11px 8px;
            font-size: 13.5px;
          }

          /* ---------- the marks ---------- */

          /* Four marks on one line at every phone width — the row is the head
             of the route and a wrapped head reads as a logo wall. The chips
             share one baseline and one height, and their natural widths do the
             rest. The three parts are the same three the band above reserved,
             so the row is exactly as tall as the layout was told it is. */
          .arc-rail { padding-top: var(--arc-rail-top); }

          .arc-rail-rule {
            width: min(200px, 54%);
            margin-bottom: var(--arc-rail-gap);
          }

          .arc-marks {
            --mark-h: var(--arc-mark-h);
            flex-wrap: nowrap;
            gap: clamp(6px, 2vw, 11px);
          }

          .arc-mark-float { border-radius: 10px; padding: calc(var(--pad) * .7); }

          /* ---------- performance ----------

             Everything below buys frames back without taking anything off the
             screen. A phone compositing this hero is already carrying nine
             transformed artifacts; it must not also be re-rasterising two
             120px-blurred circles and a full-screen blend on every one of them.
          */

          /* the same two lights, drawn instead of blurred. A 44vw circle behind
             a 120px blur is a full-screen filter pass; a radial gradient of the
             same colour and softness is a paint the GPU already had. */
          .hero-aurora {
            width: 76vw;
            filter: none;
            opacity: 1;
            border-radius: 0;
            background: radial-gradient(
              closest-side,
              color-mix(in srgb, var(--aurora-tint) 12%, transparent),
              transparent 100%
            );
          }

          .hero-aurora-a { --aurora-tint: #55a9ff; background-image: radial-gradient(closest-side, rgba(85,169,255,.13), transparent); }
          .hero-aurora-b { --aurora-tint: #7d5cff; background-image: radial-gradient(closest-side, rgba(125,92,255,.09), transparent); }

          /* 4.5% of noise under a blend mode, on a screen held at arm's length:
             invisible, and a full-viewport blend recomposited behind every
             moving artifact. It goes. */
          .hero-grain { display: none; }

          /* ---------- the route ----------

            The phone route: seven stops, the same seven the desktop files into.
            The berth is sized off the slot rather than off the viewport, so the
            widest landing — a 3:2 frame beside a wide lockup, at Monsha'at —
            always fits inside it, and the labels wrap rather than truncate
            because there is no width here to spend on an ellipsis.
          */
          .fl-route {
            /* svh, not vw: what a dock has room to be is decided by the height
               of the band it is drawn in, and that band is one small viewport
               less the navigation's strip. Sized against the width instead, the
               route came out identical on a 568px screen and an 844px one —
               cramped on the first and lost in the second. */
            --fl-slot: clamp(30px, 5.6svh, 50px);
            --fl-mark: clamp(15px, 2.8svh, 25px);
            --fl-node: clamp(15px, 2.4svh, 20px);
            /* wide enough for the widest landing there is — a 3:2 frame beside
               a wide lockup, at Monsha'at — whatever the slot has become */
            --fl-berth: calc(var(--fl-slot) * 2.9);
          }

          .fl-track { width: 100%; }
          .fl-dock { gap: 9px; }
          .fl-berth { gap: 7px; }
          .fl-list { gap: clamp(4px, 2.4svh, 20px); }

          .fl-org,
          .fl-role,
          .fl-lead { white-space: normal; overflow: visible; }
          .fl-org { font-size: 12.5px; line-height: 1.3; }
          .fl-dock[data-lead="1"] .fl-org { font-size: 13.5px; }
          .fl-role { font-size: 10.5px; line-height: 1.4; }
          .fl-lead { font-size: 11px; max-width: none; }
        }

        /* A short phone has no room for the opening paragraph beside the first
           dock — the same trade the short-laptop rule makes, for the same
           reason: the route must end above the navigation, not behind it. */
        @media (max-width: 767px) and (max-height: 700px) {
          .fl-lead { display: none; }
        }

        /* A landscape phone. The composition is not pinned at this width — it
           is a scrolling column, as it is on any short tablet — so the only
           thing that has to be guaranteed here is that the fixed navigation
           covers nothing that is being READ: the header strip gives back what
           it can, and the composition keeps the dock's own clearance under it
           so the buttons stay hittable. */
        @media (max-width: 1099px) and (max-height: 640px) {
          .arc-screen {
            padding-top: calc(clamp(58px, 15vh, 88px) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(var(--dock-clear) + 8px);
          }
        }

        /*
          The narrowest phones keep the buttons on ONE line.

          Stacking them was the tidier-looking answer and it was the wrong one:
          a second button row is 55px of type in the middle of the stage, and
          the stage is sized off an estimate of how tall the copy is — so at
          320 it pushed the lower half of the composition down behind the
          navigation. Two 140px buttons hold both labels in both scripts at
          this size; the row gives back its gap and its padding instead.
        */
        @media (max-width: 359px) {
          .hero-cta-row { gap: 7px; }
          .hero-cta-primary,
          .hero-cta-secondary { padding-inline: 4px; font-size: 12.5px; }
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
             have been laid over — it follows the composition instead, and the
             hero keeps the dock's clearance under it so the last stop of that
             calm list is never the thing left behind the navigation */
          .fl-route {
            position: static;
            height: auto;
            padding-top: clamp(34px, 7vh, 58px);
          }

          .arc-screen { padding-bottom: var(--dock-clear); }
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

const Collage = memo(function Collage({
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
          isPhone={isPhone}
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
});

const CollageTile = memo(function CollageTile({
  tile,
  spot,
  isPhone,
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
  spot: Spot | Berth;
  isPhone: boolean;
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
          ...(isPhone
            ? berthVars(spot as Berth)
            : {
                "--w": `${spot.w}%`,
                "--x": `${spot.x}%`,
                "--y": `${(spot as Spot).y}%`,
              }),
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
                  sizes="(max-width: 767px) 48vw, 320px"
                />
              </span>
            </span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* The marks                                                           */
/* ------------------------------------------------------------------ */

/**
 * An organisation's mark, which is also the label its stop is filed under.
 *
 * On the way down it stops being a logo and becomes the metadata beside a
 * year: the same object, in a different role.
 */
const MarkChip = memo(function MarkChip({
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
});

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
const Showcase = memo(function Showcase({
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
        style={
          (isPhone ? berthVars(WINDOW.atPhone) : { "--w": `${WINDOW.w}%` }) as CSSProperties
        }
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
                    sizes="(max-width: 767px) 47vw, 400px"
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
          isPhone={isPhone}
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
});

const ShowcasePhone = memo(function ShowcasePhone({
  phone,
  spot,
  isPhone,
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
  spot: Handset["at"] | Berth;
  isPhone: boolean;
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
          ...(isPhone
            ? berthVars(spot as Berth)
            : {
                "--w": `${spot.w}%`,
                "--x": `${spot.x}%`,
                "--b": `${(spot as Handset["at"]).b}%`,
              }),
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
                    sizes="(max-width: 767px) 19vw, 120px"
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
});
