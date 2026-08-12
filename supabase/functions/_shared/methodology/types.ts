/**
 * THE CAREER REVIEW ENGINE'S TYPE SYSTEM (Command 03 §26).
 *
 * These types are the contract between three parties that must never blur:
 *   - the LLM, which evaluates individual dimensions and returns
 *     `DimensionResult`s with evidence,
 *   - the deterministic scoring engine (scoring.ts), which is the ONLY
 *     thing allowed to produce `overallScore`,
 *   - the report layer (projection.ts), which decides what the free and
 *     paid tiers each see.
 *
 * Nothing here imports anything outside this directory; the whole
 * methodology is dependency-free so it runs identically under Deno (Edge
 * Functions, later) and Node (the test harness, now).
 */
import type { MethodologyVersion } from "./version.ts";

// ── The 15 scored dimensions (§2) ────────────────────────────────────────
export const DIMENSION_IDS = [
  "positioning",
  "professional_summary",
  "experience_quality",
  "achievement_impact",
  "career_progression",
  "leadership_ownership",
  "skills_relevance",
  "ats_readability",
  "target_role_alignment",
  "keyword_coverage",
  "evidence_specificity",
  "language_quality",
  "content_prioritization",
  "redundancy_noise",
  "seniority_alignment",
] as const;

export type DimensionId = (typeof DIMENSION_IDS)[number];

// ── Seniority (§9) ───────────────────────────────────────────────────────
export const SENIORITY_LEVELS = [
  "entry",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

// ── Language (§16–17): three real-world CV cases, none "better" ──────────
export type CvLanguage = "ar" | "en" | "bilingual";

// ── Confidence (§28) ─────────────────────────────────────────────────────
export type Confidence = "high" | "medium" | "low";

// ── Priority model (§23) ─────────────────────────────────────────────────
export type Severity = "critical" | "high" | "medium" | "low";
export type Effort = "quick" | "moderate" | "substantial";

// ── Fact preservation (§8) ───────────────────────────────────────────────
export type FactClassification =
  | "SAFE_TO_REWRITE"
  | "NEEDS_USER_CONFIRMATION"
  | "DO_NOT_INFER";

// ── Evidence (§6): points at the document, never at vague reasoning ──────
export interface Evidence {
  /** CV section the evidence comes from, e.g. "Experience", "Summary". */
  section: string;
  /** Role/heading within the section, when applicable. */
  role?: string;
  /** The exact phrase or bullet quoted from the CV. */
  text: string;
}

// ── What the LLM returns per dimension; scores stay per-dimension ────────
export interface DimensionResult {
  dimension: DimensionId;
  /** 0–100 within this dimension's rubric anchors. */
  score: number;
  confidence: Confidence;
  evidence: Evidence[];
  /** WHY this score — must trace to rubric signals, not taste. */
  reason: string;
  recommendations: string[];
}

/**
 * A dimension the scoring engine excluded for this analysis (missing JD,
 * missing target role, or not applicable at this seniority). Recorded so
 * a report can say "not scored — no job description provided" instead of
 * silently vanishing (§3).
 */
export interface ExcludedDimension {
  dimension: DimensionId;
  reason: "no_target_role" | "no_job_description" | "not_applicable_at_seniority";
}

// ── Findings ─────────────────────────────────────────────────────────────
export interface Strength {
  dimension: DimensionId;
  summary: string;
  evidence: Evidence[];
}

export interface Issue {
  dimension: DimensionId;
  severity: Severity;
  effort: Effort;
  /** Computed by priority.ts from severity × effort — never by the LLM. */
  priorityRank: number;
  summary: string;
  evidence: Evidence[];
  recommendations: string[];
  confidence: Confidence;
}

export interface QuickWin {
  dimension: DimensionId;
  action: string;
  why: string;
}

/**
 * §7: when strengthening a bullet would need a fact the CV doesn't
 * contain, the engine ASKS instead of inventing.
 */
export interface MissingEvidenceQuestion {
  dimension: DimensionId;
  /** What in the CV prompted the question. */
  context: Evidence;
  question: string;
}

export interface RewriteExample {
  before: string;
  after: string;
  classification: FactClassification;
  /** What changed and why every fact survived unchanged. */
  note: string;
}

// ── Target role / JD analysis (§14–15) ───────────────────────────────────
export type KeywordTier = "core" | "supporting" | "optional";
/** "not_demonstrated" ≠ "candidate doesn't have it" — the CV only tells
 *  us what is documented. */
export type MatchLevel = "strong_match" | "partial_match" | "not_demonstrated";

export interface KeywordFinding {
  keyword: string;
  tier: KeywordTier;
  match: MatchLevel;
  evidence: Evidence[];
}

export interface TargetRoleAnalysis {
  targetRole: string;
  hasJobDescription: boolean;
  positioningVerdict: string;
  keywordFindings: KeywordFinding[];
  gaps: string[];
}

// ── ATS (§13): indicators, never guarantees ──────────────────────────────
export interface AtsAnalysis {
  /** Explicitly "readability indicators", never a pass/fail claim. */
  indicators: Array<{
    check: string;
    status: "ok" | "risk" | "problem";
    detail: string;
  }>;
  disclaimer: string;
}

// ── Action plan (§23–24): what to fix FIRST ──────────────────────────────
export interface ActionPlanStep {
  order: number;
  issueSummary: string;
  severity: Severity;
  effort: Effort;
}

// ── Analysis input context ───────────────────────────────────────────────
export interface AnalysisContext {
  seniority: SeniorityLevel;
  /** The CV's OWN detected language — drives the language_quality rubric only (Arabic is never scored against English norms). Never used to decide what language the AI writes its prose in; see `outputLanguage`. */
  language: CvLanguage;
  /**
   * The language the CUSTOMER's UI is in — every customer-facing prose
   * field the model writes (shortReason, and anything derived from it)
   * must be written in this language, regardless of what language the CV
   * itself is in. Defaults to `language` (narrowed to ar/en) when the
   * caller doesn't supply one, so existing fixtures/tests/mock-provider
   * callers that never set this keep their current behavior.
   */
  outputLanguage?: "ar" | "en";
  targetRole?: string;
  jobDescription?: string;
  /** One of contextPatterns.ts's industry categories, when detectable. */
  industry?: string;
}

// ── The full report (§26) ────────────────────────────────────────────────
export interface CareerAnalysis {
  methodologyVersion: MethodologyVersion;
  /** Computed by scoring.ts from dimension scores + weights — never LLM. */
  overallScore: number;
  scoreBand: { min: number; labelEn: string; labelAr: string };
  confidence: Confidence;
  context: AnalysisContext;
  dimensions: DimensionResult[];
  excludedDimensions: ExcludedDimension[];
  strengths: Strength[];
  issues: Issue[];
  quickWins: QuickWin[];
  missingEvidenceQuestions: MissingEvidenceQuestion[];
  rewriteExamples: RewriteExample[];
  targetRoleAnalysis?: TargetRoleAnalysis;
  atsAnalysis: AtsAnalysis;
  actionPlan: ActionPlanStep[];
  metadata: {
    analyzedAt: string;
    /** Whether an overall-score cap fired (scoring.ts documents each). */
    capsApplied: string[];
  };
}
