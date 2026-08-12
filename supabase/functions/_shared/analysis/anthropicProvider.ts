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
import { DIMENSION_IDS } from "../methodology/types.ts";
import type {
  AnalyzeDimensionsInput,
  CareerAIProvider,
  DimensionAIResult,
  RewriteCandidateResult,
  RewriteGenerationInput,
} from "./types.ts";
import { CAREER_AI_CONFIG } from "./config.ts";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

const DIMENSION_RESULT_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimensionId: { type: "string", enum: DIMENSION_IDS as unknown as string[] },
          score: { type: "number", minimum: 0, maximum: 100 },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section: { type: "string" },
                text: { type: "string" },
                role: { type: "string" },
              },
              required: ["section", "text"],
            },
          },
          reason: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
        },
        required: ["dimensionId", "score", "confidence", "evidence", "reason", "recommendations"],
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
}

async function callAnthropicTool(
  apiKey: string,
  system: string,
  userText: string,
  toolName: string,
  schema: unknown,
): Promise<{ input: unknown; usage?: { input_tokens: number; output_tokens: number } }> {
  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": CAREER_AI_CONFIG.apiVersion,
    },
    body: JSON.stringify({
      model: CAREER_AI_CONFIG.model,
      max_tokens: CAREER_AI_CONFIG.maxOutputTokens,
      temperature: CAREER_AI_CONFIG.temperature,
      system,
      messages: [{ role: "user", content: userText }],
      tools: [{ name: toolName, description: `Return ${toolName} as structured JSON.`, input_schema: schema }],
      tool_choice: { type: "tool", name: toolName },
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    // §18: never log raw CV content or prompt bodies — only status/shape.
    throw new Error(`anthropic_api_error status=${res.status} bodyLength=${bodyText.length}`);
  }

  const data = (await res.json()) as AnthropicMessageResponse;
  const toolUse = data.content.find((block) => block.type === "tool_use");
  if (!toolUse) throw new Error("anthropic_no_tool_use_block");
  return { input: toolUse.input, usage: data.usage };
}

const SYSTEM_PROMPT =
  "You are the evaluation engine behind a CV analysis product. You will be given " +
  "methodology rubrics and a structured resume. Score strictly against the given " +
  "rubrics and dimensions only. Every claim you make must be backed by a VERBATIM " +
  "quote from the resume text you were given — never invent metrics, team sizes, " +
  "titles, technologies, or achievements not present in the source text. If the " +
  "resume does not support a dimension, say so with low confidence rather than " +
  "inventing evidence. You never compute or return an overall score — only " +
  "per-dimension scores.";

function buildDimensionsPrompt(input: AnalyzeDimensionsInput): string {
  return JSON.stringify({
    task: "analyze_dimensions",
    dimensionIds: input.dimensionIds,
    context: input.context,
    methodologySections: input.methodologySections,
    examples: input.examples,
    normalizedResume: input.normalizedResume,
  });
}

function buildRewritePrompt(input: RewriteGenerationInput): string {
  return JSON.stringify({
    task: "generate_rewrite",
    dimension: input.dimension,
    context: input.context,
    candidateBefore: input.candidateBefore,
    instruction:
      "Rewrite candidateBefore into a stronger bullet using ONLY facts already present " +
      "in candidateBefore or normalizedResume — do not add any new fact. If no safe, " +
      "fact-preserving rewrite is possible, return an empty object (omit `candidate`).",
    normalizedResume: input.normalizedResume,
  });
}

export function createAnthropicCareerAIProvider(apiKey: string): CareerAIProvider {
  return {
    name: "anthropic",
    model: CAREER_AI_CONFIG.model,

    async analyzeDimensions(input: AnalyzeDimensionsInput): Promise<DimensionAIResult[]> {
      const { input: raw } = await callAnthropicTool(
        apiKey,
        SYSTEM_PROMPT,
        buildDimensionsPrompt(input),
        "submit_dimension_analysis",
        DIMENSION_RESULT_SCHEMA,
      );
      const results = (raw as { results?: unknown }).results;
      // Deliberately returned as-is, untyped-cast at the boundary only —
      // schemaValidation.ts (§13/§29) is the sole authority on whether
      // this is actually well-formed; this adapter does not pre-filter or
      // "fix" it, so a misbehaving model surfaces as a validation failure,
      // not a silently-repaired one.
      return (Array.isArray(results) ? results : []) as DimensionAIResult[];
    },

    async generateRewrite(input: RewriteGenerationInput): Promise<RewriteCandidateResult | null> {
      const { input: raw } = await callAnthropicTool(
        apiKey,
        SYSTEM_PROMPT,
        buildRewritePrompt(input),
        "submit_rewrite_candidate",
        REWRITE_RESULT_SCHEMA,
      );
      const candidate = (raw as { candidate?: unknown }).candidate;
      return candidate ? (candidate as RewriteCandidateResult) : null;
    },
  };
}
