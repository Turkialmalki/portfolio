/**
 * FRONTEND MIRROR of the Career backend's free-tier report contract.
 *
 * The authoritative shapes live in the Edge Function code —
 * `supabase/functions/_shared/methodology/projection.ts` (FreeReport) and
 * `.../methodology/types.ts` — but those files are Deno modules with `.ts`
 * import specifiers and cannot be imported into the Next.js static-export
 * bundle. This file re-states ONLY what the UI consumes, field for field,
 * so a backend contract change shows up as a loud type break here rather
 * than a silent rendering bug.
 *
 * NOTHING in this file computes. Scores, bands and findings arrive from
 * the backend (or from the synthetic fixtures that stand in for it while
 * the privacy gate is closed) — the frontend never recomputes a score,
 * never re-derives a band, and never invents a finding (§16, §22).
 */

export type CareerLang = "ar" | "en";

export type Severity = "critical" | "high" | "medium" | "low";

/** The 15 methodology dimensions — mirror of methodology/types.ts DIMENSION_IDS. */
export type DimensionId =
  | "positioning"
  | "professional_summary"
  | "experience_quality"
  | "achievement_impact"
  | "career_progression"
  | "leadership_ownership"
  | "skills_relevance"
  | "ats_readability"
  | "target_role_alignment"
  | "keyword_coverage"
  | "evidence_specificity"
  | "language_quality"
  | "content_prioritization"
  | "redundancy_noise"
  | "seniority_alignment";

/** Display titles — mirror of methodology/dimensions.ts titleAr/titleEn. */
export const DIMENSION_TITLES: Record<DimensionId, { ar: string; en: string }> = {
  positioning: { ar: "التموضع المهني", en: "Positioning" },
  professional_summary: { ar: "الملخص المهني", en: "Professional Summary" },
  experience_quality: { ar: "جودة الخبرات", en: "Experience Quality" },
  achievement_impact: { ar: "الإنجاز والأثر", en: "Achievement / Impact" },
  career_progression: { ar: "التدرج المهني", en: "Career Progression" },
  leadership_ownership: { ar: "القيادة وتحمّل المسؤولية", en: "Leadership / Ownership" },
  skills_relevance: { ar: "ملاءمة المهارات", en: "Skills Relevance" },
  ats_readability: { ar: "قابلية القراءة الآلية (ATS)", en: "ATS Readability" },
  target_role_alignment: { ar: "التوافق مع الدور المستهدف", en: "Target Role Alignment" },
  keyword_coverage: { ar: "تغطية الكلمات المفتاحية", en: "Keyword Coverage" },
  evidence_specificity: { ar: "الأدلة والتحديد", en: "Evidence / Specificity" },
  language_quality: { ar: "جودة اللغة", en: "Language Quality" },
  content_prioritization: { ar: "ترتيب أولويات المحتوى", en: "Content Prioritization" },
  redundancy_noise: { ar: "التكرار والحشو", en: "Redundancy / Noise" },
  seniority_alignment: { ar: "التوافق مع مستوى الأقدمية", en: "Seniority Alignment" },
};

export interface UiScoreBand {
  min: number;
  labelEn: string;
  labelAr: string;
}

export interface UiDimensionSummary {
  dimension: DimensionId;
  score: number;
  /** One line, in the language of the analyzed CV — a single string, exactly as the backend projects it. */
  summary: string;
}

export interface UiIssue {
  dimension: DimensionId;
  severity: Severity;
  summary: string;
}

export interface UiStrength {
  dimension: DimensionId;
  summary: string;
}

export interface UiQuickWin {
  dimension: DimensionId;
  action: string;
  why: string;
}

export interface UiRewriteExample {
  before: string;
  after: string;
  note: string;
}

/**
 * What the paid Full Review contains for THIS analysis, as counts only —
 * used by the locked paywall preview (§27: only numbers the backend
 * actually produced, never invented for drama).
 */
export interface UiFullReviewCounts {
  recommendations: number;
  highPriority: number;
  sectionsToRewrite: number;
  missingEvidenceQuestions: number;
}

/**
 * Mirror of projection.ts's FullReviewData — the entitlement-gated paid
 * content, served ONLY by `get-full-review` after it independently
 * verifies ownership + an active `career_cv_full_review` entitlement.
 * Nothing here is ever computed client-side or shown without that check
 * succeeding server-side first.
 */
export interface UiDimensionDetail {
  dimension: DimensionId;
  score: number;
  reason: string;
  recommendations: string[];
}

export interface UiIssueDetail {
  dimension: DimensionId;
  severity: Severity;
  effort: "quick" | "moderate" | "substantial";
  summary: string;
  recommendations: string[];
}

