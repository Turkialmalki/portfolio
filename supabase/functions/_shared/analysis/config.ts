/**
 * CENTRALIZED MODEL/PIPELINE CONFIG (Command 05C §12).
 *
 * The single place a provider name, model id, timeout, or retry budget
 * is written down. `anthropicProvider.ts` (and any future adapter) reads
 * from here — nothing scatters a model string through the analysis
 * functions themselves. Timeouts/retries stay defined once, in
 * `instrumentation.ts` (`DEFAULT_TIMEOUTS`, pre-dating this file); this
 * module re-exports them alongside the provider/model choice so callers
 * have one import for "how does an analysis run behave."
 *
 * Changing the model or timeout is a one-line edit here, not a grep
 * across the pipeline.
 */
import { DEFAULT_TIMEOUTS } from "./instrumentation.ts";

export const CAREER_AI_CONFIG = {
  /** Selected only when AI_PROVIDER_API_KEY is set — see provider.ts. */
  provider: "anthropic" as const,
  model: "claude-sonnet-5",
  /** Anthropic Messages API version header (not a package version). */
  apiVersion: "2023-06-01",
  /**
   * Per-call token ceiling for a dimension-analysis or rewrite response.
   * Bumped 4096 → 8192 after a REAL production CV (Career V2 email-test
   * verification, first live customer analysis after launch) hit this
   * ceiling on the 13-dimension compact-schema call: both the initial
   * call and the one repair retry produced stop_reason "max_tokens" mid
   * tool-call, which yields no usable `results` at all (anthropicProvider.ts
   * falls back to `[]` rather than trusting a truncated array) — 13/13
   * "missing dimension result" schema issues, deterministically on both
   * tries (thinking disabled + no temperature ⇒ near-identical output
   * length each call). The compact schema (Command 05D.2 §3) fixed the
   * OLD verbose contract's truncation at this same 4096 ceiling for
   * SYNTHETIC fixtures; it was never verified against a real, longer
   * production CV's actual evidence-excerpt/shortReason lengths, which is
   * exactly the gap fixture/mock-provider tests can't catch (they never
   * call the real API — see mockProvider.ts's header). 8192 gives ~2x
   * headroom for the same 13-item compact array; see safeLog.ts's
   * `stop_reason` field for how a future recurrence gets diagnosed
   * without needing to guess again.
   */
  maxOutputTokens: 8192,
  /**
   * NOT sent as a request parameter (Command 05C §2 fix). `claude-sonnet-5`
   * rejects any non-default `temperature`/`top_p`/`top_k` with a 400 — this
   * field records the deterministic-leaning INTENT
   * (analyzeDimensions/generateRewrite are structured-extraction tasks, not
   * creative writing) for anyone reading this config, but anthropicProvider.ts
   * must never put it on the wire. Determinism is steered by disabling
   * thinking + the forced tool_choice instead — see anthropicProvider.ts.
   */
  temperature: 0.2,
  /** Per-provider-call budget (§35) — reused from instrumentation.ts so there is exactly one number. */
  analysisTimeoutMs: DEFAULT_TIMEOUTS.providerCallMs,
  /** Pipeline retries its own single repair attempt (pipeline.ts §29) by calling the provider again with the same input — the adapter itself does not loop. */
  maxRepairAttempts: DEFAULT_TIMEOUTS.maxSchemaRepairRetries,
  /** Bumped whenever the provider adapter, prompt shape, or output contract changes — logged in instrumentation so a run's behavior is traceable to a version, not just a model string. */
  pipelineVersion: "career-ai-pipeline-v1",
} as const;
