/**
 * KNOWLEDGE APPROVAL SAFETY (Command 05 §0).
 *
 * Two modes exist, both approved-only in what they hand to the AI:
 *   - "approved"  — production shape: pool comes from the real knowledge
 *                   base, filtered to status = "approved".
 *   - "fixture"   — operator/dev shape: pool comes from the same
 *                   in-repo knowledge source (buildRetrievalPool()) used
 *                   by the Command 04 test harness, still filtered to
 *                   status = "approved".
 *
 * There is deliberately no "all" mode. `retrieveExamples`'s own
 * `RetrievalOptions.mode` only understands "production" (approved-only)
 * and "operator_review" (also sees candidates) — this module NEVER passes
 * "operator_review" from the analysis engine, in either KnowledgeMode.
 * That is the actual enforcement point: whichever KnowledgeMode is
 * selected, retrieval is hard-coded to the approved-only filter below, so
 * there is no code path — today or from a future refactor — that can
 * silently promote the 72 unapproved candidate rows into a live analysis.
 */
import type { RetrievalOptions } from "../knowledge/types.ts";
import type { KnowledgeMode } from "./types.ts";

export function retrievalOptionsFor(
  mode: KnowledgeMode,
  maxExamples: number,
): RetrievalOptions {
  void mode; // both KnowledgeModes resolve to the same approved-only filter — see doc comment above.
  return { mode: "production", maxExamples };
}
