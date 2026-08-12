"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { motionValue, useMotionValueEvent, type MotionValue } from "framer-motion";
import {
  ATSCard,
  LinkedInCard,
  RejectionEmail,
  StickyNote,
} from "../services/CareerObjects";
import { sample } from "../services/scrub";
import type { CareerLang } from "./careerTypes";

/* ═══════════════════════════════════════════════════════════════════════
   THE FLOATING CAREER WORLD (Command 06A.1 §7–§13; trimmed by 06A.4).

   A handful of small evidence fragments — the rejection email, the sticky
   note, the ATS score — sit at the four corners and the far edges, well
   outside the protected center column that owns the headline and the
   paper story. 06A.4 cut this from twelve objects across three depth
   planes down to 6 on desktop / 4 on a phone, dropped every full-size
   paper slab (only the hero's own CrumpledSheet/RestoringPaper carries
   that story now), and shrank what's left so it reads as light texture,
   not competition. Every object is a REAL document fragment from the
   /services object library (unmodified), placed by DATA, not by a dozen
   hand-rolled JSX blocks.

   Three cheap mechanisms, one element write each:

   · FLOAT     — per-object CSS keyframe (transform only), desynced by
                 negative delays. No JS runs for idle motion.
   · PARALLAX  — one rAF-coalesced pointermove writes --wx/--wy on the
                 world root; each object multiplies by its plane factor
                 in calc(). Desktop fine-pointer only.
   · SCATTER   — the hero's existing scroll progress writes ONE --scatter
                 var on the root; objects push outward along their own
                 (--sx,--sy) and fade via calc() opacity. Chaos → focus
                 without a single per-object JS subscription.

   Layer order inside .cp-pin:  bg (z1) · mid (z2) · paper (z3) · fg (z4)
   · headline (z5). Foreground objects hug the viewport edges so the
   center stays protected (§10, §21).
   ═══════════════════════════════════════════════════════════════════════ */

type Plane = "bg" | "mid" | "fg";

type WorldObject = {
  id: string;
  plane: Plane;
  /** logical-inline position — the composition mirrors for RTL */
  top?: string;
  bottom?: string;
  start?: string;
  end?: string;
  /** design width in px at a 1728 canvas; scaled responsively in CSS */
  w: number;
  rot: number;
  /** resting opacity (bg objects sit back) */
  o?: number;
  /** float personality */
  dur: number;
  delay: number;
  dy: number;
  drot: number;
  /** scatter vector, px outward when the story starts */
  sx: number;
  sy: number;
  /** hover microinteraction (§18) — max 2–3 objects */
  int?: boolean;
  node: (lang: CareerLang) => ReactNode;
};

/* ── small career-specific fragments that only this hero needs ── */

function FileChip({ lang }: { lang: CareerLang }) {
  return (
    <div className="cw-file" dir="ltr" aria-hidden>
      <span className="cw-file-ic" />
      <span className="cw-file-n">CV_Final_v7_FINAL.pdf</span>
      <span className="cw-file-m">{lang === "ar" ? "آخر تعديل: 2023" : "modified 2023"}</span>
    </div>
  );
}

function StatusChip({ lang }: { lang: CareerLang }) {
  const rtl = lang === "ar";
  return (
    <div className="cw-status" dir={rtl ? "rtl" : "ltr"} aria-hidden>
      <span className="cw-status-dot" />
      <div className="cw-status-t">
        <span className="cw-status-from">{rtl ? "إدارة التوظيف" : "Talent Acquisition"}</span>
        <span className="cw-status-b">{rtl ? "تم استلام طلبك" : "Application received"}</span>
      </div>
      <span className="cw-status-time">{rtl ? "قبل ٣ أسابيع" : "3w ago"}</span>
    </div>
  );
}

/* ── the desktop composition (06A.4) — 6 objects, four corners + two
   far-edge accents, nothing crossing the protected center column ── */

const DESKTOP: WorldObject[] = [
  { id: "email", plane: "mid", top: "6%", start: "7%", w: 190, rot: -3.5, dur: 8.5, delay: -1, dy: 6, drot: 0.9, sx: -150, sy: -110, int: true, node: (l) => <RejectionEmail lang={l} /> },
  { id: "sticky", plane: "mid", top: "9%", end: "6%", w: 84, rot: 7, dur: 7, delay: -4.2, dy: 6, drot: -1.4, sx: 140, sy: -120, node: (l) => <StickyNote lang={l} /> },
  { id: "ats", plane: "mid", bottom: "8%", start: "10%", w: 148, rot: -4.5, dur: 7.5, delay: -0.6, dy: 6, drot: 1.2, sx: -150, sy: 150, int: true, node: (l) => <ATSCard lang={l} /> },
  { id: "status", plane: "mid", bottom: "9%", end: "5%", w: 190, rot: 2, dur: 10.5, delay: -8, dy: 6, drot: 0.7, sx: 170, sy: 140, node: (l) => <StatusChip lang={l} /> },
  { id: "linkedin", plane: "bg", top: "47%", start: "-2%", w: 165, rot: -4, o: 0.85, dur: 9, delay: -2.4, dy: 5, drot: 1, sx: -120, sy: 20, node: (l) => <LinkedInCard lang={l} variant="weak" /> },
  { id: "file", plane: "bg", top: "51%", end: "-3%", w: 175, rot: -2, o: 0.85, dur: 9.5, delay: -3.6, dy: 5, drot: -1, sx: 130, sy: 30, node: (l) => <FileChip lang={l} /> },
];

