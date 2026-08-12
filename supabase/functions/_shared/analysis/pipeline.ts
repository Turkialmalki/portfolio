/**
 * THE ANALYSIS PIPELINE (Command 05 §8) — orchestration only.
 *
 * CV TEXT + USER CONTEXT + career_methodology_v1 + RELEVANT APPROVED
 * KNOWLEDGE + AI REASONING → VALIDATED DIMENSION EVALUATIONS →
 * DETERMINISTIC SCORING ENGINE → CareerAnalysis.
 *
 * Stages (Command 05D.2 §17 removed the old "exactly two AI calls"
 * constraint — correctness and free-result latency matter more than a
 * fixed call count, per that command's explicit product-architecture
 * rule):
 *
 *   A. Structure           — deterministic (structure.ts). No AI call.
 *   B+C. Rubric evaluation — `provider.analyzeDimensions()` calls, split
 *        into small PARALLEL batches (MAX_DIMENSIONS_PER_BATCH below)
 *        rather than one call covering every dimension at once — a real
 *        production CV hit `stop_reason: "max_tokens"` on a single
 *        13-dimension call, identically on its full retry (see that
 *        constant's own comment). Together the batches still cover
 *        every dimension `scoring.ts` will actually weight for this
 *        context (universal + contextual — `planWeights` has already
 *        excluded what doesn't apply), using the COMPACT runtime
 *        methodology (compileRuntimeMethodology — Command 05D.2 §6,
 *        now compiled per batch) and the compact per-dimension contract
 *        (analysis/types.ts's `DimensionAIResult`). A validation failure
 *        triggers ONE TARGETED repair — only the dimensions still
 *        missing/invalid, batched the same way, never the full set
 *        again. Strengths, issues, quick wins, and the action plan are
 *        NOT separate AI calls at all — findings.ts derives them
 *        deterministically from the already-validated dimension results
 *        (§21–§26 rules), which is both cheaper and keeps "why is this
 *        a critical issue" traceable to code.
 *   E. Schema validation    — schemaValidation.ts + evidenceValidation.ts.
 *   F. Deterministic scoring — scoring.ts (the ONLY source of overallScore).
 *
 * Rewrite generation is DELIBERATELY NOT a stage of `runAnalysis()`
 * anymore (Command 05D.2 §17) — see `generateRewriteForCandidate()` at
 * the bottom of this file. The free result (score + dimensions + issues +
 * strengths + quick win) is complete and returned without it; a caller
 * generates the rewrite separately, after the score is already visible.
 *
 * Real customer mode is refused twice, independently: here (defense in
 * depth) and again in the Edge Function (§2, §40) — so a bug in either
 * layer alone cannot open the gate.
 */
import {
  CAREER_METHODOLOGY_VERSION,
  aggregateConfidence,
  bandForScore,
  buildActionPlan,
  compileRuntimeMethodology,
  computeOverallScore,
  planWeights,
  rubricFor,
  rubricScoreFor,
  type AnalysisContext,
  type CareerAnalysis,
  type CvLanguage,
  type DimensionId,
  type DimensionResult,
  type KeywordFinding,
  type TargetRoleAnalysis,
} from "../methodology/index.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../releaseGates.ts";
import { OPERATOR_CV_INGESTION_VERSION } from "../knowledge/version.ts";
import type { RetrievalExample } from "../knowledge/types.ts";
import { ANALYSIS_PIPELINE_VERSION } from "./version.ts";
import { preprocessResumeText } from "./preprocess.ts";
import { redactContactFields } from "./redact.ts";
import { extractNormalizedResume } from "./structure.ts";
import { computeAtsCompatibility } from "./atsCompatibility.ts";
import { buildAndRunRetrieval } from "./retrievalContext.ts";
import { validateDimensionAIResults } from "./schemaValidation.ts";
import { verifyDimensionEvidence } from "./evidenceValidation.ts";
import { detectMetricConflicts, enforceRewriteFactPreservation } from "./factCheck.ts";
import { buildFindings } from "./findings.ts";
import { sanitizeDimensionReason, validateReportLanguage } from "./languageValidator.ts";
import { DEFAULT_TIMEOUTS, newInstrumentation, withTimeout } from "./instrumentation.ts";
import type { AnalyzeResumeRequest, AnalysisRunOptions, AnalysisRunResult, AnalysisInstrumentation, CareerAIProvider, NormalizedResume } from "./types.ts";
import { AnalysisPipelineError } from "./types.ts";
import { AnthropicProviderError } from "./anthropicClient.ts";

