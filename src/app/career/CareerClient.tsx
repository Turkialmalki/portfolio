"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { CareerObjectStyles } from "../services/CareerObjects";
import { CareerHeroWorldStyles } from "./CareerHeroWorld";
import { useLanguage } from "@/i18n/LanguageProvider";
import { trackCareerEvent } from "@/lib/careerAnalytics";
import { CAREER_FLAGS } from "@/config/careerFlags";
import { supabase } from "@/lib/supabaseClient";
import CareerHero from "./CareerHero";
import CareerReport from "./CareerReport";
import { CareerAuthGate, CareerErrorState, CareerProcessing, CareerUploader } from "./CareerFlow";
import { CAREER_COPY } from "./careerCopy";
import type { CareerErrorCode, CareerPhase, UiFreeReport } from "./careerTypes";
import {
  CAREER_FIXTURES,
  defaultFixtureFor,
  type CareerFixtureKey,
} from "./careerFixtures";

/**
 * Maps the Edge Function's `SafeErrorCode` vocabulary
 * (supabase/functions/_shared/errorCodes.ts) onto the frontend's narrower
 * `CareerErrorCode` (Command 06A.5 §24 — never a raw backend code shown
 * to a customer). Parser-content failures all read as "we couldn't read
 * that file" (PARSE_FAILED already covers corrupted/encrypted/scanned
 * PDFs in careerCopy.ts); anything genuinely unexpected on the server
 * side reads as a generic analysis failure rather than a false "check
 * your connection" (reserved for actual fetch/network exceptions below).
 */
