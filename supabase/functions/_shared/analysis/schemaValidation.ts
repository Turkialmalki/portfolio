/**
 * AI JSON SCHEMA VALIDATION (Command 05 §29, §9).
 *
 * AI JSON is never trusted. Every field is checked against the typed
 * contract; anything invalid, missing, out-of-range, duplicated, or
 * unknown fails the whole batch (the pipeline's one controlled retry —
 * see pipeline.ts — handles transient bad output; this module never loops
 * on its own).
 *
 * §9 hard rule, enforced structurally: this validator reads exactly the
 * fields of `DimensionAIResult` (dimensionId, score, confidence, evidence,
 * reason, recommendations) and nothing else. If a provider's raw JSON
 * includes an `overallScore` field, it is simply never read here — there
 * is no code path from raw AI JSON to `CareerAnalysis.overallScore` that
 * doesn't go through scoring.ts's `computeOverallScore`.
 */
import { DIMENSION_IDS, type DimensionId } from "../methodology/types.ts";
import type { DimensionAIResult, SchemaIssue } from "./types.ts";

const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const DIMENSION_ID_SET = new Set<string>(DIMENSION_IDS);

function isValidEvidenceItem(e: unknown): e is { section: string; text: string; role?: string } {
  if (typeof e !== "object" || e === null) return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.section === "string" &&
    o.section.length > 0 &&
    typeof o.text === "string" &&
    o.text.length > 0 &&
    (o.role === undefined || typeof o.role === "string")
  );
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
  if (typeof o.score !== "number" || Number.isNaN(o.score) || o.score < 0 || o.score > 100) {
    issues.push({ path: `${path}.score`, issue: "score must be a number 0–100" });
  }
  if (typeof o.confidence !== "string" || !CONFIDENCE_VALUES.has(o.confidence)) {
    issues.push({ path: `${path}.confidence`, issue: "confidence must be high|medium|low" });
  }
  if (!Array.isArray(o.evidence) || !o.evidence.every(isValidEvidenceItem)) {
    issues.push({ path: `${path}.evidence`, issue: "evidence must be an array of {section, text, role?}" });
  }
  if (typeof o.reason !== "string" || o.reason.trim().length === 0) {
    issues.push({ path: `${path}.reason`, issue: "reason must be a non-empty string" });
  }
  if (!Array.isArray(o.recommendations) || !o.recommendations.every((r) => typeof r === "string")) {
    issues.push({ path: `${path}.recommendations`, issue: "recommendations must be an array of strings" });
  }

  if (issues.length > 0) return { issues };

  return {
    issues: [],
    value: {
      dimensionId: o.dimensionId as DimensionId,
      score: o.score as number,
      confidence: o.confidence as DimensionAIResult["confidence"],
      evidence: o.evidence as DimensionAIResult["evidence"],
      reason: o.reason as string,
      recommendations: o.recommendations as string[],
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