/**
 * Pulls the just-completed call's token usage AND stop_reason (real
 * provider only) into `instrumentation` — see CareerAIProvider.lastCallUsage.
 * `stopReason` is overwritten with each call (not accumulated — it
 * describes the MOST RECENT call only, matching the interface doc), so
 * after a repair retry it reflects the retry's own stop reason, not the
 * first attempt's.
 */
function accumulateUsage(instrumentation: AnalysisInstrumentation, provider: CareerAIProvider): void {
  const usage = provider.lastCallUsage?.();
  if (!usage) return;
  instrumentation.totalInputTokens += usage.inputTokens;
  instrumentation.totalOutputTokens += usage.outputTokens;
  instrumentation.stopReason = usage.stopReason;
}

/**
 * A real production CV (Career V2, longer/more senior than the synthetic
 * fixtures ever exercised) hit `stop_reason: "max_tokens"` on BOTH the
 * primary call and its one full retry, identically — `results: []`
 * both times, 13/13 dimensions missing. `thinking: disabled` + no
 * temperature (anthropicProvider.ts) makes decoding near-deterministic,
 * so retrying the SAME oversized 13-dimension request just fails the
 * same way twice; the only two prior fixes (maxOutputTokens 4096→8192)
 * bought headroom for the fixtures but not for every real CV, and
 * simply raising it again just chases whatever a longer CV needs next
 * while eating into providerCallMs/overallAnalysisMs's own budget.
 *
 * Real fix: split `dimensionIds` into smaller batches and call the
 * provider for each IN PARALLEL. Each batch needs proportionally less
 * output — far below any max_tokens ceiling regardless of how verbose a
 * given CV's evidence/reasoning turns out to be — and running them
 * concurrently keeps total wall-clock close to the slowest SINGLE batch,
 * not the sum, so this is not a "trade truncation risk for latency"
 * compromise. 6 was chosen to comfortably halve (or better) the typical
 * 13-15 dimension request while keeping the number of parallel calls
 * (and therefore duplicated system-prompt/resume-context input cost)
 * small.
 */
export const MAX_DIMENSIONS_PER_BATCH = 6;

function splitIntoBatches<T>(items: readonly T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));
  return batches;
}

/**
 * ONE batch's provider call, usage accounting included. Usage is read
 * from `provider.lastCallUsage()` synchronously, immediately after THIS
 * call's own `await` resolves, inside this same function — that's what
 * keeps it race-free even when several `callBatch` invocations are
 * in flight together under `Promise.all` below: `lastUsage` is a single
 * closure-scoped variable another concurrent call could overwrite, but
 * only ACROSS an `await` boundary, never in the middle of a synchronous
 * span (JS microtask semantics), and there is no `await` between this
 * call's own assignment and this function's own synchronous read of it.
 */
async function callBatch(
  provider: CareerAIProvider,
  batchIds: DimensionId[],
  normalized: NormalizedResume,
  context: AnalysisContext,
  examples: RetrievalExample[],
  instrumentation: AnalysisInstrumentation,
  timeoutMessage: string,
): Promise<unknown[]> {
  const methodologySections = compileRuntimeMethodology(context, batchIds);
  const raw = await withTimeout(
    provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds: batchIds, methodologySections, examples }),
    DEFAULT_TIMEOUTS.providerCallMs,
    timeoutMessage,
  );
  instrumentation.aiCallCount += 1;
  accumulateUsage(instrumentation, provider);
  return Array.isArray(raw) ? raw : [];
}

