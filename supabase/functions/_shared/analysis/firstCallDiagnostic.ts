/**
 * TEMPORARY DIAGNOSTIC: first-dimension-call-only, with pre-call context
 * sizing and safe structural validation reporting (Command 05D.1).
 *
 * Narrower than dimensionDiagnostic.ts on purpose: runs validation →
 * preprocessing → structure → retrieval → prompt composition → EXACTLY
 * ONE Anthropic call → schema validation → stop. No repair retry, no
 * rewrite, no scoring, no findings, no second provider call — the repair
 * retry is exactly what made the previous diagnostic run long enough to
 * hit its own overall budget, so it's excluded here entirely to isolate
 * "what does ONE real call actually look like."
 *
 * Two things this file fixes relative to dimensionDiagnostic.ts:
 *  1. Context/token sizing is computed BEFORE the Anthropic call, so it
 *     exists in the response even if the call fails or times out.
 *  2. Provider response diagnostics (latency, usage, stop_reason, tool
 *     presence) are captured immediately on return, BEFORE schema
 *     validation runs — so a validation failure never erases them.
 *
 * Same content discipline as every other diagnostic module here: every
 * returned field is a count, a duration, a boolean, or a closed-vocabulary
 * category string — never CV text, prompt text, model prose, or a value
 * the model supplied. See `categorizeIssue` below for how raw
 * `SchemaIssue`s (from schemaValidation.ts, unmodified) are mapped onto
 * the fixed diagnostic taxonomy without forwarding any model content.
 */
import {
  composeMethodologyContext,
  planWeights,
  type AnalysisContext,
} from "../methodology/index.ts";
import { DIMENSION_IDS, type DimensionId } from "../methodology/types.ts";
import { preprocessResumeText } from "./preprocess.ts";
import { redactContactFields } from "./redact.ts";
import { extractNormalizedResume } from "./structure.ts";
import { buildAndRunRetrieval } from "./retrievalContext.ts";
import { validateDimensionAIResults } from "./schemaValidation.ts";
import { withTimeout } from "./instrumentation.ts";
import { AnthropicProviderError, buildProviderDiagnosticBody, callAnthropic } from "./anthropicClient.ts";
import { CAREER_AI_CONFIG } from "./config.ts";
import { SYSTEM_PROMPT, buildDimensionsPrompt, DIMENSION_RESULT_SCHEMA } from "./anthropicProvider.ts";
import type { AnalyzeResumeRequest, SchemaIssue } from "./types.ts";

/** Diagnostic-only timeouts — NEVER used by the real pipeline. */
export const FIRST_CALL_DIAGNOSTIC_TIMEOUTS = {
  providerCallMs: 60_000,
  overallDiagnosticMs: 65_000,
} as const;

const CHARS_PER_TOKEN_ESTIMATE = 4;
const estimateTokens = (chars: number) => Math.ceil(chars / CHARS_PER_TOKEN_ESTIMATE);
const charsOf = (v: unknown) => JSON.stringify(v ?? "").length;

// ── §5: safe structural-issue taxonomy — no model content ever crosses this boundary ──
type IssueCategory =
  | "missing_field"
  | "invalid_type"
  | "out_of_range"
  | "missing_dimension"
  | "duplicate_dimension"
  | "unknown_dimension"
  | "invalid_confidence"
  | "missing_evidence"
  | "invalid_evidence_shape"
  | "missing_reason"
  | "missing_recommendations"
  | "tool_payload_parse_failed";

/**
 * Maps schemaValidation.ts's existing SchemaIssue (`{path, issue}`, fixed
 * hand-written strings — see that file's own no-model-content discipline)
 * onto the closed category vocabulary. Some categories can't be
 * distinguished from the existing message text alone (e.g. "score must be
 * a number 0–100" covers both a wrong type AND an out-of-range value) —
 * those are noted inline rather than guessed at from the model's actual
 * value, which this function never receives in the first place.
 */
