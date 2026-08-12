/**
 * TEMPORARY DIAGNOSTIC: full compact free-path measurement (Command
 * 05D.2 §23–§24).
 *
 * Runs the ACTUAL production stages — the same functions
 * `pipeline.ts`'s `runAnalysis()` calls, in the same order, using the
 * COMPACT runtime methodology and the compact AI contract — through to a
 * free-tier projection: validation (by the caller, before this function)
 * → preprocessing → structure → compileRuntimeMethodology → retrieval →
 * ONE real compact dimension call → schema validation → evidence
 * validation → scoring.ts → deterministic issue/strength/quick-win
 * selection (findings.ts) → free projection (projection.ts). No rewrite
 * call, no paid-report generation, and — deliberately, per §23 — NO
 * repair retry: if the first real call fails schema validation, this
 * diagnostic reports that and stops rather than silently retrying, so a
 * repair requirement is visible instead of masked.
 *
 * This is not a reimplementation of the pipeline; it is the pipeline,
 * inlined here only so a diagnostic-only timeout ceiling
 * (`COMPACT_DIAGNOSTIC_TIMEOUTS`) can apply without touching
 * `DEFAULT_TIMEOUTS` in instrumentation.ts, which stays exactly as
 * `runAnalysis()`/`pipeline.ts` already use it (Command 05D.2 §22: "leave
 * current production timeout configuration unchanged until the optimized
 * real call is measured").
 */
import {
  CAREER_METHODOLOGY_VERSION,
  aggregateConfidence,
  bandForScore,
  compileRuntimeMethodology,
  computeOverallScore,
  planWeights,
  projectFreeReport,
  rubricScoreFor,
  type AnalysisContext,
  type CareerAnalysis,
  type DimensionResult,
} from "../methodology/index.ts";
import { preprocessResumeText } from "./preprocess.ts";
import { redactContactFields } from "./redact.ts";
import { extractNormalizedResume } from "./structure.ts";
import { computeAtsCompatibility } from "./atsCompatibility.ts";
import { buildAndRunRetrieval } from "./retrievalContext.ts";
import { validateDimensionAIResults } from "./schemaValidation.ts";
import { verifyDimensionEvidence } from "./evidenceValidation.ts";
import { detectMetricConflicts } from "./factCheck.ts";
import { buildFindings } from "./findings.ts";
import { withTimeout } from "./instrumentation.ts";
import { AnthropicProviderError, buildProviderDiagnosticBody } from "./anthropicClient.ts";
import { CAREER_AI_CONFIG } from "./config.ts";
import { createAnthropicCareerAIProvider } from "./anthropicProvider.ts";
import type { AnalyzeResumeRequest, CareerAIProvider } from "./types.ts";

/** Diagnostic-only ceiling — NEVER used by the production pipeline (DEFAULT_TIMEOUTS in instrumentation.ts is untouched). */
export const COMPACT_DIAGNOSTIC_TIMEOUTS = {
  providerCallMs: 60_000,
  overallDiagnosticMs: 70_000,
} as const;

function buildContext(request: AnalyzeResumeRequest, industry: string | undefined): AnalysisContext {
  return {
    seniority: request.seniority,
    language: request.language as AnalysisContext["language"],
    targetRole: request.targetRole,
    jobDescription: request.jobDescription,
    industry,
  };
}

export interface CompactAnalysisDiagnosticResult {
  success: boolean;
  providerHttpStatus: number | null;
  providerLatencyMs: number | null;
  providerErrorType: string | null;
  providerErrorMessageSanitized: string | null;
  actualInputTokens: number | null;
  actualOutputTokens: number | null;
  maxOutputTokens: number;
  stopReason: string | null;
  promptCharacters: number;
  runtimeMethodologyCharacters: number;
  applicableDimensionCount: number;
  returnedDimensionCount: number;
  schemaValidated: boolean;
  validationIssueCount: number;
  repairAttempted: boolean;
  repairSucceeded: boolean;
  evidenceAccepted: number;
  evidenceRejected: number;
  overallScore: number | null;
  overallScoreSource: "scoring.ts" | null;
  scoreBand: string | null;
  topIssueCount: number;
  strengthCount: number;
  quickWinPresent: boolean;
  retrievedExampleCount: number;
  retrievedExampleIds: string[];
  timeToFreeResultMs: number;
  timedOut: boolean;
}

