/**
 * THE DETERMINISTIC SCORING ENGINE (Command 03 §3, §27–28, §33).
 *
 * The LLM evaluates dimensions; THIS CODE — and only this code — turns
 * dimension scores into the overall 0–100 score. Same inputs, same
 * output, every time, explainable line by line:
 *
 *   1. Start from the base weights in dimensions.ts (sum = 100).
 *   2. Drop contextual dimensions whose context is missing (§3): no
 *      target role → target_role_alignment out; no job description →
 *      keyword_coverage out. Missing OPTIONAL context must never read
 *      as a zero.
 *   3. Apply seniority multipliers (seniority.ts): a 0 excludes the
 *      dimension at that level (entry is never scored on leadership).
 *   4. Renormalize: effectiveWeight_i = adjustedWeight_i / Σ adjusted,
 *      so remaining weights always sum to 1 and no exclusion can inflate
 *      or deflate the scale.
 *   5. overall = round( Σ score_i × effectiveWeight_i ).
 *   6. Apply documented caps (below) — the only non-linear step, each
 *      one recorded in metadata.capsApplied so a report can explain it.
 */
import type {
  AnalysisContext,
  Confidence,
  DimensionId,
  DimensionResult,
  EvidenceQuality,
  ExcludedDimension,
  SignalLevel,
} from "./types.ts";
import { DIMENSIONS } from "./dimensions.ts";
import { SENIORITY_WEIGHT_MULTIPLIERS } from "./seniority.ts";

/**
 * §33's first sanity rule, made mechanical: a document whose
 * evidence/specificity score is below EVIDENCE_CAP_THRESHOLD is capped at
 * EVIDENCE_CAP_MAX overall (top of the "Good, with meaningful
 * improvements" band) no matter how polished everything else is.
 * Excellent writing with zero checkable evidence cannot score 95.
 */
export const EVIDENCE_CAP_THRESHOLD = 40;
export const EVIDENCE_CAP_MAX = 74;
export const EVIDENCE_CAP_ID = "evidence_below_40_caps_overall_at_74";

export interface EffectiveWeight {
  dimension: DimensionId;
  /** Base weight from dimensions.ts (percentage points). */
  baseWeight: number;
  /** After seniority multiplier, before normalization. */
  adjustedWeight: number;
  /** Normalized share of the overall score (sums to 1 across included). */
  effectiveWeight: number;
}

export interface WeightPlan {
  included: EffectiveWeight[];
  excluded: ExcludedDimension[];
}

/**
 * Which dimensions are scored for this analysis, at what effective
 * weight, and which are excluded and WHY (§3). Pure function of context.
 */
export function planWeights(context: AnalysisContext): WeightPlan {
  const included: Omit<EffectiveWeight, "effectiveWeight">[] = [];
  const excluded: ExcludedDimension[] = [];

  for (const rubric of DIMENSIONS) {
    if (rubric.requiresTargetRole && !context.targetRole) {
      excluded.push({ dimension: rubric.id, reason: "no_target_role" });
      continue;
    }
    if (rubric.requiresJobDescription && !context.jobDescription) {
      excluded.push({ dimension: rubric.id, reason: "no_job_description" });
      continue;
    }
    const multiplier =
      SENIORITY_WEIGHT_MULTIPLIERS[rubric.id]?.[context.seniority] ?? 1;
    if (multiplier === 0 || !rubric.applicableSeniority.includes(context.seniority)) {
      excluded.push({ dimension: rubric.id, reason: "not_applicable_at_seniority" });
      continue;
    }
    included.push({
      dimension: rubric.id,
      baseWeight: rubric.weight,
      adjustedWeight: rubric.weight * multiplier,
    });
  }

  const totalAdjusted = included.reduce((sum, w) => sum + w.adjustedWeight, 0);
  return {
    included: included.map((w) => ({
      ...w,
      effectiveWeight: w.adjustedWeight / totalAdjusted,
    })),
    excluded,
  };
}

export interface OverallScoreResult {
  overallScore: number;
  /** The score before caps, kept for auditability. */
  uncappedScore: number;
  capsApplied: string[];
  weightPlan: WeightPlan;
}

