/**
 * THE CLIENT-FACING FREE-REPORT SHAPE (Command 06A.5 §15).
 *
 * Shared by `analyze-resume` (fresh + reused analyses) and
 * `get-analysis-report` (Career V2 Part 19's deep-link restore) so both
 * entry points return byte-identical shapes for the same stored
 * `CareerAnalysis` — the frontend's `UiFreeReport` type (careerTypes.ts)
 * must never drift between "just analyzed" and "restored after refresh".
 */
import { projectFreeReport, type CareerAnalysis } from "../methodology/index.ts";

/** Narrow, structural check that a jsonb `result_json` column really holds a CareerAnalysis before trusting it as one. */
export function looksLikeCareerAnalysis(value: unknown): value is CareerAnalysis {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { dimensions?: unknown }).dimensions) &&
    Array.isArray((value as { issues?: unknown }).issues)
  );
}

/**
 * §15: the frontend renders this exact shape (UiFreeReport in
 * careerTypes.ts) without recomputing anything — fullReviewCounts are all
 * deterministic counts already produced by the real analysis, never
 * invented for the paywall preview.
 */
export function buildUiFreeReport(analysis: CareerAnalysis, outputLanguage: "ar" | "en") {
  const free = projectFreeReport(analysis);
  return {
    overallScore: free.overallScore,
    scoreBand: free.scoreBand,
    confidence: free.confidence,
    // The language the customer-facing prose was actually written in
    // (outputLanguage) — NOT the CV's own detected language. Drives `dir`
    // on summary/issue/strength/quick-win text. The one exception is the
    // rewrite example's `before`/`after`, which stays in the CV's own
    // language on purpose (a rewrite must never translate the person's
    // actual bullet) — RewritePreview renders those with their own dir
    // when it differs from reportLang.
    reportLang: outputLanguage,
    dimensionSummary: free.dimensionSummary,
    topIssues: free.topIssues,
    topStrengths: free.topStrengths,
    rewriteExample: free.rewriteExample,
    quickWin: free.quickWin,
    atsCompatibility: free.atsCompatibility,
    fullReviewCounts: {
      recommendations: analysis.actionPlan.length,
      highPriority: analysis.issues.filter((i) => i.severity === "critical" || i.severity === "high").length,
      sectionsToRewrite: new Set(analysis.issues.map((i) => i.dimension)).size,
      missingEvidenceQuestions: analysis.missingEvidenceQuestions.length,
    },
  };
}
