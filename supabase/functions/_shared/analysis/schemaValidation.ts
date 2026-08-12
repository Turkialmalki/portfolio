/**
 * AI JSON SCHEMA VALIDATION (Command 05 §29, §9; compact contract per
 * Command 05D.2 §3).
 *
 * AI JSON is never trusted. Every field is checked against the typed
 * contract; anything invalid, missing, out-of-range, duplicated, or
 * unknown fails the whole batch (the pipeline's one controlled retry —
 * see pipeline.ts — handles transient bad output; this module never loops
 * on its own).
 *
 * §9 hard rule, enforced structurally: this validator reads exactly the
 * fields of `DimensionAIResult` (dimensionId, signalLevel, evidencePresent,
 * evidenceQuality, confidence, evidence, reasonCode, shortReason) and
 * nothing else. If a provider's raw JSON includes an `overallScore` or
 * `score` field, it is simply never read here — there is no code path
 * from raw AI JSON to `CareerAnalysis.overallScore` that doesn't go
 * through scoring.ts's `computeOverallScore`/`rubricScoreFor`.
 *
 * `signalLevel`/`evidenceQuality` ARE validated against their closed
 * lists (methodology/types.ts's `SIGNAL_LEVELS`/`EVIDENCE_QUALITIES|) —
 * unlike `reasonCode`. That's not a contradiction: those two fields are
 * real JSON-schema `enum`s in the tool call itself (anthropicProvider.ts),
 * the same mechanism `confidence`/`dimensionId` already use here safely,
 * so the model structurally cannot emit a value outside the list.
 * `reasonCode` is validated as a non-empty string only, NOT against the
 * closed list in methodology/reasonCodes.ts, because it is a free string
 * in the schema (never enum-enforced) — rejecting an otherwise valid
 * result because the model chose a reasonable code outside a fixed list
 * would recreate Command 05D.1's schema-validation-failure problem.
 * `shortReason` is length-guided, not hard-capped: an over-length reason
 * is still real content, not a structural defect worth discarding an
 * entire dimension result over.
 */
import { DIMENSION_IDS, EVIDENCE_QUALITIES, SIGNAL_LEVELS, type DimensionId } from "../methodology/types.ts";
import type { DimensionAIResult, SchemaIssue } from "./types.ts";

const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const DIMENSION_ID_SET = new Set<string>(DIMENSION_IDS);
const SIGNAL_LEVEL_SET = new Set<string>(SIGNAL_LEVELS);
const EVIDENCE_QUALITY_SET = new Set<string>(EVIDENCE_QUALITIES);

function isValidEvidence(e: unknown): e is { section: string; excerpt: string } | null {
  if (e === null || e === undefined) return true;
  if (typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return typeof o.section === "string" && o.section.length > 0 && typeof o.excerpt === "string" && o.excerpt.length > 0;
}

function validateOne(raw: unknown, index: number, expected: Set<DimensionId>): { value?: DimensionAIResult; issues: SchemaIssue[] } {
  const issues: SchemaIssue[] = [];
  const path = `[${index}]`;
  if (typeof raw !== "object" || raw === null) {
    return { issues: [{ path, issue: "not an object" }] };
  }
  const o = raw as Record<string, unknown>;

  if (typeof o.dimensionId !== "string" || !DIMENSION_ID_SET.has(o.dimensionId)) {
    issues.push({ path: `${path}.dimensionId`, issue: "missing or unknown dimensionId" });
  } else if (!expected.has(o.dimensionId as DimensionId)) {
    issues.push({ path: `${path}.dimensionId`, issue: `dimensionId ${o.dimensionId} was not requested for this analysis` });
  }
  if (typeof o.signalLevel !== "string" || !SIGNAL_LEVEL_SET.has(o.signalLevel)) {
    issues.push({ path: `${path}.signalLevel`, issue: "signalLevel must be one of very_weak|weak|mixed|strong|very_strong" });
  }
  if (typeof o.evidencePresent !== "boolean") {
    issues.push({ path: `${path}.evidencePresent`, issue: "evidencePresent must be a boolean" });
  }
  if (typeof o.evidenceQuality !== "string" || !EVIDENCE_QUALITY_SET.has(o.evidenceQuality)) {
    issues.push({ path: `${path}.evidenceQuality`, issue: "evidenceQuality must be one of none|limited|specific|strong" });
  }
  if (typeof o.confidence !== "string" || !CONFIDENCE_VALUES.has(o.confidence)) {
    issues.push({ path: `${path}.confidence`, issue: "confidence must be high|medium|low" });
  }
  // evidence is OPTIONAL and NULLABLE — at most one item, never an array.
  if ("evidence" in o && !isValidEvidence(o.evidence)) {
    issues.push({ path: `${path}.evidence`, issue: "evidence must be {section, excerpt} or null" });
  }
  if (typeof o.reasonCode !== "string" || o.reasonCode.trim().length === 0) {
    issues.push({ path: `${path}.reasonCode`, issue: "reasonCode must be a non-empty string" });
  }
  if (typeof o.shortReason !== "string" || o.shortReason.trim().length === 0) {
    issues.push({ path: `${path}.shortReason`, issue: "shortReason must be a non-empty string" });
  }

  if (issues.length > 0) return { issues };

  return {
    issues: [],
    value: {
      dimensionId: o.dimensionId as DimensionId,
      signalLevel: o.signalLevel as DimensionAIResult["signalLevel"],
      evidencePresent: o.evidencePresent as boolean,
      evidenceQuality: o.evidenceQuality as DimensionAIResult["evidenceQuality"],
      confidence: o.confidence as DimensionAIResult["confidence"],
      evidence: (o.evidence as DimensionAIResult["evidence"]) ?? null,
      reasonCode: o.reasonCode as string,
      shortReason: o.shortReason as string,
      // Note: any `overallScore` key present on `o` is deliberately never read (§9).
    },
  };
}

export type ValidateDimensionsResult =
  | { ok: true; value: DimensionAIResult[] }
  | { ok: false; issues: SchemaIssue[] };

export function validateDimensionAIResults(raw: unknown, expectedIds: DimensionId[]): ValidateDimensionsResult {
  if (!Array.isArray(raw)) {
    return { ok: false, issues: [{ path: "$", issue: "expected an array of dimension results" }] };
  }

  const expected = new Set(expectedIds);
  const issues: SchemaIssue[] = [];
  const values: DimensionAIResult[] = [];
  const seen = new Set<string>();

  raw.forEach((item, i) => {
    const { value, issues: itemIssues } = validateOne(item, i, expected);
    issues.push(...itemIssues);
    if (value) {
      if (seen.has(value.dimensionId)) {
        issues.push({ path: `[${i}].dimensionId`, issue: `duplicate dimension result for ${value.dimensionId}` });
      } else {
        seen.add(value.dimensionId);
        values.push(value);
      }
    }
  });

  for (const id of expectedIds) {
    if (!seen.has(id)) issues.push({ path: "$", issue: `missing dimension result for ${id}` });
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: values };
}
