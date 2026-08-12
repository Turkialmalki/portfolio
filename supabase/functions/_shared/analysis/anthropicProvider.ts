/**
 * REAL AI PROVIDER ADAPTER — Anthropic Messages API (Command 05C §10–§13).
 *
 * Implements the exact `CareerAIProvider` contract `mockProvider.ts`
 * already satisfies (types.ts). Nothing here touches methodology,
 * scoring, projection, fact preservation, or evidence validation — this
 * module's only job is turning `AnalyzeDimensionsInput`/
 * `RewriteGenerationInput` into a prompt, calling the model, and handing
 * back raw-but-typed JSON for `schemaValidation.ts` and
 * `evidenceValidation.ts` to check exactly as hard as they check the
 * mock's output (§13, §17: the LLM never controls `overallScore` — it
 * never even sees a place to put one, see `types.ts`'s note on
 * `DimensionAIResult`).
 *
 * Auth: reads `AI_PROVIDER_API_KEY` from an Edge Function secret only
 * (§11) — this module never reads `Deno.env` itself; the key is injected
 * by `provider.ts`'s `resolveProvider()`, the same pattern used for
 * `readEnv` there, so this file runs identically under Deno and the Node
 * test harness (it just never gets constructed under Node without a key).
 *
 * No SDK dependency: the Anthropic Messages API is called with `fetch`
 * and a forced tool-use call, matching this directory's existing
 * dependency-free-under-both-runtimes discipline (methodology/knowledge
 * have none either). Structured output comes from a `tool_choice`-forced
 * tool call whose `input_schema` mirrors `DimensionAIResult`/
 * `RewriteCandidateResult` exactly — this narrows how far the model CAN
 * misbehave, but §13 still applies: nothing here loosens
 * `schemaValidation.ts` to accommodate it, and nothing here re-implements
 * the pipeline's one repair retry (`pipeline.ts` already calls
 * `analyzeDimensions` again with the same input on a validation failure;
 * this adapter is stateless per call).
 */
import { DIMENSION_IDS, EVIDENCE_QUALITIES, SIGNAL_LEVELS } from "../methodology/types.ts";
import type {
  AnalyzeDimensionsInput,
  CareerAIProvider,
  DimensionAIResult,
  RewriteCandidateResult,
  RewriteGenerationInput,
} from "./types.ts";
import { CAREER_AI_CONFIG } from "./config.ts";
import { callAnthropic } from "./anthropicClient.ts";

/**
 * COMPACT dimension-result schema (Command 05D.2 §3) — replaces the old
 * evidence[]/reason/recommendations[] shape. At most ONE evidence item per
 * dimension, a coarse `reasonCode` bucket, and one short free-text
 * sentence. This is the schema Command 05D.1's real-provider diagnostic
 * conclusively showed was needed: the old per-dimension contract couldn't
 * complete generation for 12 dimensions within any reasonable output
 * budget (measured: 4096/4096 output tokens, stop_reason "max_tokens",
 * zero dimensions successfully returned).
 *
 * Career V2 Part 4: `score: number` is gone. The model now picks a rubric
 * CLASSIFICATION — `signalLevel` (closed enum, same 5 bands every
 * dimension's `scoreAnchors` already documents) + `evidencePresent`/
 * `evidenceQuality` — and `methodology/scoring.ts`'s `rubricScoreFor`
 * turns that into the actual number. `signalLevel`/`evidenceQuality` are
 * real JSON-schema `enum`s, the same mechanism `dimensionId` and
 * `confidence` already use here without incident — this is NOT the
 * `reasonCode` pattern (a free string, deliberately never enum-enforced;
 * see schemaValidation.ts's note on why that field stays loose).
 */
