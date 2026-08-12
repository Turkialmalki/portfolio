/**
 * FREE vs PAID OUTPUT (Command 03 §25) — output STRUCTURE only.
 *
 * No payment gating is implemented here (that is a later command and an
 * entitlement check in an Edge Function). This module only guarantees
 * that one CareerAnalysis can be projected into the free tier without
 * recomputing anything, and defines exactly what the free tier exposes:
 *
 *   FREE:  overall score · dimension summary · top 3 issues ·
 *          top 2 strengths · 1 rewrite example · 1 quick win
 *   PAID:  the full CareerAnalysis — every finding, every piece of
 *          evidence, all recommendations, all rewrites, ATS detail,
 *          target-role detail, missing-evidence questions, action plan.
 */
import type {
  AtsCompatibilityResult,
  CareerAnalysis,
  DimensionId,
  Issue,
  QuickWin,
  RewriteExample,
  Strength,
} from "./types.ts";

export interface FreeDimensionSummary {
  dimension: DimensionId;
  score: number;
  /** One line, no evidence — the evidence is paid detail. */
  summary: string;
}

export interface FreeReport {
  methodologyVersion: CareerAnalysis["methodologyVersion"];
  overallScore: number;
  scoreBand: CareerAnalysis["scoreBand"];
  confidence: CareerAnalysis["confidence"];
  dimensionSummary: FreeDimensionSummary[];
  /** Top 3 by priorityRank — summaries only, evidence withheld. */
  topIssues: Array<Pick<Issue, "dimension" | "severity" | "summary">>;
  /** Top 2 — trust matters even at the free tier (§22). */
  topStrengths: Array<Pick<Strength, "dimension" | "summary">>;
  rewriteExample: RewriteExample | null;
  quickWin: QuickWin | null;
  /** Career V2 Part 6/11: ATS Compatibility is shown in the FREE report, not gated — a separate concept from CV Strength, never a universal pass claim. */
  atsCompatibility: AtsCompatibilityResult;
}

export function projectFreeReport(analysis: CareerAnalysis): FreeReport {
  const topIssues = [...analysis.issues]
    .sort((a, b) => b.priorityRank - a.priorityRank)
    .slice(0, 3)
    .map(({ dimension, severity, summary }) => ({ dimension, severity, summary }));

  return {
    methodologyVersion: analysis.methodologyVersion,
    overallScore: analysis.overallScore,
    scoreBand: analysis.scoreBand,
    confidence: analysis.confidence,
    dimensionSummary: analysis.dimensions.map((d) => ({
      dimension: d.dimension,
      score: d.score,
      summary: d.reason,
    })),
    topIssues,
    topStrengths: analysis.strengths
      .slice(0, 2)
      .map(({ dimension, summary }) => ({ dimension, summary })),
    rewriteExample: analysis.rewriteExamples[0] ?? null,
    quickWin: analysis.quickWins[0] ?? null,
    atsCompatibility: analysis.atsCompatibility,
  };
}

/** The paid report IS the full analysis; the alias exists so call sites
 *  read as a deliberate tier decision, not an accidental leak. */
export function projectFullReport(analysis: CareerAnalysis): CareerAnalysis {
  return analysis;
}

/**
 * PAID FULL REVIEW, shaped for the client (Command 06B — entitlement-gated
 * Full Review). Everything here already exists in the analysis produced at
 * scan time — no second AI call, nothing invented for the paywall. Only
 * `get-full-review` calls this, and only after it has independently
 * confirmed the caller owns the analysis AND holds a verified entitlement
 * for `career_cv_full_review`.
 */
export interface FullReviewDimensionDetail {
  dimension: DimensionId;
  score: number;
  reason: string;
  recommendations: string[];
}

export interface FullReviewIssueDetail {
  dimension: DimensionId;
  severity: Issue["severity"];
  effort: Issue["effort"];
  summary: string;
  recommendations: string[];
}

export interface FullReviewData {
  dimensionDetails: FullReviewDimensionDetail[];
  issues: FullReviewIssueDetail[];
  strengths: Strength[];
  actionPlan: CareerAnalysis["actionPlan"];
  atsAnalysis: CareerAnalysis["atsAnalysis"];
  atsCompatibility: AtsCompatibilityResult;
  /** null, honestly, when no target role was ever provided — never a
   *  guessed role (§ never invent a target role). */
  targetRoleAnalysis: CareerAnalysis["targetRoleAnalysis"] | null;
  rewriteSuggestions: RewriteExample[];
}

export function projectFullReviewForClient(analysis: CareerAnalysis): FullReviewData {
  return {
    dimensionDetails: analysis.dimensions.map((d) => ({
      dimension: d.dimension,
      score: d.score,
      reason: d.reason,
      recommendations: d.recommendations,
    })),
    issues: [...analysis.issues]
      .sort((a, b) => b.priorityRank - a.priorityRank)
      .map(({ dimension, severity, effort, summary, recommendations }) => ({
        dimension,
        severity,
        effort,
        summary,
        recommendations,
      })),
    strengths: analysis.strengths,
    actionPlan: analysis.actionPlan,
    atsAnalysis: analysis.atsAnalysis,
    atsCompatibility: analysis.atsCompatibility,
    targetRoleAnalysis: analysis.targetRoleAnalysis ?? null,
    rewriteSuggestions: analysis.rewriteExamples,
  };
}
