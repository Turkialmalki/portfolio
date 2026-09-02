"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { STOPS } from "./FlightPath";

/* ════════════════════════════════════════════════════════════════════════
   THE FLIGHT — the hero's archive docking into the career route
   ────────────────────────────────────────────────────────────────────────
   The hero spread and the flight-path timeline used to be two sections that
   happened to sit next to each other. This module makes them one movement:
   every object floating around the identity is an *aircraft* with a filed
   flight plan, and the route below is a column of *docks*, one per stop on
   the real timeline.

   Scroll drives it and nothing else. There is no timer, no IntersectionObserver
   driving position, no scroll hijack: a single scroll progress value in [0,1]
   is fed through a pure function per aircraft, so the choreography is
   deterministic, reversible, and correct after a refresh at any offset.

   Nothing here reflows. Measurement happens on layout, resize and font load;
   during scroll the only things that change are `transform` and `opacity` on
   the aircraft, plus `scaleY` on the route rail.
   ════════════════════════════════════════════════════════════════════════ */

type Bi = { ar: string; en: string };

/* ------------------------------------------------------------------ */
/* Flight plans                                                        */
/* ------------------------------------------------------------------ */

/**
 * One travelling artifact.
 *
 * `start`/`end` are positions in the transition's scroll progress, so each
 * aircraft leaves and lands at its own moment — the archive empties in an
 * order rather than all at once. `bow` and `spin` are what make each route
 * its own curve: a straight interpolation from A to B reads as a drag, a
 * lateral bow peaking mid-flight reads as a path.
 */
export type Flight = {
  id: string;
  /** id of the dock this artifact belongs to — always a real timeline stop */
  dock: string;
  /** which slot in the dock receives it */
  into: "frame" | "mark";
  start: number;
  end: number;
  /** lateral bow of the path at its midpoint, px */
  bow: number;
  /** extra rotation carried through the arc, deg */
  spin: number;
  /** motion blur at the midpoint of the arc, px — always 0 at both ends */
  blur: number;
  /** the artifact's resting tilt, cancelled on arrival so it docks square */
  tilt: number;
  /** offset inside a shared frame, for artifacts that dock as a stack */
  stack?: { x: number; y: number; r: number };
};

/**
 * One stop on the route, drawn as the place an artifact comes to rest.
 *
 * `id` is a real id from `STOPS` in FlightPath, and every word of copy is read
 * back out of that array — the dock cannot describe a milestone the timeline
 * does not have, and the two can never drift apart.
 */
export type Dock = {
  id: string;
  /** aspect (w/h) of the frame an artifact lands in; omitted → no frame */
  ratio?: number;
  /** this dock receives an organisation mark */
  mark?: boolean;
  /** aspect (w/h) of that mark — kept level with MARKS in Hero.tsx */
  markRatio?: number;
  /** the first milestone — the one that opens into a card as it docks */
  lead?: boolean;
};

export const DOCKS: Dock[] = [
  { id: "aramco", mark: true, markRatio: 327 / 119, lead: true },
  /* Each frame is given its artifact's OWN aspect, which is what lets the
     landing be measured on one edge and come out right on both — see the
     scale in `measure`. Change an artifact's crop and its dock changes with
     it, or the object arrives the wrong shape. */
  { id: "alrajhi", mark: true, markRatio: 1566 / 1527, ratio: 330 / 736 },
  { id: "emkan", mark: true, markRatio: 209 / 192, ratio: 538 / 1200 },
  { id: "practice", ratio: 4 / 5 },
  { id: "monshaat", mark: true, markRatio: 640 / 356, ratio: 3 / 2 },
  /* The route stops where the hero's own objects run out, and it skips the
     stops in between that have nothing to receive — a dock with nothing
     landing on it is a row of text pretending to be a landing. Ventures used
     to sit here on the strength of one logo chip; with that chip gone it was
     exactly that row, so it goes back to being the timeline's to tell.

     Film is last because the window is: it carries the accelerator's platform,
     so it flies past the ventures stop to the one that is actually about it.
     No mark here on purpose — the accelerator's wordmark is pale enough to
     read as an empty box at 24px, which is the same reason the timeline's own
     film stop carries no logo tile. */
  { id: "film", ratio: 1700 / 1012 },
];

