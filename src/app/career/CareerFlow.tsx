"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CAREER_ERRORS, type CareerCopy } from "./careerCopy";
import { CAREER_UPLOAD_LIMITS, type CareerErrorCode, type CareerLang } from "./careerTypes";
import { CAREER_FLAGS } from "@/config/careerFlags";
import { CAREER_UPLOAD_MICROCOPY } from "@/config/careerTrustCopy";
import { CAREER_FIXTURES, FIXTURE_LABELS, type CareerFixtureKey } from "./careerFixtures";

/* ═══════════════════════════════════════════════════════════════════════
   UPLOAD → PROCESSING → ERROR surfaces (Command 06A §8–§15).

   The uploader is the moment the story becomes a product, so it is drawn
   as a sheet of paper — the same visual language as the hero — not a
   dashed dropzone. Everything here is honest about the launch gates:

   · synthetic demo mode: the flow runs, clearly badged, against fixture
     reports; the chosen file is never read and never leaves the device.
   · gated production: the full surface renders, but the action is a
     clear "private beta" state — no fake processing, ever (§64).
   ═══════════════════════════════════════════════════════════════════════ */

export function CareerUploader({
  t,
  lang,
  fixture,
  onFixture,
  onFile,
  onError,
  onDialogOpen,
}: {
  t: CareerCopy;
  lang: CareerLang;
  fixture: CareerFixtureKey;
  onFixture: (k: CareerFixtureKey) => void;
  onFile: (fileName: string) => void;
  onError: (code: CareerErrorCode) => void;
  onDialogOpen: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const demo = CAREER_FLAGS.syntheticDemoMode;
  const live = CAREER_FLAGS.analysisEnabled;
  const actionable = demo || live;
  const trust = CAREER_UPLOAD_MICROCOPY[lang];

  const accept = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase();
      const okExt = CAREER_UPLOAD_LIMITS.acceptExtensions.some((e) => name.endsWith(e));
      if (!okExt) return onError("UNSUPPORTED_FILE");
      if (file.size > CAREER_UPLOAD_LIMITS.maxFileBytes) return onError("FILE_TOO_LARGE");
      if (file.size < CAREER_UPLOAD_LIMITS.minFileBytes) return onError("FILE_TOO_SMALL");
      onFile(file.name);
    },
    [onError, onFile],
  );

  return (
    <div className="cp-upload" id="career-upload">
      <div
        className={`cp-upload-sheet${dragOver ? " cp-drag" : ""}`}
        onDragOver={
          actionable
            ? (e) => {
                e.preventDefault();
                setDragOver(true);
              }
            : undefined
        }
        onDragLeave={actionable ? () => setDragOver(false) : undefined}
        onDrop={
          actionable
            ? (e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) accept(f);
              }
            : undefined
        }
      >
        <div className="cp-upload-fold" aria-hidden />
        <h2 className="cp-h2">{t.uploadH}</h2>
        <p className="cp-upload-formats">{t.uploadFormats}</p>
        <p className="cp-upload-promise">{t.uploadPromise}</p>
        <ul className="cp-upload-points">
          {t.uploadPoints.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        {actionable ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={CAREER_UPLOAD_LIMITS.acceptAttr}
              className="cp-visually-hidden"
              aria-label={t.uploadCta}
              onChange={(e) => {
                const f = e.target.files?.[0];
                // allow re-selecting the same file after an error
                e.target.value = "";
                if (f) accept(f);
              }}
            />
            <button
              type="button"
              className="cp-cta cp-cta-upload"
              onClick={() => {
                onDialogOpen();
                inputRef.current?.click();
              }}
            >
              {t.uploadCta}
            </button>
            <p className="cp-upload-drop" aria-hidden>
              {t.uploadDrop}
            </p>
            {demo && !live && <p className="cp-demo-badge">{t.demoBadge}</p>}
          </>
        ) : (
          /* §64 — visually complete, honestly gated. No dead buttons. */
          <div className="cp-beta" role="status">
            <p className="cp-beta-title">{t.betaTitle}</p>
            <p className="cp-beta-body">{t.betaBody}</p>
          </div>
        )}

        {/* §10 — trust, expandable, never a legal dump */}
        <details className="cp-privacy">
          <summary>{t.privacyTitle}</summary>
          <p className="cp-privacy-lede">{trust.line2}</p>
          <ul>
            {t.privacyPoints.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Link href={CAREER_UPLOAD_MICROCOPY.href} className="cp-privacy-link">
            {t.privacyLink}
          </Link>
        </details>
      </div>

      {/* §56 — dev-only fixture picker, only exists in synthetic demo mode */}
      {demo && !live && (
        <div className="cp-fixture-bar" aria-label="Demo fixtures">
          {(Object.keys(CAREER_FIXTURES) as CareerFixtureKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`cp-fixture${fixture === k ? " cp-fixture-on" : ""}`}
              onClick={() => onFixture(k)}
              aria-pressed={fixture === k}
            >
              {FIXTURE_LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── processing ─────────────────────────── */

/**
 * §12–§14: staged narrative, confidence-based progress. Stages advance on a
 * timer toward ~88% and hold; the parent completes the last stretch only
 * when the result actually exists. Percentages never regress, never reach
 * 100 early, and no stage claims backend instrumentation we don't have —
 * these are UI states narrating one opaque wait.
 */
export function CareerProcessing({
  t,
  fileName,
  done,
}: {
  t: CareerCopy;
  fileName: string;
  done: boolean;
}) {
  const stages = t.processingStages;
  const [pct, setPct] = useState(4);

  useEffect(() => {
    /* ~17s to walk the stages toward 88% — matched to the measured
       15–20s TIME_TO_FREE_RESULT, not to an imaginary fast backend. */
    const id = setInterval(() => {
      setPct((v) => (done ? Math.min(100, v + 6) : Math.min(88, v + (v < 60 ? 1.9 : 0.7))));
    }, 340);
    return () => clearInterval(id);
  }, [done]);

  // the stage is a pure function of progress — no second piece of state
  const stage = done ? stages.length - 1 : Math.min(stages.length - 1, Math.floor(pct / 19));

  return (
    <div className="cp-processing" aria-label={t.processingA11y}>
      {/* the uploaded document stays present — a paper being read (§13) */}
      <div className="cp-proc-doc" aria-hidden>
        <div className="cp-proc-page">
          <span className="cp-proc-name" dir="auto">
            {fileName}
          </span>
          <span className="cp-proc-l cp-proc-l1" />
          <span className="cp-proc-l cp-proc-l2" />
          <span className="cp-proc-l cp-proc-l3" />
          <span className="cp-proc-l cp-proc-l4" />
          <span className="cp-proc-l cp-proc-l5" />
          <span className="cp-proc-sweep" />
        </div>
      </div>

      <ol className="cp-stages">
        {stages.map((s, i) => (
          <li
            key={s}
            className={i < stage ? "cp-stage-done" : i === stage ? "cp-stage-on" : ""}
          >
            <span className="cp-stage-dot" aria-hidden />
            {s}
          </li>
        ))}
      </ol>

      <div
        className="cp-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <span className="cp-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {/* one polite live region: the current stage, not every tick (§53) */}
      <p className="cp-visually-hidden" aria-live="polite">
        {stages[stage]}
      </p>
      {pct >= 88 && !done && <p className="cp-proc-hold">{t.processingHold}</p>}
    </div>
  );
}

/* ───────────────────────────── error ───────────────────────────── */

export function CareerErrorState({
  code,
  lang,
  t,
  onRetry,
}: {
  code: CareerErrorCode;
  lang: CareerLang;
  t: CareerCopy;
  onRetry: () => void;
}) {
  const e = CAREER_ERRORS[code][lang];
  return (
    <div className="cp-error" role="alert">
      <div className="cp-error-mark" aria-hidden>
        !
      </div>
      <h2 className="cp-h2">{e.title}</h2>
      <p className="cp-error-body">{e.body}</p>
      <button type="button" className="cp-cta" onClick={onRetry}>
        {t.errorRetry}
      </button>
    </div>
  );
}
