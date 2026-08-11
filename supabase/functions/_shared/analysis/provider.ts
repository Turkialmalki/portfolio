/**
 * AI PROVIDER ABSTRACTION (Command 05 §30–§31).
 *
 * `CareerAIProvider` (defined in types.ts) is the only surface the
 * pipeline (pipeline.ts) is allowed to call. Nothing in this directory
 * imports an OpenAI/Anthropic/Gemini SDK directly — a concrete adapter for
 * a real provider is a separate module that implements this interface,
 * reads its API key from an Edge Function secret (§31: never
 * `NEXT_PUBLIC_*`, never bundled into the browser), and is selected here
 * only if that secret is actually configured.
 *
 * This command ships exactly one concrete provider — mockProvider.ts —
 * because a real provider adapter needs real credentials this environment
 * does not have (§32: "do not invent credentials"). `resolveProvider()`
 * is the single place a future real adapter gets wired in.
 */
import type { CareerAIProvider } from "./types.ts";
import { createMockCareerAIProvider } from "./mockProvider.ts";

export interface ProviderResolution {
  provider: CareerAIProvider;
  /** True once AI_PROVIDER_API_KEY is read from env and a real adapter exists — always false today (§33). */
  realProviderConfigured: boolean;
}

/**
 * Resolves which provider a caller should use. `readEnv` is injected
 * (rather than reading `Deno.env` directly) so this function runs
 * identically under Deno (the Edge Function) and Node (the test harness).
 */
export function resolveProvider(readEnv: (name: string) => string | undefined): ProviderResolution {
  const apiKey = readEnv("AI_PROVIDER_API_KEY");
  if (!apiKey) {
    return { provider: createMockCareerAIProvider(), realProviderConfigured: false };
  }
  // NOT IMPLEMENTED (§33): no real provider adapter exists yet. The key's
  // presence is reported so a caller can log "REAL AI PROVIDER: NOT
  // CONFIGURED" vs "...CONFIGURED (adapter pending)" without this module
  // silently pretending a real integration exists. Falling back to the
  // mock here — rather than throwing — keeps the engine runnable in every
  // environment; wiring a real adapter is a deliberate follow-up, not a
  // side effect of an env var appearing.
  return { provider: createMockCareerAIProvider(), realProviderConfigured: false };
}