const COPY = {
  ar: {
    label: "خط الرحلة",
    /* deliberately not the timeline's own summary: this is the one-line
       version of the first milestone, the paragraph lives on the stop below */
    lead: "حيث بدأت الرحلة — أساسيات العمل المؤسسي وتسليم البرمجيات.",
  },
  en: {
    label: "Flight path",
    lead: "Where the journey began — enterprise foundations and software delivery.",
  },
};

/* ------------------------------------------------------------------ */
/* Measurement                                                         */
/* ------------------------------------------------------------------ */

type Leg = {
  /** centre-to-centre travel, px */
  dx: number;
  dy: number;
  /** how much the artifact shrinks to fit its slot */
  scale: number;
};

export type Plan = {
  legs: Record<string, Leg>;
  /** the identity block's move to the head of the route */
  center: { dy: number; scale: number };
  /**
   * How far the screen is allowed to scroll BEFORE it pins, px.
   *
   * Desktop pins at the top of the composition and this is always 0. A phone
   * cannot: the identity, both artifact groups and the row of marks do not fit
   * in one viewport at 320x568, so the screen is pinned with a negative sticky
   * top and the identity is what scrolls off. `lift` is exactly how much of
   * the screen is above the viewport once it is stuck, measured — never a
   * breakpoint's guess at how tall a name happens to be.
   */
  lift: number;
  /**
   * `lift` expressed as a fraction of the pin's scroll range.
   *
   * The choreography is driven by the pin's progress, but nothing should move
   * until the screen is actually stuck — otherwise every artifact flies while
   * the page underneath it is still scrolling and lands nowhere near its dock.
   * The hero remaps progress past this fraction, so 0 is still "the screen is
   * now held" at every width.
   */
  lead: number;
};

const EMPTY_PLAN: Plan = { legs: {}, center: { dy: 0, scale: 1 }, lift: 0, lead: 0 };

/**
 * How a transform gets at the measurements.
 *
 * The plan itself is a plain object behind `read()` so a transform always sees
 * the latest numbers, and `version` is a motion value that ticks when it
 * changes. `useTransform` only combines numeric motion values, so the tick is
 * what re-poses every artifact after a resize — without a React render, and
 * without any transform holding a stale measurement.
 */
export type PlanFeed = {
  read: () => Plan;
  version: MotionValue<number>;
};

/**
 * Everything the choreography needs to know about the page, measured.
 *
 * The one subtlety: an artifact's travel is read from its *container* — the
 * element that carries the static placement (`.arc-tile`, `.arc-mark`, …) —
 * while the animation is applied to the child inside it. A container is never
 * touched by this module, so its rect stays the artifact's resting position no
 * matter how far through the transition the reader already is. That is what
 * makes a mid-scroll resize, or a refresh halfway down, measure correctly.
 *
 * Both rects are read in the same frame and only their difference is kept, so
 * the scroll offset cancels out of every number here.
 */
