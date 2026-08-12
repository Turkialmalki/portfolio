/**
 * TEMPORARY DIAGNOSTIC: dimension-analysis-only run with per-stage timing
 * (Command 05D §1–§5).
 *
 * Exists to answer ONE question with real numbers instead of guesses:
 * where does the real-provider pipeline actually spend its time, and how
 * big is the context it sends? It runs exactly the stages up through
 * dimension schema validation (+ the existing one repair retry) and stops
 * — no evidence verification, no scoring, no findings, no rewrite call,
 * no second provider call. That mirrors runStages() in pipeline.ts through
 * Stage B+C only; it does NOT replace or modify pipeline.ts, and production
 * timeouts (DEFAULT_TIMEOUTS in instrumentation.ts) are untouched by this
 * file — see DIAGNOSTIC_TIMEOUTS below, which apply ONLY here.
 *
 * Every returned field is a count, a duration, or a boolean — never CV
 * text, prompt text, model output, evidence, or personal data (same
 * discipline as instrumentation.ts and safeLog.ts). Token estimates for
 * context sizing are char-length/4 heuristics, clearly separate from the
 * real measured `inputTokens`/`outputTokens` that come back from
 * `provider.lastCallUsage()` on an actual call.
 *
 * Remove this file (and its one call site in analyze-resume/index.ts)
 * once the real-provider latency question is settled — it is not a
 * permanent product surface.
 */
import {
  composeMethodologyContext,
  planWeights,
  type AnalysisContext,
} from "../methodology/index.ts";
import { preprocessResumeText } from "./preprocess.ts";
import { redactContactFields } from "./redact.ts";
import { extractNormalizedResume } from "./structure.ts";
import { buildAndRunRetrieval } from "./retrievalContext.ts";
import { validateDimensionAIResults } from "./schemaValidation.ts";
import { withTimeout } from "./instrumentation.ts";
import { AnthropicProviderError, buildProviderDiagnosticBody } from "./anthropicClient.ts";
import { CAREER_AI_CONFIG } from "./config.ts";
import type { AnalyzeResumeRequest, CareerAIProvider } from "./types.ts";

/** Diagnostic-only timeouts — NEVER used by the real pipeline (pipeline.ts keeps DEFAULT_TIMEOUTS untouched). */
export const DIAGNOSTIC_TIMEOUTS = {
  providerCallMs: 60_000,
  overallDiagnosticMs: 75_000,
} as const;

const CHARS_PER_TOKEN_ESTIMATE = 4;
const estimateTokens = (chars: number) => Math.ceil(chars / CHARS_PER_TOKEN_ESTIMATE);

export interface DimensionDiagnosticResult {
  success: boolean;
  stageTimings: {
    request_validation: number | null;
    preprocessing: number | null;
    structure_extraction: number | null;
    knowledge_retrieval: number | null;
    prompt_composition: number | null;
    dimension_analysis_ai: number | null;
    dimension_schema_validation: number | null;
    dimension_repair: number | null;
    total: number;
  };
  contextSize: {
    resumeCharacters: number;
    resumeTokenEstimate: number;
    methodologyCharacters: number;
    methodologyTokenEstimate: number;
    seniorityContextTokens: number;
    languageContextTokens: number;
    retrievedExampleCount: number;
    retrievedExampleTokenEstimate: number;
    totalInputTokensEstimate: number;
    maxOutputTokens: number;
    actualOutputTokens: number | null;
  };
  dimension: {
    providerLatencyMs: number | null;
    totalDiagnosticLatencyMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    applicableDimensionCount: number;
    schemaValidated: boolean;
    repairRetries: number;
    retrievedExampleIds: string[];
    timedOut: boolean;
    timeoutStage: string | null;
    providerHttpStatus: number | null;
    providerErrorType: string | null;
    providerErrorMessageSanitized: string | null;
  };
}

function buildContext(request: AnalyzeResumeRequest, industry: string | undefined): AnalysisContext {
  return {
    seniority: request.seniority,
    language: request.language as AnalysisContext["language"],
    targetRole: request.targetRole,
    jobDescription: request.jobDescription,
    industry,
  };
}