/* ── the phone composition (06A.4) — 4 corners, small and quiet ── */

const PHONE: WorldObject[] = [
  { id: "m-sticky", plane: "mid", top: "6%", end: "-3%", w: 68, rot: 8, dur: 10, delay: -6, dy: 5, drot: -1.4, sx: 60, sy: -60, node: (l) => <StickyNote lang={l} /> },
  { id: "m-linkedin", plane: "bg", top: "8%", start: "-8%", w: 128, rot: -4, o: 0.85, dur: 13, delay: -4, dy: 5, drot: 1, sx: -70, sy: -60, node: (l) => <LinkedInCard lang={l} variant="weak" /> },
  { id: "m-ats", plane: "mid", bottom: "10%", start: "-6%", w: 118, rot: -5, dur: 11, delay: -8, dy: 5, drot: 1, sx: -70, sy: 70, node: (l) => <ATSCard lang={l} /> },
  { id: "m-file", plane: "bg", bottom: "6%", end: "-4%", w: 138, rot: 2.5, o: 0.85, dur: 14, delay: -3, dy: 4, drot: -0.8, sx: 70, sy: 70, node: (l) => <FileChip lang={l} /> },
];

const PLANE_PARALLAX: Record<Plane, number> = { bg: 0.2, mid: 0.5, fg: 0.85 };
const PLANE_Z: Record<Plane, number> = { bg: 1, mid: 2, fg: 4 };
/* bg fades first, fg lingers a touch — depth reads even while leaving */
const PLANE_FADE: Record<Plane, number> = { bg: 1.5, mid: 1.15, fg: 1 };