export function useFlightPlan(
  flights: Flight[],
  enabled: boolean,
  ready: boolean,
  /** phones pin with a measured lift; every other width pins at the top */
  lifted: boolean,
) {
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<HTMLDivElement>(null);
  /*
    One element whose only job is to be `100svh - --dock-clear` tall.

    Both halves of that are CSS the JS cannot resolve — `svh` is not
    `innerHeight` on iOS, and `--dock-clear` is a calc() containing env(). A
    probe is the honest way to ask the browser what those two actually come to
    on this device, and it is what every number below is measured against, so
    the fixed navigation can never end up covering a dock.
  */
  const probeRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const craft = useRef(new Map<string, HTMLElement>());
  const slots = useRef(new Map<string, HTMLElement>());
  const nodes = useRef(new Map<string, HTMLElement>());

  /**
   * The plan lives outside React: it changes on resize only, and pushing it
   * through state would re-render the whole hero for a handful of numbers that
   * nothing but the transforms ever reads.
   */
  const planRef = useRef<Plan>(EMPTY_PLAN);
  const lastSignature = useRef("");
  const lastCopy = useRef(-1);
  const version = useMotionValue(0);
  const plan = useMemo<PlanFeed>(() => ({ read: () => planRef.current, version }), [version]);
  const publish = useCallback(
    (next: Plan) => {
      planRef.current = next;
      version.set(version.get() + 1);
    },
    [version],
  );

  const registerCraft = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) craft.current.set(id, node);
      else craft.current.delete(id);
    },
    [],
  );

  const registerSlot = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) slots.current.set(id, node);
      else slots.current.delete(id);
    },
    [],
  );

  const registerNode = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    },
    [],
  );

  /**
   * How tall the identity block ACTUALLY is, published to CSS.
   *
   * The phone stage has to decide how wide it may be before it can know how
   * tall the copy is: its two artifact bands are fractions of its width, so a
   * wider stage is a taller one, and what is left for the type is what is left
   * of one viewport. The stylesheet carries a clamp for that — and a clamp is a
   * guess. It is right for the strapline this site ships today and wrong the
   * moment the strapline gets longer, or a translation sets it in three lines
   * where the other set it in two.
   *
   * So the guess becomes a FLOOR and this becomes the truth: the stage reserves
   * whichever of the two is larger. The reserve can then only ever be too
   * generous — which costs a few pixels of composition — and never too small,
   * which would put an artifact on the name.
   *
   * `offsetHeight`, not a rect: the identity is scaled and translated by the
   * transition, and the number wanted here is the layout one, which no
   * transform can touch. It is read on layout, on font load, on resize and
   * orientation, and whenever the block itself changes size. Never on scroll.
   */
  const measureCopy = useCallback(() => {
    const stage = stageRef.current;
    const center = centerRef.current;
    if (!stage || !center) return;
    const height = Math.round(center.offsetHeight);
    /* written only when it genuinely changes: this property feeds back into the
       stage's own width, and the observer watching that width is what calls
       this in the first place */
    if (height === lastCopy.current) return;
    lastCopy.current = height;
    stage.style.setProperty("--arc-copy-measured", `${height}px`);
  }, []);

  /**
   * Returns a signature of what it measured, so the caller can tell whether the
   * page has stopped moving underneath it — see the settle loop below.
   */
  const measure = useCallback((): string => {
    const stage = stageRef.current;
    measureCopy();
    if (!stage || !enabled) return "";

    /** layout position inside the stage — never touched by any transform */
    const offsetIn = (node: HTMLElement | null) => {
      let total = 0;
      let walk: HTMLElement | null = node;
      while (walk && walk !== stage) {
        total += walk.offsetTop;
        walk = walk.offsetParent as HTMLElement | null;
      }
      return total;
    };

    const legs: Record<string, Leg> = {};
    for (const flight of flights) {
      const from = craft.current.get(flight.id);
      const to = slots.current.get(`${flight.dock}:${flight.into}`);
      if (!from || !to) continue;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      if (!a.height || !b.height || !from.offsetHeight) continue;

      /*
        Two corrections, both because the container is already tilted.

        A transform on a child is expressed in the PARENT's frame, so a
        translate of (dx, dy) under a container tilted by θ arrives on screen
        rotated by θ — enough, at four degrees and four hundred pixels, to miss
        a dock by a third of its height. The travel is therefore measured on
        screen and then turned back into the container's own frame.

        And a rect is the axis-aligned bounding box of that tilted element,
        which is taller than the element itself; scaling against it would land
        every tilted artifact a couple of percent small. offsetHeight is the
        layout height, untouched by any transform, which is the one to divide.
      */
      const rad = (flight.tilt * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);

      legs[flight.id] = {
        dx: dx * cos + dy * sin,
        dy: -dx * sin + dy * cos,
        /* height, not width: every slot is given its artifact's own aspect,
           so matching one edge matches both */
        scale: to.offsetHeight / from.offsetHeight,
      };
    }

    /*
      How much of the screen has to be above the viewport before the rest of it
      fits.

      `free` is the band the composition may actually use: one small viewport
      less the strip the fixed navigation owns, both asked of the browser
      rather than derived from innerHeight and a hard-coded dock height. `need`
      is where the composition genuinely ends — the bottom of the row of marks,
      read from layout so a half-finished transition cannot change it.

      Above the phone breakpoint the two artifact columns sit either side of
      the identity and the whole spread is a screen tall, so this is zero and
      the screen pins at its top exactly as it always did. On a phone the
      identity is a stacked block above the artifacts and the difference is
      real, so the identity is what leaves — it has already been read by the
      time anything takes off.
    */
    const free = probeRef.current?.offsetHeight ?? 0;
    const need = marksRef.current
      ? offsetIn(marksRef.current) + marksRef.current.offsetHeight
      : 0;
    const lift = lifted && free > 0 && need > 0 ? Math.max(0, Math.round(need - free)) : 0;

    /*
      The identity climbs to the head of the route and shrinks about its own top
      edge, so the name stays the first thing read the whole way through.

      Unlike every artifact, the identity has no container to hide behind: the
      element this transform lands on is the element that has to be measured. A
      rect would therefore include the displacement already applied to it, which
      is invisible on a normal load — progress is zero, so there is nothing to
      include — and badly wrong on a refresh halfway down, where the block is
      measured mid-climb and told to climb again from there. offsetTop is the
      layout position and no transform can touch it.
    */
    let center = { dy: 0, scale: 1 };
    const centerNode = centerRef.current;
    const scale = 0.58;
    if (centerNode) {
      const offset = offsetIn(centerNode);
      /*
        Where the name comes to rest, measured from the top of the band the
        reader can actually see — which is `lift` further down the screen than
        the screen's own top.

        A phone gets a floor under that headroom, and it is the height of the
        fixed header itself. The identity is a wide block on a narrow screen, so
        at 320 the shrunk name reached across into the language switcher and the
        two ended up sharing a line. Reading the header's real height is the
        only version of this that survives a longer name, a taller control or a
        notch; the desktop keeps the proportional headroom it was drawn with.
      */
      const stageH = stage.getBoundingClientRect().height;
      const bar = document.querySelector("header");
      const barH = bar ? bar.getBoundingClientRect().height : 0;
      const headroom = lifted
        ? Math.max(Math.min(96, (free || stageH) * 0.11), Math.min(112, barH - 8))
        : Math.min(96, stageH * 0.11);
      center = { dy: lift + headroom - offset, scale };

      /*
        Where the route is allowed to begin: under the name, once the name has
        shrunk. Published rather than guessed at, because the one thing that
        must never happen is a dock opening underneath the identity.
      */
      const title = centerNode.querySelector<HTMLElement>(".hero-name-title");
      const head = headroom + (title ? title.offsetHeight * scale : 0) + 14;
      stage.style.setProperty("--fl-head", `${Math.round(head)}px`);
    }

    stage.style.setProperty("--phone-lift", `${lift}px`);

    /*
      The same lift as a fraction of the pin's scroll range, so the hero can
      hold every artifact still until the screen is genuinely stuck. The range
      is the pin's height less one viewport — the span a sticky child stays
      stuck for, and exactly what useScroll's start/end offsets measure.
    */
    const pin = pinRef.current;
    const range = pin ? pin.offsetHeight - window.innerHeight : 0;
    const lead = lift > 0 && range > 0 ? Math.min(0.9, lift / range) : 0;

    /*
      Where the route is allowed to draw itself, below the width that pins the
      hero.

      Unpinned, the route cannot simply follow the composition: the columns it
      empties would stay in the layout as a screen-tall hole with a timeline
      underneath it. So it is laid over the box the archive just left instead —
      the work does not slide out of the way to make room for the route, the
      route is what the work turns into, in the same place.

      Whether the collage belongs in that box is decided by the layout rather
      than by a breakpoint: side by side with the showcase it is part of the
      same emptied row, stacked above it (phones, where the collage stays put)
      it is not.
    */
    const collage = collageRef.current?.getBoundingClientRect();
    const showcase = showcaseRef.current?.getBoundingClientRect();
    if (stage && showcase) {
      const base = stage.getBoundingClientRect();
      const sameRow = collage ? Math.abs(collage.top - showcase.top) < collage.height * 0.5 : false;
      const top = sameRow && collage ? Math.min(collage.top, showcase.top) : showcase.top;
      const bottom = sameRow && collage ? Math.max(collage.bottom, showcase.bottom) : showcase.bottom;
      stage.style.setProperty("--fl-anchor", `${Math.round(top - base.top)}px`);
      stage.style.setProperty("--fl-anchor-h", `${Math.round(bottom - top)}px`);
    }

    const next: Plan = { legs, center, lift, lead };
    const signature = JSON.stringify(next, (key, value) =>
      typeof value === "number" ? Math.round(value * 2) / 2 : value,
    );
    if (signature !== lastSignature.current) {
      lastSignature.current = signature;
      publish(next);
    }

    return signature;
  }, [flights, enabled, publish, lifted, measureCopy]);

  /**
   * The rail, drawn between the first and last node exactly as the timeline
   * draws its own — measured, never guessed, so it lands right in both scripts
   * and at every width.
   *
   * It is deliberately outside the flight measurement: under reduced motion
   * nothing flies and there is no plan to compute, but the route is still
   * rendered as a calm list and still needs its line.
   */
  const measureRail = useCallback(() => {
    const rail = railRef.current;
    const list = [...nodes.current.values()];
    const parent = rail?.parentElement;
    if (!rail || !parent || list.length < 2) return;
    const base = parent.getBoundingClientRect();
    const first = list[0].getBoundingClientRect();
    const last = list[list.length - 1].getBoundingClientRect();
    const top = first.top + first.height / 2 - base.top;
    const height = last.top + last.height / 2 - base.top - top;
    rail.style.top = `${top}px`;
    rail.style.height = `${height}px`;

    /*
      The tail carries the line on past the last dock, so the route leaves the
      hero rather than stopping inside it. Its length is measured, not chosen:
      it runs from the last node to the bottom edge of the hero, which is
      exactly where the timeline's entry curve takes over — a fixed height left
      a line-less band on tall screens and overshot on short ones.
    */
    const tail = tailRef.current;
    if (tail) {
      tail.style.top = `${top + height}px`;
      const stage = stageRef.current;
      const reach = stage
        ? stage.getBoundingClientRect().bottom - base.top - (top + height)
        : 72;
      tail.style.height = `${Math.max(48, Math.min(360, reach))}px`;
    }

    /*
      Where this rail is, in viewport x — published for the timeline's entry
      curve, which used to start from the middle of the page and so drew a line
      that began nowhere near the one it was supposed to be continuing. The page
      never scrolls horizontally, so a viewport x is a stable page x.
    */
    document.documentElement.style.setProperty(
      "--hero-rail-x",
      `${Math.round(rail.getBoundingClientRect().left + rail.getBoundingClientRect().width / 2)}px`,
    );
  }, []);

  /**
   * Measure until the page holds still.
   *
   * A single pass on layout is not enough and a timeout is a guess: the
   * entrance animation is still translating the very columns it is asked to
   * measure, webfonts have not swapped, and the preloader is still holding the
   * page. Rather than predict when all of that ends, this re-measures each
   * frame and stops once three in a row agree — which is also exactly the right
   * behaviour after a resize, an orientation change, or a language switch.
   *
   * `ready` is in the dependencies for the same reason: while the preloader is
   * up the spread sits perfectly still at its entrance offset, which looks
   * settled and is not. The run has to start again when the columns are
   * finally allowed to move.
   *
   * It costs a few frames of reads at mount and after a resize, and nothing at
   * all while the reader is scrolling: scroll never re-measures, because every
   * number here is a difference between two boxes in the same frame and is
   * therefore independent of the scroll position.
   */
  useLayoutEffect(() => {
    if (!enabled) {
      lastSignature.current = "";
      publish(EMPTY_PLAN);
      /* the calm treatment still draws a route, so it still needs the line —
         and it still lays the composition out around the copy, so it still
         needs to know how tall the copy really is */
      measureCopy();
      measureRail();
      const onResize = () => {
        measureCopy();
        measureRail();
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      document.fonts?.ready.then(onResize).catch(() => {});
      const ro = new ResizeObserver(onResize);
      if (centerRef.current) ro.observe(centerRef.current);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        ro.disconnect();
      };
    }

    let frame = 0;
    let stable = 0;
    let seen = "";
    let floor = 0;
    let deadline = 0;

    const step = () => {
      measureRail();
      const signature = measure();
      if (signature && signature === seen) stable += 1;
      else {
        stable = 0;
        seen = signature;
      }
      const now = performance.now();
      /* Holding still is not the same as having finished. The entrance runs
         on a delay, so for the first fraction of a second after it is allowed
         to start the columns sit perfectly stable at their offset — stopping
         there would bake that offset into every route. The floor is what
         carries the run past it. */
      if ((stable >= 3 && now >= floor) || now > deadline) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const restart = () => {
      stable = 0;
      seen = "";
      const now = performance.now();
      floor = now + 1600;
      deadline = now + 4000;
      if (!frame) frame = requestAnimationFrame(step);
    };

    restart();

    const stage = stageRef.current;
    const ro = new ResizeObserver(restart);
    if (stage) ro.observe(stage);
    /* the identity block as well as the screen: a language switch resets the
       copy without necessarily resizing anything above it, and the height of
       that block is what the stage reserves its middle row from */
    if (centerRef.current) ro.observe(centerRef.current);
    window.addEventListener("resize", restart);
    window.addEventListener("orientationchange", restart);
    /* Arabic and Latin metrics differ enough to move every dock a few pixels. */
    document.fonts?.ready.then(restart).catch(() => {});
    window.addEventListener("load", restart);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", restart);
      window.removeEventListener("orientationchange", restart);
      window.removeEventListener("load", restart);
    };
  }, [measure, measureRail, measureCopy, enabled, publish, ready]);

  return {
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
  };
}

