/**
 * FINDINGS GENERATION (Command 05 §20–§26).
 *
 * Turns validated, evidence-checked `DimensionResult`s into the report's
 * findings — deterministically. The LLM's per-dimension `reason` and
 * `recommendations` are the raw material; severity, effort, priority,
 * ATS status, and which dimensions become strengths vs issues are all
 * computed here by fixed rules, not asked of the model again. This keeps
 * "why is this critical and that merely medium" answerable by reading
 * code, matching how scoring.ts owns the overall score.
 */
import type {
  AnalysisContext,
  AtsAnalysis,
  DimensionId,
  DimensionResult,
  Effort,
  Issue,
  MissingEvidenceQuestion,
  QuickWin,
  Severity,
  Strength,
} from "../methodology/types.ts";
import { rubricFor } from "../methodology/dimensions.ts";
import { prioritizeIssues } from "../methodology/priority.ts";
import type { MetricConflict } from "./types.ts";

/** Effort classification per dimension — §21/§23: quick language/structure fixes vs substantial content work. */
const QUICK_DIMENSIONS = new Set<DimensionId>([
  "professional_summary",
  "redundancy_noise",
  "ats_readability",
  "skills_relevance",
  "content_prioritization",
]);
const SUBSTANTIAL_DIMENSIONS = new Set<DimensionId>([
  "leadership_ownership",
  "achievement_impact",
  "experience_quality",
]);

function effortFor(dimension: DimensionId): Effort {
  if (QUICK_DIMENSIONS.has(dimension)) return "quick";
  if (SUBSTANTIAL_DIMENSIONS.has(dimension)) return "moderate";
  return "moderate";
}

function severityFor(score: number): Severity {
  if (score < 45) return "critical";
  if (score < 60) return "high";
  if (score < 70) return "medium";
  return "low";
}

/**
 * §21: builds issues only from dimensions genuinely below a "meaningful
 * improvements available" threshold, and avoids duplicate findings that
 * say essentially the same thing by capping at one issue per dimension.
 */
export function buildIssues(results: DimensionResult[]): Omit<Issue, "priorityRank">[] {
  return results
    .filter((r) => r.score < 70)
    .map((r) => ({
      dimension: r.dimension,
      severity: severityFor(r.score),
      effort: effortFor(r.dimension),
      summary: r.reason,
      evidence: r.evidence,
      recommendations: r.recommendations.length > 0 ? r.recommendations : [rubricFor(r.dimension).recommendationRules[0]?.recommend ?? "Review this section."],
      confidence: r.confidence,
    }));
}

/**
 * Career V2 Part 9 bug (found via a real Arabic-output production
 * failure — "Arabic report failed language validation: 5 field(s)
 * contained English prose leakage"): `buildStrengths`/`buildQuickWins`/
 * `buildMissingEvidenceQuestions` below built their customer-facing text
 * from CODE TEMPLATES that never consulted `outputLanguage` at all —
 * always English, 100% reproducible for every Arabic-output report, not
 * an AI compliance issue (the AI's own `reason`/`shortReason` text,
 * which flows straight into `issues[].summary`, was already correctly
 * Arabic in that same failing run; only the code-templated fields
 * leaked). `rubricFor(dimension).titleAr` already exists and is used
 * here; `.purpose`/`.recommendationRules[].recommend` do NOT have an
 * Arabic counterpart in the methodology data yet, so rather than ship
 * a fresh, unreviewed Arabic translation of ~15 dimensions' worth of
 * methodology prose, the Arabic path below reuses content that's
 * ALREADY correctly localized and CV-specific — the AI's own per-
 * dimension `reason` (via `issue.summary`) — instead of the generic
 * English-only rubric prose, which arguably reads better anyway (specific
 * to this CV, not a generic dimension blurb).
 */
const STRENGTH_PHRASE: Record<"ar" | "en", Record<"high" | "mid" | "low", string>> = {
  en: { high: "clearly demonstrates", mid: "shows solid signal in", low: "shows some signal in" },
  ar: { high: "تُظهر سيرتك بوضوح", mid: "تُظهر سيرتك إشارة جيدة في", low: "تُظهر سيرتك بعض الإشارة في" },
};

/**
 * §22: minimum 2, evidence-based, never manufactured. Takes the
 * highest-scoring dimensions with at least one verified evidence item,
 * phrased proportionally to how strong the signal actually is — a modest,
 * precise strength on a weak CV rather than inflated praise.
 */
export function buildStrengths(results: DimensionResult[], outputLanguage: "ar" | "en" = "en"): Strength[] {
  const withEvidence = results.filter((r) => r.evidence.length > 0);
  const pool = (withEvidence.length >= 2 ? withEvidence : results).slice();
  pool.sort((a, b) => b.score - a.score);
  return pool.slice(0, Math.max(2, Math.min(3, pool.length))).map((r) => {
    const rubric = rubricFor(r.dimension);
    const tier = r.score >= 80 ? "high" : r.score >= 60 ? "mid" : "low";
    const summary =
      outputLanguage === "ar"
        ? `${STRENGTH_PHRASE.ar[tier]} ${rubric.titleAr}.`
        : `The document ${STRENGTH_PHRASE.en[tier]} ${rubric.titleEn.toLowerCase()}.`;
    return {
      dimension: r.dimension,
      summary,
      evidence: r.evidence.slice(0, 2),
    };
  });
}

