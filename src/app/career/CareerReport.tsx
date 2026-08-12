"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion } from "framer-motion";
import type { CareerCopy } from "./careerCopy";
import {
  DIMENSION_TITLES,
  type CareerLang,
  type UiFreeReport,
  type UiFullReview,
} from "./careerTypes";
import { CAREER_FLAGS, CAREER_FULL_REVIEW_PRICE } from "@/config/careerFlags";
import { CAREER_USD_PAYMENT_CONFIG } from "@/config/payments";
import { trackCareerEvent } from "@/lib/careerAnalytics";
import { supabase } from "@/lib/supabaseClient";
import { CONTACT } from "@/config/contact";
import { CAREER_SERVICES, COMPLETE_BUNDLE, priceLabel as servicePriceLabel } from "@/data/careerServices";

/* ═══════════════════════════════════════════════════════════════════════
   FREE RESULT + LOCKED FULL REVIEW (Command 06A §16–§32, §65–§66).

   Everything rendered here comes from the report object — the frontend
   never recomputes a score, never re-derives a band, and never invents a
   finding. The layout is editorial: annotations, rules and typography on
   paper, not a grid of SaaS cards (§40).

   Finding TEXT arrives in the language of the analyzed CV (`reportLang`),
   which can differ from the UI language — those nodes carry their own
   `dir` so an Arabic report reads natively inside an English UI and vice
   versa.
   ═══════════════════════════════════════════════════════════════════════ */

const COMPACT_DIMS = 5;

export default function CareerReport({
  t,
  lang,
  report,
  fileName,
  resumeId,
  analysisId,
  onRevealed,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  fileName: string;
  /** Undefined for a synthetic-demo fixture report — the Full Review CTA
   *  stays visually identical but never creates a purchase without one. */
  resumeId?: string;
  /** Undefined for a synthetic-demo fixture report — "email me the
   *  report" (Part 15-18) stays visually identical but never calls
   *  send-career-report without a real analysisId to own. */
  analysisId?: string;
  onRevealed: () => void;
}) {
  const rDir = report.reportLang === "ar" ? "rtl" : "ltr";
  const strong = report.overallScore >= 75;

  return (
    <div className="cp-report">
      <ScoreReveal t={t} lang={lang} report={report} fileName={fileName} analysisId={analysisId} onRevealed={onRevealed} />

      <AtsCompatibilityCard t={t} report={report} />

      <JobMatchNote t={t} lang={lang} report={report} />

      <DimensionOverview t={t} lang={lang} report={report} rDir={rDir} strong={strong} />

      <IssueList t={t} lang={lang} report={report} rDir={rDir} />

      <StrengthList t={t} lang={lang} report={report} rDir={rDir} />

      {report.quickWin && (
        <section className="cp-sec cp-quickwin-sec" aria-label={t.quickWinH}>
          <div className="cp-quickwin" dir={rDir}>
            <span className="cp-quickwin-pin" aria-hidden />
            <p className="cp-quickwin-k">{t.quickWinH}</p>
            <p className="cp-quickwin-action">{report.quickWin.action}</p>
            <p className="cp-quickwin-why">
              <strong>{t.quickWinWhy}</strong> {report.quickWin.why}
            </p>
          </div>
        </section>
      )}

      <RewritePreview t={t} report={report} rDir={rDir} />

      <FullReviewGate t={t} lang={lang} report={report} resumeId={resumeId} />

      <Methodology t={t} />

      <NextServices t={t} lang={lang} />

      <ContactFooter t={t} />

      <ReportStyles />
    </div>
  );
}

/* ───────────────────────── score reveal (§16–§18) ───────────────────────── */

function ScoreReveal({
  t,
  lang,
  report,
  fileName,
  analysisId,
  onRevealed,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  fileName: string;
  analysisId?: string;
  onRevealed: () => void;
}) {
  const nRef = useRef<HTMLSpanElement>(null);
  /* this section only ever mounts client-side (post-analysis), so the
     reduced-motion preference can seed the initial state directly */
  const [settled, setSettled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const fired = useRef(false);
  /* Prevents a late safety-net timer from overwriting a value that a
     faster, normal completion already wrote — see `finalize` below. */
  const finalized = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    finalized.current = false;

    // report.overallScore is the ONLY source of truth (§15 — never
    // recomputed, never re-derived). Whatever happens to the count-up
    // animation — it never starts, framer-motion throws, `onComplete`
    // never fires, the tab is backgrounded and rAF stalls, reduced
    // motion is on — this is the single place the DOM is allowed to
    // settle, and it is always called with the real value. Idempotent
    // via `finalized`, so it is safe to call from more than one path
    // (the animation's own onComplete AND the safety timer below) —
    // whichever gets there first wins, and the value is identical
    // either way, so there is nothing to visually reconcile.
    const finalize = () => {
      if (finalized.current) return;
      finalized.current = true;
      if (nRef.current) nRef.current.textContent = String(Math.round(report.overallScore));
      setSettled(true);
      onRevealed();
    };

    const resetGuard = () => {
      // Reset on EVERY cleanup, not just cancel the animation — a
      // cleanup that runs without this (Strict Mode's dev-only fake
      // unmount, or a genuine remount) leaves `fired.current` stuck
      // `true` and the next real mount's effect no-ops at the guard
      // above, which is the exact bug this whole file's history is
      // about: the DOM never gets written and the literal JSX "0"
      // below is what a visitor sees, forever.
      fired.current = false;
    };

    if (settled) {
      // reduced motion: no count-up — the number is simply there
      finalize();
      return resetGuard;
    }

    // Fail-safe: guarantees `finalize()` runs even if `animate()` never
    // calls `onComplete` at all (a stalled/backgrounded rAF, a provider
    // that silently no-ops) — set comfortably past the animation's own
    // 1.4s duration, so in the normal/working case `onComplete` always
    // wins this race and the timer fires into a no-op via `finalized`.
    // Nothing about the visible animation changes; this only ever
    // matters when the animation was already broken.
    const safetyTimer = window.setTimeout(finalize, 2_200);

    let ctrl: { stop: () => void } | undefined;
    try {
      ctrl = animate(0, report.overallScore, {
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => {
          // Never let a stray onUpdate after finalize() win the race —
          // finalize() already wrote the true, rounded final value.
          if (!finalized.current && nRef.current) nRef.current.textContent = String(Math.round(v));
        },
        onComplete: finalize,
      });
    } catch {
      // animate() itself threw synchronously (Command 06A.5.1 follow-up
      // — "JS animation fails") — the safety timer above still fires
      // and finalize() still runs with the real score.
    }

    return () => {
      resetGuard();
      window.clearTimeout(safetyTimer);
      ctrl?.stop();
    };
  }, [report.overallScore, onRevealed, settled]);

  // the band ships in both languages from the backend — display the UI one
  const uiLabel = lang === "ar" ? report.scoreBand.labelAr : report.scoreBand.labelEn;

  return (
    <section className="cp-sec cp-score-sec" aria-label={t.cvStrengthLabel}>
      <p className="cp-sec-k">{t.cvStrengthLabel}</p>
      <p className="cp-score-file" dir="auto">
        {fileName}
      </p>
      <div className="cp-score-big">
        <span className="cp-score-num" ref={nRef} aria-hidden>
          0
        </span>
        <span className="cp-score-den">{t.scoreOutOf}</span>
      </div>
      {/* the score, readable without watching the animation (§53) */}
      <p className="cp-visually-hidden" role="status">
        {report.overallScore}
        {t.scoreOutOf} — {uiLabel}
      </p>
      <div className={`cp-score-meta${settled ? " cp-in" : ""}`}>
        <p className="cp-score-band">{uiLabel}</p>
        <ScoreLine score={report.overallScore} />
        <p className="cp-score-context">
          {report.overallScore >= 75 ? t.scoreStrongLine : t.scoreWeakLine}
        </p>
        <p className="cp-score-confidence">{t.confidenceLabel[report.confidence]}</p>

        {/* item A — three compact indicators, never a second headline */}
        <ScoreIndicators t={t} lang={lang} report={report} />

        {/* item I */}
        <SendReportByEmail t={t} lang={lang} analysisId={analysisId} />
      </div>
    </section>
  );
}