/* ------------------------------------------------------------------ */
/* The path                                                            */
/* ------------------------------------------------------------------ */

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** slow out of the hero, quick across the middle, slow into the dock */
const glide = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The vertical component leads the horizontal one.
 *
 * If both axes used the same easing the artifact would travel a straight line;
 * running the fall slightly ahead of the drift is what bends the route, and
 * the lateral bow below finishes the curve.
 */
const fall = (t: number) => t * t * (3 - 2 * t);

/** 0 at both ends, 1 in the middle — the shape of everything that peaks mid-air */
const arc = (t: number) => Math.sin(Math.PI * clamp01(t));

export type Pose = { x: number; y: number; scale: number; rotate: number; blur: number };

/**
 * Where one artifact is at one scroll position. Pure, so the same offset
 * always produces the same frame — scrolling back up retraces the route
 * exactly, and a refresh mid-transition paints the correct pose immediately.
 */
export function poseAt(p: number, flight: Flight, leg: Leg | undefined): Pose {
  if (!leg) return { x: 0, y: 0, scale: 1, rotate: 0, blur: 0 };
  const t = clamp01((p - flight.start) / (flight.end - flight.start));
  const e = glide(t);
  const bow = arc(t);
  const stack = flight.stack;
  return {
    x: leg.dx * e + flight.bow * bow + (stack ? stack.x * e : 0),
    y: leg.dy * fall(t) + (stack ? stack.y * e : 0),
    scale: 1 + (leg.scale - 1) * e,
    /* the resting tilt is unwound as it flies, so it arrives square in its
       slot — plus a little spin carried through the arc itself */
    rotate: -flight.tilt * e + flight.spin * bow + (stack ? stack.r * e : 0),
    blur: flight.blur * bow,
  };
}

