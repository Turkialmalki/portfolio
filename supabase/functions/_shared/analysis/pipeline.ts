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
 *   B+C. Rubric evaluation — ONE `provider.analyzeDimensions()` call
 *        covering every dimension `scoring.ts` will actually weight for
 *        this context (universal + contextual — `planWeights` has
 *        already excluded what doesn't apply, so this call never wastes
 *        budget on target-role/keyword rubrics when there's no target
 *        role/JD), using the COMPACT runtime methodology
 *        (compileRuntimeMethodology — Command 05D.2 §6) and the compact
 *        per-dimension contract (analysis/types.ts's `DimensionAIResult`)
 *        instead of the old verbose one. Strengths, issues, quick wins,
 *        and the action plan are NOT separate AI calls at all —
 *        findings.ts derives them deterministically from the
 *        already-validated dimension results (§21–§26 rules), which is
 *        both cheaper and keeps "why is this a critical issue" traceable
 *        to code.
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
  rubricScoreFor,
  type AnalysisContext,
  type CareerAnalysis,
  type CvLanguage,
  type DimensionResult,
  type KeywordFinding,
  type TargetRoleAnalysis,
} from "../methodology/index.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../releaseGates.ts";
import { OPERATOR_CV_INGESTION_VERSION } from "../knowledge/version.ts";
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
import { validateReportLanguage } from "./languageValidator.ts";
import { DEFAULT_TIMEOUTS, newInstrumentation, withTimeout } from "./instrumentation.ts";
import type { AnalyzeResumeRequest, AnalysisRunOptions, AnalysisRunResult, AnalysisInstrumentation, CareerAIProvider, NormalizedResume } from "./types.ts";
import { AnalysisPipelineError } from "./types.ts";

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
function buildTargetRoleAnalysis(
  request: AnalyzeResumeRequest,
  normalized: NormalizedResume,
  targetRoleResult: DimensionResult | undefined,
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
      if (f.match === "not_demonstrated") gaps.push(`${f.keyword} not demonstrated in any bullet`);
    }
  }

  return {
    targetRole: request.targetRole,
    hasJobDescription: !!request.jobDescription,
    positioningVerdict:
      targetRoleResult?.reason ??
      "The resume currently demonstrates some, but not conclusive, alignment with the stated target role.",
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
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = message.includes("time budget") || message.includes("timed out");
    throw new AnalysisPipelineError(timedOut ? "ANALYSIS_TIMEOUT" : "ANALYSIS_FAILED", message);
  }
}

async function runStages(
  request: AnalyzeResumeRequest,
  opts: AnalysisRunOptions,
  instrumentation: ReturnType<typeof newInstrumentation>,
  start: number,
): Promise<AnalysisRunResult> {
  // Stage A: deterministic structure extraction.
  const preprocessed = preprocessResumeText(request.resumeText);
  const redaction = redactContactFields(preprocessed);
  const normalized = extractNormalizedResume(redaction.redactedText);

  // Retrieval + context assembly (roleFamily detection informs both the
  // industry-fallback context and the retrieval call).
  const retrieval = buildAndRunRetrieval(normalized, buildContext(request, request.industry), request.roleFamily, undefined, opts.knowledgeMode);
  instrumentation.examplesRetrieved = retrieval.examples.length;
  const context = buildContext(request, request.industry);

  const plan = planWeights(context);
  const dimensionIds = plan.included.map((w) => w.dimension);
  // Command 05D.2 §6: the COMPACT runtime projection of the same rubrics
  // compose.ts filters — replaces composeMethodologyContext() for the AI
  // call. composeMethodologyContext()/compose.ts are unchanged and still
  // used elsewhere (documentation, tests); this pipeline's live AI call
  // no longer sends full rubric prose.
  const runtimeMethodology = compileRuntimeMethodology(context, dimensionIds);

  // Stage B+C: ONE compact dimension-evaluation call, with one controlled
  // repair retry (§29) — unchanged safety net, now expected to be rare
  // (Command 05D.2 §21: a system that routinely needs repair isn't
  // production-ready).
  let aiRaw = await withTimeout(
    opts.provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections: runtimeMethodology, examples: retrieval.examples }),
    DEFAULT_TIMEOUTS.providerCallMs,
    "provider timed out during dimension analysis",
  );
  instrumentation.aiCallCount += 1;
  accumulateUsage(instrumentation, opts.provider);
  let validation = validateDimensionAIResults(aiRaw, dimensionIds);
  if (!validation.ok) {
    instrumentation.retryCount += 1;
    aiRaw = await withTimeout(
      opts.provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections: runtimeMethodology, examples: retrieval.examples }),
      DEFAULT_TIMEOUTS.providerCallMs,
      "provider timed out during dimension analysis retry",
    );
    instrumentation.aiCallCount += 1;
    accumulateUsage(instrumentation, opts.provider);
    validation = validateDimensionAIResults(aiRaw, dimensionIds);
    if (!validation.ok) {
      throw new AnalysisPipelineError(
        "ANALYSIS_FAILED",
        "AI output failed schema validation after one repair retry",
        validation.issues,
        instrumentation.stopReason,
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
  const verifiedResults: DimensionResult[] = validation.value.map((r) => {
    const { result } = verifyDimensionEvidence(r, normalized.rawTextReference);
    return {
      dimension: result.dimensionId,
      score: rubricScoreFor(result.signalLevel, result.evidencePresent, result.evidenceQuality),
      confidence: result.confidence,
      evidence: result.evidence ? [{ section: result.evidence.section, text: result.evidence.excerpt }] : [],
      reason: result.shortReason,
      recommendations: [],
    };
  });

  // Stage F: deterministic scoring — the ONLY source of overallScore (§9).
  const overall = computeOverallScore(verifiedResults, context);
  const confidence = aggregateConfidence(verifiedResults, overall.weightPlan);
  const scoreBand = bandForScore(overall.overallScore);

  // §13 metric-conflict protection.
  const factConflicts = detectMetricConflicts(normalized.rawTextReference);

  // §21–§26 deterministic findings.
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
  const targetRoleAnalysis = buildTargetRoleAnalysis(request, normalized, targetRoleResult);

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

  // Career V2 Part 9: a final gate before ANY Arabic-output analysis is
  // returned/saved — no dimension reason, issue/strength summary, quick
  // win, or ATS detail may contain leaked English explanatory prose.
  // Proper nouns/currency figures are allow-listed (languageValidator.ts);
  // a genuine leak fails the analysis closed rather than saving a report
  // with English sentences in it. This pipeline has exactly one repair
  // retry today (§29, above, for schema validation) — a second AI call
  // specifically to re-translate leaked fields is a real follow-up this
  // gate deliberately does NOT attempt yet, so it fails safely instead of
  // silently shipping the leak.
  //
  // Skipped for the mock provider on purpose: mockProvider.ts's own header
  // comment documents it as heuristics that exercise the pipeline, never a
  // simulation of real model output, and its shortReason strings are not
  // localized to outputLanguage by design — running this gate against it
  // would fail every Arabic fixture for a property the mock never claims
  // to have. The real Anthropic provider IS instructed (SYSTEM_PROMPT) to
  // write shortReason in outputLanguage, so this gate is meaningful there.
  if (opts.provider.name !== "mock") {
    const languageCheck = validateReportLanguage(analysis);
    if (!languageCheck.ok) {
      throw new AnalysisPipelineError(
        "ANALYSIS_FAILED",
        `Arabic report failed language validation: ${languageCheck.leaks.length} field(s) contained English prose leakage`,
      );
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