export async function runCompactAnalysisDiagnostic(
  request: AnalyzeResumeRequest,
  apiKey: string,
  knowledgeMode: "fixture" | "approved",
): Promise<CompactAnalysisDiagnosticResult> {
  const overallStart = Date.now();

  try {
    return await withTimeout(
      (async () => {
        const preprocessed = preprocessResumeText(request.resumeText);
        const redaction = redactContactFields(preprocessed);
        const normalized = extractNormalizedResume(redaction.redactedText);

        const context = buildContext(request, request.industry);
        const retrieval = buildAndRunRetrieval(normalized, context, request.roleFamily, undefined, knowledgeMode);

        const plan = planWeights(context);
        const dimensionIds = plan.included.map((w) => w.dimension);
        const runtimeMethodology = compileRuntimeMethodology(context, dimensionIds);

        // The SAME provider adapter production code uses — not a
        // reimplementation — so this diagnostic exercises the exact
        // prompt/schema/parsing path a real free scan would.
        const provider: CareerAIProvider = createAnthropicCareerAIProvider(apiKey);

        const promptCharacters = JSON.stringify({ dimensionIds, context, methodologySections: runtimeMethodology, examples: retrieval.examples, normalizedResume: normalized }).length;
        const runtimeMethodologyCharacters = JSON.stringify(runtimeMethodology).length;

        let providerHttpStatus: number | null = null;
        let providerErrorType: string | null = null;
        let providerErrorMessageSanitized: string | null = null;
        let aiRaw: unknown;
        const callStart = Date.now();
        let providerLatencyMs: number | null = null;
        try {
          aiRaw = await withTimeout(
            provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections: runtimeMethodology, examples: retrieval.examples }),
            COMPACT_DIAGNOSTIC_TIMEOUTS.providerCallMs,
            "compact diagnostic provider call timed out",
          );
          providerLatencyMs = Date.now() - callStart;
          providerHttpStatus = 200;
        } catch (err) {
          providerLatencyMs = Date.now() - callStart;
          if (err instanceof AnthropicProviderError) {
            const diag = buildProviderDiagnosticBody(err);
            providerHttpStatus = diag.providerHttpStatus;
            providerErrorType = diag.providerErrorType;
            providerErrorMessageSanitized = diag.providerErrorMessageSanitized;
          } else if (err instanceof Error && err.message.includes("timed out")) {
            throw err; // outer catch reports timedOut: true
          } else {
            providerErrorMessageSanitized = err instanceof Error ? err.message.slice(0, 300) : "unknown_error";
          }
          // Provider call itself failed — nothing to validate/score.
          return buildFailureResult({
            overallStart,
            providerHttpStatus,
            providerLatencyMs,
            providerErrorType,
            providerErrorMessageSanitized,
            promptCharacters,
            runtimeMethodologyCharacters,
            applicableDimensionCount: dimensionIds.length,
            retrievedExampleCount: retrieval.examples.length,
            retrievedExampleIds: retrieval.debug.retrievedIds,
          });
        }

        const usage = provider.lastCallUsage?.();
        const actualInputTokens = usage?.inputTokens ?? null;
        const actualOutputTokens = usage?.outputTokens ?? null;

        // §23: NO repair retry in this diagnostic — a first-pass failure
        // is reported, not silently retried away.
        const validation = validateDimensionAIResults(aiRaw, dimensionIds);
        if (!validation.ok) {
          return {
            success: false,
            providerHttpStatus,
            providerLatencyMs,
            providerErrorType,
            providerErrorMessageSanitized,
            actualInputTokens,
            actualOutputTokens,
            maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
            stopReason: usage?.stopReason ?? null,
            promptCharacters,
            runtimeMethodologyCharacters,
            applicableDimensionCount: dimensionIds.length,
            returnedDimensionCount: 0,
            schemaValidated: false,
            validationIssueCount: validation.issues.length,
            repairAttempted: false,
            repairSucceeded: false,
            evidenceAccepted: 0,
            evidenceRejected: 0,
            overallScore: null,
            overallScoreSource: null,
            scoreBand: null,
            topIssueCount: 0,
            strengthCount: 0,
            quickWinPresent: false,
            retrievedExampleCount: retrieval.examples.length,
            retrievedExampleIds: retrieval.debug.retrievedIds,
            timeToFreeResultMs: Date.now() - overallStart,
            timedOut: false,
          } satisfies CompactAnalysisDiagnosticResult;
        }

        // Evidence verification (§5).
        let evidenceAccepted = 0;
        let evidenceRejected = 0;
        const verifiedResults: DimensionResult[] = validation.value.map((r) => {
          const hadEvidence = r.evidence !== null;
          const { result, rejectedCount } = verifyDimensionEvidence(r, normalized.rawTextReference);
          if (hadEvidence) {
            if (rejectedCount > 0) evidenceRejected += 1;
            else evidenceAccepted += 1;
          }
          return {
            dimension: result.dimensionId,
            score: rubricScoreFor(result.signalLevel, result.evidencePresent, result.evidenceQuality),
            confidence: result.confidence,
            evidence: result.evidence ? [{ section: result.evidence.section, text: result.evidence.excerpt }] : [],
            reason: result.shortReason,
            recommendations: [],
          };
        });

        // Deterministic scoring — scoring.ts is the ONLY source of overallScore (§13, unchanged).
        const overall = computeOverallScore(verifiedResults, context);
        const confidence = aggregateConfidence(verifiedResults, overall.weightPlan);
        const scoreBand = bandForScore(overall.overallScore);
        const factConflicts = detectMetricConflicts(normalized.rawTextReference);
        const { issues, strengths, quickWins, missingEvidenceQuestions, atsAnalysis } = buildFindings(verifiedResults, context, factConflicts);

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
          rewriteExamples: [], // deferred — §17, not part of the free critical path
          atsAnalysis,
          atsCompatibility: computeAtsCompatibility(normalized, redaction),
          actionPlan: [],
          metadata: { analyzedAt: new Date().toISOString(), capsApplied: overall.capsApplied },
        };
        const freeReport = projectFreeReport(analysis);

        return {
          success: true,
          providerHttpStatus,
          providerLatencyMs,
          providerErrorType,
          providerErrorMessageSanitized,
          actualInputTokens,
          actualOutputTokens,
          maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
          stopReason: usage?.stopReason ?? null, // Command 05D.3: now surfaced via CareerAIProvider.lastCallUsage()
          promptCharacters,
          runtimeMethodologyCharacters,
          applicableDimensionCount: dimensionIds.length,
          returnedDimensionCount: verifiedResults.length,
          schemaValidated: true,
          validationIssueCount: 0,
          repairAttempted: false,
          repairSucceeded: false,
          evidenceAccepted,
          evidenceRejected,
          overallScore: freeReport.overallScore,
          overallScoreSource: "scoring.ts",
          scoreBand: freeReport.scoreBand.labelEn,
          topIssueCount: freeReport.topIssues.length,
          strengthCount: freeReport.topStrengths.length,
          quickWinPresent: freeReport.quickWin !== null,
          retrievedExampleCount: retrieval.examples.length,
          retrievedExampleIds: retrieval.debug.retrievedIds,
          timeToFreeResultMs: Date.now() - overallStart,
          timedOut: false,
        } satisfies CompactAnalysisDiagnosticResult;
      })(),
      COMPACT_DIAGNOSTIC_TIMEOUTS.overallDiagnosticMs,
      "compact analysis diagnostic exceeded its overall time budget",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = message.includes("time budget") || message.includes("timed out");
    return {
      success: false,
      providerHttpStatus: null,
      providerLatencyMs: null,
      providerErrorType: null,
      providerErrorMessageSanitized: timedOut ? "diagnostic_timed_out" : message.slice(0, 300),
      actualInputTokens: null,
      actualOutputTokens: null,
      maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
      stopReason: null,
      promptCharacters: 0,
      runtimeMethodologyCharacters: 0,
      applicableDimensionCount: 0,
      returnedDimensionCount: 0,
      schemaValidated: false,
      validationIssueCount: 0,
      repairAttempted: false,
      repairSucceeded: false,
      evidenceAccepted: 0,
      evidenceRejected: 0,
      overallScore: null,
      overallScoreSource: null,
      scoreBand: null,
      topIssueCount: 0,
      strengthCount: 0,
      quickWinPresent: false,
      retrievedExampleCount: 0,
      retrievedExampleIds: [],
      timeToFreeResultMs: Date.now() - overallStart,
      timedOut,
    };
  }
}