/**
 * The style object for one aircraft.
 *
 * `useTransform` over both the progress and the plan means a resize re-poses
 * every artifact on the spot without a React render, and without the
 * transforms ever holding a stale measurement.
 */
const REST: Pose = { x: 0, y: 0, scale: 1, rotate: 0, blur: 0 };

export function useFlightStyle(
  flight: Flight | undefined,
  progress: MotionValue<number>,
  plan: PlanFeed,
) {
  /* The flight plan is read through a ref, not captured: the phone and the
     desktop file different timings for the same artifact, and a transform that
     closed over the definition would keep animating last render's route across
     the breakpoint. */
  const current = useRef(flight);
  useEffect(() => {
    current.current = flight;
  }, [flight]);

  const pose = useTransform<number, Pose>([progress, plan.version], ([p]) => {
    const f = current.current;
    if (!f) return REST;
    return poseAt(p, f, plan.read().legs[f.id]);
  });
  return {
    x: useTransform(pose, (v) => v.x),
    y: useTransform(pose, (v) => v.y),
    scale: useTransform(pose, (v) => v.scale),
    rotate: useTransform(pose, (v) => v.rotate),
    filter: useTransform(pose, (v) => (v.blur < 0.05 ? "none" : `blur(${v.blur.toFixed(2)}px)`)),
  };
}