/**
 * Item A (three compact indicators) — ATS, evidence coverage, strongest
 * area. Each is a short label + value, never a restatement of the hero
 * headline above it.
 */
function ScoreIndicators({
  t,
  lang,
  report,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
}) {
  const ats = report.atsCompatibility;
  // Thresholds for the ATS Compatibility phrase (Career V2 Part 6/11 — the
  // backend ships only the raw 0–100 score, never a verdict string, so the
  // UI picks a phrase deterministically): >=80 good, >=55 mixed, else weak.
  const atsPhrase =
    ats.atsCompatibilityScore >= 80
      ? t.atsCompatibilityGood
      : ats.atsCompatibilityScore >= 55
        ? t.atsCompatibilityMixed
        : t.atsCompatibilityWeak;

  // Evidence coverage: UiFreeReport carries no per-dimension "has evidence"
  // flag, so we reuse the backend's own `confidence` field 1:1 — it is
  // already the backend's estimate of how well-evidenced its scoring was,
  // so relabeling it here as high/medium/low describes the same fact
  // without inventing a new metric (§15).
  const evidenceLevel = report.confidence;

  const strongest = report.topStrengths[0];

  return (
    <dl className="cp-indicators">
      <div className="cp-indicator">
        <dt>{t.atsCompatibilityLabel}</dt>
        <dd>
          <bdi dir="ltr">{Math.round(ats.atsCompatibilityScore)}/100</bdi> · {atsPhrase}
        </dd>
      </div>
      <div className="cp-indicator">
        <dt title={t.evidenceCoverageTooltip}>{t.evidenceCoverageLabel}</dt>
        <dd>{t.evidenceCoverageLevel[evidenceLevel]}</dd>
      </div>
      {strongest && (
        <div className="cp-indicator">
          <dt>{t.strongestAreaLabel}</dt>
          <dd>{DIMENSION_TITLES[strongest.dimension][lang]}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * Item I — "send report to email". For now this is a static, non-networked
 * placeholder: it never calls out to the network and never wires an actual
 * email send. Real send + its animated expand/collapse are implemented
 * separately (a dedicated piece of work) — this button only proves the
 * entry point exists.
 */
/** True below 640px — the breakpoint the bottom-sheet variant kicks in at (Part 15/24: mobile gets a sheet, desktop an anchored dropdown). */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return narrow;
}

type SendStatus = "idle" | "sending" | "sent" | "error";

/**
 * Item I / Parts 15-18 — "email me the report", for real: an animated
 * anchored dropdown on desktop, a bottom sheet on mobile (AnimatePresence,
 * spring, opacity 0→1 / y 12→0 / scale 0.98→1 — fast and subtle, no heavy
 * blur), backed by a REAL server-side send (send-career-report Edge
 * Function — no mailto, no fake success). Delivery is restricted to the
 * authenticated account's own verified email (Part 16 — security over
 * convenience) — never a free-text "send to any address" box.
 *
 * UX fix: the visitor arrives here from an ANONYMOUS session (see
 * CareerClient.tsx's runRealAnalysis — no sign-in prompt before the free
 * result). An anonymous session has no email at all, so this panel is
 * also where a real one gets collected — ONCE, right here, at the exact
 * moment the visitor actually wants the report — via
 * `auth.updateUser({ email })`, Supabase's own upgrade-in-place flow
 * (same auth.uid(), same analysis already on screen, no migration).
 * Once that email is confirmed, this collapses back to the original
 * prefilled-read-only send flow.
 */
function SendReportByEmail({ t, lang, analysisId }: { t: CareerCopy; lang: CareerLang; analysisId?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [emailInput, setEmailInput] = useState("");
  const [upgradeStatus, setUpgradeStatus] = useState<"idle" | "submitting" | "awaiting_confirmation" | "error">("idle");
  const narrow = useIsNarrow();
  const openedTracked = useRef(false);
  // Read inside the onAuthStateChange closure below without needing to
  // re-subscribe every time upgradeStatus changes.
  const upgradeStatusRef = useRef(upgradeStatus);
  upgradeStatusRef.current = upgradeStatus;

  useEffect(() => {
    if (!open || !supabase) return;
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    // The real email may arrive later, without a page reload — the
    // visitor confirms the auth.updateUser({email}) link (possibly in a
    // different tab) and this session picks up the change live.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return;
      const confirmedEmail = newSession?.user?.email ?? null;
      if (confirmedEmail) {
        setEmail((prev) => {
          if (!prev && upgradeStatusRef.current === "awaiting_confirmation") {
            setUpgradeStatus("idle");
            trackCareerEvent("career_email_upgrade_confirmed", {});
          }
          return confirmedEmail;
        });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [open]);

  async function handleUpgradeEmail(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !emailInput || upgradeStatus === "submitting") return;
    setUpgradeStatus("submitting");
    trackCareerEvent("career_email_upgrade_started", {});
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    setUpgradeStatus(error ? "error" : "awaiting_confirmation");
  }

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next && !openedTracked.current) {
        openedTracked.current = true;
        trackCareerEvent("career_report_email_opened", {});
      }
      return next;
    });
  }

  async function handleSend() {
    // Prevent double submits (Part 18) — a click while already sending/sent is a no-op.
    if (!supabase || !analysisId || status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      const { data, error } = await supabase.functions.invoke("send-career-report", {
        body: { analysisId },
      });
      const ok = !error && data && (data as { ok?: boolean }).ok === true;
      if (!ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      trackCareerEvent("career_report_email_sent", {});
    } catch {
      setStatus("error");
    }
  }

  const panelVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };
  const sheetVariants = {
    hidden: { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: 0 },
  };
  const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

  const panel = (
    <motion.div
      key="send-email-panel"
      className={narrow ? "cp-send-email-sheet" : "cp-send-email-panel"}
      role="dialog"
      aria-label={t.sendToEmailCta}
      variants={narrow ? sheetVariants : panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={spring}
    >
      {narrow && <div className="cp-sheet-grip" aria-hidden />}
      <p className="cp-send-email-title">{t.sendToEmailTitle}</p>
      <p className="cp-send-email-note">{t.sendToEmailBody}</p>

      {analysisId ? (
        email ? (
          <>
            <div className="cp-auth-form" dir="ltr">
              <input
                type="email"
                className="cp-auth-input"
                value={email}
                placeholder={t.sendToEmailPlaceholder}
                readOnly
                aria-readonly="true"
                dir="ltr"
              />
              <button
                type="button"
                className="cp-cta cp-cta-secondary"
                onClick={handleSend}
                disabled={status === "sending" || status === "sent"}
                aria-busy={status === "sending"}
              >
                {status === "sending" ? t.sendToEmailSending : status === "sent" ? t.sendToEmailSentCta : t.sendToEmailSubmit}
              </button>
            </div>
            {status === "sent" && (
              <p className="cp-send-email-status cp-send-email-success" role="status">
                {t.sendToEmailSent}
                <br />
                {t.sendToEmailCheckInbox}
              </p>
            )}
            {status === "error" && (
              <p className="cp-send-email-status cp-send-email-error" role="alert">
                {t.sendToEmailError}
              </p>
            )}
          </>
        ) : upgradeStatus === "awaiting_confirmation" ? (
          <p className="cp-send-email-status" role="status">
            {t.sendToEmailConfirmPending}
          </p>
        ) : (
          <>
            <form className="cp-auth-form" dir="ltr" onSubmit={handleUpgradeEmail}>
              <input
                type="email"
                className="cp-auth-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t.sendToEmailPlaceholder}
                required
                autoComplete="email"
                dir="ltr"
              />
              <button
                type="submit"
                className="cp-cta cp-cta-secondary"
                disabled={upgradeStatus === "submitting"}
                aria-busy={upgradeStatus === "submitting"}
              >
                {upgradeStatus === "submitting" ? t.sendToEmailSending : t.sendToEmailConfirmCta}
              </button>
            </form>
            {upgradeStatus === "error" && (
              <p className="cp-send-email-status cp-send-email-error" role="alert">
                {t.sendToEmailError}
              </p>
            )}
          </>
        )
      ) : (
        <p className="cp-send-email-note">{t.sendToEmailComingSoonBody}</p>
      )}
    </motion.div>
  );

  return (
    <div className="cp-send-email">
      <button type="button" className="cp-linkbtn cp-linkbtn-muted" onClick={toggle} aria-expanded={open}>
        {t.sendToEmailCta}
      </button>
      <AnimatePresence>{open && panel}</AnimatePresence>
    </div>
  );
}

/**
 * Item B — ATS Compatibility card, its own small section near the hero.
 * Deterministic, code-computed (Career V2 Part 5/6/11) — a SEPARATE concept
 * from `atsAnalysis` (paid Full Review's "ATS" section). Never merged, never
 * mixed into `overallScore`.
 */
function AtsCompatibilityCard({ t, report }: { t: CareerCopy; report: UiFreeReport }) {
  const ats = report.atsCompatibility;
  // A note about readability risk — never a pass/fail claim for any real
  // ATS product — is shown when failures are notable or the score is very
  // low. Thresholds documented here since the backend ships raw counts only.
  const risky = ats.atsChecksFailed >= 3 || ats.atsCompatibilityScore < 40;

  return (
    <section className="cp-sec cp-ats-sec" aria-label={t.atsCompatibilityFull}>
      <h2 className="cp-h2 cp-rule">{t.atsCompatibilityFull}</h2>
      <div className="cp-ats-score" dir="ltr">
        <span className="cp-ats-num">{Math.round(ats.atsCompatibilityScore)}</span>
        <span className="cp-ats-den">{t.scoreOutOf}</span>
      </div>
      <ul className="cp-ats-counts">
        <li>
          <span className="cp-full-n">{ats.atsChecksPassed}</span> {t.atsChecksPassedLabel}
        </li>
        <li>
          <span className="cp-full-n">{ats.atsChecksWarning}</span> {t.atsChecksWarningLabel}
        </li>
        <li>
          <span className="cp-full-n">{ats.atsChecksFailed}</span> {t.atsChecksFailedLabel}
        </li>
      </ul>
      {risky && <p className="cp-ats-risk">{t.atsReadabilityRiskNote}</p>}
      <p className="cp-ats-disclaimer">{t.atsCompatibilityDisclaimer}</p>
    </section>
  );
}

/**
 * Career V2 Part 6/7: Job Match — the THIRD distinct concept, separate
 * from CV Strength and ATS Compatibility, and NEVER shown as a real
 * match unless a target role/JD genuinely existed for this analysis.
 * `UiFreeReport` carries no separate "was a target role given" flag —
 * `target_role_alignment` is simply one of the (possibly excluded)
 * dimensions in `dimensionSummary`, present only when the dimension was
 * actually scored (methodology/scoring.ts excludes it entirely, never
 * zeroes it, when there's no target role — see planWeights). Deriving
 * presence from that existing array, rather than adding a new backend
 * field, means this can never drift from the real exclusion logic.
 */
function JobMatchNote({ t, lang, report }: { t: CareerCopy; lang: CareerLang; report: UiFreeReport }) {
  const dim = report.dimensionSummary.find((d) => d.dimension === "target_role_alignment");
  return (
    <section className="cp-sec cp-jobmatch-sec" aria-label={t.jobMatchLabel}>
      <p className="cp-sec-k">{t.jobMatchLabel}</p>
      {dim ? (
        <>
          <p className="cp-jobmatch-score" dir="ltr">
            {Math.round(dim.score)}/100
          </p>
          <p className="cp-jobmatch-summary">{dim.summary}</p>
        </>
      ) : (
        <p className="cp-jobmatch-missing">{t.jobMatchMissingNote}</p>
      )}
    </section>
  );
}

/** A thin horizontal performance line — editorial, not a donut (§17). */
function ScoreLine({ score }: { score: number }) {
  return (
    <div className="cp-scoreline" aria-hidden>
      <span className="cp-scoreline-track" />
      <span className="cp-scoreline-fill" style={{ width: `${score}%` }} />
      <span className="cp-scoreline-marker" style={{ insetInlineStart: `${score}%` }} />
    </div>
  );
}

/* ─────────────────────── dimensions (§20) ─────────────────────── */

function DimensionOverview({
  t,
  lang,
  report,
  rDir,
  strong,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  rDir: "rtl" | "ltr";
  strong: boolean;
}) {
  const [open, setOpen] = useState(false);
  /* weak CV: lead with what needs work; strong CV: lead with what carries it */
  const sorted = useMemo(
    () =>
      [...report.dimensionSummary].sort((a, b) => (strong ? b.score - a.score : a.score - b.score)),
    [report.dimensionSummary, strong],
  );
  const visible = open ? sorted : sorted.slice(0, COMPACT_DIMS);

  return (
    <section className="cp-sec" aria-label={t.dimensionsH}>
      <h2 className="cp-h2 cp-rule">{t.dimensionsH}</h2>
      <ul className="cp-dims">
        {visible.map((d) => (
          <li key={d.dimension} className="cp-dim">
            <div className="cp-dim-row">
              <span className="cp-dim-name">{DIMENSION_TITLES[d.dimension][lang]}</span>
              <span className="cp-dim-track" aria-hidden>
                <span className="cp-dim-fill" style={{ width: `${d.score}%` }} />
              </span>
              <span className="cp-dim-score">{d.score}</span>
            </div>
            <p className="cp-dim-summary" dir={rDir}>
              {d.summary}
            </p>
          </li>
        ))}
      </ul>
      {sorted.length > COMPACT_DIMS && (
        <button type="button" className="cp-linkbtn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? t.dimensionsCollapse : `${t.dimensionsExpand} (${sorted.length})`}
        </button>
      )}
    </section>
  );
}

/* ─────────────────────── issues (§21–§22) ─────────────────────── */

function IssueList({
  t,
  lang,
  report,
  rDir,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  rDir: "rtl" | "ltr";
}) {
  const hasIssues = report.topIssues.length > 0;
  /* §22 — a strong CV gets honest "opportunities": its two lowest REAL
     dimension scores, never invented problems. */
  const opportunities = useMemo(
    () =>
      hasIssues
        ? []
        : [...report.dimensionSummary].sort((a, b) => a.score - b.score).slice(0, 2),
    [hasIssues, report.dimensionSummary],
  );

  return (
    <section className="cp-sec" aria-label={hasIssues ? t.issuesH : t.issuesHStrong}>
      <h2 className="cp-h2 cp-rule">{hasIssues ? t.issuesH : t.issuesHStrong}</h2>
      {hasIssues ? (
        <ol className="cp-issues">
          {report.topIssues.map((issue, i) => (
            <li key={i} className="cp-issue">
              <details
                onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open)
                    trackCareerEvent("career_issue_expanded", {
                      issue_index: i,
                      dimension: issue.dimension,
                      severity: issue.severity,
                    });
                }}
              >
                <summary>
                  <span className="cp-issue-n" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`cp-sev cp-sev-${issue.severity}`}>
                    {t.severity[issue.severity]}
                  </span>
                  <span className="cp-issue-dim">{DIMENSION_TITLES[issue.dimension][lang]}</span>
                </summary>
                <p className="cp-issue-body" dir={rDir}>
                  {issue.summary}
                </p>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="cp-opps">
          {opportunities.map((d) => (
            <li key={d.dimension} className="cp-opp">
              <span className="cp-opp-head">
                <span className="cp-issue-dim">{DIMENSION_TITLES[d.dimension][lang]}</span>
                <span className="cp-dim-score">{d.score}</span>
              </span>
              <p className="cp-issue-body" dir={rDir}>
                {d.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────── strengths (§23) ─────────────────────── */

function StrengthList({
  t,
  lang,
  report,
  rDir,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  rDir: "rtl" | "ltr";
}) {
  if (report.topStrengths.length === 0) return null;
  return (
    <section className="cp-sec" aria-label={t.strengthsH}>
      <h2 className="cp-h2 cp-rule">{t.strengthsH}</h2>
      <ul className="cp-strengths">
        {report.topStrengths.map((s, i) => (
          <li key={i} className="cp-strength">
            <span className="cp-strength-mark" aria-hidden>
              ✓
            </span>
            <div>
              <span className="cp-issue-dim">{DIMENSION_TITLES[s.dimension][lang]}</span>
              <p className="cp-issue-body" dir={rDir}>
                {s.summary}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────── before / after rewrite (§25–§26) ───────────────── */

function RewritePreview({
  t,
  report,
  rDir,
}: {
  t: CareerCopy;
  report: UiFreeReport;
  rDir: "rtl" | "ltr";
}) {
  /* Real rewrite generation is launch-gated. The slot renders only when the
     flag is on OR we are in synthetic demo mode showing fixture content —
     and in the latter case it is explicitly labeled a demonstration. */
  const show =
    report.rewriteExample &&
    (CAREER_FLAGS.rewriteEnabled || CAREER_FLAGS.syntheticDemoMode);
  if (!show || !report.rewriteExample) return null;
  const rw = report.rewriteExample;

  return (
    <section className="cp-sec" aria-label={t.rewriteH}>
      <h2 className="cp-h2 cp-rule">{t.rewriteH}</h2>
      <figure className="cp-rewrite" dir={rDir}>
        <figcaption className="cp-rw-k">{t.rewriteBefore}</figcaption>
        <p className="cp-rw-before">{rw.before}</p>
        <span className="cp-rw-arrow" aria-hidden>
          ↓
        </span>
        <figcaption className="cp-rw-k">{t.rewriteAfter}</figcaption>
        <p className="cp-rw-after">{rw.after}</p>
        <p className="cp-rw-note">{rw.note}</p>
      </figure>
      {!CAREER_FLAGS.rewriteEnabled && <p className="cp-demo-note">{t.rewriteDemoNote}</p>}
    </section>
  );
}

/* ─────────────── full review paywall (§27–§30, §65–§66) ─────────────── */

type PurchaseState = { id: string; status: string } | null;
type GateStatus = "idle" | "preparing" | "prepare_error" | "verify_submitting" | "verify_requested" | "verify_error";

/**
 * Part 14 — collapses GateStatus + purchase + entitlement into the 4-word
 * vocabulary the product wants: "payment not started" / "awaiting
 * verification" / "verified" / "report unlocked". `purchase.status ===
 * "verified"` (restored from the real `purchases` row on mount, see the
 * effect above) is the one case that can genuinely land on "verified"
 * distinctly from "opened" — a narrow window right after an admin
 * verifies but before this tab's own `get-full-review` re-check has
 * completed. Once `fullReview` loads, "opened" always wins.
 */
type PaymentStateKey = "notStarted" | "pendingVerification" | "verified" | "opened";
function paymentStateFor(
  status: GateStatus,
  purchase: PurchaseState,
  fullReview: UiFullReview | null,
): PaymentStateKey {
  if (fullReview) return "opened";
  if (purchase?.status === "verified") return "verified";
  if (purchase || status === "verify_requested" || status === "verify_submitting") return "pendingVerification";
  return "notStarted";
}

function FullReviewGate({
  t,
  lang,
  report,
  resumeId,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  resumeId?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(false);
  const priceLabel = `$${CAREER_FULL_REVIEW_PRICE.amount}`;
  const enabled = CAREER_FLAGS.paymentEnabled;

  const [status, setStatus] = useState<GateStatus>("idle");
  const [purchase, setPurchase] = useState<PurchaseState>(null);
  const [reference, setReference] = useState("");
  const [paidEmail, setPaidEmail] = useState("");
  const [fullReview, setFullReview] = useState<UiFullReview | null>(null);

  /* Entitlement check — independent of the checkout flow above, so a
     returning customer (refresh, a later visit after an admin verifies)
     sees their unlocked content without re-clicking anything. Never
     trusts anything client-side: `get-full-review` re-derives ownership
     AND a verified entitlement server-side before returning content. */
  useEffect(() => {
    const client = supabase;
    if (!resumeId || !client) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await client.functions.invoke("get-full-review", {
        body: { resumeId },
      });
      if (cancelled || error || !data || (data as { ok?: boolean }).ok !== true) return;
      const result = data as { entitled: boolean; report?: UiFullReview };
      if (result.entitled && result.report) setFullReview(result.report);
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, status]);

  /* Part 14 — persist payment state across refresh/return-from-PayPal/
     new-tab. `purchase`/`status` above are plain React state, which resets
     to "idle"/null on every remount; this restores them from the caller's
     own real purchase row (RLS-scoped `purchases_select_own`, same
     ownership discipline as every other query here) so a genuine reload
     mid-verification shows "awaiting verification", never resets to
     "not started" and risks a customer paying twice. Runs once and only
     when there's nothing live already in flight (status still "idle") —
     never overwrites a checkout/verification the user just triggered in
     this same session. */
  useEffect(() => {
    const client = supabase;
    if (!client || !enabled || status !== "idle" || purchase) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await client
        .from("purchases")
        .select("id, status")
        .eq("product_key", "career_cv_full_review")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || error || !data) return;
      // purchases.status vocabulary (post generic_payment_verification
      // migration): pending | verification_requested | verified | rejected
      // | refunded. Only the first three represent a real, current
      // in-flight-or-completed attempt worth restoring — a rejected/
      // refunded purchase should NOT block a fresh retry, so it's left
      // unrestored (falls back to "not started").
      if (data.status === "pending" || data.status === "verification_requested" || data.status === "verified") {
        setPurchase({ id: data.id, status: data.status });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
          trackCareerEvent("career_full_review_viewed", {
            payment_enabled: enabled,
            lang,
          });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, lang]);

  const counts = (
    [
      [report.fullReviewCounts.recommendations, t.fullCounts.recommendations],
      [report.fullReviewCounts.highPriority, t.fullCounts.highPriority],
      [report.fullReviewCounts.sectionsToRewrite, t.fullCounts.sectionsToRewrite],
      [report.fullReviewCounts.missingEvidenceQuestions, t.fullCounts.missingEvidenceQuestions],
    ] as Array<[number, string]>
  ).filter(([n]) => n > 0);

  /* §G/H — locked-row preview. The two count-based rows only render when
     that real count is > 0 (never a fabricated "{n}"); the other four are
     generic feature rows, always shown. */
  const lockedRows = [
    report.fullReviewCounts.recommendations > 0
      ? t.fullLockedRowRecommendations.replace("{n}", String(report.fullReviewCounts.recommendations))
      : null,
    report.fullReviewCounts.highPriority > 0
      ? t.fullLockedRowHighPriority.replace("{n}", String(report.fullReviewCounts.highPriority))
      : null,
    t.fullLockedRowAts,
    t.fullLockedRowSections,
    t.fullLockedRowRewrites,
    t.fullLockedRowPriorityOrder,
  ].filter((row): row is string => row !== null);

  /* §29/checkout: create/reuse a `pending` purchase server-side (its price
     comes ONLY from _shared/careerPricing.ts, never this button) BEFORE
     ever sending the customer to PayPal — that purchase_id is what lets
     them later prove payment against their own account. Opening the
     PayPal link is not, and never becomes, proof of payment.

     The tab is opened synchronously, in the same click's call stack, and
     only navigated to the PayPal URL once create-purchase resolves.
     window.open() called after an `await` loses the "direct result of a
     user gesture" trust most browsers (Safari/iOS especially) require —
     it gets silently popup-blocked, leaving the customer stuck on this
     page's own verify-payment form having never reached PayPal at all. */
  async function startCheckout() {
    trackCareerEvent("career_checkout_clicked", {
      payment_enabled: enabled,
      price_usd: CAREER_FULL_REVIEW_PRICE.amount,
      lang,
    });
    if (!enabled || !resumeId || !supabase) return; // demo/fixture reports never touch real payment infra
    const paypalUrl = CAREER_USD_PAYMENT_CONFIG.career_cv_full_review?.url;
    if (!paypalUrl) return;

    const paypalTab = window.open("", "_blank");
    if (paypalTab) paypalTab.opener = null; // no `noopener` on open() itself — we need the handle to navigate it below

    setStatus("preparing");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("no_session");

      const { data, error } = await supabase.functions.invoke("create-purchase", {
        body: { product_key: "career_cv_full_review" },
      });
      if (error || !data || (data as { ok?: boolean }).ok !== true) throw new Error("create_purchase_failed");

      const created = (data as { purchase: { id: string; status: string } }).purchase;
      setPurchase(created);
      setStatus("idle");
      trackCareerEvent("career_checkout_started", { lang });
      if (paypalTab && !paypalTab.closed) {
        paypalTab.location.href = paypalUrl;
      } else {
        // The synchronous open() was itself blocked (rare) — fall back to
        // a fresh attempt; still a direct result of this same click handler.
        window.open(paypalUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setStatus("prepare_error");
      paypalTab?.close();
    }
  }

  async function submitVerification(e: FormEvent) {
    e.preventDefault();
    if (!purchase || !supabase) return;
    setStatus("verify_submitting");
    try {
      const { data, error } = await supabase.functions.invoke("request-payment-verification", {
        body: {
          purchase_id: purchase.id,
          reference: reference.trim() || undefined,
          email: paidEmail.trim() || undefined,
        },
      });
      if (error || !data || (data as { ok?: boolean }).ok !== true) throw new Error("verify_request_failed");
      setStatus("verify_requested");
      trackCareerEvent("career_payment_verification_submitted", { lang });
    } catch {
      setStatus("verify_error");
    }
  }

  return (
    <section ref={ref} className="cp-sec cp-full" aria-label={t.fullH}>
      <p className="cp-sec-k">{t.fullH}</p>
      <h2 className="cp-h2 cp-rule">{t.fullHeadline}</h2>
      <p className="cp-full-sub">{t.fullSubheading}</p>
      {counts.length > 0 && (
        <>
          <p className="cp-full-found">{t.fullFound}</p>
          <ul className="cp-full-counts">
            {counts.map(([n, label]) => (
              <li key={label}>
                <span className="cp-full-n">{n}</span> {label}
              </li>
            ))}
          </ul>
        </>
      )}

      {fullReview ? (
        <>
          <p className="cp-locked-note" role="status">
            {t.fullUnlockedNote}
          </p>
          <UnlockedFullReview t={t} lang={lang} data={fullReview} />
        </>
      ) : (
        <>
          {/* locked structure — section titles blurred, no fabricated prose (§65) */}
          <ul className="cp-locked" aria-label={t.lockedA11y}>
            {lockedRows.map((row) => (
              <li key={row} className="cp-locked-row">
                <span className="cp-lock" aria-hidden>
                  🔒
                </span>
                <span className="cp-locked-title">{row}</span>
                <span className="cp-locked-blur" aria-hidden />
              </li>
            ))}
          </ul>

          {/* what's included — plain, not blurred; the same content the
              locked rows above tease, stated once more as a quick recap */}
          <ul className="cp-full-includes">
            {t.fullIncludes.map((item) => (
              <li key={item}>
                <span aria-hidden>✓</span> {item}
              </li>
            ))}
          </ul>

          {/* §29 — payment gate: price shown, action honestly unavailable when
              the flag/link aren't both live. The "$5" fragment is isolated in
              its own `dir="ltr"` span so the currency figure never reorders
              inside the surrounding Arabic sentence on narrow RTL widths. */}
          <button
            type="button"
            className="cp-cta cp-cta-buy"
            disabled={!enabled || status === "preparing"}
            aria-disabled={!enabled || status === "preparing"}
            onClick={startCheckout}
          >
            {status === "preparing" ? (
              t.fullCtaPreparing
            ) : (
              <>
                {t.fullCta.split("$5")[0]}
                <bdi dir="ltr">{priceLabel}</bdi>
                {t.fullCta.split("$5")[1]}
              </>
            )}
          </button>
          {!enabled && <p className="cp-locked-note">{t.fullLockedNote}</p>}
          {status === "prepare_error" && <p className="cp-locked-note" role="alert">{t.fullCtaError}</p>}

          <p className="cp-payment-state" role="status">
            {t.paymentState[paymentStateFor(status, purchase, fullReview)]}
          </p>

          {purchase && status !== "verify_requested" && (
            <form className="cp-auth-form" onSubmit={submitVerification} dir={lang === "ar" ? "rtl" : "ltr"}>
              <p className="cp-beta-title">{t.verifyH}</p>
              <p className="cp-auth-hint">{t.verifyBody}</p>
              <input
                type="text"
                className="cp-auth-input"
                placeholder={t.verifyRefPlaceholder}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                dir="ltr"
              />
              <input
                type="email"
                className="cp-auth-input"
                placeholder={t.verifyEmailPlaceholder}
                value={paidEmail}
                onChange={(e) => setPaidEmail(e.target.value)}
                dir="ltr"
              />
              <button type="submit" className="cp-cta cp-cta-secondary" disabled={status === "verify_submitting"}>
                {status === "verify_submitting" ? t.verifySending : t.verifySubmitCta}
              </button>
              {status === "verify_error" && <p className="cp-locked-note" role="alert">{t.verifyError}</p>}
              <p className="cp-auth-hint">{t.fullPayNote}</p>
            </form>
          )}
          {status === "verify_requested" && (
            <p className="cp-locked-note" role="status">
              {t.verifyRequested}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* ─────────────── unlocked Full Review content (real, entitlement-gated) ─────────────── */

function UnlockedFullReview({ t, lang, data }: { t: CareerCopy; lang: CareerLang; data: UiFullReview }) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <div className="cp-full-unlocked" dir={dir}>
      <section aria-label={t.detailH}>
        <h3 className="cp-h2 cp-rule">{t.detailH}</h3>
        <ul className="cp-full-counts">
          {data.dimensionDetails.map((d) => (
            <li key={d.dimension}>
              <strong>{DIMENSION_TITLES[d.dimension][lang]}</strong> ({Math.round(d.score)}/100) — {d.reason}
              {d.recommendations.length > 0 && (
                <ul>
                  {d.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={t.atsH}>
        <h3 className="cp-h2 cp-rule">{t.atsH}</h3>
        {data.atsAnalysis.indicators.map((ind, i) => (
          <p key={i}>
            <strong>{ind.check}</strong> — {ind.detail}
          </p>
        ))}
        <p className="cp-auth-hint">{data.atsAnalysis.disclaimer}</p>
      </section>

      <section aria-label={t.actionPlanH}>
        <h3 className="cp-h2 cp-rule">{t.actionPlanH}</h3>
        <ol>
          {data.actionPlan.map((step) => (
            <li key={step.order}>
              [{t.severity[step.severity]} · {t.actionPlanEffort[step.effort]}] {step.issueSummary}
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={t.targetRoleH}>
        <h3 className="cp-h2 cp-rule">{t.targetRoleH}</h3>
        {data.targetRoleAnalysis ? (
          <>
            <p>{data.targetRoleAnalysis.positioningVerdict}</p>
            {data.targetRoleAnalysis.gaps.length > 0 && (
              <ul>
                {data.targetRoleAnalysis.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="cp-auth-hint">{t.noTargetRoleNote}</p>
        )}
      </section>

      {data.rewriteSuggestions.length > 0 && (
        <section aria-label={t.rewriteSuggestionsFullH}>
          <h3 className="cp-h2 cp-rule">{t.rewriteSuggestionsFullH}</h3>
          {data.rewriteSuggestions.map((rw, i) => (
            <figure className="cp-rewrite" key={i}>
              <figcaption className="cp-rw-k">{t.rewriteBefore}</figcaption>
              <p className="cp-rw-before">{rw.before}</p>
              <span className="cp-rw-arrow" aria-hidden>
                ↓
              </span>
              <figcaption className="cp-rw-k">{t.rewriteAfter}</figcaption>
              <p className="cp-rw-after">{rw.after}</p>
              <p className="cp-rw-note">{rw.note}</p>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}

/* ─────────────────────── methodology / trust (§41–§42) ─────────────────────── */

function Methodology({ t }: { t: CareerCopy }) {
  return (
    <section className="cp-sec cp-method" aria-label={t.methodH}>
      <h2 className="cp-h2 cp-rule">{t.methodH}</h2>
      <p className="cp-method-body">{t.methodBody}</p>
      <p className="cp-method-ai">{t.methodAI}</p>
      <p className="cp-method-by">{t.builtBy}</p>
    </section>
  );
}

/* ─────────────────────── next services (item J) ─────────────────────── */

/**
 * "وش الخطوة التالية؟" — end-of-report cross-sell, deliberately two short
 * groups rather than a wall of cards. All prices/outcomes come straight
 * from `src/data/careerServices.ts` + `src/config/careerServices.ts` (the
 * same catalog /services uses) — nothing here invents a price or a product.
 * Every CTA points at `/services`: there is no dedicated product page per
 * service, /services itself is the one scroll-driven catalog.
 */
function NextServices({ t, lang }: { t: CareerCopy; lang: CareerLang }) {
  const cvRewrite = CAREER_SERVICES.find((s) => s.id === "resumeWriting");
  const linkedin = CAREER_SERVICES.find((s) => s.id === "linkedinOptimization");
  const portfolio = CAREER_SERVICES.find((s) => s.id === "mvpPortfolio");
  if (!cvRewrite || !linkedin || !portfolio) return null; // catalog entry missing — never render a broken row

  const group1 = [
    { key: "cv", name: t.nextServiceCvName, cta: t.nextServiceCvCta, svc: cvRewrite },
    { key: "linkedin", name: t.nextServiceLinkedinName, cta: t.nextServiceLinkedinCta, svc: linkedin },
    { key: "portfolio", name: t.nextServicePortfolioName, cta: t.nextServicePortfolioCta, svc: portfolio },
  ];

  return (
    <section className="cp-sec cp-next-services" aria-label={t.nextStepsH}>
      <h2 className="cp-h2 cp-rule">{t.nextStepsH}</h2>

      <p className="cp-sec-k">{t.nextStepsGroup1H}</p>
      <ul className="cp-service-rows">
        {group1.map((row) => (
          <li key={row.key} className="cp-service-row">
            <div>
              <p className="cp-service-name">{row.name}</p>
              <p className="cp-service-detail">
                {row.svc.outcome[lang]} · {servicePriceLabel(row.svc.price, lang)}
              </p>
            </div>
            <Link href="/services" className="cp-cta cp-cta-secondary cp-service-cta">
              {row.cta}
            </Link>
          </li>
        ))}
      </ul>

      <div className="cp-next-idea">
        <p className="cp-sec-k">{t.nextStepsGroup2H}</p>
        <ul className="cp-service-rows">
          <li className="cp-service-row">
            <div>
              <p className="cp-service-name">{portfolio.name[lang]}</p>
              <p className="cp-service-detail">{servicePriceLabel(portfolio.price, lang)}</p>
            </div>
            <Link href="/services" className="cp-cta cp-cta-secondary cp-service-cta">
              {portfolio.cta[lang]}
            </Link>
          </li>
          <li className="cp-service-row">
            <div>
              <p className="cp-service-name">{COMPLETE_BUNDLE.name[lang]}</p>
              <p className="cp-service-detail">{servicePriceLabel(COMPLETE_BUNDLE.price, lang)}</p>
            </div>
            <Link href="/services" className="cp-cta cp-cta-secondary cp-service-cta">
              {COMPLETE_BUNDLE.cta[lang]}
            </Link>
          </li>
        </ul>
        <Link href="/services" className="cp-linkbtn">
          {t.nextStepsSeeAll}
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────── contact / social footer (item K) ─────────────────────── */

function ContactFooter({ t }: { t: CareerCopy }) {
  return (
    <section className="cp-sec cp-contact-footer" aria-label={t.contactH}>
      <h2 className="cp-h2 cp-rule">{t.contactH}</h2>
      <p className="cp-contact-name">{t.contactName}</p>
      <p className="cp-contact-line">{t.contactSentence}</p>
      <div className="cp-contact-buttons">
        <a className="cp-cta cp-cta-secondary" href={`mailto:${CONTACT.email}`}>
          {t.contactEmailCta}
        </a>
        {CONTACT.linkedinUrl && (
          <a className="cp-cta cp-cta-secondary" href={CONTACT.linkedinUrl} target="_blank" rel="noopener noreferrer">
            {t.contactLinkedinCta}
          </a>
        )}
        {CONTACT.githubUrl && (
          <a className="cp-cta cp-cta-secondary" href={CONTACT.githubUrl} target="_blank" rel="noopener noreferrer">
            {t.contactGithubCta}
          </a>
        )}
        <a className="cp-cta cp-cta-secondary" href={CONTACT.siteUrl} target="_blank" rel="noopener noreferrer">
          {t.contactSiteCta}
        </a>
      </div>
    </section>
  );
}

/* ═══════════════════════ report-only styles ═══════════════════════
   New UI introduced by the Career V2 report journey. CareerClient.tsx's
   own global `<style>` (its `CareerStyles`) already defines `.cp-*` base
   classes and renders AFTER this component in the DOM, so any override of
   an EXISTING class here is written with an extra `.cp-report` prefix —
   raising specificity above a bare single-class selector — so it wins
   regardless of DOM/cascade order. Brand-new classes need no such prefix. */
function ReportStyles() {
  return (
    <style>{`
      /* ── item C — issue/opportunity row: number + severity + title never
         collide on narrow RTL widths; the title wraps to its own line
         instead of overflowing or squeezing the badges. ── */
      .cp-report .cp-issue summary { flex-wrap: wrap; row-gap: 6px; }
      .cp-report .cp-issue-n { flex: 0 0 auto; min-width: 20px; }
      .cp-report .cp-sev { flex: 0 0 auto; white-space: nowrap; }
      .cp-report .cp-issue-dim { flex: 1 1 auto; min-width: 40%; word-break: break-word; }
      .cp-report .cp-opp-head { flex-wrap: wrap; row-gap: 6px; }

      /* dimension row — same narrow-width safety net */
      @media (max-width: 420px) {
        .cp-report .cp-dim-row { flex-wrap: wrap; row-gap: 8px; }
        .cp-report .cp-dim-name { min-width: 100%; }
        .cp-report .cp-dim-track { min-width: 0; }
      }

      /* ── item A — hero indicators row ── */
      .cp-indicators {
        display: flex; flex-wrap: wrap; justify-content: center; gap: 20px 32px;
        margin: 22px 0 4px; padding: 18px 0 0; border-top: 1px solid var(--border-subtle);
      }
      .cp-indicator { margin: 0; text-align: center; min-width: 84px; }
      .cp-indicator dt {
        font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--text-muted); margin: 0 0 4px;
      }
      .cp-indicator dd { margin: 0; font-size: 14.5px; font-weight: 700; color: var(--text-primary); }

      /* ── item I — send to email (Parts 15-18: animated dropdown/sheet, real send) ── */
      .cp-send-email { margin-top: 16px; text-align: center; position: relative; }
      .cp-send-email-panel {
        max-width: 420px; margin: 12px auto 0; padding: 16px 18px;
        border: 1.5px solid var(--border-subtle); border-radius: 12px; text-align: start;
        background: var(--surface-1, var(--bg-primary));
        box-shadow: 0 8px 28px -12px rgba(0,0,0,0.22);
      }
      .cp-send-email-title { margin: 0 0 4px; font-size: 14.5px; font-weight: 700; color: var(--text-primary); }
      .cp-send-email-note { margin: 0 0 12px; font-size: 13.5px; color: var(--text-secondary); line-height: 1.7; }
      .cp-send-email-panel .cp-auth-form { margin-top: 0; }
      .cp-auth-input[readonly] { opacity: 0.85; cursor: default; }
      .cp-send-email-status { margin: 10px 0 0; font-size: 13.5px; line-height: 1.6; }
      .cp-send-email-success { color: var(--success, #1a7f4e); }
      .cp-send-email-error { color: var(--danger, #c23b3b); }

      /* Mobile bottom sheet (Part 15/24): fixed to the viewport bottom, full-width, above everything, keyboard-safe padding. */
      .cp-send-email-sheet {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
        max-width: none; margin: 0; border-radius: 18px 18px 0 0;
        border: 1px solid var(--border-subtle); border-bottom: none;
        padding: 10px 18px calc(20px + env(safe-area-inset-bottom));
        box-shadow: 0 -12px 32px -16px rgba(0,0,0,0.3);
      }
      .cp-sheet-grip { width: 36px; height: 4px; border-radius: 999px; background: var(--border-subtle); margin: 4px auto 14px; }

      /* ── Job Match (Part 6/7) — third distinct concept, small and quiet ── */
      .cp-jobmatch-sec { text-align: center; padding-top: 4px; }
      .cp-jobmatch-score { margin: 4px 0 0; font-size: 20px; font-weight: 800; direction: ltr; }
      .cp-jobmatch-summary { margin: 4px 0 0; font-size: 13.5px; color: var(--text-secondary); max-width: 520px; margin-inline: auto; }
      .cp-jobmatch-missing { margin: 4px 0 0; font-size: 13.5px; color: var(--text-muted); }

      /* ── item B — ATS Compatibility card ── */
      .cp-ats-sec { text-align: center; }
      .cp-ats-score { display: flex; align-items: baseline; justify-content: center; gap: 4px; direction: ltr; }
      .cp-ats-num { font-size: clamp(36px, 5vw, 48px); font-weight: 900; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
      .cp-ats-den { font-size: 16px; font-weight: 500; color: var(--text-muted); }
      .cp-ats-counts {
        list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-wrap: wrap;
        justify-content: center; gap: 8px 22px; font-size: 14px; color: var(--text-secondary);
      }
      .cp-ats-risk {
        max-width: 480px; margin: 16px auto 0; padding: 10px 16px; font-size: 13px;
        color: #a05a00; background: #fdf3d8; border: 1px solid #f0dfae; border-radius: 10px;
      }
      [data-theme="dark"] .cp-ats-risk { color: #ffc46b; background: rgba(255,196,107,0.1); border-color: rgba(255,196,107,0.3); }
      .cp-ats-disclaimer { max-width: 480px; margin: 14px auto 0; font-size: 12px; color: var(--text-muted); line-height: 1.7; }

      /* ── full review restructure ── */
      .cp-full-sub { color: var(--text-secondary); line-height: 1.8; margin: 0 0 20px; max-width: 520px; }
      .cp-full-includes { list-style: none; margin: 0 0 22px; padding: 0; display: grid; gap: 8px; font-size: 14.5px; }
      .cp-full-includes li { color: var(--text-secondary); }
      .cp-full-includes li span[aria-hidden] { color: var(--text-primary); font-weight: 900; margin-inline-end: 6px; }
      .cp-payment-state { text-align: center; font-size: 12.5px; font-weight: 700; color: var(--text-muted); margin: 14px 0 0; }

      /* ── item J — next services ── */
      .cp-service-rows { list-style: none; margin: 14px 0 0; padding: 0; }
      .cp-service-row {
        display: flex; align-items: center; justify-content: space-between; gap: 14px;
        padding: 16px 0; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap;
      }
      .cp-service-name { font-weight: 700; font-size: 15px; margin: 0 0 4px; }
      .cp-service-detail { font-size: 13px; color: var(--text-secondary); margin: 0; }
      .cp-service-cta { flex-shrink: 0; padding: 10px 22px; font-size: 14px; min-height: 40px; }
      .cp-next-idea { margin-top: 44px; padding-top: 28px; border-top: 1px dashed var(--border-subtle); }

      /* ── item K — contact / social footer ── */
      .cp-contact-footer { text-align: center; }
      .cp-contact-name { font-weight: 900; font-size: 17px; margin: 0 0 6px; }
      .cp-contact-line { color: var(--text-secondary); line-height: 1.8; max-width: 440px; margin: 0 auto 20px; }
      .cp-contact-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
      .cp-contact-buttons .cp-cta { padding: 11px 22px; font-size: 14px; min-height: 42px; }

      @media (max-width: 380px) {
        .cp-indicators { gap: 16px 20px; }
        .cp-service-cta { width: 100%; text-align: center; }
      }
    `}</style>
  );
}