function categorizeIssue(issue: SchemaIssue): { path: string; issue: IssueCategory } {
  const p = issue.path;
  const msg = issue.issue;

  if (p === "$" && msg.startsWith("expected an array")) return { path: p, issue: "tool_payload_parse_failed" };
  if (p === "$" && msg.startsWith("missing dimension result for")) return { path: p, issue: "missing_dimension" };
  if (msg.startsWith("duplicate dimension result")) return { path: p, issue: "duplicate_dimension" };
  if (msg === "not an object") return { path: p, issue: "invalid_type" };
  if (p.endsWith(".dimensionId")) {
    return { path: p, issue: msg.includes("was not requested") ? "unknown_dimension" : "missing_field" };
  }
  // Current validator conflates "not a number" and "out of 0–100 range" in
  // one message — reported as invalid_type (the more common real-world
  // cause); a future validator change could split this without touching
  // this diagnostic.
  if (p.endsWith(".score")) return { path: p, issue: "invalid_type" };
  if (p.endsWith(".confidence")) return { path: p, issue: "invalid_confidence" };
  if (p.endsWith(".evidence")) return { path: p, issue: "invalid_evidence_shape" };
  // Compact contract (Command 05D.2 §3): "reason" is now split into
  // reasonCode + shortReason; both map to the closest existing category.
  if (p.endsWith(".reasonCode")) return { path: p, issue: "missing_field" };
  if (p.endsWith(".shortReason")) return { path: p, issue: "missing_reason" };
  return { path: p, issue: "invalid_type" };
}

interface RawAnthropicDimensionResponse {
  content: Array<{ type: string; input?: unknown }>;
  usage?: { input_tokens: number; output_tokens: number };
  stop_reason?: string;
}

