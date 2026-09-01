"use client";

import { useEffect, useRef } from "react";
import { motion, useTransform, useMotionValueEvent } from "framer-motion";
import { CrumpledSheet } from "../services/CrumpledSheet";
import { RestoringPaper } from "../services/PaperPhysics";
import { CVSheet } from "../services/CareerObjects";
import { useScrub } from "../services/scrub";
import { useSectionProgress } from "../services/scrollDriver";
import CareerHeroWorld from "./CareerHeroWorld";
import type { CareerCopy } from "./careerCopy";
import type { CareerLang } from "./careerTypes";

/* ═══════════════════════════════════════════════════════════════════════
   CAREER HERO — the product promise, told by one piece of paper.

   CRUMPLED → UNFOLDS → CLEAN → SCANNED → SCORE → "upload yours".

   The machinery is deliberately the machinery /services already proved:
   the baked crumple frames (CrumpledSheet — 22 layers on desktop, one
   canvas on a phone), the live flattening sheet (RestoringPaper), and the
   shared one-listener scroll driver. Nothing in /services is modified —
   this file only composes those pieces into a different, shorter story:

     0.00–0.16  SCENE 1 · the crumpled ball + the restrained headline
     0.10–0.46  UNFOLD   · baked frames play; one object, one trajectory
     0.42–0.66  CLEAN    · the live sheet flattens into a readable CV
     0.68–0.84  SCAN     · a thin line sweeps; dimensions activate
     0.86–1.00  SCORE    · the sheet recedes; 62/100; the real CTA

   The CTA is NOT gated behind the film: a persistent "upload — free"
   action is visible from the first frame (§6), and the whole scene is a
   single scroll of ~320vh, not a movie.

   Reduced motion (§52): no scrub, no pin — a static composition that
   still tells crumpled → clean → scored via a settled layout.
   ═══════════════════════════════════════════════════════════════════════ */

/** Demo dimensions shown during the hero scan — illustrative only (§5D). */
const SCAN_DIMS: { ar: string; en: string; score: number }[] = [
  { ar: "الأثر", en: "Impact", score: 41 },
  { ar: "التموضع", en: "Positioning", score: 55 },
  { ar: "الخبرة", en: "Experience", score: 68 },
  { ar: "ATS", en: "ATS", score: 74 },
  { ar: "الأدلة", en: "Evidence", score: 36 },
  { ar: "المهارات", en: "Skills", score: 63 },
];

const DEMO_SCORE = 62;