export function computeOverallScore(
  results: DimensionResult[],
  context: AnalysisContext,
): OverallScoreResult {
  const plan = planWeights(context);
  const byId = new Map(results.map((r) => [r.dimension, r]));

  // Every included dimension must have been evaluated — a missing result
  // is an engine bug, not a zero for the customer.
  for (const w of plan.included) {
    if (!byId.has(w.dimension)) {
      throw new Error(`missing dimension result: ${w.dimension}`);
    }
  }

  const weighted = plan.included.reduce((sum, w) => {
    const score = clamp(byId.get(w.dimension)!.score);
    return sum + score * w.effectiveWeight;
  }, 0);
  const uncapped = Math.round(weighted);

  const capsApplied: string[] = [];
  let overall = uncapped;
  const evidence = byId.get("evidence_specificity");
  if (evidence && clamp(evidence.score) < EVIDENCE_CAP_THRESHOLD && overall > EVIDENCE_CAP_MAX) {
    overall = EVIDENCE_CAP_MAX;
    capsApplied.push(EVIDENCE_CAP_ID);
  }

  return { overallScore: overall, uncappedScore: uncapped, capsApplied, weightPlan: plan };
}

/**
 * §28: overall confidence, aggregated by effective weight. LOW-confidence
 * findings must also be PHRASED differently ("the document suggests…" vs
 * "the document shows…") — that is prompt guidance; this is the roll-up.
 */
export function aggregateConfidence(
  results: DimensionResult[],
  plan: WeightPlan,
): Confidence {
  const byId = new Map(results.map((r) => [r.dimension, r]));
  let low = 0;
  let medium = 0;
  for (const w of plan.included) {
    const c = byId.get(w.dimension)?.confidence ?? "low";
    if (c === "low") low += w.effectiveWeight;
    else if (c === "medium") medium += w.effectiveWeight;
  }
  if (low >= 0.25) return "low";
  if (low + medium >= 0.4) return "medium";
  return "high";
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * §Career V2 Part 4: turns the LLM's constrained rubric classification
 * (signalLevel + evidenceQuality) into the fixed numeric `DimensionResult.
 * score` — the ONLY place that conversion happens. The LLM never invents a
 * precise number again; this function is the deterministic arithmetic that
 * replaces it.
 *
 * Every one of the 15 dimensions in dimensions.ts shares the identical
 * 5-anchor ladder (scoreAnchors: 90/75/60/45/0 — asserted by the
 * methodology test harness, "scoreAnchors share the same ladder across all
 * dimensions"), read here from `DIMENSIONS` rather than re-declared, so a
 * future rubric edit can't silently drift out of sync with this mapping.
 * `signalLevel` selects which anchor band the score falls in (its FLOOR —
 * an anchor's own description already describes what a document AT that
 * floor looks like); `evidenceQuality` then places the score somewhere
 * inside that band, as a FRACTION of the band's own width — never a flat
 * constant — so the same four evidence-quality levels mean proportionally
 * the same thing whether the band is 10 points wide (very_strong) or 45
 * points wide (very_weak). `evidencePresent: false` always yields the
 * band's floor, matching "none" — a claim with literally no evidence gets
 * no credit for the classification's own internal confidence.
 */
const SHARED_ANCHOR_FLOORS: readonly number[] = [...DIMENSIONS[0].scoreAnchors]
  .map((a) => a.atOrAbove)
  .sort((a, b) => a - b);

const SIGNAL_LEVEL_ORDER: readonly SignalLevel[] = ["very_weak", "weak", "mixed", "strong", "very_strong"];

const ANCHOR_BAND: Record<SignalLevel, { floor: number; ceiling: number }> = Object.fromEntries(
  SIGNAL_LEVEL_ORDER.map((level, i) => [
    level,
    {
      floor: SHARED_ANCHOR_FLOORS[i],
      ceiling: i + 1 < SHARED_ANCHOR_FLOORS.length ? SHARED_ANCHOR_FLOORS[i + 1] - 1 : 100,
    },
  ]),
) as Record<SignalLevel, { floor: number; ceiling: number }>;

/**
 * Fraction of the anchor band's own width — deliberately never reaching 1
 * (which would touch the next anchor's floor). Versioned alongside
 * CAREER_METHODOLOGY_VERSION: changing these fractions changes what every
 * future analysis scores and must ship as a new methodology version.
 */
const EVIDENCE_QUALITY_BAND_FRACTION: Record<EvidenceQuality, number> = {
  none: 0,
  limited: 0.2,
  specific: 0.5,
  strong: 0.8,
};

export function rubricScoreFor(
  signalLevel: SignalLevel,
  evidencePresent: boolean,
  evidenceQuality: EvidenceQuality,
): number {
  const band = ANCHOR_BAND[signalLevel];
  const effectiveQuality: EvidenceQuality = evidencePresent ? evidenceQuality : "none";
  const bonus = Math.round((band.ceiling - band.floor) * EVIDENCE_QUALITY_BAND_FRACTION[effectiveQuality]);
  return clamp(Math.min(band.floor + bonus, band.ceiling));
}
