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
  };
}

/** The paid report IS the full analysis; the alias exists so call sites
 *  read as a deliberate tier decision, not an accidental leak. */
export function projectFullReport(analysis: CareerAnalysis): CareerAnalysis {
  return analysis;
}
