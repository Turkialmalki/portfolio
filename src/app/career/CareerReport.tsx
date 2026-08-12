"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { animate } from "framer-motion";
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
  onRevealed,
}: {
  t: CareerCopy;
  lang: CareerLang;
  report: UiFreeReport;
  fileName: string;
  /** Undefined for a synthetic-demo fixture report — the Full Review CTA
   *  stays visually identical but never creates a purchase without one. */
  resumeId?: string;
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

      <FullReviewGate t={t} lang={lang} report={report} resumeId={resumeId} />

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

type PurchaseState = { id: string; status: string } | null;
type GateStatus = "idle" | "preparing" | "prepare_error" | "verify_submitting" | "verify_requested" | "verify_error";

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

  /* §29/checkout: create/reuse a `pending` purchase server-side (its price
     comes ONLY from _shared/careerPricing.ts, never this button) BEFORE
     ever sending the customer to PayPal — that purchase_id is what lets
     them later prove payment against their own account. Opening the
     PayPal link is not, and never becomes, proof of payment. */
  async function startCheckout() {
    trackCareerEvent("career_checkout_clicked", {
      payment_enabled: enabled,
      price_usd: CAREER_FULL_REVIEW_PRICE.amount,
      lang,
    });
    if (!enabled || !resumeId || !supabase) return; // demo/fixture reports never touch real payment infra
    const paypalUrl = CAREER_USD_PAYMENT_CONFIG.career_cv_full_review?.url;
    if (!paypalUrl) return;

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
      window.open(paypalUrl, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("prepare_error");
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

          {/* §29 — payment gate: price shown, action honestly unavailable when
              the flag/link aren't both live */}
          <button
            type="button"
            className="cp-cta cp-cta-buy"
            disabled={!enabled || status === "preparing"}
            aria-disabled={!enabled || status === "preparing"}
            onClick={startCheckout}
          >
            {status === "preparing" ? t.fullCtaPreparing : t.fullCta.replace("$5", priceLabel)}
          </button>
          {!enabled && <p className="cp-locked-note">{t.fullLockedNote}</p>}
          {status === "prepare_error" && <p className="cp-locked-note" role="alert">{t.fullCtaError}</p>}

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