function buildContext(request: AnalyzeResumeRequest, industry: string | undefined): AnalysisContext {
  return {
    seniority: request.seniority,
    language: request.language as CvLanguage,
    // The customer's UI language, not the CV's own — falls back to the
    // CV's language (narrowed to ar/en) only for older callers that never
    // send one (fixtures, tests, admin-mode runs).
    outputLanguage: request.outputLanguage ?? (request.language === "ar" ? "ar" : "en"),
    targetRole: request.targetRole,
    jobDescription: request.jobDescription,
    industry,
  };
}

/**
 * §18–§19: only when a job description exists do we tier keywords and
 * classify matches. No JD → no keyword findings at all (never a zero-fill
 * penalty). No target role → no target-role analysis at all.
 */
const NO_TARGET_ROLE_DIMENSION_RESULT_TEXT: Record<"ar" | "en", string> = {
  en: "The resume currently demonstrates some, but not conclusive, alignment with the stated target role.",
  ar: "سيرتك تُظهر حالياً بعض التوافق مع الوظيفة المستهدفة، لكن ليس بشكل قاطع.",
};

function buildTargetRoleAnalysis(
  request: AnalyzeResumeRequest,
  normalized: NormalizedResume,
  targetRoleResult: DimensionResult | undefined,
  outputLanguage: "ar" | "en",
): TargetRoleAnalysis | undefined {
  if (!request.targetRole) return undefined;

  let keywordFindings: KeywordFinding[] = [];
  const gaps: string[] = [];
  if (request.jobDescription) {
    const jdTerms = Array.from(new Set(request.jobDescription.toLowerCase().match(/[a-z][a-z+.#]{2,}/g) ?? [])).slice(0, 20);
    const resumeText = normalized.rawTextReference.toLowerCase();
    keywordFindings = jdTerms.map((term) => {
      const demonstrated = normalized.experience.some((e) => e.bullets.some((b) => b.toLowerCase().includes(term)));
      const listedOnly = !demonstrated && resumeText.includes(term);
      return {
        keyword: term,
        tier: "core" as const,
        match: demonstrated ? "strong_match" : listedOnly ? "partial_match" : "not_demonstrated",
        evidence: [],
      };
    });
    for (const f of keywordFindings) {
      // Bilingual template around the keyword itself — the keyword/term
      // is taken verbatim from the job description (could be in either
      // language) and is never translated, only the surrounding phrase.
      if (f.match === "not_demonstrated") {
        gaps.push(outputLanguage === "ar" ? `"${f.keyword}" غير موثّق في أي نقطة من سيرتك` : `${f.keyword} not demonstrated in any bullet`);
      }
    }
  }

  return {
    targetRole: request.targetRole,
    hasJobDescription: !!request.jobDescription,
    positioningVerdict: targetRoleResult?.reason ?? NO_TARGET_ROLE_DIMENSION_RESULT_TEXT[outputLanguage],
    keywordFindings,
    gaps,
  };
}

export async function runAnalysis(request: AnalyzeResumeRequest, opts: AnalysisRunOptions): Promise<AnalysisRunResult> {
  // §2, §40: defense-in-depth release gate, independent of the Edge Function's own check.
  if (!opts.isFixtureRun && !PRIVACY_SECURITY_EXECUTION_VERIFIED) {
    throw new AnalysisPipelineError(
      "ANALYSIS_FAILED",
      "release gate: real customer analysis is blocked until privacy/RLS tests A–H/K are executed (see releaseGates.ts)",
      { stage: "release_gate" },
    );
  }

  const start = Date.now();
  const instrumentation = newInstrumentation(request.resumeText.length, opts.provider.name, opts.provider.model);

  try {
    return await withTimeout(
      runStages(request, opts, instrumentation, start),
      DEFAULT_TIMEOUTS.overallAnalysisMs,
      "analysis exceeded its overall time budget",
    );
  } catch (err) {
    if (err instanceof AnalysisPipelineError) throw err;
    // CONFIRMED production bug (real-provider smoke test, post the
    // instrumentation above): an `AnthropicProviderError` (thrown by
    // anthropicClient.ts's `callAnthropic` on a non-2xx response, WITH
    // its own rich diagnostics — providerHttpStatus/providerErrorType/
    // providerRequestId/providerErrorMessageSanitized) is a DIFFERENT
    // class from `AnalysisPipelineError` above, so it fell through this
    // catch's generic fallback below — silently downgraded to a bare
    // `stage: "unexpected_error"` with none of those diagnostics
    // attached, even though analyze-resume/index.ts's own catch block
    // has always had correct, complete handling for exactly this error
    // type (`buildProviderDiagnosticBody`) — it just never got the
    // chance to run, because this function re-wrapped the error first.
    // Re-throwing AS-IS (same pattern as the AnalysisPipelineError check
    // above) lets that existing handling actually see it.
    if (err instanceof AnthropicProviderError) throw err;
    // A bare `withTimeout` rejection (never an AnalysisPipelineError
    // itself — that's caught above) — one of the THREE distinct timeout
    // sites in this file, distinguished only by their fixed messages
    // (never guessed from a stack trace): the overall budget here, or
    // one of runStages's own per-call budgets (message text set at each
    // `withTimeout` call site below). `stage` records which, so "which
    // timeout was it" never needs re-deriving from raw duration_ms again
    // the way this exact ambiguity had to be reasoned through by hand
    // for a real production incident (Career V2 email-test verification).
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = message.includes("time budget") || message.includes("timed out");
    const stage = message.includes("overall time budget")
      ? "overall_timeout"
      : message.includes("retry")
        ? "repair_provider_call"
        : message.includes("dimension analysis")
          ? "primary_provider_call"
          : "unexpected_error";
    // A production incident (Career V2 email-test verification) hit this
    // exact fallback with NOTHING further to go on: `stage:
    // "unexpected_error"`, no stop_reason, no schema data, no provider
    // telemetry, at only 621ms. Most likely candidate, closed separately
    // in anthropicClient.ts: `fetch()` itself failing (DNS/connection/
    // TLS) was previously uncaught there and propagated as a plain
    // exception all the way here. `operation`/`errorType` below are the
    // general-purpose version of that fix — captured for ANY unforeseen
    // exception, not just that one, so a future occurrence never again
    // arrives this bare. `errorType` is the constructor NAME only (e.g.
    // "TypeError") — never `.message`, which could echo request/response
    // content this module has no way to pre-verify as safe.
    throw new AnalysisPipelineError(timedOut ? "ANALYSIS_TIMEOUT" : "ANALYSIS_FAILED", message, {
      stage,
      operation: instrumentation.currentOperation,
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    });
  }
}

async function runStages(
  request: AnalyzeResumeRequest,
  opts: AnalysisRunOptions,
  instrumentation: ReturnType<typeof newInstrumentation>,
  start: number,
): Promise<AnalysisRunResult> {
  // Stage A: deterministic structure extraction.
  instrumentation.currentOperation = "preprocessing";
  const preprocessed = preprocessResumeText(request.resumeText);
  const redaction = redactContactFields(preprocessed);
  const normalized = extractNormalizedResume(redaction.redactedText);

  // Retrieval + context assembly (roleFamily detection informs both the
  // industry-fallback context and the retrieval call).
  instrumentation.currentOperation = "retrieval";
  const retrieval = buildAndRunRetrieval(normalized, buildContext(request, request.industry), request.roleFamily, undefined, opts.knowledgeMode);
  instrumentation.examplesRetrieved = retrieval.examples.length;
  const context = buildContext(request, request.industry);

  const plan = planWeights(context);
  const dimensionIds = plan.included.map((w) => w.dimension);

  // Stage B+C: the dimension-evaluation call, split into small PARALLEL
  // batches (MAX_DIMENSIONS_PER_BATCH — see its own comment for the real
  // production incident this replaces a single giant call for) instead
  // of one request covering all 13-15 dimensions at once.
  // compileRuntimeMethodology (Command 05D.2 §6) is now called per batch
  // inside callBatch, scoped to just that batch's dimensions — smaller
  // than the old whole-set call on top of the output-size win.
  instrumentation.currentOperation = "primary_provider_call";
  const primaryBatches = splitIntoBatches(dimensionIds, MAX_DIMENSIONS_PER_BATCH);
  const primaryBatchResults = await Promise.all(
    primaryBatches.map((batchIds) =>
      callBatch(opts.provider, batchIds, normalized, context, retrieval.examples, instrumentation, "provider timed out during dimension analysis"),
    ),
  );
  let aiRaw: unknown[] = primaryBatchResults.flat();
  instrumentation.currentOperation = "primary_schema_validation";
  let validation = validateDimensionAIResults(aiRaw, dimensionIds);
  if (!validation.ok) {
    instrumentation.retryCount += 1;
    // TARGETED repair — only the dimensions still missing/invalid, never
    // the full set again. A production incident showed a full-set retry
    // reproducing the exact same max_tokens truncation identically
    // (thinking disabled + no temperature ⇒ near-deterministic decoding
    // on the same oversized ask) — pointless and wasteful. Batching
    // already makes this the rare path (Command 05D.2 §21: a system
    // that routinely needs repair isn't production-ready); this makes
    // the rare case cheap too.
    const satisfiedIds = new Set(validation.partial.map((r) => r.dimensionId));
    const missingIds = dimensionIds.filter((id) => !satisfiedIds.has(id));
    instrumentation.currentOperation = "repair_provider_call";
    const repairBatches = splitIntoBatches(missingIds, MAX_DIMENSIONS_PER_BATCH);
    const repairBatchResults = await Promise.all(
      repairBatches.map((batchIds) =>
        callBatch(opts.provider, batchIds, normalized, context, retrieval.examples, instrumentation, "provider timed out during dimension analysis retry"),
      ),
    );
    aiRaw = [...validation.partial, ...repairBatchResults.flat()];
    instrumentation.currentOperation = "repair_schema_validation";
    validation = validateDimensionAIResults(aiRaw, dimensionIds);
    if (!validation.ok) {
      throw new AnalysisPipelineError(
        "ANALYSIS_FAILED",
        "AI output failed schema validation after one targeted repair retry",
        {
          issues: validation.issues,
          stopReason: instrumentation.stopReason,
          stage: "repair_schema_validation",
          providerAttempts: instrumentation.aiCallCount,
          schemaRepairCount: instrumentation.retryCount,
          dimensionSummary: validation.summary,
        },
      );
    }
  }

  // Stage E: evidence verification (§11), then expand the compact AI
  // result into the full DimensionResult shape scoring.ts/findings.ts
  // already consume unchanged. `recommendations` is always [] here —
  // findings.ts (buildIssues) falls back to
  // rubricFor(dimension).recommendationRules[0] deterministically, which
  // is exactly the "derive from code, not another AI call" behavior
  // Command 05D.2 §14 asks for.
  //
  // Career V2 Part 4: `score` is no longer read off the AI result — the
  // model returned a classification (signalLevel + evidenceQuality), and
  // `rubricScoreFor` (the ONLY place this happens) turns that into the
  // fixed number. evidenceValidation.ts's verification below can flip
  // `evidencePresent`/`evidenceQuality` down to reflect an evidence quote
  // that failed to verify, so scoring MUST read the verified result, not
  // the raw AI one.
  instrumentation.currentOperation = "evidence_verification";
  const outputLanguageForVerification = context.outputLanguage ?? (context.language === "ar" ? "ar" : "en");
  const verifiedResults: DimensionResult[] = validation.value.map((r) => {
    const { result } = verifyDimensionEvidence(r, normalized.rawTextReference, outputLanguageForVerification);
    // Non-fatal language fallback, applied at the SOURCE (real production
    // incident: an otherwise-valid, structurally-sound analysis was
    // failing outright over English prose in this one AI-authored field
    // — see languageValidator.ts's header). `dimensions.*.reason`,
    // `issues.*.summary`, and `atsAnalysis.*.detail` are all literally
    // this same string downstream, so sanitizing it once here covers all
    // three without a second AI call — there is no "language repair"
    // call anywhere in this codebase.
    const { text: sanitizedReason, fellBack } = sanitizeDimensionReason(result.shortReason, rubricFor(result.dimensionId).titleAr, outputLanguageForVerification);
    if (fellBack) instrumentation.languageFallbackCount += 1;
    return {
      dimension: result.dimensionId,
      score: rubricScoreFor(result.signalLevel, result.evidencePresent, result.evidenceQuality),
      confidence: result.confidence,
      evidence: result.evidence ? [{ section: result.evidence.section, text: result.evidence.excerpt }] : [],
      reason: sanitizedReason,
      recommendations: [],
    };
  });

  // Stage F: deterministic scoring — the ONLY source of overallScore (§9).
  instrumentation.currentOperation = "scoring";
  const overall = computeOverallScore(verifiedResults, context);
  const confidence = aggregateConfidence(verifiedResults, overall.weightPlan);
  const scoreBand = bandForScore(overall.overallScore);

  // §13 metric-conflict protection.
  const factConflicts = detectMetricConflicts(normalized.rawTextReference);

  // §21–§26 deterministic findings.
  instrumentation.currentOperation = "findings";
  const { issues, strengths, quickWins, missingEvidenceQuestions, atsAnalysis } = buildFindings(verifiedResults, context, factConflicts);
  const actionPlan = buildActionPlan(issues);

  // Career V2 Part 5: deterministic ATS Compatibility — code-only, reuses
  // the same `normalized`/`redaction` this stage already computed. Never
  // mixed into overallScore; a standalone field on CareerAnalysis.
  const atsCompatibility = computeAtsCompatibility(normalized, redaction);

  // Command 05D.2 §17: rewrite generation has LEFT the free critical path.
  // The free result (score, dimensions, issues, strengths, quick win) is
  // now complete without it. `rewriteExamples` is always [] from this
  // call — see `generateRewriteForCandidate()` below for the separate,
  // deferred call a caller makes AFTER the free result is already
  // delivered (own TIME_TO_REWRITE measurement, own optional failure that
  // never blocks the score the user is already looking at).
  const rewriteExamples: CareerAnalysis["rewriteExamples"] = [];

  const targetRoleResult = verifiedResults.find((r) => r.dimension === "target_role_alignment");
  const targetRoleAnalysis = buildTargetRoleAnalysis(request, normalized, targetRoleResult, context.outputLanguage ?? (context.language === "ar" ? "ar" : "en"));

  instrumentation.currentOperation = "result_build";
  const analysis: CareerAnalysis = {
    methodologyVersion: CAREER_METHODOLOGY_VERSION,
    overallScore: overall.overallScore,
    scoreBand: { min: scoreBand.min, labelEn: scoreBand.labelEn, labelAr: scoreBand.labelAr },
    confidence,
    context,
    dimensions: verifiedResults,
    excludedDimensions: overall.weightPlan.excluded,
    strengths,
    issues,
    quickWins,
    missingEvidenceQuestions,
    rewriteExamples,
    targetRoleAnalysis,
    atsAnalysis,
    atsCompatibility,
    actionPlan,
    metadata: { analyzedAt: new Date().toISOString(), capsApplied: overall.capsApplied },
  };

  // Career V2 Part 9, NON-FATAL as of a real production incident: a
  // structurally-valid, fully-scored analysis was failing outright
  // (ANALYSIS_FAILED) over English prose in a handful of fields — real
  // customer scoring/ATS/evidence work discarded over presentation
  // style, not an analysis-integrity problem. `sanitizeDimensionReason`
  // above already substitutes deterministic Arabic text at the SOURCE
  // for the one genuinely AI-authored field this can affect, so by the
  // time this runs, a leak here should be rare — this stays as
  // telemetry-only defense-in-depth (never a second AI call, never a
  // thrown error): count it, log it, still return the real analysis.
  // Proper nouns/currency figures are allow-listed (languageValidator.ts).
  //
  // Skipped for the mock provider on purpose: mockProvider.ts's own header
  // comment documents it as heuristics that exercise the pipeline, never a
  // simulation of real model output, and its shortReason strings are not
  // localized to outputLanguage by design — running this gate against it
  // would flag every Arabic fixture for a property the mock never claims
  // to have. The real Anthropic provider IS instructed (SYSTEM_PROMPT) to
  // write shortReason in outputLanguage, so this gate is meaningful there.
  if (opts.provider.name !== "mock") {
    instrumentation.currentOperation = "language_validation";
    const languageCheck = validateReportLanguage(analysis);
    if (!languageCheck.ok) {
      instrumentation.languageFallbackCount += languageCheck.leaks.length;
    }
  }

  instrumentation.durationMs = Date.now() - start;

  return {
    analysis,
    engineMetadata: {
      methodologyVersion: CAREER_METHODOLOGY_VERSION,
      analysisPipelineVersion: ANALYSIS_PIPELINE_VERSION,
      knowledgeVersion: OPERATOR_CV_INGESTION_VERSION,
      provider: opts.provider.name,
      model: opts.provider.model,
      retrievedExampleIds: retrieval.debug.retrievedIds,
      timestamp: new Date().toISOString(),
    },
    instrumentation,
    factConflicts,
  };
}

const REWRITE_CANDIDATE_RE = /^(was responsible for|responsible for|worked on|helped with|participated in)/i;

/** Finds the same weak-verb-opener bullet the old inline rewrite step looked for — used by callers of `generateRewriteForCandidate` below. */
export function findRewriteCandidateBullet(normalized: NormalizedResume): string | null {
  return normalized.experience.flatMap((e) => e.bullets).find((b) => REWRITE_CANDIDATE_RE.test(b.trim())) ?? null;
}

/**
 * Command 05D.2 §17–§18: the rewrite call, deliberately OUTSIDE
 * `runAnalysis()`. A caller invokes this AFTER the free result is already
 * returned to the user — e.g. to show "Generating your example…" once the
 * score is already visible. Own timeout, own TIME_TO_REWRITE measurement
 * (the caller times this call itself), own failure mode that never
 * blocks or retries the score.
 */
export async function generateRewriteForCandidate(
  candidateBullet: string,
  context: AnalysisContext,
  normalized: NormalizedResume,
  provider: CareerAIProvider,
): Promise<CareerAnalysis["rewriteExamples"][number] | null> {
  const raw = await withTimeout(
    // `normalized` is part of the typed input for callers that need it
    // (e.g. fact-checking against the full document later), but
    // anthropicProvider.ts's buildRewritePrompt only puts
    // `candidateBullet` + context on the wire (§18) — the full resume is
    // never sent for a single-bullet rewrite.
    provider.generateRewrite({ normalizedResume: normalized, context, candidateBefore: candidateBullet, dimension: "experience_quality" }),
    DEFAULT_TIMEOUTS.providerCallMs,
    "provider timed out during rewrite generation",
  );
  return raw ? enforceRewriteFactPreservation(raw) : null;
}