export interface FirstCallDiagnosticResult {
  success: boolean;
  contextSize: {
    resumeCharacters: number;
    resumeTokenEstimate: number;
    methodologyCharacters: number;
    methodologyTokenEstimate: number;
    languageGuidanceCharacters: number;
    languageGuidanceTokenEstimate: number;
    seniorityGuidanceCharacters: number;
    seniorityGuidanceTokenEstimate: number;
    targetRoleContextCharacters: number;
    targetRoleContextTokenEstimate: number;
    jobDescriptionCharacters: number;
    jobDescriptionTokenEstimate: number;
    retrievedExampleCount: number;
    retrievedExampleCharacters: number;
    retrievedExampleTokenEstimate: number;
    totalPromptCharacters: number;
    totalInputTokenEstimate: number;
    applicableDimensionCount: number;
    retrievedExampleIds: string[];
  };
  provider: {
    providerLatencyMs: number | null;
    providerHttpStatus: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    maxOutputTokens: number;
    stopReason: string | null;
    toolUseReturned: boolean;
    toolName: string | null;
    toolPayloadPresent: boolean;
    providerRequestId: string | null;
    providerErrorType: string | null;
    providerErrorMessageSanitized: string | null;
  };
  schema: {
    schemaValidated: boolean;
    validationIssueCount: number;
    issues: Array<{ path: string; issue: IssueCategory }>;
    expectedDimensionIds: DimensionId[];
    returnedDimensionIds: DimensionId[];
    missingDimensionIds: DimensionId[];
    duplicateDimensionIds: DimensionId[];
    unknownDimensionIds: string[];
  };
  truncation: {
    outputTokens: number | null;
    maxOutputTokens: number;
    stopReason: string | null;
    expectedDimensionCount: number;
    returnedDimensionCount: number;
    likelyOutputTruncation: boolean;
  };
  verbosity: {
    averageEvidenceItemsPerReturnedDimension: number | null;
    averageRecommendationItemsPerReturnedDimension: number | null;
    dimensionsWithMoreThan2EvidenceItems: number | null;
    dimensionsWithMoreThan2Recommendations: number | null;
  };
  timedOut: boolean;
  totalDiagnosticLatencyMs: number;
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

export async function runFirstCallDiagnostic(
  request: AnalyzeResumeRequest,
  apiKey: string,
  knowledgeMode: "fixture" | "approved",
): Promise<FirstCallDiagnosticResult> {
  const overallStart = Date.now();

  // Captured by reference from inside the IIFE below AS SOON AS each is
  // known, so the outer catch (overall-budget timeout) can still return
  // them even if the run never reaches its own `return` — this is the
  // exact gap Command 05D.1 asked to fix (§4: "context size must also
  // exist on failure").
  const captured: {
    contextSize: FirstCallDiagnosticResult["contextSize"] | null;
    provider: FirstCallDiagnosticResult["provider"] | null;
  } = { contextSize: null, provider: null };

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
        const methodologySections = composeMethodologyContext(context);

        // ── §4: context/token sizing, computed BEFORE the Anthropic call ──
        const resumeCharacters = normalized.rawTextReference.length;
        const methodologyCharacters = charsOf(methodologySections);
        const languageSections = methodologySections.filter((s) => s.id.startsWith("language:"));
        const seniritySections = methodologySections.filter((s) => s.id.startsWith("seniority:"));
        const targetRoleSections = methodologySections.filter((s) => s.id === "target_role");
        const languageGuidanceCharacters = charsOf(languageSections);
        const seniorityGuidanceCharacters = charsOf(seniritySections);
        const targetRoleContextCharacters = charsOf(targetRoleSections);
        const jobDescriptionCharacters = request.jobDescription?.length ?? 0;
        const retrievedExampleCharacters = charsOf(retrieval.examples);
        const userPromptText = buildDimensionsPrompt({ normalizedResume: normalized, context, dimensionIds, methodologySections, examples: retrieval.examples });
        const totalPromptCharacters = SYSTEM_PROMPT.length + userPromptText.length;

        const contextSize: FirstCallDiagnosticResult["contextSize"] = {
          resumeCharacters,
          resumeTokenEstimate: estimateTokens(resumeCharacters),
          methodologyCharacters,
          methodologyTokenEstimate: estimateTokens(methodologyCharacters),
          languageGuidanceCharacters,
          languageGuidanceTokenEstimate: estimateTokens(languageGuidanceCharacters),
          seniorityGuidanceCharacters,
          seniorityGuidanceTokenEstimate: estimateTokens(seniorityGuidanceCharacters),
          targetRoleContextCharacters,
          targetRoleContextTokenEstimate: estimateTokens(targetRoleContextCharacters),
          jobDescriptionCharacters,
          jobDescriptionTokenEstimate: estimateTokens(jobDescriptionCharacters),
          retrievedExampleCount: retrieval.examples.length,
          retrievedExampleCharacters,
          retrievedExampleTokenEstimate: estimateTokens(retrievedExampleCharacters),
          totalPromptCharacters,
          totalInputTokenEstimate: estimateTokens(totalPromptCharacters),
          applicableDimensionCount: dimensionIds.length,
          retrievedExampleIds: retrieval.debug.retrievedIds,
        };
        captured.contextSize = contextSize; // visible to the outer catch immediately

        // ── ONE real Anthropic call — same shape CareerAIProvider uses ──
        const provider: FirstCallDiagnosticResult["provider"] = {
          providerLatencyMs: null,
          providerHttpStatus: null,
          inputTokens: null,
          outputTokens: null,
          maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
          stopReason: null,
          toolUseReturned: false,
          toolName: null,
          toolPayloadPresent: false,
          providerRequestId: null,
          providerErrorType: null,
          providerErrorMessageSanitized: null,
        };
        // Same object reference — every `provider.field = ...` mutation
        // below is visible to the outer catch through this pointer too,
        // even if the overall timeout fires mid-call.
        captured.provider = provider;

        const callStart = Date.now();
        let toolInput: unknown = undefined;
        try {
          const raw = await withTimeout(
            callAnthropic(
              apiKey,
              {
                model: CAREER_AI_CONFIG.model,
                max_tokens: CAREER_AI_CONFIG.maxOutputTokens,
                thinking: { type: "disabled" },
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: userPromptText }],
                tools: [{ name: "submit_dimension_analysis", description: "Return submit_dimension_analysis as structured JSON.", input_schema: DIMENSION_RESULT_SCHEMA }],
                tool_choice: { type: "tool", name: "submit_dimension_analysis" },
              },
              "diagnostic_first_dimension_call_only",
            ),
            FIRST_CALL_DIAGNOSTIC_TIMEOUTS.providerCallMs,
            "diagnostic provider call timed out during first dimension call",
          );
          provider.providerLatencyMs = Date.now() - callStart;
          provider.providerHttpStatus = 200;

