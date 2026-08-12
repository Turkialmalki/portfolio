/**
 * COST / TOKEN / TIMING INSTRUMENTATION (Command 05 §34–§35).
 *
 * Only counts and identifiers — never raw CV content, never a prompt or
 * AI response body. `safeLog.ts`'s allowlist discipline applies here too:
 * this module produces a `SafeLogFields`-shaped record, not a free-form
 * blob.
 */
import type { AnalysisInstrumentation } from "./types.ts";

export const DEFAULT_TIMEOUTS = {
  /**
   * Per-provider-call budget. Command 05D.3's 11-fixture real-provider
   * suite measured latency of median 16.5s / P75 17.5s / max 20.5s for the
   * compact single dimension-analysis call at the OLD 4096-token ceiling
   * — the old 20_000ms budget left near-zero headroom above that observed
   * max, so it was raised to 45s (Command 06A.5 §13).
   *
   * Raised again, 45s → 90s, right after that: Career V2's first real
   * production CV hit truncation (`maxOutputTokens` 4096→8192 fix, see
   * config.ts's note), and the very next real CV then hit THIS timeout at
   * the new 8192 ceiling (duration_ms 47164, i.e. cut off right at 45s) —
   * a real call generating up toward 8192 tokens needs measurably longer
   * than the calibration above assumed. From case 1's data (two calls
   * both truncated at exactly 4096 tokens in ~25s each), real generation
   * runs roughly ~160 tokens/sec, so an 8192-token call can legitimately
   * need ~50s+ to finish — 45s was racing that, not covering it. 90s
   * gives real headroom above the ~50s estimate.
   */
  providerCallMs: 90_000,
  /**
   * Whole-analysis budget across every stage (§35): validation + parse +
   * structure + retrieval + the provider call above + one possible repair
   * retry + scoring/findings. NOT sized to 2×providerCallMs (a timed-out
   * call throws immediately via `withTimeout` and is never retried — only
   * a call that RETURNS but fails schema validation gets the one repair
   * retry — so the realistic worst case is one slow call plus one
   * ordinary-speed retry, not two full-budget calls back to back).
   * Deliberately kept below Supabase Edge Functions' platform-level 150s
   * request-idle ceiling (supabase.com/docs/guides/functions/limits) so
   * THIS timeout — a clean ANALYSIS_TIMEOUT the customer's UI already
   * handles — fires before the platform kills the request with a raw,
   * unhandled 504.
   */
  overallAnalysisMs: 130_000,
  /**
   * Now wired up in anthropicClient.ts's `callAnthropic` — retries a 529
   * (overloaded) / 429 (rate limited) response this many times with short
   * backoff before giving up. Raised from 1 to 2 (Command 06A.5's first
   * real production CV hit 529 twice in a row live) — still comfortably
   * inside providerCallMs (90s) alongside the backoff delays and a real
   * ~50s+ call at the current 8192-token ceiling.
   */
  maxRetries: 2,
  maxSchemaRepairRetries: 1,
} as const;

export function newInstrumentation(inputCharCount: number, provider: string, model: string): AnalysisInstrumentation {
  return {
    inputCharCount,
    examplesRetrieved: 0,
    aiCallCount: 0,
    retryCount: 0,
    durationMs: 0,
    provider,
    model,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    stopReason: null,
    currentOperation: "init",
    languageFallbackCount: 0,
  };
}

/** Runs an async operation with a hard timeout, converting a hang into a typed rejection rather than letting a caller wait forever (§35). */
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(onTimeoutMessage)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
