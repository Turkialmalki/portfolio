/**
 * TEMPORARY DIAGNOSTIC PATHS (Command 05D §3–§6).
 *
 * Isolates three layers, in order, so a real-provider failure can be
 * attributed to the right one instead of collapsing into one opaque
 * ANALYSIS_FAILED / 502:
 *
 *   1. runBasicSmokeTest  — API key / billing / model access / basic
 *      Messages API request shape. No tools, no resume, no methodology.
 *   2. runToolSmokeTest   — the forced tool_choice + input_schema
 *      mechanism CareerAIProvider actually uses, with a trivial synthetic
 *      schema and fictional data. Isolates "basic API works" from "our
 *      structured-output mechanism works."
 *
 * Both are reachable ONLY through analyze-resume's existing admin-key gate
 * (mode: "smoke_test_basic" / "smoke_test_tool") — see index.ts. Remove
 * this file and its two call sites once the real-provider path is fully
 * validated end to end; it exists to debug the Command 05D 502, not as a
 * permanent product surface.
 *
 * Same discipline as anthropicClient.ts: never return/log the API key,
 * never return/log the full request or response — only the counts/codes
 * the caller needs to diagnose the failure.
 */
import { CAREER_AI_CONFIG } from "./config.ts";
import { AnthropicProviderError, callAnthropic } from "./anthropicClient.ts";
import { buildProviderDiagnosticBody } from "./anthropicClient.ts";

export interface SmokeTestResult {
  success: boolean;
  providerHttpStatus: number | null;
  providerErrorType: string | null;
  providerRequestId: string | null;
  providerErrorMessageSanitized: string | null;
  latencyMs: number;
  /** Only populated on success, and only ever this fixed, non-sensitive reply text. */
  responseText?: string;
  diagnosticCode?: string;
}

interface AnthropicTextResponse {
  content: Array<{ type: string; text?: string }>;
}

function fromError(err: unknown, latencyMs: number): SmokeTestResult {
  if (err instanceof AnthropicProviderError) {
    const diag = buildProviderDiagnosticBody(err);
    return {
      success: false,
      providerHttpStatus: diag.providerHttpStatus,
      providerErrorType: diag.providerErrorType,
      providerRequestId: diag.providerRequestId,
      providerErrorMessageSanitized: diag.providerErrorMessageSanitized,
      latencyMs,
      diagnosticCode: diag.diagnosticCode,
    };
  }
  // Non-provider failure (network error before any HTTP response, etc.) —
  // no provider fields to report, but never swallow the fact that it failed.
  return {
    success: false,
    providerHttpStatus: null,
    providerErrorType: null,
    providerRequestId: null,
    providerErrorMessageSanitized: err instanceof Error ? err.message.slice(0, 300) : "unknown_error",
    latencyMs,
  };
}

/**
 * §3: the smallest possible Anthropic call. No tools, no resume, no
 * methodology, no retrieval, no scoring — isolates the API key, billing/
 * access, model access, and basic request format from everything else in
 * the pipeline.
 */
export async function runBasicSmokeTest(apiKey: string): Promise<SmokeTestResult> {
  const start = Date.now();
  try {
    const raw = await callAnthropic(
      apiKey,
      {
        model: CAREER_AI_CONFIG.model,
        max_tokens: 32,
        thinking: { type: "disabled" },
        messages: [{ role: "user", content: "Reply with OK" }],
      },
      "smoke_test_basic",
    );
    const latencyMs = Date.now() - start;
    const data = raw as AnthropicTextResponse;
    const textBlock = data.content.find((b) => b.type === "text");
    return {
      success: true,
      providerHttpStatus: 200,
      providerErrorType: null,
      providerRequestId: null,
      providerErrorMessageSanitized: null,
      latencyMs,
      responseText: textBlock?.text?.slice(0, 20), // bounded — this is Claude's own fixed reply, not user content
    };
  } catch (err) {
    return fromError(err, Date.now() - start);
  }
}

/**
 * §5: the same forced tool_choice + input_schema mechanism
 * `anthropicProvider.ts` actually uses, but with a tiny synthetic schema
 * and fictional data — isolates "the tool_choice/schema mechanism itself
 * works" from "the full Career methodology prompt works."
 */
export async function runToolSmokeTest(apiKey: string): Promise<SmokeTestResult> {
  const start = Date.now();
  try {
    const raw = await callAnthropic(
      apiKey,
      {
        model: CAREER_AI_CONFIG.model,
        max_tokens: 64,
        thinking: { type: "disabled" },
        messages: [{ role: "user", content: "Set ok to true and note to 'smoke test'." }],
        tools: [
          {
            name: "submit_smoke_test_result",
            description: "Return a tiny synthetic test object.",
            input_schema: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                note: { type: "string" },
              },
              required: ["ok", "note"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "submit_smoke_test_result" },
      },
      "smoke_test_tool",
    );
    const latencyMs = Date.now() - start;
    const data = raw as { content: Array<{ type: string; input?: unknown }> };
    const toolUse = data.content.find((b) => b.type === "tool_use");
    return {
      success: Boolean(toolUse),
      providerHttpStatus: 200,
      providerErrorType: null,
      providerRequestId: null,
      providerErrorMessageSanitized: toolUse ? null : "no_tool_use_block_returned",
      latencyMs,
      responseText: toolUse ? JSON.stringify(toolUse.input).slice(0, 100) : undefined,
    };
  } catch (err) {
    return fromError(err, Date.now() - start);
  }
}
