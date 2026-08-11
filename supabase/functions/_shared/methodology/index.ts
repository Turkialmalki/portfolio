/**
 * TURKI CAREER METHODOLOGY — public surface.
 *
 * `career_methodology_v1`: the brain specification of the Career Review
 * Engine. The AI is the execution engine; THIS is the product. See
 * docs/career-methodology.md for the audit-level explanation.
 */
export { CAREER_METHODOLOGY_VERSION, type MethodologyVersion } from "./version.ts";
export * from "./types.ts";
export { SCORE_BANDS, bandForScore, type ScoreBand } from "./scoreBands.ts";
export {
  BULLET_QUALITY_SCALE,
  DIMENSIONS,
  rubricFor,
  type DimensionRubric,
  type RecommendationRule,
  type ScoreAnchor,
} from "./dimensions.ts";
export {
  SENIORITY_EXPECTATIONS,
  SENIORITY_WEIGHT_MULTIPLIERS,
  expectationFor,
  type SeniorityExpectation,
} from "./seniority.ts";
export {
  EVIDENCE_CAP_ID,
  EVIDENCE_CAP_MAX,
  EVIDENCE_CAP_THRESHOLD,
  aggregateConfidence,
  computeOverallScore,
  planWeights,
  type EffectiveWeight,
  type OverallScoreResult,
  type WeightPlan,
} from "./scoring.ts";
export { buildActionPlan, prioritizeIssues, priorityRank } from "./priority.ts";
export {
  ALLOWED_OPERATIONS,
  FACT_CLASSIFICATION_RULES,
  MISSING_EVIDENCE_QUESTION_GUIDANCE,
  NEVER_INVENT,
  type FactClassificationRule,
} from "./factPreservation.ts";
export {
  ARABIC_GUIDANCE,
  CV_LANGUAGE_CASES,
  ENGLISH_GUIDANCE,
  guidanceForCase,
  type CvLanguageCase,
  type LanguageGuidance,
} from "./language.ts";
export {
  INDUSTRY_CATEGORIES,
  INDUSTRY_PATTERNS,
  ROLE_PATTERNS,
  type IndustryCategory,
  type IndustryPattern,
  type RolePattern,
} from "./contextPatterns.ts";
export { projectFreeReport, projectFullReport, type FreeReport } from "./projection.ts";
export { composeMethodologyContext, type MethodologySection } from "./compose.ts";
