/**
 * PRIORITY MODEL (Command 03 §23).
 *
 * Not all findings matter equally, and the report must say what to fix
 * FIRST. Priority is computed — never assigned by the LLM — from
 * severity × effort. Severity dominates (a critical issue outranks any
 * lesser one), effort breaks ties inside a severity so that
 * HIGH-IMPACT / QUICK-FIX items surface at the top of their tier.
 */
import type { ActionPlanStep, Effort, Issue, Severity } from "./types.ts";

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const EFFORT_RANK: Record<Effort, number> = {
  quick: 3,
  moderate: 2,
  substantial: 1,
};

/** Higher = fix sooner. Severity is worth 10, so no effort bonus can
 *  ever promote an issue past a more severe one. */
export function priorityRank(severity: Severity, effort: Effort): number {
  return SEVERITY_RANK[severity] * 10 + EFFORT_RANK[effort];
}

/** Sorts a copy, most urgent first, and stamps priorityRank on each. */
export function prioritizeIssues(issues: Omit<Issue, "priorityRank">[]): Issue[] {
  return issues
    .map((issue) => ({ ...issue, priorityRank: priorityRank(issue.severity, issue.effort) }))
    .sort((a, b) => b.priorityRank - a.priorityRank);
}

/** §23: the ordered "fix this first" plan, derived from the same ranking. */
export function buildActionPlan(issues: Issue[]): ActionPlanStep[] {
  return [...issues]
    .sort((a, b) => b.priorityRank - a.priorityRank)
    .map((issue, index) => ({
      order: index + 1,
      issueSummary: issue.summary,
      severity: issue.severity,
      effort: issue.effort,
    }));
}
