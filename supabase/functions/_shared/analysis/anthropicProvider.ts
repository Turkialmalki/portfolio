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
import { DIMENSION_IDS, EVIDENCE_QUALITIES, SIGNAL_LEVELS, type DimensionId } from "../methodology/types.ts";
import {
  AI_CONFIDENCE_VALUES,
  type AnalyzeDimensionsInput,
  type CareerAIProvider,
  type DimensionAIResult,
  type RewriteCandidateResult,
  type RewriteGenerationInput,
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
/**
 * `strict: true` (set where this schema is attached to a tool, below) is
 * Anthropic's grammar-constrained-sampling guarantee that a `tool_use`
 * block's `input` structurally matches this schema exactly — required
 * fields present, enums respected, types correct.
 *
 * TWO real production incidents (Career V2 email-test verification),
 * both `stop_reason: "tool_use"` (clean, non-truncated completions) that
 * still failed schemaValidation.ts:
 *  1. Before `strict` existed at all: a schema-shaped-but-EMPTY `results`
 *     array (nothing forbade it).
 *  2. After `strict`/`minItems:1` were live: a well-formed but
 *     INCOMPLETE `results` array (2 of 13 requested dimensions present,
 *     11 simply omitted) — `minItems: 1` was satisfied, just not what
 *     was asked for. A JSON Schema **array** genuinely cannot express
 *     "exactly these N specific items, each exactly once" — strict
 *     mode's supported subset only allows array `minItems` of 0 or 1
 *     (never an exact/large count), and `maxItems` isn't supported at
 *     all there.
 *
 * The fix is a different SHAPE, not a tighter array constraint: `results`
 * is now an OBJECT keyed by dimension id, not an array of items each
 * carrying their own `dimensionId`. JSON Schema's `required` on an
 * object DOES support an exact, named list of keys — combined with
 * `additionalProperties: false`, this makes "return exactly these
 * dimensions, each exactly once, nothing else" a real structural
 * guarantee instead of a runtime-validator-only check:
 *   - every id in `dimensionIds` is a `required` property → omitting one
 *     violates the schema itself (closes incident #2's exact gap).
 *   - an id outside `dimensionIds` can't exist as a property at all
 *     (`additionalProperties: false`) → no "chose a dimension nobody
 *     asked for" case.
 *   - a JSON object cannot carry two properties with the same key →
 *     duplicate dimension results are impossible BY CONSTRUCTION, not
 *     just checked for.
 * `dimensionId` is therefore no longer repeated inside each value at
 * all — the object KEY is the dimension's identity. `analyzeDimensions`
 * below (the adapter boundary) converts this keyed object back into the
 * `DimensionAIResult[]` array every downstream stage (scoring.ts,
 * findings.ts, schemaValidation.ts) already consumes unchanged, deriving
 * `dimensionId` from the key — see `keyedResultsToArray`.
 *
 * schemaValidation.ts's array-shaped validator remains in place
 * unchanged as defense-in-depth (§9/§29: never trust AI JSON, even
 * strict-mode JSON) — it now runs against the ADAPTED array, and its
 * "missing dimension result"/"was not requested" checks become expected
 * to essentially never fire post-fix rather than routinely catching a
 * schema that was too loose to prevent them.
 */
export function buildDimensionResultSchema(dimensionIds: readonly DimensionId[]) {
  const resultValueSchema = {
    type: "object",
    properties: {
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
      confidence: { type: "string", enum: AI_CONFIDENCE_VALUES as unknown as string[] },
      evidence: {
        type: ["object", "null"],
        description: "At most ONE verbatim excerpt from the resume, or null if none applies. Never more than one.",
        properties: {
          section: { type: "string" },
          excerpt: { type: "string", description: "A short verbatim quote, ideally under ~120 characters." },
        },
        required: ["section", "excerpt"],
        additionalProperties: false,
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
    required: ["signalLevel", "evidencePresent", "evidenceQuality", "confidence", "reasonCode", "shortReason"],
    additionalProperties: false,
  } as const;

  const resultsProperties: Record<string, typeof resultValueSchema> = {};
  for (const id of dimensionIds) resultsProperties[id] = resultValueSchema;

  return {
    type: "object",
    properties: {
      results: {
        type: "object",
        description: "Keyed by dimension id — one property per requested dimension, each holding that dimension's classification. No other keys.",
        properties: resultsProperties,
        required: [...dimensionIds],
        additionalProperties: false,
      },
    },
    required: ["results"],
    additionalProperties: false,
  };
}

/** The full-dimension-set schema — used by the contract-drift test suite as the "canonical" shape to diff against. Real calls always use `buildDimensionResultSchema(input.dimensionIds)` (the per-call-scoped version) above. */
export const DIMENSION_RESULT_SCHEMA = buildDimensionResultSchema(DIMENSION_IDS);

/**
 * SCHEMA PREFLIGHT — a pure, local, $0 self-check that our OWN generated
 * schema is actually well-formed BEFORE spending a real Anthropic
 * request on it. Anthropic's `strict: true` guarantees the MODEL's
 * output conforms to whatever schema we hand it — it says nothing about
 * whether the schema we built is itself sane. Called from
 * `analyzeDimensions` on every real call (negligible cost — pure
 * synchronous object traversal over ≤15 small objects).
 *
 * Throws a plain `Error` (never `AnalysisPipelineError` — this module
 * has no opinion on `AnalysisFailureCode`/`stage`; that classification
 * stays pipeline.ts's job) with a short, fixed, code-authored message
 * identifying exactly which invariant failed — never any dimension-
 * specific content beyond the id itself (a closed methodology
 * identifier, not customer data).
 */
export function assertGeneratedAnalysisToolSchema(schema: unknown, expectedDimensionIds: readonly DimensionId[]): void {
  const fail = (reason: string): never => {
    throw new Error(`schema_preflight_failed: ${reason}`);
  };
  if (!schema || typeof schema !== "object") fail("schema is not an object");
  const top = schema as Record<string, unknown>;
  if (top.type !== "object") fail("top-level type must be 'object'");
  if (top.additionalProperties !== false) fail("top-level additionalProperties must be false");
  if (!Array.isArray(top.required) || !top.required.includes("results")) fail("top-level required must include 'results'");

  const props = top.properties as Record<string, unknown> | undefined;
  const results = (props?.results ?? undefined) as Record<string, unknown> | undefined;
  if (!results || typeof results !== "object") fail("properties.results is missing");
  const resultsObj = results!;
  if (resultsObj.type !== "object") fail("results.type must be 'object' (keyed-by-dimension, not an array)");
  if (resultsObj.additionalProperties !== false) fail("results.additionalProperties must be false");

  const resultsProps = resultsObj.properties as Record<string, unknown> | undefined;
  if (!resultsProps || typeof resultsProps !== "object") fail("results.properties is missing");
  const resultsPropsObj = resultsProps!;
  const actualKeys = Object.keys(resultsPropsObj);
  const expectedSet = new Set<string>(expectedDimensionIds);
  const actualSet = new Set<string>(actualKeys);
  if (actualKeys.length !== expectedDimensionIds.length || ![...expectedSet].every((id) => actualSet.has(id))) {
    fail(`results.properties keys must exactly equal the expected dimension set (expected ${expectedDimensionIds.length}, got ${actualKeys.length})`);
  }
  const requiredKeys: unknown[] = Array.isArray(resultsObj.required) ? resultsObj.required : [];
  if (!Array.isArray(resultsObj.required) || requiredKeys.length !== expectedDimensionIds.length || !expectedDimensionIds.every((id) => requiredKeys.includes(id))) {
    fail("results.required must exactly equal the expected dimension set");
  }
  // No duplicates possible in `properties` (object keys are inherently
  // unique) or in `expectedDimensionIds` itself (methodology invariant,
  // checked here defensively rather than assumed).
  if (new Set(expectedDimensionIds).size !== expectedDimensionIds.length) fail("expectedDimensionIds itself contains a duplicate");

  const requiredValueFields = ["signalLevel", "evidencePresent", "evidenceQuality", "confidence", "reasonCode", "shortReason"];
  for (const id of expectedDimensionIds) {
    const valueSchema = resultsPropsObj[id] as Record<string, unknown> | undefined;
    if (!valueSchema || typeof valueSchema !== "object") fail(`results.properties["${id}"] is missing`);
    const valueSchemaObj = valueSchema!;
    if (valueSchemaObj.type !== "object") fail(`results.properties["${id}"].type must be 'object'`);
    if (valueSchemaObj.additionalProperties !== false) fail(`results.properties["${id}"].additionalProperties must be false`);
    const valueProps = valueSchemaObj.properties as Record<string, unknown> | undefined;
    const valueRequired: unknown[] = Array.isArray(valueSchemaObj.required) ? valueSchemaObj.required : [];
    if (!valueProps || typeof valueProps !== "object") fail(`results.properties["${id}"].properties is missing`);
    if (!Array.isArray(valueSchemaObj.required)) fail(`results.properties["${id}"].required is missing`);
    const valuePropsObj = valueProps!;
    for (const field of requiredValueFields) {
      if (!(field in valuePropsObj)) fail(`results.properties["${id}"] is missing property "${field}"`);
      if (!valueRequired.includes(field)) fail(`results.properties["${id}"].required is missing "${field}"`);
    }
    // Every `required` entry must actually exist in `properties` — the
    // general form of the check above, catches a future field rename
    // that updates one list but not the other.
    for (const field of valueRequired) {
      if (typeof field !== "string" || !(field in valuePropsObj)) fail(`results.properties["${id}"].required lists "${String(field)}" which is not in its properties`);
    }
  }

  // No non-JSON-serializable value (undefined/NaN/function/Set/Map) and
  // no circular reference can be hiding anywhere in the tree — a single
  // stringify+parse+diff proves both at once. JSON.stringify silently
  // DROPS `undefined`/function values (rather than throwing), so an
  // object-key-count comparison after a round trip catches that class
  // too, not just the circular-reference case (which throws directly).
  let json: string;
  try {
    json = JSON.stringify(schema);
  } catch (e) {
    fail(`schema is not JSON-serializable (${e instanceof Error ? e.constructor.name : typeof e} — likely a circular reference)`);
    return;
  }
  const roundTripped = JSON.parse(json) as Record<string, unknown>;
  const roundTrippedResults = (roundTripped.properties as Record<string, unknown>)?.results as Record<string, unknown> | undefined;
  const roundTrippedKeys = roundTrippedResults && typeof roundTrippedResults.properties === "object" ? Object.keys(roundTrippedResults.properties as object) : [];
  if (!sameStringSet(roundTrippedKeys, actualKeys)) fail("results.properties keys did not survive a JSON round trip unchanged");
  const roundTrippedRequired = Array.isArray(roundTrippedResults?.required) ? (roundTrippedResults!.required as unknown[]) : [];
  if (!sameStringSet(roundTrippedRequired as string[], requiredKeys as string[])) fail("results.required did not survive a JSON round trip unchanged");
}

function sameStringSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && new Set(a).size === a.length && a.every((v) => b.includes(v));
}

/**
 * Adapter boundary: converts the strict tool's `{results: {dimensionId:
 * {...}}}` keyed-object shape into the flat `DimensionAIResult`-ish
 * array shape every downstream stage already consumes — `dimensionId`
 * comes from the object KEY (the very thing `required`/
 * `additionalProperties:false` above structurally enforce), never
 * re-declared inside the value, so it can never disagree with its own
 * key. Exported standalone so it's unit-testable without a real
 * Anthropic call (see supabase/tests/analysis/harness.ts). Deliberately
 * returns `unknown[]`, not `DimensionAIResult[]` — schemaValidation.ts
 * remains the sole authority on whether each entry is actually
 * well-formed (§13/§29); this function does not pre-filter or "fix"
 * anything, so a malformed value still surfaces as a validation failure,
 * never a silently-repaired one.
 */
export function keyedResultsToArray(resultsObj: unknown): unknown[] {
  if (!resultsObj || typeof resultsObj !== "object" || Array.isArray(resultsObj)) return [];
  return Object.entries(resultsObj as Record<string, unknown>).map(([dimensionId, value]) => ({
    dimensionId,
    ...(value && typeof value === "object" ? (value as Record<string, unknown>) : {}),
  }));
}

const REWRITE_RESULT_SCHEMA = {
  type: "object",
  properties: {
    candidate: {
      // Nullable-by-omission: the model returns {} (no `candidate` key) when
      // no safe rewrite exists, rather than inventing one. `candidate`
      // deliberately stays out of the top-level `required` below so
      // strict mode still allows omitting it entirely (Anthropic's
      // strict subset: a property absent from `required` is optional,
      // no nullable-union workaround needed for an object-typed field).
      type: "object",
      properties: {
        before: { type: "string" },
        after: { type: "string" },
        classification: { type: "string", enum: ["fact_preserving", "fact_altering", "unverifiable"] },
        note: { type: "string" },
      },
      required: ["before", "after", "classification", "note"],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
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
      // `strict: true` (a top-level property of the tool definition, not
      // inside input_schema) turns the schema above from a hint into an
      // enforced grammar — see DIMENSION_RESULT_SCHEMA's own comment for
      // exactly which production failure this closes.
      tools: [{ name: toolName, description: `Return ${toolName} as structured JSON.`, input_schema: schema, strict: true }],
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
  "only per-dimension classifications. The tool's schema requires a classification for " +
  "EVERY dimension in dimensionIds, keyed by that dimension's id — never fewer, never " +
  "more, never one you weren't asked for. BE CONCISE: at most one evidence excerpt per " +
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
      // Schema is built PER CALL, scoped to exactly this call's requested
      // dimensions (input.dimensionIds) — the single source of truth
      // already shared with the prompt (buildDimensionsPrompt below) and
      // with pipeline.ts's own `expected` set passed to
      // schemaValidation.ts. No second, independently-maintained
      // dimension list exists anywhere in this path.
      const schema = buildDimensionResultSchema(input.dimensionIds);
      // $0 local self-check BEFORE spending a real request on it —
      // `strict:true` guarantees the MODEL's output matches whatever
      // schema we send; it says nothing about whether WE built that
      // schema correctly. See the function's own doc.
      assertGeneratedAnalysisToolSchema(schema, input.dimensionIds);
      const { input: raw, usage, stopReason } = await callAnthropicTool(
        apiKey,
        SYSTEM_PROMPT,
        buildDimensionsPrompt(input),
        "submit_dimension_analysis",
        schema,
        "dimension_analysis",
      );
      lastUsage = usage ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, stopReason } : { inputTokens: 0, outputTokens: 0, stopReason };
      return keyedResultsToArray((raw as { results?: unknown }).results) as DimensionAIResult[];
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