export interface UiStrengthDetail {
  dimension: DimensionId;
  summary: string;
}

export interface UiActionPlanStep {
  order: number;
  issueSummary: string;
  severity: Severity;
  effort: "quick" | "moderate" | "substantial";
}

export interface UiAtsIndicator {
  check: string;
  status: "ok" | "risk" | "problem";
  detail: string;
}

export interface UiAtsAnalysis {
  indicators: UiAtsIndicator[];
  disclaimer: string;
}

/** Career V2 Part 5 — deterministic, code-only. Separate concept from CV Strength/UiAtsAnalysis above. */
export interface UiAtsCheck {
  id: string;
  labelEn: string;
  labelAr: string;
  status: "pass" | "warning" | "fail";
  detailEn: string;
  detailAr: string;
}

export interface UiAtsCompatibility {
  atsCompatibilityScore: number;
  atsChecksPassed: number;
  atsChecksWarning: number;
  atsChecksFailed: number;
  checks: UiAtsCheck[];
}

export interface UiKeywordFinding {
  keyword: string;
  tier: "core" | "supporting" | "optional";
  match: "strong_match" | "partial_match" | "not_demonstrated";
}

export interface UiTargetRoleAnalysis {
  targetRole: string;
  hasJobDescription: boolean;
  positioningVerdict: string;
  keywordFindings: UiKeywordFinding[];
  gaps: string[];
}

export interface UiRewriteSuggestion {
  before: string;
  after: string;
  note: string;
}

export interface UiFullReview {
  dimensionDetails: UiDimensionDetail[];
  issues: UiIssueDetail[];
  strengths: UiStrengthDetail[];
  actionPlan: UiActionPlanStep[];
  atsAnalysis: UiAtsAnalysis;
  atsCompatibility: UiAtsCompatibility;
  /** null, honestly, when no target role was ever given — never a guess. */
  targetRoleAnalysis: UiTargetRoleAnalysis | null;
  rewriteSuggestions: UiRewriteSuggestion[];
}

/** Mirror of projection.ts FreeReport, plus UI-only context fields. */
export interface UiFreeReport {
  overallScore: number;
  scoreBand: UiScoreBand;
  confidence: "high" | "medium" | "low";
  dimensionSummary: UiDimensionSummary[];
  topIssues: UiIssue[];
  topStrengths: UiStrength[];
  rewriteExample: UiRewriteExample | null;
  quickWin: UiQuickWin | null;
  /** Language the analyzed CV (and therefore all finding text) is written in. */
  reportLang: CareerLang;
  fullReviewCounts: UiFullReviewCounts;
  /** Career V2 Part 6/11 — shown in the FREE report, not gated. */
  atsCompatibility: UiAtsCompatibility;
}

/**
 * The explicit product state machine (§58). One field, one source of truth
 * — never a pile of booleans.
 */
export type CareerPhase =
  | { name: "LANDING" }
  | { name: "UPLOADING"; fileName: string }
  | { name: "PROCESSING"; fileName: string; startedAt: number }
  | {
      name: "FREE_RESULT";
      report: UiFreeReport;
      fileName: string;
      revealed: boolean;
      /** Set for a real analysis (undefined for a synthetic-demo fixture)
       *  — the handle `career_cv_full_review` purchases and payment
       *  verification are created against. Never used to re-derive report
       *  content client-side. */
      resumeId?: string;
      /** Set for a real analysis — the `resume_analyses.id` this report
       *  came from. Drives the `?analysis=` deep link (Career V2 Part 19)
       *  and is the ownership handle `send-career-report` checks against
       *  (Part 17) — never used to re-derive report content client-side. */
      analysisId?: string;
    }
  | { name: "ERROR"; code: CareerErrorCode; fileName?: string };

/**
 * Safe error vocabulary the UI maps to bilingual human copy — a subset of
 * supabase/functions/_shared/errorCodes.ts plus client-side pre-checks.
 * Raw backend codes are never printed (§15).
 */
export type CareerErrorCode =
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "PARSE_FAILED"
  | "ANALYSIS_FAILED"
  | "ANALYSIS_TIMEOUT"
  | "NETWORK"
  | "GATED";

/** Mirror of PARSER_LIMITS (supabase/functions/_shared/parser/limits.ts) — display + pre-check only; the server re-checks. */
export const CAREER_UPLOAD_LIMITS = {
  maxFileBytes: 8 * 1024 * 1024,
  minFileBytes: 200,
  acceptExtensions: [".pdf", ".docx"] as const,
  acceptAttr: ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
