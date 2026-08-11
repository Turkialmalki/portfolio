/**
 * THE ANALYSIS PIPELINE (Command 05 §8) — orchestration only.
 *
 * CV TEXT + USER CONTEXT + career_methodology_v1 + RELEVANT APPROVED
 * KNOWLEDGE + AI REASONING → VALIDATED DIMENSION EVALUATIONS →
 * DETERMINISTIC SCORING ENGINE → CareerAnalysis.
 *
 * Stages, and why there are exactly two AI calls (§8's "minimum number of
 * AI calls that produces reliable structured results"):
 *
 *   A. Structure           — deterministic (structure.ts). No AI call.
 *   B+C. Rubric evaluation — ONE `provider.analyzeDimensions()` call
 *        covering every dimension `scoring.ts` will actually weight for
 *        this context (universal + contextual — `planWeights` has
 *        already excluded what doesn't apply, so this call never wastes
 *        budget on target-role/keyword rubrics when there's no target
 *        role/JD). Splitting universal vs contextual into two calls would
 *        double latency/cost for no reliability gain: both need the same
 *        resume text and methodology context, and neither depends on the
 *        other's output.
 *   D. Rewrite candidate    — ONE `provider.generateRewrite()` call,
 *        because it's a different task shape (generation, not scoring)
 *        best kept as its own small, auditable call. Strengths, issues,
 *        quick wins, and the action plan are NOT separate AI calls at
 *        all — findings.ts derives them deterministically from the
 *        already-validated dimension results (§21–§26 rules), which is
 *        both cheaper and keeps "why is this a critical issue" traceable
 *        to code.
 *   E. Schema validation    — schemaValidation.ts + evidenceValidation.ts.
 *   F. Deterministic scoring — scoring.ts (the ONLY source of overallScore).
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
  composeMethodologyContext,
  computeOverallScore,
  planWeights,
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
import { buildAndRunRetrieval } from "./retrievalContext.ts";
import { validateDimensionAIResults } from "./schemaValidation.ts";
import { verifyDimensionEvidence } from "./evidenceValidation.ts";
import { detectMetricConflicts, enforceRewriteFactPreservation } from "./factCheck.ts";
import { buildFindings } from "./findings.ts";
import { DEFAULT_TIMEOUTS, newInstrumentation, withTimeout } from "./instrumentation.ts";
import type { AnalyzeResumeRequest, AnalysisRunOptions, AnalysisRunResult, NormalizedResume } from "./types.ts";
import { AnalysisPipelineError } from "./types.ts";

function buildContext(request: AnalyzeResumeRequest, industry: string | undefined): AnalysisContext {
  return {
    seniority: request.seniority,
    language: request.language as CvLanguage,
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
  const methodologySections = composeMethodologyContext(context);

  // Stage B+C: one dimension-evaluation call, with one controlled repair retry (§29).
  let aiRaw = await withTimeout(
    opts.provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections, examples: retrieval.examples }),
    DEFAULT_TIMEOUTS.providerCallMs,
    "provider timed out during dimension analysis",
  );
  instrumentation.aiCallCount += 1;
  let validation = validateDimensionAIResults(aiRaw, dimensionIds);
  if (!validation.ok) {
    instrumentation.retryCount += 1;
    aiRaw = await withTimeout(
      opts.provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections, examples: retrieval.examples }),
      DEFAULT_TIMEOUTS.providerCallMs,
      "provider timed out during dimension analysis retry",
    );
    instrumentation.aiCallCount += 1;
    validation = validateDimensionAIResults(aiRaw, dimensionIds);
    if (!validation.ok) {
      throw new AnalysisPipelineError("ANALYSIS_FAILED", "AI output failed schema validation after one repair retry", validation.issues);
    }
  }

  // Stage E: evidence verification (§11).
  const verifiedResults: DimensionResult[] = validation.value.map((r) => {
    const { result } = verifyDimensionEvidence(r, normalized.rawTextReference);
    return { dimension: result.dimensionId, score: result.score, confidence: result.confidence, evidence: result.evidence, reason: result.reason, recommendations: result.recommendations };
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

  // §24: exactly one rewrite candidate, fact-checked before it's trusted (§12).
  const candidateBullet = normalized.experience.flatMap((e) => e.bullets).find((b) => /^(was responsible for|responsible for|worked on|helped with|participated in)/i.test(b.trim()));
  let rewriteExamples: CareerAnalysis["rewriteExamples"] = [];
  if (candidateBullet) {
    const raw = await withTimeout(
      opts.provider.generateRewrite({ normalizedResume: normalized, context, candidateBefore: candidateBullet, dimension: "experience_quality" }),
      DEFAULT_TIMEOUTS.providerCallMs,
      "provider timed out during rewrite generation",
    );
    instrumentation.aiCallCount += 1;
    const checked = raw ? enforceRewriteFactPreservation(raw) : null;
    if (checked) rewriteExamples = [checked];
  }

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
    actionPlan,
    metadata: { analyzedAt: new Date().toISOString(), capsApplied: overall.capsApplied },
  };

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