/* ------------------------------------------------------------------ */
/* The route                                                           */
/* ------------------------------------------------------------------ */

const stopById = new Map(STOPS.map((stop) => [stop.id, stop]));

/**
 * The docks, and the line that joins them.
 *
 * This is scenery, not content: every word of it is a shortened echo of the
 * timeline immediately below, so the whole thing is `aria-hidden` and a screen
 * reader meets the career exactly once, in the section that owns it.
 */
export function FlightRoute({
  docks,
  flights,
  lang,
  progress,
  railRef,
  tailRef,
  registerSlot,
  registerNode,
  still,
}: {
  docks: Dock[];
  flights: Flight[];
  lang: "ar" | "en";
  progress: MotionValue<number>;
  railRef: React.RefObject<HTMLSpanElement | null>;
  tailRef: React.RefObject<HTMLSpanElement | null>;
  registerSlot: (id: string) => (node: HTMLElement | null) => void;
  registerNode: (id: string) => (node: HTMLElement | null) => void;
  still: boolean;
}) {
  const copy = COPY[lang];

  /**
   * A dock is "arrived" once the last aircraft booked into it has landed.
   * One bitmask, so seven docks cost one state update rather than seven.
   */
  const landing = docks.map((dock) => {
    const legs = flights.filter((flight) => flight.dock === dock.id);
    return legs.length ? Math.max(...legs.map((flight) => flight.end)) : 1;
  });

  const [arrived, setArrived] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    let next = 0;
    landing.forEach((at, index) => {
      if (p >= at - 0.015) next |= 1 << index;
    });
    setArrived((prev) => (prev === next ? prev : next));
  });

  const railScale = useTransform(progress, [0.12, 0.9], [0, 1], { clamp: true });
  /* Nothing of the route exists until the departure starts. At rest the hero
     is the hero: no rail, no empty landing pads behind the composition. */
  const routeOpacity = useTransform(progress, [0.04, 0.2], [0, 1], { clamp: true });

  return (
    <motion.div
      className="fl-route"
      aria-hidden="true"
      style={still ? undefined : { opacity: routeOpacity }}
    >
      <div className="fl-track">
        <span className="fl-rail" ref={railRef}>
          <motion.span
            className="fl-rail-fill"
            style={still ? { scaleY: 1 } : { scaleY: railScale }}
          />
        </span>

        <span className="fl-rail-tail" ref={tailRef} />

        <ol className="fl-list">
        {docks.map((dock, index) => {
          const stop = stopById.get(dock.id);
          if (!stop) return null;
          const open = still || (arrived & (1 << index)) !== 0;
          return (
            <li
              key={dock.id}
              className="fl-dock"
              data-dock={dock.id}
              data-open={open ? "1" : "0"}
              data-lead={dock.lead ? "1" : "0"}
            >
              <span className="fl-node" ref={registerNode(dock.id)}>
                <span className="fl-node-core" />
              </span>

              {/* The berth is one fixed width whatever lands in it, so seven
                  stops of wildly different proportions still read as a column
                  of labels rather than a ragged edge. */}
              <span className="fl-berth">
                {dock.ratio ? (
                  <span
                    className="fl-frame"
                    ref={registerSlot(`${dock.id}:frame`)}
                    style={{ "--ar": dock.ratio } as CSSProperties}
                  />
                ) : null}

                {dock.mark ? (
                  <span
                    className="fl-mark"
                    ref={registerSlot(`${dock.id}:mark`)}
                    style={{ "--ar": dock.markRatio ?? 1 } as CSSProperties}
                  />
                ) : null}
              </span>

              <span className="fl-meta">
                <span className="fl-meta-top">
                  {stop.year ? <b className="fl-year">{stop.year}</b> : null}
                  <strong className="fl-org">{stop.org[lang]}</strong>
                </span>
                <span className="fl-role">{stop.role[lang]}</span>
                {dock.lead ? <span className="fl-lead">{copy.lead}</span> : null}
              </span>
            </li>
          );
        })}
        </ol>
      </div>
    </motion.div>
  );
}

export type { Bi };