/** §23: low-effort, high-visibility fixes drawn from quick-effort issues. */
export function buildQuickWins(issues: Omit<Issue, "priorityRank">[], outputLanguage: "ar" | "en" = "en"): QuickWin[] {
  return issues
    .filter((i) => i.effort === "quick")
    .slice(0, 3)
    .map((i) => {
      const rubric = rubricFor(i.dimension);
      if (outputLanguage === "ar") {
        // `i.recommendations[0]` is always the English-only
        // `rubricFor().recommendationRules[0].recommend` fallback here in
        // practice (pipeline.ts never populates AI recommendations — see
        // its own comment) — never used for Arabic. `why` reuses the
        // issue's own already-Arabic, CV-specific `summary` rather than
        // the English-only `rubric.purpose`.
        return { dimension: i.dimension, action: `ابدأ بتحسين ${rubric.titleAr}.`, why: i.summary };
      }
      return {
        dimension: i.dimension,
        action: i.recommendations[0] ?? `Improve ${rubric.titleEn.toLowerCase()}.`,
        why: rubric.purpose,
      };
    });
}

const MISSING_EVIDENCE_QUESTION_TEXT: Record<"ar" | "en", string> = {
  en: "This section describes work without a checkable outcome. What changed, roughly how much, or over what scope — approximate answers and 'I'm not sure' are fine.",
  ar: "هذا القسم يصف عملاً بدون نتيجة يمكن التحقق منها. وش تغيّر بالضبط، وبأي مقدار تقريبي، أو على أي نطاق؟ إجابة تقريبية أو 'مو متأكد' تكفي.",
};

/** §25 + §13: missing-evidence questions from evidence-thin dimensions and detected metric conflicts. */
export function buildMissingEvidenceQuestions(
  results: DimensionResult[],
  factConflicts: MetricConflict[],
  outputLanguage: "ar" | "en" = "en",
): MissingEvidenceQuestion[] {
  const questions: MissingEvidenceQuestion[] = [];

  for (const r of results) {
    if ((r.dimension === "achievement_impact" || r.dimension === "evidence_specificity") && r.score < 60 && r.evidence.length > 0) {
      questions.push({
        dimension: r.dimension,
        context: r.evidence[0],
        question: MISSING_EVIDENCE_QUESTION_TEXT[outputLanguage],
      });
    }
  }

  for (const conflict of factConflicts) {
    questions.push({
      dimension: "evidence_specificity",
      context: { section: "Experience", text: `"${conflict.context}" reported as ${conflict.values.join(" and ")}` },
      question:
        outputLanguage === "ar"
          ? `تعارض محتمل في الأرقام: "${conflict.context}" ورد بقيم مختلفة (${conflict.values.join(" و")}) في هذه السيرة. وش الصح، أو تغيّر الرقم مع الوقت؟`
          : `POSSIBLE_FACT_CONFLICT: "${conflict.context}" appears with different values (${conflict.values.join(", ")}) in this document. Which is correct, or has this changed over time?`,
    });
  }

  return questions;
}

const ATS_DISCLAIMER: Record<"ar" | "en", string> = {
  en:
    "These are structural readability indicators only — not a simulation of any specific applicant tracking system and never a guarantee of parsing, ranking, or recruiter visibility.",
  ar:
    "هذه مؤشرات هيكلية لسهولة القراءة فقط — وليست محاكاة لأي نظام تتبع متقدمين محدد، ولا ضمانًا لتحليل السيرة أو ترتيبها أو ظهورها لمسؤول التوظيف.",
};
const ATS_CHECK_LABEL: Record<"ar" | "en", string> = {
  en: "structure and heading clarity",
  ar: "وضوح البنية والعناوين",
};

/** §20: readability indicators only — never a pass/fail claim. Customer-
 *  facing prose (the disclaimer and check label) follows `outputLanguage`
 *  — the per-dimension `detail` text itself is `atsResult.reason`, already
 *  in that language via the AI's own outputLanguage instruction. */
export function buildAtsAnalysis(results: DimensionResult[], outputLanguage: "ar" | "en" = "en"): AtsAnalysis {
  const disclaimer = ATS_DISCLAIMER[outputLanguage];
  const atsResult = results.find((r) => r.dimension === "ats_readability");
  if (!atsResult) {
    return { indicators: [], disclaimer };
  }
  const status = atsResult.score >= 80 ? "ok" : atsResult.score >= 60 ? "risk" : "problem";
  return {
    indicators: [{ check: ATS_CHECK_LABEL[outputLanguage], status, detail: atsResult.reason }],
    disclaimer,
  };
}

export function buildFindings(
  results: DimensionResult[],
  context: AnalysisContext,
  factConflicts: MetricConflict[],
) {
  const outputLanguage = context.outputLanguage ?? (context.language === "ar" ? "ar" : "en");
  const rawIssues = buildIssues(results);
  const issues = prioritizeIssues(rawIssues);
  const strengths = buildStrengths(results, outputLanguage);
  const quickWins = buildQuickWins(rawIssues, outputLanguage);
  const missingEvidenceQuestions = buildMissingEvidenceQuestions(results, factConflicts, outputLanguage);
  const atsAnalysis = buildAtsAnalysis(results, outputLanguage);
  return { issues, strengths, quickWins, missingEvidenceQuestions, atsAnalysis };
}