/**
 * request_validation is timed by the CALLER (analyze-resume/index.ts
 * already runs validateAnalyzeResumeRequest before any diagnostic path is
 * reached) — passed in here as `requestValidationMs` so this function's
 * own timings start from "already-validated request" the same way
 * pipeline.ts's runStages() does.
 */
export async function runDimensionAnalysisDiagnostic(
  request: AnalyzeResumeRequest,
  provider: CareerAIProvider,
  knowledgeMode: "fixture" | "approved",
  requestValidationMs: number,
): Promise<DimensionDiagnosticResult> {
  const overallStart = Date.now();
  const stageTimings: DimensionDiagnosticResult["stageTimings"] = {
    request_validation: requestValidationMs,
    preprocessing: null,
    structure_extraction: null,
    knowledge_retrieval: null,
    prompt_composition: null,
    dimension_analysis_ai: null,
    dimension_schema_validation: null,
    dimension_repair: null,
    total: 0,
  };

  let timedOut = false;
  let timeoutStage: string | null = null;
  let providerHttpStatus: number | null = null;
  let providerErrorType: string | null = null;
  let providerErrorMessageSanitized: string | null = null;

  try {
    return await withTimeout(
      (async () => {
        // preprocessing
        let t = Date.now();
        const preprocessed = preprocessResumeText(request.resumeText);
        const redaction = redactContactFields(preprocessed);
        stageTimings.preprocessing = Date.now() - t;

        // structure_extraction
        t = Date.now();
        const normalized = extractNormalizedResume(redaction.redactedText);
        stageTimings.structure_extraction = Date.now() - t;

        // knowledge_retrieval
        t = Date.now();
        const context = buildContext(request, request.industry);
        const retrieval = buildAndRunRetrieval(normalized, context, request.roleFamily, undefined, knowledgeMode);
        stageTimings.knowledge_retrieval = Date.now() - t;

        // prompt_composition
        t = Date.now();
        const plan = planWeights(context);
        const dimensionIds = plan.included.map((w) => w.dimension);
        const methodologySections = composeMethodologyContext(context);
        stageTimings.prompt_composition = Date.now() - t;

        // ── context/token size metadata (counts only, no content) ────────
        const resumeCharacters = normalized.rawTextReference.length;
        const methodologyCharacters = JSON.stringify(methodologySections).length;
        const seniorityContextTokens = estimateTokens(JSON.stringify(context.seniority ?? "").length);
        const languageContextTokens = estimateTokens(JSON.stringify(context.language ?? "").length);
        const retrievedExampleTokenEstimate = estimateTokens(JSON.stringify(retrieval.examples).length);
        const resumeTokenEstimate = estimateTokens(resumeCharacters);
        const methodologyTokenEstimate = estimateTokens(methodologyCharacters);

        // dimension_analysis_ai — the ONE real provider call this diagnostic makes.
        t = Date.now();
        let providerLatencyMs: number | null = null;
        let aiRaw: unknown;
        try {
          const callStart = Date.now();
          aiRaw = await withTimeout(
            provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections, examples: retrieval.examples }),
            DIAGNOSTIC_TIMEOUTS.providerCallMs,
            "diagnostic provider call timed out during dimension analysis",
          );
          providerLatencyMs = Date.now() - callStart;
          providerHttpStatus = 200;
        } catch (err) {
          providerLatencyMs = Date.now() - t;
          if (err instanceof AnthropicProviderError) {
            const diag = buildProviderDiagnosticBody(err);
            providerHttpStatus = diag.providerHttpStatus;
            providerErrorType = diag.providerErrorType;
            providerErrorMessageSanitized = diag.providerErrorMessageSanitized;
          } else if (err instanceof Error && err.message.includes("timed out")) {
            timedOut = true;
            timeoutStage = "dimension_analysis_ai";
          }
          throw err;
        }
        stageTimings.dimension_analysis_ai = Date.now() - t;
        const usage = provider.lastCallUsage?.();

        // dimension_schema_validation (+ one repair retry, same as pipeline.ts §29)
        t = Date.now();
        let validation = validateDimensionAIResults(aiRaw, dimensionIds);
        stageTimings.dimension_schema_validation = Date.now() - t;
        let repairRetries = 0;
        let repairUsage: { inputTokens: number; outputTokens: number } | undefined;
        if (!validation.ok) {
          repairRetries = 1;
          const repairStart = Date.now();
          try {
            aiRaw = await withTimeout(
              provider.analyzeDimensions({ normalizedResume: normalized, context, dimensionIds, methodologySections, examples: retrieval.examples }),
              DIAGNOSTIC_TIMEOUTS.providerCallMs,
              "diagnostic provider call timed out during dimension analysis repair retry",
            );
            repairUsage = provider.lastCallUsage?.();
          } catch (err) {
            if (err instanceof Error && err.message.includes("timed out")) {
              timedOut = true;
              timeoutStage = "dimension_repair";
            }
            throw err;
          } finally {
            stageTimings.dimension_repair = Date.now() - repairStart;
          }
          validation = validateDimensionAIResults(aiRaw, dimensionIds);
        }

        const totalInputTokens = (usage?.inputTokens ?? 0) + (repairUsage?.inputTokens ?? 0);
        const totalOutputTokens = (usage?.outputTokens ?? 0) + (repairUsage?.outputTokens ?? 0);

        stageTimings.total = Date.now() - overallStart;

        return {
          success: true,
          stageTimings,
          contextSize: {
            resumeCharacters,
            resumeTokenEstimate,
            methodologyCharacters,
            methodologyTokenEstimate,
            seniorityContextTokens,
            languageContextTokens,
            retrievedExampleCount: retrieval.examples.length,
            retrievedExampleTokenEstimate,
            totalInputTokensEstimate: resumeTokenEstimate + methodologyTokenEstimate + seniorityContextTokens + languageContextTokens + retrievedExampleTokenEstimate,
            maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
            actualOutputTokens: totalOutputTokens || null,
          },
          dimension: {
            providerLatencyMs,
            totalDiagnosticLatencyMs: Date.now() - overallStart,
            inputTokens: totalInputTokens || null,
            outputTokens: totalOutputTokens || null,
            applicableDimensionCount: dimensionIds.length,
            schemaValidated: validation.ok,
            repairRetries,
            retrievedExampleIds: retrieval.debug.retrievedIds,
            timedOut: false,
            timeoutStage: null,
            providerHttpStatus,
            providerErrorType,
            providerErrorMessageSanitized,
          },
        } satisfies DimensionDiagnosticResult;
      })(),
      DIAGNOSTIC_TIMEOUTS.overallDiagnosticMs,
      "diagnostic run exceeded its overall time budget",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const overallTimedOut = timedOut || message.includes("time budget") || message.includes("timed out");
    stageTimings.total = Date.now() - overallStart;
    return {
      success: false,
      stageTimings,
      contextSize: {
        resumeCharacters: 0,
        resumeTokenEstimate: 0,
        methodologyCharacters: 0,
        methodologyTokenEstimate: 0,
        seniorityContextTokens: 0,
        languageContextTokens: 0,
        retrievedExampleCount: 0,
        retrievedExampleTokenEstimate: 0,
        totalInputTokensEstimate: 0,
        maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
        actualOutputTokens: null,
      },
      dimension: {
        providerLatencyMs: null,
        totalDiagnosticLatencyMs: stageTimings.total,
        inputTokens: null,
        outputTokens: null,
        applicableDimensionCount: 0,
        schemaValidated: false,
        repairRetries: 0,
        retrievedExampleIds: [],
        timedOut: overallTimedOut,
        timeoutStage: timeoutStage ?? (overallTimedOut ? "overall_diagnostic_budget" : null),
        providerHttpStatus,
        providerErrorType,
        providerErrorMessageSanitized,
      },
    };
  }
}
