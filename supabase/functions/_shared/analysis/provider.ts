/**
 * AI PROVIDER ABSTRACTION (Command 05 §30–§31, Command 05C §10–§11).
 *
 * `CareerAIProvider` (defined in types.ts) is the only surface the
 * pipeline (pipeline.ts) is allowed to call. Nothing outside this file
 * and anthropicProvider.ts imports an Anthropic/OpenAI/Gemini SDK or
 * touches `fetch` for a model call — a concrete adapter for a real
 * provider is a separate module that implements this interface, reads
 * its API key from an Edge Function secret (§11: never `NEXT_PUBLIC_*`,
 * never bundled into the browser), and is selected here only if that
 * secret is actually configured.
 *
 * Two concrete providers exist: mockProvider.ts (always available, no
 * credentials) and anthropicProvider.ts (real, selected only when
 * `AI_PROVIDER_API_KEY` is present). `resolveProvider()` is the single
 * place either gets wired in — nothing else in the pipeline chooses.
 */
import type { CareerAIProvider } from "./types.ts";
import { createMockCareerAIProvider } from "./mockProvider.ts";
import { createAnthropicCareerAIProvider } from "./anthropicProvider.ts";

export interface ProviderResolution {
  provider: CareerAIProvider;
  /** True once AI_PROVIDER_API_KEY is read from env and the real adapter is actually selected. */
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
  return { provider: createAnthropicCareerAIProvider(apiKey), realProviderConfigured: true };
}