export const DIMENSION_RESULT_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimensionId: { type: "string", enum: DIMENSION_IDS as unknown as string[] },
          signalLevel: {
            type: "string",
            enum: SIGNAL_LEVELS as unknown as string[],
            description:
              "Which rubric anchor band this dimension's evidence supports, from very_weak (matches the rubric's lowest anchor) to very_strong (matches its top anchor). Judge against the rubric's own anchor descriptions, not a felt sense of 0-100.",
          },
          evidencePresent: {
            type: "boolean",
            description: "Whether at least one concrete, checkable quote from the resume supports this classification.",
          },
          evidenceQuality: {
            type: "string",
            enum: EVIDENCE_QUALITIES as unknown as string[],
            description:
              "How strong the supporting evidence is: none (no checkable quote), limited (present but thin/generic), specific (a clear, concrete instance), strong (multiple or highly concrete instances). Use 'none' whenever evidencePresent is false.",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: ["object", "null"],
            description: "At most ONE verbatim excerpt from the resume, or null if none applies. Never more than one.",
            properties: {
              section: { type: "string" },
              excerpt: { type: "string", description: "A short verbatim quote, ideally under ~120 characters." },
            },
            required: ["section", "excerpt"],
          },
          reasonCode: {
            type: "string",
            description: "A short bucket label for why this classification, e.g. STRONG_ROLE_IDENTITY, RESPONSIBILITY_WITHOUT_OUTCOME, INSUFFICIENT_EVIDENCE. Pick the closest fit or OTHER.",
          },
          shortReason: {
            type: "string",
            description: "ONE short sentence of nuance, under ~160 characters. Never a paragraph.",
          },
        },
        required: ["dimensionId", "signalLevel", "evidencePresent", "evidenceQuality", "confidence", "reasonCode", "shortReason"],
      },
    },
  },
  required: ["results"],
} as const;

const REWRITE_RESULT_SCHEMA = {
  type: "object",
  properties: {
    candidate: {
      // Nullable-by-omission: the model returns {} (no `candidate` key) when
      // no safe rewrite exists, rather than inventing one.
      type: "object",
      properties: {
        before: { type: "string" },
        after: { type: "string" },
        classification: { type: "string", enum: ["fact_preserving", "fact_altering", "unverifiable"] },
        note: { type: "string" },
      },
      required: ["before", "after", "classification", "note"],
    },
  },
} as const;

interface AnthropicMessageResponse {
  content: Array<{ type: string; input?: unknown }>;
  usage?: { input_tokens: number; output_tokens: number };
  /** Anthropic's own enum, e.g. "end_turn" | "max_tokens" | "tool_use" — never model-generated content. Command 05D.3. */
  stop_reason?: string;
}

async function callAnthropicTool(
  apiKey: string,
  system: string,
  userText: string,
  toolName: string,
  schema: unknown,
  stage: string,
): Promise<{ input: unknown; usage?: { input_tokens: number; output_tokens: number }; stopReason: string | null }> {
  // On a non-2xx response, callAnthropic throws AnthropicProviderError with
  // safe diagnostics (status/type/requestId/sanitized message) only — see
  // anthropicClient.ts. Nothing here catches it; it propagates to the
  // pipeline and, ultimately, to the fixture/admin-mode response (§1).
  const raw = await callAnthropic(
    apiKey,
    {
      model: CAREER_AI_CONFIG.model,
      max_tokens: CAREER_AI_CONFIG.maxOutputTokens,
      // NOT `temperature`: claude-sonnet-5 400s on any non-default sampling
      // parameter (temperature/top_p/top_k) — see config.ts's note on
      // CAREER_AI_CONFIG.temperature. Determinism for this structured-
      // extraction call comes from `thinking: disabled` + the forced
      // tool_choice below, not from a sampling parameter.
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: userText }],
      tools: [{ name: toolName, description: `Return ${toolName} as structured JSON.`, input_schema: schema }],
      tool_choice: { type: "tool", name: toolName },
    },
    stage,
  );

  const data = raw as AnthropicMessageResponse;
  const toolUse = data.content.find((block) => block.type === "tool_use");
  if (!toolUse) throw new Error("anthropic_no_tool_use_block");
  return { input: toolUse.input, usage: data.usage, stopReason: data.stop_reason ?? null };
}

export const SYSTEM_PROMPT =
  "You are the evaluation engine behind a CV analysis product. You will be given " +
  "compact methodology rubrics and a structured resume. Classify strictly against the " +
  "given rubrics and dimensions only — for each dimension, pick the signalLevel whose " +
  "rubric anchor description the CV actually matches (very_weak/weak/mixed/strong/" +
  "very_strong), never a felt sense of a precise number; the product's scoring engine, " +
  "not you, turns that classification into a number. Any evidence you cite must be a " +
  "VERBATIM quote from the resume text you were given — never invent metrics, team " +
  "sizes, titles, technologies, or achievements not present in the source text. If the " +
  "resume does not support a dimension, say so with low confidence and evidencePresent: " +
  "false rather than inventing evidence. You never compute or return an overall score — " +
  "only per-dimension classifications. BE CONCISE: at most one evidence excerpt per " +
  "dimension (or none), one short reasonCode bucket, and one short sentence " +
  "(shortReason, under ~160 characters) — never a paragraph, never a list of " +
  "recommendations. This budget is deliberately tight so every requested dimension " +
  "fits in the response. " +
  "LANGUAGE: `context.language` is the language the RESUME ITSELF is written in — " +
  "it only tells you which writing-quality norms to judge language_quality against. " +
  "`context.outputLanguage` is the language of the CUSTOMER using this product. " +
  "`shortReason` MUST always be written in natural, professional `context.outputLanguage` " +
  "prose — regardless of what language the resume is in — never a literal translation, " +
  "never a mix of languages within a sentence. The only exceptions are proper nouns, " +
  "acronyms, and product/company/technology names with no natural equivalent (e.g. ATS, " +
  "LinkedIn, SAP, React) and currency-prefixed figures (e.g. $27M), which may stay as-is. " +
  "`evidence.excerpt` is a verbatim quote FROM THE RESUME and must never be translated.";