function mapBackendErrorCode(code: string | undefined): CareerErrorCode {
  switch (code) {
    case "UNSUPPORTED_FILE":
    case "INVALID_FILE":
      return "UNSUPPORTED_FILE";
    case "FILE_TOO_LARGE":
      return "FILE_TOO_LARGE";
    case "FILE_CORRUPTED":
    case "FILE_ENCRYPTED":
    case "PDF_NO_EXTRACTABLE_TEXT":
    case "SCAN_REQUIRES_TEXT_PDF":
    case "PARSE_FAILED":
      return "PARSE_FAILED";
    case "PARSE_TIMEOUT":
    case "ANALYSIS_TIMEOUT":
      return "ANALYSIS_TIMEOUT";
    case "GATED":
      return "GATED";
    default:
      return "ANALYSIS_FAILED";
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   /career — one seamless product flow (Command 06A §4, §58).

   LANDING (hero + upload) → UPLOADING → PROCESSING → FREE_RESULT
                                   ↘ ERROR ↩ retry

   One state field drives the page; there is no pile of booleans. The
   cinematic hero belongs to discovery: the moment a file is chosen the
   page becomes a product — compact header, minimal navigation (§33–§34),
   no way to lose the report by accident.

   While the privacy gate is closed, the only path through this machine is
   SAFE_SYNTHETIC_DEMO_MODE (fixture reports, file never read). The real
   backend integration point is `startAnalysis` below — one function to
   swap when `analyze-resume` opens a customer path.
   ═══════════════════════════════════════════════════════════════════════ */

type Action =
  | { type: "FILE_SELECTED"; fileName: string }
  | { type: "UPLOAD_DONE" }
  | { type: "RESULT"; report: UiFreeReport; resumeId?: string; analysisId?: string }
  | { type: "FAIL"; code: CareerErrorCode }
  | { type: "REVEALED" }
  | { type: "RESET" }
  | { type: "RESTORE"; report: UiFreeReport; fileName: string }
  /** Career V2 Part 19: restoring a REAL analysis via `?analysis=<id>` —
   *  distinct from RESTORE (which is fixture-only, no resumeId/analysisId,
   *  never drives entitlement re-checks). Always lands already-revealed
   *  (score-reveal animation is a first-view moment, not a returning one). */
  | { type: "RESTORE_REAL"; report: UiFreeReport; resumeId: string; analysisId: string };

function reducer(phase: CareerPhase, a: Action): CareerPhase {
  switch (a.type) {
    case "FILE_SELECTED":
      return { name: "UPLOADING", fileName: a.fileName };
    case "UPLOAD_DONE":
      return phase.name === "UPLOADING"
        ? { name: "PROCESSING", fileName: phase.fileName, startedAt: Date.now() }
        : phase;
    case "RESULT":
      return phase.name === "PROCESSING"
        ? { name: "FREE_RESULT", report: a.report, fileName: phase.fileName, revealed: false, resumeId: a.resumeId, analysisId: a.analysisId }
        : phase;
    case "FAIL":
      return {
        name: "ERROR",
        code: a.code,
        fileName: "fileName" in phase ? phase.fileName : undefined,
      };
    case "REVEALED":
      return phase.name === "FREE_RESULT" ? { ...phase, revealed: true } : phase;
    case "RESET":
      return { name: "LANDING" };
    case "RESTORE":
      return { name: "FREE_RESULT", report: a.report, fileName: a.fileName, revealed: true };
    case "RESTORE_REAL":
      return {
        name: "FREE_RESULT",
        report: a.report,
        fileName: "",
        revealed: true,
        resumeId: a.resumeId,
        analysisId: a.analysisId,
      };
    default:
      return phase;
  }
}

/* film/phone split — same discipline as /services: resolved on the first
   client render, null on the server AND the hydration render so neither
   device ever mounts the other's machinery. */
const FILM_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 900px)";
function subscribeFilm(cb: () => void) {
  const mq = window.matchMedia(FILM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useMode(): "film" | "phone" | null {
  return useSyncExternalStore(
    subscribeFilm,
    () => (window.matchMedia(FILM_QUERY).matches ? "film" : "phone"),
    () => null,
  );
}

function useMedia(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return on;
}

/** Returning-user memory (§33, §59): a fixture KEY and file name only —
 *  never report text, never anything derived from a real document.
 *  Exposed as a tiny external store so components read it through
 *  useSyncExternalStore — sessionStorage is an external system, and this
 *  keeps the hydration render honest (server snapshot: null). */
const STORE_KEY = "career-demo-report-v1";
type StoredReport = { fixture: CareerFixtureKey; fileName: string; at: number };

function readStored(): StoredReport | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredReport;
    return v.fixture in CAREER_FIXTURES ? v : null;
  } catch {
    return null;
  }
}

const storedListeners = new Set<() => void>();
let storedSnapshot: StoredReport | null | undefined;
function storedSubscribe(cb: () => void) {
  storedListeners.add(cb);
  return () => storedListeners.delete(cb);
}
function storedGet(): StoredReport | null {
  if (storedSnapshot === undefined) storedSnapshot = readStored();
  return storedSnapshot;
}
function storedSet(v: StoredReport | null) {
  storedSnapshot = v;
  try {
    if (v) sessionStorage.setItem(STORE_KEY, JSON.stringify(v));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* private-mode storage failures never break the product */
  }
  storedListeners.forEach((cb) => cb());
}

export default function CareerClient() {
  const { lang } = useLanguage();
  const t = CAREER_COPY[lang];
  const mode = useMode();
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [phase, dispatch] = useReducer(reducer, { name: "LANDING" } as CareerPhase);
  /* null = "no explicit choice"; the effective fixture follows the UI
     language until the visitor picks one in the demo bar */
  const [fixtureChoice, setFixtureChoice] = useState<CareerFixtureKey | null>(null);
  const fixture = fixtureChoice ?? defaultFixtureFor(lang);
  const stored = useSyncExternalStore(storedSubscribe, storedGet, () => null);
  const [resultReady, setResultReady] = useState(false);
  const pendingReport = useRef<UiFreeReport | null>(null);
  const timers = useRef<number[]>([]);
  /* Command 06A.5 §7, §14 — real flow only: a file picked before a
     session exists waits here until sign-in completes, then resumes
     automatically. Never set/read in synthetic mode. */
  const pendingFile = useRef<File | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  /* Orphaned-upload follow-up: null = not checked yet (fails CLOSED —
     the uploader stays in the existing "private beta" state, same as
     analysisEnabled=false), true/false = the server's own
     PRIVACY_SECURITY_EXECUTION_VERIFIED mirror, fetched from
     career-health BEFORE any file is ever picked up for real upload. */
  const [gateVerified, setGateVerified] = useState<boolean | null>(null);
  useEffect(() => {
    if (CAREER_FLAGS.syntheticDemoMode || !CAREER_FLAGS.analysisEnabled || !supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("career-health");
        const verified = Boolean((data as { privacyGateVerified?: boolean } | null)?.privacyGateVerified);
        if (!cancelled) setGateVerified(verified);
      } catch {
        if (!cancelled) setGateVerified(false); // network failure reads as "not verified", never as "assume open"
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const liveReady = CAREER_FLAGS.analysisEnabled && gateVerified === true;

  useEffect(() => {
    trackCareerEvent("career_viewed", {
      lang,
      analysis_enabled: CAREER_FLAGS.analysisEnabled,
      demo_mode: CAREER_FLAGS.syntheticDemoMode,
    });
    // deliberately once — the view event is per visit, not per language flip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  /* ── synthetic path — SAFE_SYNTHETIC_DEMO_MODE ──
     The file is never read — a fixture report stands in, on a delay
     matched to the REAL measured 15–20s pipeline so the processing
     experience is designed against reality (§12). Always labeled (the
     demo badge, §3) and never reachable once syntheticDemoMode is off. */
  const runSyntheticAnalysis = useCallback(
    (fileName: string) => {
      dispatch({ type: "FILE_SELECTED", fileName });
      trackCareerEvent("cv_upload_completed", { mode: "synthetic", lang });
      setResultReady(false);
      pendingReport.current = null;

      const t0 = Date.now();
      timers.current.push(
        window.setTimeout(() => {
          dispatch({ type: "UPLOAD_DONE" });
          trackCareerEvent("analysis_started", { mode: "synthetic", lang });
        }, 700),
      );
      /* the fixture "backend" answers inside the real system's envelope */
      const wait = 12_500 + Math.random() * 3_500;
      timers.current.push(
        window.setTimeout(() => {
          pendingReport.current = CAREER_FIXTURES[fixture];
          setResultReady(true);
          trackCareerEvent("analysis_completed", {
            mode: "synthetic",
            status: "ok",
            duration_ms: Date.now() - t0,
            lang,
          });
          /* let the progress bar finish its last stretch honestly (§14) */
          timers.current.push(
            window.setTimeout(() => {
              const report = pendingReport.current;
              if (report) {
                dispatch({ type: "RESULT", report });
                storedSet({ fixture, fileName, at: Date.now() });
                trackCareerEvent("free_report_viewed", {
                  score_band: report.scoreBand.labelEn,
                  lang,
                });
              }
            }, 1_400),
          );
        }, wait),
      );
    },
    [fixture, lang],
  );

  /* ── real path (Command 06A.5) — REAL FILE → VALIDATION (already done
     in CareerFlow's accept()) → AUTH → PRIVATE STORAGE → RESUME RECORD →
     analyze-resume(mode:"customer") → scoring.ts's own overallScore,
     rendered exactly as the backend returned it (§15). Every write goes
     through Supabase RLS under the caller's own session — this function
     holds no elevated credential of any kind. */
  const runRealAnalysisWithSession = useCallback(
    async (file: File, userId: string) => {
      if (!supabase) {
        dispatch({ type: "FAIL", code: "NETWORK" });
        return;
      }
      const fileName = file.name;
      dispatch({ type: "FILE_SELECTED", fileName });
      const t0 = Date.now();

      const resumeId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = (fileName.split(".").pop() || "pdf").toLowerCase();
      const storagePath = `${userId}/${resumeId}/original.${ext}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("career-resumes")
          .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
        if (uploadError) throw new Error("upload_failed");

        const { error: insertError } = await supabase.from("resumes").insert({
          id: resumeId,
          user_id: userId,
          original_filename: fileName,
          storage_path: storagePath,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          language: lang === "ar" ? "ar" : "en",
          status: "uploaded",
        });
        if (insertError) {
          await supabase.storage.from("career-resumes").remove([storagePath]);
          throw new Error("upload_failed");
        }

        dispatch({ type: "UPLOAD_DONE" });
        trackCareerEvent("cv_upload_completed", { mode: "real", lang });
        trackCareerEvent("analysis_started", { mode: "real", lang });

        const { data, error } = await supabase.functions.invoke("analyze-resume", {
          body: { mode: "customer", resumeId },
        });

        if (error || !data || (data as { ok?: boolean }).ok !== true) {
          const backendCode =
            data && typeof (data as { error?: unknown }).error === "string"
              ? ((data as { error: string }).error)
              : undefined;
          const code = mapBackendErrorCode(backendCode);
          trackCareerEvent("analysis_completed", { mode: "real", status: "error", duration_ms: Date.now() - t0, lang });
          trackCareerEvent("career_error_shown", { code });

          /* Orphaned-upload follow-up: GATED means the feature is OFF, not
             a transient failure — the `liveReady` precheck above should
             make this unreachable in the normal case, but if the gate
             closed in the narrow race between that check and this
             request, the file already landed in private storage for a
             feature that isn't running. There's nothing to retry toward,
             so clean it up now via the SAME deletion path a signed-in
             customer already has (delete-resume — real storage removal +
             soft-deleted row + deletion_audit entry), rather than leaving
             it to sit unexplained. Every other failure below is left in
             place on purpose — see the catch block's comment. */
          if (backendCode === "GATED") {
            void supabase.functions.invoke("delete-resume", { body: { resume_id: resumeId } }).catch(() => {
              /* best-effort — same failure mode delete-resume's own storage
                 cleanup already tolerates; a real deletion_audit row exists
                 only when the RPC actually ran, so nothing here can silently
                 fabricate "deleted" status */
            });
          }

          dispatch({ type: "FAIL", code });
          return;
        }

        const report = (data as { report: UiFreeReport }).report;
        const analysisId = (data as { analysisId?: string }).analysisId;
        trackCareerEvent("analysis_completed", { mode: "real", status: "ok", duration_ms: Date.now() - t0, lang });
        dispatch({ type: "RESULT", report, resumeId, analysisId });
        trackCareerEvent("free_report_viewed", { score_band: report.scoreBand.labelEn, lang });
        // Career V2 Part 19: from this point on, a refresh/return-from-
        // email/return-from-PayPal/new-tab can restore this exact report —
        // no report CONTENT ever goes in the URL, only the id. A plain
        // history replace (no navigation, no reload) so this never
        // interferes with the in-flight reveal animation.
        if (analysisId && typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("analysis", analysisId);
          window.history.replaceState(window.history.state, "", url.toString());
        }
      } catch {
        /* Orphaned-upload follow-up: reaches here for (a) the upload/
           insert failures above (nothing was left behind — the storage
           object is removed before this throws) and (b) a real network
           drop AFTER the upload succeeded, where whether analyze-resume
           ever received the request is genuinely unknown. Deleting here
           would risk destroying a resume the server is still mid-way
           through processing. This is the RETRY case, on purpose: the
           `resumes` row (status "uploaded", or "processing"/"failed" if
           the server did receive it and then failed — see
           analyze-resume/index.ts's own failure handling) stays exactly
           as a retry needs it — `analyze-resume(mode:"customer", { resumeId
           })` against the SAME resumeId picks the already-uploaded file
           back up; nothing here forces a fresh upload. */
        trackCareerEvent("career_error_shown", { code: "NETWORK" });
        dispatch({ type: "FAIL", code: "NETWORK" });
      }
    },
    [lang],
  );

  /* Not signed in yet: park the file and show the inline sign-in gate
     instead of failing outright — the visitor stays on the page they
     were already on (§7, §14). authEnabled mirrors the hosted Auth
     Dashboard verification (§19) independently of analysisEnabled — a
     tampered client cannot invent a session the Edge Function's own
     auth.getUser() check would ever accept, so this is honesty, not
     enforcement. */
  const runRealAnalysis = useCallback(
    async (file: File) => {
      if (!supabase || !CAREER_FLAGS.authEnabled) {
        trackCareerEvent("career_error_shown", { code: "GATED" });
        dispatch({ type: "FAIL", code: "GATED" });
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        pendingFile.current = file;
        setNeedsAuth(true);
        return;
      }
      await runRealAnalysisWithSession(file, session.user.id);
    },
    [runRealAnalysisWithSession],
  );

  /* resumes automatically once sign-in completes (magic-link callback) */
  useEffect(() => {
    if (!supabase || !CAREER_FLAGS.analysisEnabled) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession && pendingFile.current) {
        const file = pendingFile.current;
        pendingFile.current = null;
        setNeedsAuth(false);
        trackCareerEvent("career_auth_completed", {});
        void runRealAnalysisWithSession(file, newSession.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [runRealAnalysisWithSession]);

  /* Career V2 Part 19 — deep-link restore. Reads `?analysis=<id>` on
     mount (client-side only, no dynamic route — required for this
     static-exported site) and, if a session already exists, restores the
     exact report via get-analysis-report. No report CONTENT is ever read
     from the URL, only the id; the actual data comes back through the
     caller's own RLS-scoped session. Runs once, only from LANDING, so it
     can never clobber an in-progress upload/analysis or a fixture demo
     already on screen. A missing/foreign/incomplete id, or no session yet
     (the visitor hasn't signed back in), silently falls through to the
     normal LANDING experience — never an error state for what is really
     just "nothing to restore yet". */
  useEffect(() => {
    if (!supabase || !CAREER_FLAGS.analysisEnabled) return;
    if (phase.name !== "LANDING") return;
    if (typeof window === "undefined") return;
    const analysisId = new URL(window.location.href).searchParams.get("analysis");
    if (!analysisId) return;

    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      if (!session || cancelled) return;

      const { data, error } = await supabase!.functions.invoke("get-analysis-report", {
        body: { analysisId },
      });
      if (cancelled || error || !data || (data as { ok?: boolean }).ok !== true) return;
      const found = (data as { found?: boolean }).found;
      if (!found) return;

      const restored = data as { resumeId: string; analysisId: string; report: UiFreeReport };
      dispatch({ type: "RESTORE_REAL", report: restored.report, resumeId: restored.resumeId, analysisId: restored.analysisId });
    })();

    return () => {
      cancelled = true;
    };
    // Only the mount-time URL/session matter — this deliberately does not
    // re-run on every `phase` change (the `phase.name !== "LANDING"` guard
    // above is checked once at effect-run time, not tracked as a dep, so
    // this stays a one-shot restore attempt).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── THE analysis entry point — the single function that changes when
     PRIVACY_SECURITY_EXECUTION_VERIFIED / analysisEnabled flip (§14). */
  const startAnalysis = useCallback(
    (file: File) => {
      if (CAREER_FLAGS.syntheticDemoMode) {
        runSyntheticAnalysis(file.name);
        return;
      }
      if (!CAREER_FLAGS.analysisEnabled) {
        trackCareerEvent("career_error_shown", { code: "GATED" });
        dispatch({ type: "FAIL", code: "GATED" });
        return;
      }
      void runRealAnalysis(file);
    },
    [runSyntheticAnalysis, runRealAnalysis],
  );

  const onError = useCallback((code: CareerErrorCode) => {
    trackCareerEvent("career_error_shown", { code });
    dispatch({ type: "FAIL", code });
  }, []);

  const scrollToUpload = useCallback(() => {
    document.getElementById("career-upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  /* product phases start at the top of the page, not mid-scroll */
  const inProduct = phase.name !== "LANDING";
  useEffect(() => {
    if (inProduct) window.scrollTo({ top: 0 });
  }, [phase.name, inProduct]);

  const tight = mode !== "film";
  const heroStill = reduced || mode === null;

  const returning = useMemo(() => {
    if (!stored || inProduct) return null;
    return stored;
  }, [stored, inProduct]);

  return (
    <>
      <CareerObjectStyles />
      <CareerHeroWorldStyles />
      <TopBar />
      {/* the floating dock eats bottom-anchored CTAs on a phone (see
          /services) and product phases keep navigation minimal (§34) */}
      {mode === "film" && !inProduct && <Navbar />}

      <main className={`cp${lang === "ar" ? " cp-ar" : ""}`} data-phase={phase.name}>
        {!inProduct && (
          <>
            {returning && (
              <div className="cp-returning" role="status">
                <span className="cp-returning-h">{t.returningH}</span>
                <span className="cp-returning-file" dir="auto">
                  {returning.fileName}
                </span>
                <span className="cp-returning-score">
                  {CAREER_FIXTURES[returning.fixture].overallScore}
                  {t.scoreOutOf}
                </span>
                <button
                  type="button"
                  className="cp-linkbtn"
                  onClick={() =>
                    dispatch({
                      type: "RESTORE",
                      report: CAREER_FIXTURES[returning.fixture],
                      fileName: returning.fileName,
                    })
                  }
                >
                  {t.returningView}
                </button>
                <button
                  type="button"
                  className="cp-linkbtn cp-linkbtn-muted"
                  onClick={() => storedSet(null)}
                >
                  {t.returningNew}
                </button>
              </div>
            )}

            <CareerHero t={t} lang={lang} tight={tight} reduced={heroStill} onCta={scrollToUpload} />

            <section className="cp-upload-sec">
              {/* §33 — the handoff: the demo sheet had its turn; now yours */}
              <p className="cp-now-yours">{t.uploadNowYours}</p>
              {needsAuth ? (
                <CareerAuthGate
                  t={t}
                  onSubmitEmail={(email) => {
                    trackCareerEvent("career_auth_started", {});
                    void supabase?.auth.signInWithOtp({
                      email,
                      options: {
                        emailRedirectTo:
                          typeof window !== "undefined" ? `${window.location.origin}/career` : undefined,
                      },
                    });
                  }}
                />
              ) : (
                <CareerUploader
                  t={t}
                  lang={lang}
                  fixture={fixture}
                  onFixture={setFixtureChoice}
                  onFile={startAnalysis}
                  onError={onError}
                  onDialogOpen={() => trackCareerEvent("cv_upload_started", { lang })}
                  liveReady={liveReady}
                />
              )}
            </section>

            <section className="cp-sec cp-method cp-method-landing" aria-label={t.methodH}>
              <h2 className="cp-h2 cp-rule">{t.methodH}</h2>
              <p className="cp-method-body">{t.methodBody}</p>
              <p className="cp-method-ai">{t.methodAI}</p>
              <p className="cp-method-by">{t.builtBy}</p>
            </section>
          </>
        )}

        {inProduct && (
          <>
            {/* compact product header (§33–§34) */}
            <header className="cp-product-head">
              <Link href="/" className="cp-brand">
                {lang === "ar" ? "تركي المالكي" : "Turki Almalki"}
              </Link>
              <span className="cp-brand-sep" aria-hidden>
                /
              </span>
              <span className="cp-brand-product">Career</span>
              {phase.name === "FREE_RESULT" && (
                <button
                  type="button"
                  className="cp-linkbtn cp-head-new"
                  onClick={() => {
                    storedSet(null);
                    dispatch({ type: "RESET" });
                  }}
                >
                  {t.returningNew}
                </button>
              )}
            </header>

            {(phase.name === "UPLOADING" || phase.name === "PROCESSING") && (
              <CareerProcessing t={t} fileName={phase.fileName} done={resultReady} />
            )}

            {phase.name === "ERROR" && (
              <CareerErrorState
                code={phase.code}
                lang={lang}
                t={t}
                onRetry={() => dispatch({ type: "RESET" })}
              />
            )}

            {phase.name === "FREE_RESULT" && (
              <CareerReport
                t={t}
                lang={lang}
                report={phase.report}
                fileName={phase.fileName}
                resumeId={phase.resumeId}
                analysisId={phase.analysisId}
                onRevealed={() => {
                  if (!phase.revealed) {
                    trackCareerEvent("career_score_revealed", {
                      score_band: phase.report.scoreBand.labelEn,
                      lang,
                    });
                    dispatch({ type: "REVEALED" });
                  }
                }}
              />
            )}
          </>
        )}
      </main>

      <Footer />
      <CareerStyles />
    </>
  );
}

/* ═══════════════════════════ page styles ═══════════════════════════
   Paper · annotation · scanning · editorial review (§38–§40). Tokens come
   from globals.css so light/dark both hold; the paper surfaces stay warm
   white in both themes because a document is a document. */
function CareerStyles() {
  return (
    <style>{`
      .cp { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); overflow-x: clip; }
      .cp * { box-sizing: border-box; }

      .cp-visually-hidden {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      /* ── type ── */
      .cp-kicker {
        font-size: 12.5px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-muted); margin: 0 0 14px;
      }
      .cp-h1 {
        font-size: clamp(30px, 4.6vw, 58px); line-height: 1.28; font-weight: 900;
        margin: 0; letter-spacing: -0.01em;
      }
      .cp-h2 { font-size: clamp(20px, 2.4vw, 30px); line-height: 1.35; font-weight: 700; margin: 0 0 14px; }
      .cp-rule { padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }

      /* ── CTA ── */
      .cp-cta {
        display: inline-block; border: none; cursor: pointer; font-family: inherit;
        background: var(--text-primary); color: var(--bg-primary);
        font-size: 16px; font-weight: 700; padding: 15px 34px; border-radius: 100px;
        box-shadow: 0 6px 24px rgba(13,14,18,0.18);
        transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        min-height: 48px;
      }
      .cp-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(13,14,18,0.22); }
      .cp-cta:active { transform: translateY(0); }
      .cp-cta:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
      .cp-cta:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; transform: none; }
      .cp-cta-secondary { background: transparent; color: var(--text-primary); border: 1.5px solid var(--text-primary); box-shadow: none; }
      .cp-linkbtn {
        background: none; border: none; cursor: pointer; font-family: inherit;
        font-size: 14px; font-weight: 700; color: var(--text-primary);
        text-decoration: underline; text-underline-offset: 4px; padding: 8px 4px;
      }
      .cp-linkbtn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
      .cp-linkbtn-muted { color: var(--text-muted); font-weight: 500; }

      /* ── hero ──
         06A.1 §15: compressed — the scatter + unfold + scan story now fills
         the scroll continuously, so the section earns less runway. */
      .cp-hero { position: relative; height: 280vh; }
      .cp-tight.cp-hero { height: 210vh; }
      .cp-pin {
        position: sticky; top: 0; height: 100vh; height: 100svh; overflow: clip;
        display: grid; place-items: center;
      }
      .cp-head {
        position: absolute; z-index: 5; text-align: center; padding: 0 22px;
        width: min(100%, 760px);
        top: 14vh;
      }
      /* the calm center (§21): a soft ground so the headline reads above
         the floating world without any blur or filter */
      .cp-head::before {
        content: ""; position: absolute; inset: -12% -18%; z-index: -1;
        background: radial-gradient(ellipse 62% 58% at 50% 46%, var(--bg-primary) 34%, transparent 78%);
        opacity: 0.92; pointer-events: none;
      }
      .cp-sub {
        font-size: clamp(15px, 1.5vw, 18px); line-height: 1.8; color: var(--text-secondary);
        max-width: 520px; margin: 16px auto 0;
      }
      .cp-cta-early { margin-top: 22px; font-size: 15px; padding: 13px 28px; }
      .cp-paper {
        position: relative; z-index: 3; width: min(46vh, 78vw);
        margin-top: 4vh;
      }
      .cp-tight .cp-paper { width: min(40vh, 74vw); }
      .cp-reveal {
        position: absolute; z-index: 6; inset-inline-end: clamp(20px, 9vw, 14%); text-align: center;
        max-width: 420px; padding: 0 18px;
      }
      .cp-tight .cp-reveal { inset-inline: 0; margin: 0 auto; top: 58vh; }
      .cp-reveal-label { font-size: clamp(16px, 1.6vw, 20px); font-weight: 700; margin: 0 0 4px; }
      .cp-score-line, .cp-score-big { display: flex; align-items: baseline; justify-content: center; gap: 6px; direction: ltr; }
      .cp-score-n, .cp-score-num {
        font-size: clamp(72px, 9vw, 128px); font-weight: 900; line-height: 1;
        letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
      }
      .cp-score-of, .cp-score-den { font-size: clamp(18px, 2vw, 26px); font-weight: 500; color: var(--text-muted); }
      .cp-demo-note { font-size: 12.5px; color: var(--text-muted); margin: 8px 0 16px; }
      .cp-trust {
        list-style: none; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 14px;
        margin: 16px 0 0; padding: 0; font-size: 12.5px; color: var(--text-secondary);
      }
      .cp-trust li::before { content: "·"; margin-inline-end: 6px; color: var(--text-muted); }
      .cp-hint {
        position: absolute; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        inset-inline: 0; text-align: center; font-size: 13px; color: var(--text-muted); margin: 0;
      }

      /* scan visuals live INSIDE the sheet */
      .cp-scan { position: absolute; inset: 0; z-index: 6; pointer-events: none; overflow: clip; border-radius: 3px; }
      .cp-scanline {
        position: absolute; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, rgba(20,149,255,0.85) 18%, rgba(20,149,255,0.85) 82%, transparent);
        box-shadow: 0 0 14px rgba(20,149,255,0.4);
      }
      .cp-scan-tag {
        position: absolute; top: 8px; inset-inline-end: 10px; font-size: 9px; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; color: rgba(20,110,200,0.85);
        border: 1px solid rgba(20,149,255,0.4); border-radius: 100px; padding: 3px 8px;
        background: rgba(255,255,255,0.8);
      }
      .cp-chip {
        position: absolute; z-index: 7; display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.95); border: 1px solid rgba(13,14,18,0.1);
        border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700;
        box-shadow: 0 6px 18px rgba(13,14,18,0.12); color: #0d0e12; white-space: nowrap;
      }
      .cp-chip-a { inset-inline-start: -24%; }
      .cp-chip-b { inset-inline-end: -22%; }
      .cp-tight .cp-chip-a { inset-inline-start: -10%; }
      .cp-tight .cp-chip-b { inset-inline-end: -8%; }
      .cp-chip-n { font-variant-numeric: tabular-nums; color: #146ec8; }

      /* still (reduced-motion / pre-mode) hero — same world, settled */
      .cp-hero-still {
        position: relative; height: auto; min-height: 92vh; overflow: clip;
        display: grid; place-items: center; padding: 120px 22px 60px;
      }
      .cp-hero-still .cp-still-wrap { position: relative; z-index: 5; }
      .cp-still-wrap {
        display: grid; grid-template-columns: 1fr; gap: 40px; max-width: 1060px; width: 100%;
        align-items: center;
      }
      @media (min-width: 900px) { .cp-still-wrap { grid-template-columns: 1.1fr 0.9fr; } }
      .cp-still-copy { text-align: start; }
      .cp-still-copy .cp-sub { margin: 14px 0 0; }
      .cp-still-copy .cp-score-line { justify-content: flex-start; margin-top: 18px; }
      .cp-still-copy .cp-cta { margin-top: 10px; }
      .cp-still-copy .cp-trust { justify-content: flex-start; }
      .cp-see { font-size: clamp(16px, 1.8vw, 20px); color: var(--text-secondary); margin: 14px 0 0; }
      .cp-still-sheet { max-width: 380px; width: 100%; margin: 0 auto; transform: rotate(-2deg); }

      /* ── returning banner ── */
      .cp-returning {
        position: relative; z-index: 8; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px;
        max-width: 860px; margin-inline: auto; margin-bottom: -60px; padding: 14px 20px;
        /* clears the fixed TopBar, same convention as .cp-product-head */
        margin-top: clamp(112px, 13vw, 150px);
        background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 14px;
        font-size: 14px;
      }
      .cp-returning-h { font-weight: 700; }
      .cp-returning-file { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
      .cp-returning-score { font-weight: 900; font-variant-numeric: tabular-nums; direction: ltr; }

      /* ── upload ── */
      .cp-upload-sec { padding: 6vh 20px 10vh; display: grid; place-items: center; }
      .cp-now-yours {
        font-size: clamp(20px, 2.6vw, 30px); font-weight: 900; letter-spacing: -0.01em;
        margin: 0 0 26px; text-align: center;
      }
      .cp-upload { width: 100%; max-width: 640px; }
      .cp-upload-sheet {
        position: relative; background: #fdfcf9; color: #17181d;
        border: 1px solid rgba(13,14,18,0.08); border-radius: 4px;
        padding: clamp(26px, 5vw, 52px);
        box-shadow: 0 2px 6px rgba(28,25,20,0.05), 0 24px 60px -24px rgba(28,25,20,0.22);
        transition: box-shadow 0.25s ease, transform 0.25s ease;
      }
      .cp-drag { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(28,25,20,0.08), 0 30px 70px -24px rgba(20,110,200,0.35); }
      .cp-upload-fold {
        position: absolute; top: 0; inset-inline-end: 0; width: 44px; aspect-ratio: 1;
        clip-path: polygon(100% 0, 100% 100%, 0 0);
        background: linear-gradient(225deg, #fff 0%, #e9e5da 46%, rgba(120,112,94,0.4) 60%, transparent 61%);
        pointer-events: none;
      }
      .cp-upload-formats { font-size: 13px; color: #6d6f76; margin: 4px 0 18px; }
      .cp-upload-promise { font-weight: 700; margin: 0 0 6px; }
      .cp-upload-points { margin: 0 0 24px; padding-inline-start: 20px; color: #43454c; line-height: 1.9; }
      .cp-cta-upload { width: 100%; text-align: center; }
      .cp-upload-drop { text-align: center; font-size: 13px; color: #8a8c93; margin: 10px 0 0; }
      .cp-demo-badge {
        margin: 18px 0 0; font-size: 12px; font-weight: 700; text-align: center;
        color: #7a5b12; background: #fdf3d8; border: 1px solid #f0dfae;
        border-radius: 100px; padding: 7px 14px;
      }
      .cp-beta { border: 1.5px dashed rgba(13,14,18,0.22); border-radius: 12px; padding: 18px 20px; }
      .cp-beta-title { font-weight: 900; margin: 0 0 6px; }
      .cp-beta-body { margin: 0; color: #56585f; font-size: 14px; line-height: 1.7; }
      .cp-privacy { margin-top: 26px; border-top: 1px dashed rgba(13,14,18,0.14); padding-top: 16px; font-size: 14px; }
      .cp-privacy summary { cursor: pointer; font-weight: 700; }
      .cp-privacy summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
      .cp-privacy-lede { color: #56585f; margin: 12px 0 6px; }
      .cp-privacy ul { margin: 6px 0 10px; padding-inline-start: 20px; color: #56585f; line-height: 1.8; }
      .cp-privacy-link { color: #146ec8; font-weight: 700; }
      .cp-fixture-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; justify-content: center; }
      .cp-fixture {
        font-family: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer;
        border: 1px solid var(--border-subtle); background: var(--bg-card);
        color: var(--text-secondary); border-radius: 100px; padding: 6px 12px;
      }
      .cp-fixture-on { background: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary); }

      /* ── product header ── */
      .cp-product-head {
        display: flex; align-items: center; gap: 10px; max-width: 760px;
        margin: 0 auto; font-size: 15px;
        /* clears the fixed TopBar (~92px) — same convention as /about, /blog */
        padding: clamp(112px, 13vw, 150px) 22px 0;
      }
      .cp-brand { color: var(--text-primary); font-weight: 900; text-decoration: none; }
      .cp-brand-sep { color: var(--text-muted); }
      .cp-brand-product { color: var(--text-secondary); font-weight: 700; letter-spacing: 0.04em; }
      .cp-head-new { margin-inline-start: auto; }

      /* ── processing ── */
      .cp-processing { max-width: 560px; margin: 0 auto; padding: 8vh 22px 16vh; text-align: center; }
      .cp-proc-doc { display: grid; place-items: center; margin-bottom: 34px; }
      .cp-proc-page {
        position: relative; width: min(240px, 60vw); aspect-ratio: 3 / 4; overflow: clip;
        background: #fdfcf9; border: 1px solid rgba(13,14,18,0.09); border-radius: 4px;
        box-shadow: 0 20px 50px -20px rgba(28,25,20,0.28); padding: 18px 16px;
        text-align: start;
      }
      .cp-proc-name {
        display: block; font-size: 11px; font-weight: 700; color: #43454c;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 14px;
      }
      .cp-proc-l { display: block; height: 7px; border-radius: 4px; background: #e8e4da; margin-bottom: 10px; }
      .cp-proc-l1 { width: 62%; } .cp-proc-l2 { width: 88%; } .cp-proc-l3 { width: 74%; }
      .cp-proc-l4 { width: 82%; } .cp-proc-l5 { width: 46%; }
      .cp-proc-sweep {
        position: absolute; inset-inline: 0; top: 0; height: 34%;
        background: linear-gradient(to bottom, transparent, rgba(20,149,255,0.10) 45%, rgba(20,149,255,0.22) 98%, rgba(20,149,255,0.7) 100%);
        animation: cp-sweep 2.6s cubic-bezier(0.45, 0, 0.4, 1) infinite;
      }
      @keyframes cp-sweep { 0% { transform: translateY(-40%); } 100% { transform: translateY(310%); } }
      @media (prefers-reduced-motion: reduce) { .cp-proc-sweep { animation: none; opacity: 0.4; transform: translateY(120%); } }
      .cp-stages { list-style: none; margin: 0 auto 26px; padding: 0; max-width: 340px; text-align: start; }
      .cp-stages li {
        display: flex; align-items: center; gap: 12px; padding: 8px 0;
        color: var(--text-muted); font-size: 15px; transition: color 0.4s ease;
      }
      .cp-stage-dot {
        width: 8px; height: 8px; border-radius: 50%; background: var(--border-subtle);
        flex-shrink: 0; transition: background 0.4s ease, box-shadow 0.4s ease;
      }
      .cp-stage-on { color: var(--text-primary); font-weight: 700; }
      .cp-stage-on .cp-stage-dot { background: #1495ff; box-shadow: 0 0 0 4px rgba(20,149,255,0.16); }
      .cp-stage-done { color: var(--text-secondary); }
      .cp-stage-done .cp-stage-dot { background: var(--text-secondary); }
      .cp-progress {
        position: relative; height: 3px; border-radius: 2px; background: var(--border-subtle);
        overflow: clip; max-width: 340px; margin: 0 auto;
      }
      .cp-progress-fill {
        position: absolute; inset-block: 0; inset-inline-start: 0; background: var(--text-primary);
        border-radius: 2px; transition: width 0.5s ease;
      }
      .cp-proc-hold { margin-top: 18px; font-size: 13.5px; color: var(--text-muted); }

      /* ── error ── */
      .cp-error { max-width: 480px; margin: 0 auto; padding: 12vh 22px 18vh; text-align: center; }
      .cp-error-mark {
        width: 52px; height: 52px; border-radius: 50%; border: 2px solid var(--text-primary);
        display: grid; place-items: center; font-size: 26px; font-weight: 900; margin: 0 auto 20px;
      }
      .cp-error-body { color: var(--text-secondary); line-height: 1.8; margin: 0 0 28px; }

      /* ── report ── */
      .cp-report { max-width: 720px; margin: 0 auto; padding: 5vh 22px 12vh; }
      .cp-sec { margin: 0 0 8vh; }
      .cp-sec-k {
        font-size: 12.5px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-muted); margin: 0 0 6px;
      }
      .cp-score-sec { text-align: center; padding-top: 4vh; }
      .cp-score-file { font-size: 13px; color: var(--text-muted); margin: 0 0 18px; }
      .cp-score-meta { opacity: 0; transform: translateY(10px); transition: opacity 0.7s ease, transform 0.7s ease; }
      .cp-score-meta.cp-in { opacity: 1; transform: none; }
      @media (prefers-reduced-motion: reduce) { .cp-score-meta { transition: none; } }
      .cp-score-band { font-size: clamp(16px, 2vw, 20px); font-weight: 700; margin: 14px auto 18px; max-width: 480px; line-height: 1.6; }
      .cp-scoreline { position: relative; height: 14px; max-width: 420px; margin: 0 auto 20px; direction: ltr; }
      .cp-scoreline-track { position: absolute; inset-inline: 0; top: 6px; height: 2px; background: var(--border-subtle); }
      .cp-scoreline-fill { position: absolute; inset-inline-start: 0; top: 6px; height: 2px; background: var(--text-primary); }
      .cp-scoreline-marker {
        position: absolute; top: 0; width: 2px; height: 14px; background: var(--text-primary);
        transform: translateX(-50%);
      }
      .cp-score-context { color: var(--text-secondary); font-size: 16px; line-height: 1.8; max-width: 460px; margin: 0 auto 10px; }
      .cp-score-confidence { font-size: 12.5px; color: var(--text-muted); margin: 0; }

      .cp-dims { list-style: none; margin: 18px 0 6px; padding: 0; }
      .cp-dim { padding: 14px 0; border-bottom: 1px dashed var(--border-subtle); }
      .cp-dim-row { display: flex; align-items: center; gap: 14px; }
      .cp-dim-name { font-weight: 700; font-size: 15px; flex: 0 0 auto; min-width: 34%; }
      .cp-dim-track { flex: 1; height: 2px; background: var(--border-subtle); position: relative; direction: ltr; }
      .cp-dim-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--text-primary); }
      .cp-dim-score { font-variant-numeric: tabular-nums; font-weight: 900; font-size: 15px; min-width: 2.2em; text-align: end; direction: ltr; }
      .cp-dim-summary { margin: 8px 0 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.7; text-align: start; }

      .cp-issues { list-style: none; margin: 18px 0 0; padding: 0; counter-reset: issue; }
      .cp-issue { border-bottom: 1px solid var(--border-subtle); }
      .cp-issue summary {
        display: flex; align-items: center; gap: 12px; padding: 16px 4px; cursor: pointer;
        font-size: 15px; list-style: none;
      }
      .cp-issue summary::-webkit-details-marker { display: none; }
      .cp-issue summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
      .cp-issue-n { font-size: 12px; font-weight: 900; color: var(--text-muted); font-variant-numeric: tabular-nums; }
      .cp-sev {
        font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
        border: 1px solid currentColor; border-radius: 100px; padding: 2px 9px;
      }
      .cp-sev-critical { color: #b4231f; } .cp-sev-high { color: #a05a00; }
      .cp-sev-medium { color: #5b5f66; } .cp-sev-low { color: #6b7280; }
      [data-theme="dark"] .cp-sev-critical { color: #ff8a86; }
      [data-theme="dark"] .cp-sev-high { color: #ffc46b; }
      .cp-issue-dim { font-weight: 700; }
      .cp-issue-body { margin: 0 0 18px; padding: 0 4px; color: var(--text-secondary); line-height: 1.85; font-size: 15px; text-align: start; }
      .cp-opps { list-style: none; margin: 18px 0 0; padding: 0; }
      .cp-opp { padding: 14px 4px; border-bottom: 1px solid var(--border-subtle); }
      .cp-opp-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }

      .cp-strengths { list-style: none; margin: 18px 0 0; padding: 0; }
      .cp-strength { display: flex; gap: 14px; padding: 14px 4px; border-bottom: 1px solid var(--border-subtle); }
      .cp-strength-mark {
        width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
        border: 1.5px solid var(--text-primary); display: grid; place-items: center;
        font-size: 13px; font-weight: 900;
      }
      .cp-strength .cp-issue-body { margin: 6px 0 0; }

      .cp-quickwin {
        position: relative; max-width: 460px; margin: 0 auto; padding: 26px 26px 22px;
        background: #fef9e7; color: #2a2417; border-radius: 2px;
        box-shadow: 0 14px 34px -14px rgba(28,25,20,0.3);
        transform: rotate(-1.2deg);
      }
      .cp-quickwin-pin {
        position: absolute; top: -9px; inset-inline-start: 50%; width: 14px; height: 14px;
        border-radius: 50%; background: #b4231f; transform: translateX(-50%);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .cp-quickwin-k { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: #8a6d1a; margin: 0 0 10px; }
      .cp-quickwin-action { font-size: 16.5px; font-weight: 700; line-height: 1.7; margin: 0 0 10px; }
      .cp-quickwin-why { font-size: 13.5px; color: #5d543a; line-height: 1.7; margin: 0; }

      .cp-rewrite { margin: 20px 0 10px; padding: 0; }
      .cp-rw-k { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
      .cp-rw-before {
        margin: 0 0 14px; padding: 14px 18px; border-inline-start: 3px solid #c9c4b8;
        color: var(--text-muted); text-decoration: line-through; text-decoration-color: rgba(180,35,31,0.5);
        text-decoration-thickness: 1.5px; line-height: 1.8; background: var(--bg-card); border-radius: 0 8px 8px 0;
      }
      .cp-ar .cp-rw-before { border-radius: 8px 0 0 8px; }
      .cp-rw-arrow { display: block; text-align: center; color: var(--text-muted); margin: 0 0 14px; }
      .cp-rw-after {
        margin: 0 0 12px; padding: 16px 18px; border-inline-start: 3px solid var(--text-primary);
        font-weight: 600; line-height: 1.8; background: var(--bg-card); border-radius: 0 8px 8px 0;
      }
      .cp-ar .cp-rw-after { border-radius: 8px 0 0 8px; }
      .cp-rw-note { font-size: 13px; color: var(--text-secondary); margin: 0; }

      .cp-full-found { font-weight: 700; margin: 16px 0 8px; }
      .cp-full-counts { list-style: none; margin: 0 0 26px; padding: 0; display: grid; gap: 8px; }
      .cp-full-counts li { font-size: 15px; color: var(--text-secondary); }
      .cp-full-n { font-size: 20px; font-weight: 900; color: var(--text-primary); font-variant-numeric: tabular-nums; margin-inline-end: 4px; }
      .cp-locked { list-style: none; margin: 0 0 22px; padding: 0; }
      .cp-locked-row {
        position: relative; display: flex; align-items: center; gap: 12px;
        padding: 14px 6px; border-bottom: 1px solid var(--border-subtle); overflow: clip;
      }
      .cp-lock { font-size: 13px; filter: grayscale(1); opacity: 0.75; }
      .cp-locked-title { font-weight: 700; font-size: 15px; color: var(--text-secondary); }
      .cp-locked-blur {
        flex: 1; height: 9px; border-radius: 5px; min-width: 60px;
        background: repeating-linear-gradient(90deg, var(--border-subtle) 0 26px, transparent 26px 34px);
        filter: blur(2.5px); opacity: 0.9;
      }
      .cp-full-what { color: var(--text-secondary); line-height: 1.8; margin: 0 0 22px; }
      .cp-cta-buy { width: 100%; text-align: center; }
      .cp-locked-note { text-align: center; font-size: 13px; color: var(--text-muted); margin: 12px 0 0; }

      .cp-auth-form { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
      .cp-auth-input {
        flex: 1; min-width: 220px; font-family: inherit; font-size: 15px;
        padding: 13px 18px; border-radius: 100px; border: 1.5px solid var(--border-subtle);
        background: var(--input-bg); color: var(--text-primary); min-height: 48px;
      }
      .cp-auth-input::placeholder { color: var(--input-placeholder); }
      .cp-auth-input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
      .cp-auth-hint { font-size: 13px; color: var(--text-muted); margin: 12px 0 0; }

      .cp-method-body { color: var(--text-secondary); line-height: 1.9; margin: 16px 0 14px; }
      .cp-method-ai {
        font-weight: 600; line-height: 1.9; margin: 0 0 14px; padding: 16px 20px;
        border-inline-start: 3px solid var(--text-primary); background: var(--bg-card); border-radius: 0 10px 10px 0;
      }
      .cp-ar .cp-method-ai { border-radius: 10px 0 0 10px; }
      .cp-method-by { font-size: 13.5px; color: var(--text-muted); margin: 0; }
      .cp-method-landing { max-width: 720px; margin: 0 auto; padding: 0 22px 14vh; }

      /* tablet: the reveal shares the frame with the sheet more carefully */
      @media (min-width: 700px) and (max-width: 1023px) {
        .cp-paper { width: min(44vh, 60vw); }
      }
      @media (max-width: 420px) {
        .cp-head { top: 12vh; }
        .cp-score-n, .cp-score-num { font-size: 64px; }
      }
    `}</style>
  );
}
