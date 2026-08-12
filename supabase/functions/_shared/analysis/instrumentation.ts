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
   * compact single dimension-analysis call — the old 20_000ms budget left
   * near-zero headroom above the observed max (one fixture reached
   * ~20.5s, i.e. already past a 20s ceiling). Raised to 45s (Command
   * 06A.5 §13) so a normal real call has real headroom instead of racing
   * its own measured worst case; still far short of a "multi-minute
   * synchronous timeout".
   */
  providerCallMs: 45_000,
  /**
   * Whole-analysis budget across every stage (§35): validation + parse +
   * structure + retrieval + the provider call above + one possible repair
   * retry + scoring/findings. Sized to comfortably contain
   * providerCallMs even if a repair retry fires (two calls), while still
   * being a bounded synchronous request, not an open-ended one.
   */
  overallAnalysisMs: 60_000,
  /**
   * Now wired up in anthropicClient.ts's `callAnthropic` — retries a 529
   * (overloaded) / 429 (rate limited) response this many times with short
   * backoff before giving up. Raised from 1 to 2 (Command 06A.5's first
   * real production CV hit 529 twice in a row live) — still comfortably
   * inside providerCallMs (45s) alongside the backoff delays and a real
   * ~16-20s call.
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
