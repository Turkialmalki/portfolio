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
  /** Per-provider-call budget. A mock provider never approaches this; a real adapter must respect it. */
  providerCallMs: 20_000,
  /** Whole-analysis budget across every stage (§35). */
  overallAnalysisMs: 45_000,
  maxRetries: 1,
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