export default function CareerHero({
  t,
  lang,
  tight,
  reduced,
  onCta,
}: {
  t: CareerCopy;
  lang: CareerLang;
  /** phone/tablet composition — cheaper renderer, tighter cut */
  tight: boolean;
  reduced: boolean;
  onCta: () => void;
}) {
  const secRef = useRef<HTMLElement>(null);
  const p = useSectionProgress(secRef, !reduced);
  const D = lang === "ar" ? -1 : 1;

  /* the story beats — the phone pulls everything forward (§7) */
  const crumpleRange: [number, number] = [0, tight ? 0.42 : 0.46];
  const handoff: [number, number] = tight ? [0.36, 0.42] : [0.4, 0.46];
  const restRange: [number, number] = tight ? [0.38, 0.62] : [0.42, 0.66];
  const scanWin: [number, number] = tight ? [0.64, 0.8] : [0.68, 0.84];
  const revealAt = tight ? 0.83 : 0.86;

  /* ── the sheet's travel ──
     Drifts in from the discard pile, centres for the scan, then leans back
     and dims when the score takes the frame. Percent-based transforms so no
     stage measurement is needed. */
  const heroX = useScrub(p, [0, 0.14, 0.4, revealAt, 1], [22 * D, 9 * D, 0, 0, (tight ? 0 : -16) * D]);
  const heroXvw = useTransform(heroX, (v) => `${v.toFixed(2)}vw`);
  const heroY = useScrub(
    p,
    [0, 0.14, 0.4, revealAt, 1],
    tight ? [10, 6, 0, 0, -14] : [12, 7, 0, 0, 0],
  );
  const heroYvh = useTransform(heroY, (v) => `${v.toFixed(2)}vh`);
  const heroScale = useScrub(p, [0, 0.2, 0.5, revealAt, 1], tight ? [1, 1.06, 1.22, 1.18, 0.86] : [1, 1.05, 1.28, 1.24, 1.02]);
  const heroDim = useScrub(p, [revealAt, revealAt + 0.08], [1, tight ? 0.4 : 0.55]);
  const sheetO = useScrub(p, [handoff[0], handoff[1]], [0, 1]);

  /* headline: owns the opening, leaves as the sheet becomes the subject */
  const headO = useScrub(p, [0, 0.05, 0.16, 0.26], [1, 1, 1, 0]);
  const headY = useScrub(p, [0.16, 0.26], [0, -18]);

  /* scan: a thin line sweeping the sheet, twice, while dimensions resolve */
  const scanO = useScrub(p, [scanWin[0] - 0.02, scanWin[0], scanWin[1], scanWin[1] + 0.02], [0, 1, 1, 0]);
  const scanY = useScrub(p, [scanWin[0], (scanWin[0] + scanWin[1]) / 2, scanWin[1]], [4, 96, 30]);
  const scanTop = useTransform(scanY, (v) => `${v.toFixed(1)}%`);

  /* score block */
  const scoreO = useScrub(p, [revealAt, revealAt + 0.07], [0, 1]);
  const scoreY = useScrub(p, [revealAt, revealAt + 0.1], [26, 0]);
  const scoreN = useScrub(p, [revealAt, revealAt + 0.09], [0, DEMO_SCORE]);
  const scoreRef = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(scoreN, "change", (v) => {
    if (scoreRef.current) scoreRef.current.textContent = String(Math.round(v));
  });

  /* the opening hint leaves as soon as the visitor moves */
  const hintO = useScrub(p, [0, 0.06], [1, 0]);

  // six tiny objects — not worth memoizing against a conditional dep
  const scanChips = SCAN_DIMS.slice(0, tight ? 4 : 6).map((d, i) => ({
    ...d,
    at: scanWin[0] + 0.015 + i * ((scanWin[1] - scanWin[0] - 0.04) / 6),
  }));

  /* returning to the top of a completed film should replay cleanly — the
     driver already handles that; nothing to reset here. */
  useEffect(() => void 0, []);

  if (reduced) {
    /* §52 — the same story as three settled states, no pin, no scrub */
    return (
      <section className="cp-hero cp-hero-still" aria-label={`${t.heroH1a} ${t.heroH1b}`}>
        {/* §32 — the full floating composition, settled: no scrub, no floats */}
        <CareerHeroWorld lang={lang} tight={tight} />
        <div className="cp-still-wrap">
          <div className="cp-still-copy">
            <p className="cp-kicker">{t.heroKicker}</p>
            <h1 className="cp-h1">
              {t.heroH1a}
              <br />
              {t.heroH1b}
            </h1>
            <p className="cp-sub">{t.heroSub}</p>
            <p className="cp-see">{t.heroSeeClearly}</p>
            <div className="cp-score-line" aria-hidden>
              <span className="cp-score-n">{DEMO_SCORE}</span>
              <span className="cp-score-of">{t.scoreOutOf}</span>
            </div>
            <p className="cp-demo-note">{t.heroDemoNote}</p>
            <button type="button" className="cp-cta" onClick={onCta}>
              {t.heroCta}
            </button>
            <ul className="cp-trust" aria-label="">
              {t.heroTrust.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="cp-still-sheet">
            <CVSheet lang={lang} variant="weak" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={secRef} className={`cp-hero${tight ? " cp-tight" : ""}`}>
      <div className="cp-pin">
        {/* THE FLOATING CAREER WORLD (06A.1 §7) — evidence of the problem,
            orbiting a calm center; scatters outward as the story starts */}
        <CareerHeroWorld lang={lang} tight={tight} p={p} parallax={!tight} />

        {/* SCENE 1 — the restrained headline over generous space (§5A) */}
        <motion.div className="cp-head" style={{ opacity: headO, y: headY }}>
          <p className="cp-kicker">{t.heroKicker}</p>
          <h1 className="cp-h1">
            {t.heroH1a}
            <br />
            {t.heroH1b}
          </h1>
          <p className="cp-sub">{t.heroSub}</p>
          {/* the product is reachable before the film finishes (§6, §17) */}
          <button type="button" className="cp-cta cp-cta-early" onClick={onCta}>
            {t.heroCta}
          </button>
        </motion.div>

        {/* THE PAPER — protagonist, one object throughout */}
        <motion.div
          className="cp-paper"
          style={{ x: heroXvw, y: heroYvh, scale: heroScale, opacity: heroDim }}
        >
          <CrumpledSheet
            p={p}
            lang={lang}
            range={crumpleRange}
            fade={handoff}
            tilt={-11}
            lift={tight ? 2.0 : 1.8}
            mobile={tight}
          />
          <motion.div style={{ opacity: sheetO }}>
            <RestoringPaper
              p={p}
              range={restRange}
              simple={tight}
              tilt={-11}
              weak={<CVSheet lang={lang} variant="weak" />}
              strong={<CVSheet lang={lang} variant="weak" />}
            >
              {/* SCAN (§5D) — thin line + quiet dimension indicators */}
              <motion.div className="cp-scan" aria-hidden style={{ opacity: scanO }}>
                <motion.span className="cp-scanline" style={{ top: scanTop }} />
                <span className="cp-scan-tag">{t.heroScanLabel}</span>
              </motion.div>
              {scanChips.map((d, i) => (
                <ScanChip key={d.en} p={p} at={d.at} i={i} label={lang === "ar" ? d.ar : d.en} score={d.score} rtl={lang === "ar"} />
              ))}
            </RestoringPaper>
          </motion.div>
        </motion.div>

        {/* SCORE REVEAL (§5E) — demonstration only, honestly labeled */}
        <motion.div className="cp-reveal" style={{ opacity: scoreO, y: scoreY }}>
          <p className="cp-reveal-label">{t.heroSeeClearly}</p>
          <div className="cp-score-line" aria-hidden>
            <span className="cp-score-n" ref={scoreRef}>
              0
            </span>
            <span className="cp-score-of">{t.scoreOutOf}</span>
          </div>
          <p className="cp-demo-note">{t.heroDemoNote}</p>
          <button type="button" className="cp-cta" onClick={onCta}>
            {t.heroCta}
          </button>
          <ul className="cp-trust">
            {t.heroTrust.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </motion.div>

        <motion.p className="cp-hint" aria-hidden style={{ opacity: hintO }}>
          {t.scrollHint}
          {/* drawn: U+2193 is not in Thmanyah Sans and fell back to the system
              UI face mid-line */}
          <svg
            width="11"
            height="14"
            viewBox="0 0 11 14"
            fill="none"
            style={{ marginInlineStart: 6, verticalAlign: "-2px" }}
          >
            <path
              d="M5.5 1v11M1.6 8.4l3.9 3.9 3.9-3.9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.p>
      </div>
    </section>
  );
}

/** One quiet dimension indicator resolving beside the sheet during the scan. */
function ScanChip({
  p,
  at,
  i,
  label,
  score,
  rtl,
}: {
  p: ReturnType<typeof useSectionProgress>;
  at: number;
  i: number;
  label: string;
  score: number;
  rtl: boolean;
}) {
  const o = useScrub(p, [at, at + 0.02], [0, 1]);
  const x = useScrub(p, [at, at + 0.025], [rtl ? -10 : 10, 0]);
  const side = i % 2 === 0;
  return (
    <motion.span
      className={`cp-chip ${side ? "cp-chip-a" : "cp-chip-b"}`}
      style={{ opacity: o, x, top: `${12 + i * 14}%` }}
      aria-hidden
    >
      <span className="cp-chip-l">{label}</span>
      <span className="cp-chip-n">{score}</span>
    </motion.span>
  );
}