function buildFailureResult(args: {
  overallStart: number;
  providerHttpStatus: number | null;
  providerLatencyMs: number | null;
  providerErrorType: string | null;
  providerErrorMessageSanitized: string | null;
  promptCharacters: number;
  runtimeMethodologyCharacters: number;
  applicableDimensionCount: number;
  retrievedExampleCount: number;
  retrievedExampleIds: string[];
}): CompactAnalysisDiagnosticResult {
  return {
    success: false,
    providerHttpStatus: args.providerHttpStatus,
    providerLatencyMs: args.providerLatencyMs,
    providerErrorType: args.providerErrorType,
    providerErrorMessageSanitized: args.providerErrorMessageSanitized,
    actualInputTokens: null,
    actualOutputTokens: null,
    maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
    stopReason: null,
    promptCharacters: args.promptCharacters,
    runtimeMethodologyCharacters: args.runtimeMethodologyCharacters,
    applicableDimensionCount: args.applicableDimensionCount,
    returnedDimensionCount: 0,
    schemaValidated: false,
    validationIssueCount: 0,
    repairAttempted: false,
    repairSucceeded: false,
    evidenceAccepted: 0,
    evidenceRejected: 0,
    overallScore: null,
    overallScoreSource: null,
    scoreBand: null,
    topIssueCount: 0,
    strengthCount: 0,
    quickWinPresent: false,
    retrievedExampleCount: args.retrievedExampleCount,
    retrievedExampleIds: args.retrievedExampleIds,
    timeToFreeResultMs: Date.now() - args.overallStart,
    timedOut: false,
  };
}