export function buildDimensionsPrompt(input: AnalyzeDimensionsInput): string {
  const context = {
    ...input.context,
    outputLanguage: input.context.outputLanguage ?? (input.context.language === "ar" ? "ar" : "en"),
  };
  return JSON.stringify({
    task: "analyze_dimensions",
    dimensionIds: input.dimensionIds,
    context,
    // §6: the COMPACT runtime methodology (methodology/runtimeMethodology.ts)
    // — a projection of the same rubrics compose.ts uses, trimmed for this
    // call only. See that file's header for why the full rubric objects
    // were the actual source of the Command 05D.1 truncation, not
    // sending redundant seniority/language levels (compose.ts already
    // filtered those correctly).
    runtimeMethodology: input.methodologySections,
    examples: input.examples,
    normalizedResume: input.normalizedResume,
  });
}

function buildRewritePrompt(input: RewriteGenerationInput): string {
  // §18: minimal context only — the original bullet plus role/seniority/
  // language, not the full normalized resume or the methodology. The
  // rewrite task only needs the ONE bullet's own words plus fact-
  // preservation guidance (§19, sent via SYSTEM_PROMPT's shared rules —
  // no separate methodology payload needed for a single-bullet rewrite).
  return JSON.stringify({
    task: "generate_rewrite",
    dimension: input.dimension,
    seniority: input.context.seniority,
    language: input.context.language,
    candidateBefore: input.candidateBefore,
    instruction:
      "Rewrite candidateBefore into a stronger bullet using ONLY facts already present " +
      "in candidateBefore — do not add any new fact (no metric, team size, revenue, " +
      "technology, title, date, or outcome not already stated). If no safe, " +
      "fact-preserving rewrite is possible, return an empty object (omit `candidate`).",
  });
}

export function createAnthropicCareerAIProvider(apiKey: string): CareerAIProvider {
  // Closure-scoped, not module-scoped: a fresh provider instance is created
  // per Edge Function invocation (see provider.ts's resolveProvider), so
  // this never leaks usage between unrelated requests.
  let lastUsage: { inputTokens: number; outputTokens: number; stopReason: string | null } | undefined;

  return {
    name: "anthropic",
    model: CAREER_AI_CONFIG.model,

    async analyzeDimensions(input: AnalyzeDimensionsInput): Promise<DimensionAIResult[]> {
      const { input: raw, usage, stopReason } = await callAnthropicTool(
        apiKey,
        SYSTEM_PROMPT,
        buildDimensionsPrompt(input),
        "submit_dimension_analysis",
        DIMENSION_RESULT_SCHEMA,
        "dimension_analysis",
      );
      lastUsage = usage ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, stopReason } : { inputTokens: 0, outputTokens: 0, stopReason };
      const results = (raw as { results?: unknown }).results;
      // Deliberately returned as-is, untyped-cast at the boundary only —
      // schemaValidation.ts (§13/§29) is the sole authority on whether
      // this is actually well-formed; this adapter does not pre-filter or
      // "fix" it, so a misbehaving model surfaces as a validation failure,
      // not a silently-repaired one.
      return (Array.isArray(results) ? results : []) as DimensionAIResult[];
    },

    async generateRewrite(input: RewriteGenerationInput): Promise<RewriteCandidateResult | null> {
      const { input: raw, usage, stopReason } = await callAnthropicTool(
        apiKey,
        SYSTEM_PROMPT,
        buildRewritePrompt(input),
        "submit_rewrite_candidate",
        REWRITE_RESULT_SCHEMA,
        "rewrite_generation",
      );
      lastUsage = usage ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, stopReason } : { inputTokens: 0, outputTokens: 0, stopReason };
      const candidate = (raw as { candidate?: unknown }).candidate;
      return candidate ? (candidate as RewriteCandidateResult) : null;
    },

    lastCallUsage(): { inputTokens: number; outputTokens: number; stopReason: string | null } | undefined {
      return lastUsage;
    },
  };
}
