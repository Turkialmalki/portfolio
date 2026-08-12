"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "framer-motion";
import type { CareerCopy } from "./careerCopy";
import {
  DIMENSION_TITLES,
  type CareerLang,
  type UiFreeReport,
} from "./careerTypes";
import { CAREER_FLAGS, CAREER_FULL_REVIEW_PRICE } from "@/config/careerFlags";
import { trackCareerEvent } from "@/lib/careerAnalytics";

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
  onRevealed,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  fileName: string;
  onRevealed: () => void;
}) {
  const rDir = report.reportLang === "ar" ? "rtl" : "ltr";
  const strong = report.overallScore >= 75;

  return (
    <div className="cp-report">
      <ScoreReveal t={t} lang={lang} report={report} fileName={fileName} onRevealed={onRevealed} />

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

      <FullReviewGate t={t} lang={lang} report={report} />

      <AuthPrompt t={t} />

      <Methodology t={t} />
    </div>
  );
}

/* ───────────────────────── score reveal (§16–§18) ───────────────────────── */

function ScoreReveal({
  t,
  lang,
  report,
  fileName,
  onRevealed,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  fileName: string;
  onRevealed: () => void;
}) {
  const nRef = useRef<HTMLSpanElement>(null);
  /* this section only ever mounts client-side (post-analysis), so the
     reduced-motion preference can seed the initial state directly */
  const [settled, setSettled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (settled) {
      // reduced motion: no count-up — the number is simply there
      if (nRef.current) nRef.current.textContent = String(report.overallScore);
      onRevealed();
      // §0/§0 bugfix: this branch must reset `fired` on cleanup too — see
      // the comment on the animated branch's cleanup below. Without this,
      // React Strict Mode's dev-only mount→cleanup→mount double-invoke
      // left `fired.current` permanently `true` after the FIRST (thrown
      // away) mount, so the real mount's effect returned at the guard
      // above and never wrote the score into the DOM at all — the score
      // stayed at the literal "0" the JSX renders as its initial content,
      // forever, while sibling components that read `report.overallScore`
      // straight out of React state (ScoreLine, the visually-hidden
      // status paragraph two lines below) rendered correctly. That
      // mismatch — dimensions/labels correct, the one imperatively-
      // written number stuck at 0 — was the entire bug; report.overallScore
      // itself was never wrong.
      return () => {
        fired.current = false;
      };
    }
    const ctrl = animate(0, report.overallScore, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (nRef.current) nRef.current.textContent = String(Math.round(v));
      },
      onComplete: () => {
        setSettled(true);
        onRevealed();
      },
    });
    return () => {
      // Reset the guard on EVERY cleanup, not just cancel the animation —
      // a cleanup that runs without this (Strict Mode's fake unmount, or
      // a genuine remount) leaves `fired.current` stuck `true` and the
      // next real mount's effect no-ops at the guard above.
      fired.current = false;
      ctrl.stop();
    };
  }, [report.overallScore, onRevealed, settled]);

  // the band ships in both languages from the backend — display the UI one
  const uiLabel = lang === "ar" ? report.scoreBand.labelAr : report.scoreBand.labelEn;

  return (
    <section className="cp-sec cp-score-sec" aria-label={t.scoreRevealLabel}>
      <p className="cp-sec-k">{t.scoreRevealLabel}</p>
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
      </div>
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

function FullReviewGate({
  t,
  lang,
  report,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(false);
  const priceLabel = `$${CAREER_FULL_REVIEW_PRICE.amount}`;
  const enabled = CAREER_FLAGS.paymentEnabled;

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

  return (
    <section ref={ref} className="cp-sec cp-full" aria-label={t.fullH}>
      <h2 className="cp-h2 cp-rule">{t.fullH}</h2>
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

      {/* locked structure — section titles blurred, no fabricated prose (§65) */}
      <ul className="cp-locked" aria-label={t.lockedA11y}>
        {t.fullLockedRows.map((row) => (
          <li key={row} className="cp-locked-row">
            <span className="cp-lock" aria-hidden>
              🔒
            </span>
            <span className="cp-locked-title">{row}</span>
            <span className="cp-locked-blur" aria-hidden />
          </li>
        ))}
      </ul>

      <p className="cp-full-what">{t.fullWhat}</p>

      {/* §29 — payment gate: price shown, action honestly unavailable */}
      <button
        type="button"
        className="cp-cta cp-cta-buy"
        disabled={!enabled}
        aria-disabled={!enabled}
        onClick={() => {
          trackCareerEvent("career_checkout_clicked", {
            payment_enabled: enabled,
            price_usd: CAREER_FULL_REVIEW_PRICE.amount,
            lang,
          });
          /* When payment enables, this becomes a plain navigation to the
             verified PayPal payment link read from CAREER_USD_PAYMENT_CONFIG
             — never Lemon Squeezy, never a client-side entitlement. Until
             then there is deliberately nothing here. */
        }}
      >
        {t.fullCta.replace("$5", priceLabel)}
      </button>
      {!enabled && <p className="cp-locked-note">{t.fullLockedNote}</p>}
    </section>
  );
}

/* ───────────────────────── auth prompt (§31–§32) ───────────────────────── */

function AuthPrompt({ t }: { t: CareerCopy }) {
  const [submitted, setSubmitted] = useState(false);
  const enabled = CAREER_FLAGS.authEnabled;

  return (
    <section className="cp-sec cp-auth" aria-label={t.authH}>
      <h2 className="cp-h2 cp-rule">{t.authH}</h2>
      <form
        className="cp-auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          trackCareerEvent("career_auth_started", { auth_enabled: enabled });
          /* Hosted auth is launch-partial: the UI exists, real magic-link
             delivery does not. Never pretend a mail was sent. */
          setSubmitted(true);
        }}
      >
        <label className="cp-visually-hidden" htmlFor="career-email">
          {t.authEmail}
        </label>
        <input
          id="career-email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.authEmail}
          className="cp-auth-input"
          dir="ltr"
        />
        <button type="submit" className="cp-cta cp-cta-secondary">
          {t.authCta}
        </button>
      </form>
      <p className="cp-auth-hint">{t.authNoPassword}</p>
      {submitted && !enabled && (
        <p className="cp-locked-note" role="status">
          {t.authPending}
        </p>
      )}
    </section>
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