export default function CareerHeroWorld({
  lang,
  tight,
  /** scroll progress of the hero section; omitted for the still hero */
  p,
  /** fine-pointer desktop only */
  parallax,
}: {
  lang: CareerLang;
  tight: boolean;
  p?: MotionValue<number>;
  parallax?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const objects = tight ? PHONE : DESKTOP;

  /* SCATTER — one var write per scroll frame, consumed by every object */
  useMotionValueEvent(p ?? fallbackMv, "change", (v) => {
    rootRef.current?.style.setProperty(
      "--scatter",
      sample(v, [0.04, tight ? 0.3 : 0.34], [0, 1]).toFixed(4),
    );
  });

  /* PARALLAX — rAF-coalesced pointer, two var writes, no loop while idle */
  useEffect(() => {
    if (!parallax) return;
    const el = rootRef.current;
    if (!el) return;
    let frame = 0;
    let nx = 0;
    let ny = 0;
    const onMove = (e: PointerEvent) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          /* max displacement stays small (§12): 14px × plane factor */
          el.style.setProperty("--wx", `${(nx * 14).toFixed(2)}px`);
          el.style.setProperty("--wy", `${(ny * 10).toFixed(2)}px`);
        });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [parallax]);

  return (
    <div ref={rootRef} className="cw" aria-hidden>
      {objects.map((ob) => (
        <div
          key={ob.id}
          className={`cw-obj cw-${ob.plane}${ob.int ? " cw-int" : ""}`}
          style={
            {
              insetBlockStart: ob.top,
              insetBlockEnd: ob.bottom,
              insetInlineStart: ob.start,
              insetInlineEnd: ob.end,
              zIndex: PLANE_Z[ob.plane],
              "--w": `${ob.w}px`,
              "--o": ob.o ?? 1,
              "--px": PLANE_PARALLAX[ob.plane],
              "--fade": PLANE_FADE[ob.plane],
              "--sx": `${ob.sx}px`,
              "--sy": `${ob.sy}px`,
              "--fdur": `${ob.dur}s`,
              "--fdel": `${ob.delay}s`,
              "--fdy": `${ob.dy}px`,
              "--frot": `${ob.drot}deg`,
              "--rot": `${ob.rot}deg`,
            } as CSSProperties
          }
        >
          <div className="cw-float">
            <div className="cw-tilt">{ob.node(lang)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* A parked MotionValue for the still hero: scatter stays 0 forever. */
const fallbackMv = motionValue(0);

/** World styles — kept beside the config so the layer reads as one unit. */
export function CareerHeroWorldStyles() {
  return (
    <style>{`
      .cw {
        position: absolute; inset: 0; pointer-events: none;
        --scatter: 0; --wx: 0px; --wy: 0px;
        /* the whole field breathes down slightly on small laptops.
           NOTE: divide by a px length, not a bare number — 100vw / 1728
           mixes <length> and <number> and makes the whole custom property
           invalid, which silently drops the width calc below, which then
           forces cqw-sizing children into a shrink-to-fit measurement pass
           that resolves against the viewport instead of the (still
           undetermined) box — i.e. every object balloons to the viewport. */
        --wscale: clamp(0.62, calc(100vw / 1728px), 1.08);
      }
      .cw-obj {
        position: absolute; width: calc(var(--w) * var(--wscale));
        opacity: calc(var(--o) * (1 - var(--scatter) * var(--fade)));
        transform: translate3d(
          calc(var(--wx) * var(--px) + var(--scatter) * var(--sx)),
          calc(var(--wy) * var(--px) + var(--scatter) * var(--sy)),
          0
        );
        will-change: transform, opacity;
      }
      .cw-float {
        animation: cw-float var(--fdur) ease-in-out var(--fdel) infinite alternate;
      }
      @keyframes cw-float {
        from { transform: translateY(calc(var(--fdy) * -0.5)) rotate(calc(var(--frot) * -1)); }
        to   { transform: translateY(calc(var(--fdy) *  0.5)) rotate(var(--frot)); }
      }
      .cw-tilt { transform: rotate(var(--rot)); transition: transform 0.35s ease; }

      /* Chromium bug, verified empirically: an element that is BOTH a
         percentage-width child AND its own container-query container
         (.sn/.li/.ats/.em all set width:100% + container-type:inline-size
         on themselves) resolves to a fixed ~300px replaced-element
         fallback size — NOT the real available width — and no amount of
         re-asserting the width property on that same element changes it (confirmed
         with inline !important, with the calc() re-applied at every
         cascade layer, and across a from-scratch build). The size is
         wrong before any of our JS or CSS ever touches it.

         The fix moves containment up one level: .cw-tilt (not the object
         itself) becomes the query container, at a REAL, already-correct
         pixel width (verified directly — this element alone was never
         affected). The leaf is told to stop self-containing, so its cqw
         units resolve against .cw-tilt instead of against itself. No
         change to the shared /services object library. */
      .cw-tilt { container-type: inline-size; }
      .cw-obj .sn, .cw-obj .li, .cw-obj .ats, .cw-obj .em {
        container-type: normal !important;
        width: 100% !important;
      }

      /* ── microinteractions (§18) — two objects, hover only ── */
      .cw-int { pointer-events: auto; }
      .cw-int:hover .cw-tilt { transform: rotate(calc(var(--rot) * 0.4)) translateY(-4px) scale(1.03); }
      .cw-int .em-subj, .cw-int .ats-score { transition: color 0.3s ease; }
      .cw-int:hover .em-subj { color: #b4231f; }
      .cw-int:hover .ats-score { color: #0a7d43; }

      /* ── file chip ── */
      .cw-file {
        display: flex; align-items: center; gap: 9px; padding: 10px 14px;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 10px;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 22px 44px -18px rgba(20,22,30,0.28);
        white-space: nowrap;
      }
      .cw-file-ic {
        width: 20px; height: 24px; flex: 0 0 auto; border-radius: 3px;
        background: #e8564a;
        clip-path: polygon(0 0, 72% 0, 100% 26%, 100% 100%, 0 100%);
      }
      .cw-file-n { font-size: 11.5px; font-weight: 700; color: #2a2c33; overflow: hidden; text-overflow: ellipsis; }
      .cw-file-m { font-size: 10px; color: #9b9ea3; }

      /* ── application status ── */
      .cw-status {
        display: flex; align-items: center; gap: 10px; padding: 12px 15px;
        background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px;
        box-shadow: 0 2px 4px rgba(20,22,30,0.05), 0 24px 48px -18px rgba(20,22,30,0.26);
      }
      .cw-status-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #d9a514; }
      .cw-status-t { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .cw-status-from { font-size: 10px; font-weight: 800; letter-spacing: 0.06em; color: #9b9ea3; }
      .cw-status-b { font-size: 12.5px; font-weight: 700; color: #2a2c33; white-space: nowrap; }
      .cw-status-time { margin-inline-start: auto; font-size: 10px; color: #b6b9be; white-space: nowrap; }
      [dir="rtl"] .cw-status-from, [dir="rtl"] .cw-status-b { line-height: 1.5; }

      /* reduced motion: the full composition, settled (§32) */
      @media (prefers-reduced-motion: reduce) {
        .cw-float { animation: none; }
        .cw-obj { transform: none; }
      }
    `}</style>
  );
}
