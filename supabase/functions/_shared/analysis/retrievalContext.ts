/**
 * RETRIEVAL INTEGRATION (Command 05 §14–§17).
 *
 * Wires the Command 04 deterministic ranker (`retrieveExamples`) into an
 * analysis run: builds a `RetrievalContext` from the request plus a light
 * keyword-based role/industry detector, retrieves at most
 * `EXAMPLE_BUDGET.default` examples, and records WHY each one ranked
 * (§15) for development/audit metadata only.
 *
 * Two hard behaviors fall out of Command 04's ranker for free and are
 * documented here rather than re-implemented:
 *
 *  - §1 Arabic fallback: `retrieveExamples` hard-filters by
 *    `example.language !== context.language`. The current knowledge base
 *    has zero Arabic operator examples (Command 04 finding), so an
 *    Arabic request always retrieves zero — never English examples
 *    translated on the fly. If/when approved Arabic examples exist, they
 *    start flowing through this same path with no code change here.
 *  - §16 role/industry fallback: if no roleFamily/industry can be
 *    detected with reasonable confidence, `context.roleFamily` /
 *    `context.industry` are simply left undefined. `retrieveExamples`
 *    still scores role-agnostic ("any"/null) examples reasonably, but a
 *    poor match naturally loses to nothing rather than to a wrong-domain
 *    example, because nothing forces a retrieval floor.
 */
import type { AnalysisContext, DimensionId } from "../methodology/types.ts";
import { ROLE_PATTERNS } from "../methodology/contextPatterns.ts";
import type { KnowledgeLanguage, RetrievalContext, RetrievalExample, RoleFamily } from "../knowledge/types.ts";
import { EXAMPLE_BUDGET, retrieveExamples } from "../knowledge/retrieval.ts";
import { buildRetrievalPool } from "../knowledge/ingest.ts";
import type { NormalizedResume } from "./types.ts";
import { retrievalOptionsFor } from "./knowledgeMode.ts";
import type { KnowledgeMode } from "./types.ts";

const KNOWN_ROLE_FAMILIES = new Set([
  "software_engineering",
  "engineering_leadership",
  "product",
  "data",
]);

/** Best-effort role-family detection from the resume text against ROLE_PATTERNS' keyword hints. */
function detectRoleFamily(resume: NormalizedResume, explicit?: string): RoleFamily | undefined {
  if (explicit && KNOWN_ROLE_FAMILIES.has(explicit)) return explicit as RoleFamily;

  const text = resume.rawTextReference.toLowerCase();
  let best: { family: string; hits: number } | null = null;
  for (const pattern of ROLE_PATTERNS) {
    const hits = pattern.keywordHints.filter((k) => text.includes(k.toLowerCase())).length;
    if (hits >= 2 && (!best || hits > best.hits)) best = { family: pattern.roleFamily, hits };
  }
  // Command 04's knowledge pool only tags a small role-family vocabulary
  // (software_engineering / engineering_leadership / product / data /
  // any). A detected contextPatterns family outside that vocabulary is
  // real signal for industry detection but not for THIS retrieval call —
  // forcing it through would silently widen to "any" via the ranker's own
  // fallback, which is the correct, honest behavior (§16).
  if (!best) return undefined;
  const mapped: Record<string, RoleFamily> = {
    software_engineer: "software_engineering",
    product_manager: "product",
    data_analyst: "data",
  };
  return mapped[best.family];
}

export interface RetrievalOutcome {
  context: RetrievalContext;
  examples: RetrievalExample[];
  /** §15: explainable audit trail — dev/debug metadata only, never shown to a public report. */
  debug: { retrievedIds: string[]; roleFamilyDetected: RoleFamily | undefined };
}

export function buildAndRunRetrieval(
  resume: NormalizedResume,
  context: AnalysisContext,
  requestRoleFamily: string | undefined,
  primaryDimensionId: DimensionId | undefined,
  knowledgeMode: KnowledgeMode,
): RetrievalOutcome {
  const roleFamily = detectRoleFamily(resume, requestRoleFamily);
  const retrievalContext: RetrievalContext = {
    language: context.language === "bilingual" ? "en" : (context.language as KnowledgeLanguage),
    seniority: context.seniority,
    roleFamily,
    dimensionId: primaryDimensionId,
  };

  const pool = buildRetrievalPool();
  const opts = retrievalOptionsFor(knowledgeMode, EXAMPLE_BUDGET.default);
  const examples = retrieveExamples(pool, retrievalContext, opts);

  return {
    context: retrievalContext,
    examples,
    debug: { retrievedIds: examples.map((e) => e.id), roleFamilyDetected: roleFamily },
  };
}