          const data = raw as RawAnthropicDimensionResponse;
          provider.stopReason = data.stop_reason ?? null;
          provider.inputTokens = data.usage?.input_tokens ?? null;
          provider.outputTokens = data.usage?.output_tokens ?? null;
          const toolUse = data.content?.find((b) => b.type === "tool_use") as { type: string; name?: string; input?: unknown } | undefined;
          provider.toolUseReturned = Boolean(toolUse);
          provider.toolName = toolUse?.name ?? null;
          provider.toolPayloadPresent = toolUse?.input !== undefined && toolUse?.input !== null;
          if (toolUse && typeof toolUse.input === "object" && toolUse.input !== null) {
            toolInput = (toolUse.input as { results?: unknown }).results;
          }
        } catch (err) {
          provider.providerLatencyMs = Date.now() - callStart;
          if (err instanceof AnthropicProviderError) {
            const diag = buildProviderDiagnosticBody(err);
            provider.providerHttpStatus = diag.providerHttpStatus;
            provider.providerErrorType = diag.providerErrorType;
            provider.providerRequestId = diag.providerRequestId;
            provider.providerErrorMessageSanitized = diag.providerErrorMessageSanitized;
          } else if (err instanceof Error && err.message.includes("timed out")) {
            throw err; // handled by the outer catch — timedOut: true
          } else {
            provider.providerErrorMessageSanitized = err instanceof Error ? err.message.slice(0, 300) : "unknown_error";
          }
        }

        // ── §5–§6: schema validation, reported as safe categories only ──
        const validation = validateDimensionAIResults(toolInput, dimensionIds);
        const returnedIds: DimensionId[] = validation.ok
          ? validation.value.map((v) => v.dimensionId)
          : Array.isArray(toolInput)
            ? (toolInput as unknown[])
                .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>).dimensionId : undefined))
                .filter((id): id is DimensionId => typeof id === "string" && (DIMENSION_IDS as readonly string[]).includes(id))
            : [];
        const returnedSet = new Set(returnedIds);
        const expectedSet = new Set(dimensionIds);
        const missingDimensionIds = dimensionIds.filter((id) => !returnedSet.has(id));
        const duplicateDimensionIds = returnedIds.filter((id, i) => returnedIds.indexOf(id) !== i);
        const unknownDimensionIds = Array.isArray(toolInput)
          ? Array.from(
              new Set(
                (toolInput as unknown[])
                  .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>).dimensionId : undefined))
                  .filter((id): id is string => typeof id === "string" && !expectedSet.has(id as DimensionId)),
              ),
            )
          : [];

        const schema: FirstCallDiagnosticResult["schema"] = {
          schemaValidated: validation.ok,
          validationIssueCount: validation.ok ? 0 : validation.issues.length,
          issues: validation.ok ? [] : validation.issues.map(categorizeIssue),
          expectedDimensionIds: dimensionIds,
          returnedDimensionIds: Array.from(new Set(returnedIds)),
          missingDimensionIds,
          duplicateDimensionIds: Array.from(new Set(duplicateDimensionIds)),
          unknownDimensionIds,
        };

        // ── §7: truncation heuristic ──
        const nearCeiling = provider.outputTokens !== null && provider.outputTokens >= CAREER_AI_CONFIG.maxOutputTokens * 0.95;
        const likelyOutputTruncation =
          provider.stopReason === "max_tokens" ||
          (nearCeiling && missingDimensionIds.length > 0) ||
          (provider.toolUseReturned && !provider.toolPayloadPresent);

        const truncation: FirstCallDiagnosticResult["truncation"] = {
          outputTokens: provider.outputTokens,
          maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
          stopReason: provider.stopReason,
          expectedDimensionCount: dimensionIds.length,
          returnedDimensionCount: returnedSet.size,
          likelyOutputTruncation,
        };

        // ── §8: verbosity metrics — counts only, no content ──
        // Compact contract (Command 05D.2 §3): evidence is now {section,
        // excerpt}|null (0 or 1, never an array) and recommendations were
        // removed entirely — these metrics are kept for continuity but are
        // structurally capped now, which is the point.
        const rawArray = Array.isArray(toolInput) ? (toolInput as unknown[]) : [];
        const evidenceCounts: number[] = [];
        const recommendationCounts: number[] = [];
        for (const r of rawArray) {
          if (r && typeof r === "object") {
            const o = r as Record<string, unknown>;
            evidenceCounts.push(o.evidence && typeof o.evidence === "object" ? 1 : 0);
          }
        }
        const avg = (xs: number[]) => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

        const verbosity: FirstCallDiagnosticResult["verbosity"] = {
          averageEvidenceItemsPerReturnedDimension: avg(evidenceCounts),
          averageRecommendationItemsPerReturnedDimension: avg(recommendationCounts),
          dimensionsWithMoreThan2EvidenceItems: evidenceCounts.length > 0 ? evidenceCounts.filter((c) => c > 2).length : null,
          dimensionsWithMoreThan2Recommendations: recommendationCounts.length > 0 ? recommendationCounts.filter((c) => c > 2).length : null,
        };

        return {
          success: provider.providerHttpStatus === 200,
          contextSize,
          provider,
          schema,
          truncation,
          verbosity,
          timedOut: false,
          totalDiagnosticLatencyMs: Date.now() - overallStart,
        } satisfies FirstCallDiagnosticResult;
      })(),
      FIRST_CALL_DIAGNOSTIC_TIMEOUTS.overallDiagnosticMs,
      "first-call diagnostic exceeded its overall time budget",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = message.includes("time budget") || message.includes("timed out");
    // §4/§3: use whatever context-size/provider data was captured before
    // the timeout fired, rather than always returning zeroed placeholders
    // — this is the exact gap this diagnostic was built to close.
    return {
      success: false,
      contextSize: captured.contextSize ?? {
        resumeCharacters: 0,
        resumeTokenEstimate: 0,
        methodologyCharacters: 0,
        methodologyTokenEstimate: 0,
        languageGuidanceCharacters: 0,
        languageGuidanceTokenEstimate: 0,
        seniorityGuidanceCharacters: 0,
        seniorityGuidanceTokenEstimate: 0,
        targetRoleContextCharacters: 0,
        targetRoleContextTokenEstimate: 0,
        jobDescriptionCharacters: 0,
        jobDescriptionTokenEstimate: 0,
        retrievedExampleCount: 0,
        retrievedExampleCharacters: 0,
        retrievedExampleTokenEstimate: 0,
        totalPromptCharacters: 0,
        totalInputTokenEstimate: 0,
        applicableDimensionCount: 0,
        retrievedExampleIds: [],
      },
      provider: captured.provider ?? {
        providerLatencyMs: null,
        providerHttpStatus: null,
        inputTokens: null,
        outputTokens: null,
        maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
        stopReason: null,
        toolUseReturned: false,
        toolName: null,
        toolPayloadPresent: false,
        providerRequestId: null,
        providerErrorType: null,
        providerErrorMessageSanitized: timedOut ? "diagnostic_timed_out" : message.slice(0, 300),
      },
      schema: {
        schemaValidated: false,
        validationIssueCount: 0,
        issues: [],
        expectedDimensionIds: [],
        returnedDimensionIds: [],
        missingDimensionIds: [],
        duplicateDimensionIds: [],
        unknownDimensionIds: [],
      },
      truncation: {
        outputTokens: captured.provider?.outputTokens ?? null,
        maxOutputTokens: CAREER_AI_CONFIG.maxOutputTokens,
        stopReason: captured.provider?.stopReason ?? null,
        expectedDimensionCount: captured.contextSize?.applicableDimensionCount ?? 0,
        returnedDimensionCount: 0,
        likelyOutputTruncation: false,
      },
      verbosity: {
        averageEvidenceItemsPerReturnedDimension: null,
        averageRecommendationItemsPerReturnedDimension: null,
        dimensionsWithMoreThan2EvidenceItems: null,
        dimensionsWithMoreThan2Recommendations: null,
      },
      timedOut,
      totalDiagnosticLatencyMs: Date.now() - overallStart,
    };
  }
}
