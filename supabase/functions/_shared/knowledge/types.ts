/**
 * Command 04 — types for the operator-CV knowledge base.
 *
 * Two hard distinctions run through everything here (§7–§8):
 *
 *  1. SOURCE FACT vs REUSABLE WRITING PATTERN. Raw CV text is always an
 *     OPERATOR_SPECIFIC_FACT. Only the abstracted pattern (slots, no
 *     names, no operator metrics) may ever be shown to another user.
 *
 *  2. CANDIDATE vs APPROVED. Ingestion never auto-approves (§4). Every
 *     row this command produces enters as status = "candidate"; the
 *     operator promotes rows to "approved" after review.
 */
import type { SeniorityLevel } from "../methodology/types.ts";

export type { SeniorityLevel };

/** Which of the four §8 classes a piece of content belongs to. */
export type ContentClass =
  | "STRUCTURAL_PATTERN" // sentence architecture: slots, ordering
  | "LANGUAGE_PATTERN" // verb choice, register, phrasing guidance
  | "ROLE_GUIDANCE" // what a role/seniority should demonstrate
  | "OPERATOR_SPECIFIC_FACT"; // Turki's companies, metrics, awards — never reusable

/** §3 quality classification of a content unit. */
export type UnitQuality = "STRONG" | "ACCEPTABLE" | "WEAK" | "DO_NOT_REUSE";

/** §4 approval lifecycle. Ingestion writes only "candidate". */
export type ApprovalStatus = "candidate" | "approved" | "rejected";

export type KnowledgeLanguage = "ar" | "en";

export type RoleFamily =
  | "software_engineering"
  | "engineering_leadership"
  | "product"
  | "data"
  | "any";

export type Industry =
  | "technology"
  | "banking"
  | "fintech"
  | "government"
  | "any";

export type ContentType =
  | "summary"
  | "bullet"
  | "achievement"
  | "project"
  | "leadership"
  | "technical"
  | "career_progression"
  | "award"
  | "anti_pattern";

/** One source CV file, with provenance (§1). */
export interface OperatorCvSource {
  sourceId: string;
  filename: string;
  language: KnowledgeLanguage;
  /** Human label for the version, e.g. "v5 — 2026 Engineering Manager". */
  documentVersion: string;
  /** Best estimate of when this version was current; null if unknowable. */
  estimatedPeriod: string | null;
  source: "operator_cv";
  ingestedAt: string; // ISO date of this ingestion run
  /**
   * Stable fingerprint of the extracted text content. Files with the same
   * fingerprint are the same CV saved twice — their units are deduplicated
   * into one unit with multiple sourceIds (§28).
   */
  contentFingerprint: string;
}

/** Flags raised for the operator during review — never "fixed" silently. */
export interface ReviewFlag {
  flagId: string;
  kind:
    | "conflicting_metric" // same claim, different numbers across versions
    | "implausible_metric" // e.g. "satisfaction by 150%"
    | "unverifiable_metric" // e.g. "quality by 95%" with no observable
    | "metric_mutation" // a later version changed WHAT the number measures
    | "inconsistent_experience_years";
  affectedUnitIds: string[];
  detail: string;
  /** §6: the question we ask instead of picking a number. */
  missingEvidenceQuestion: string;
}

/**
 * One evaluated content unit from the operator CVs (§2–§3).
 *
 * `rawText` is the source fact (OPERATOR_SPECIFIC_FACT — service-role
 * workspace only). `patternText` is the anonymized structural abstraction
 * with [slots]; it must contain no operator names and no operator metrics,
 * and is the ONLY part retrieval may surface (§7–§8).
 */
export interface CvContentUnit {
  unitId: string;
  sourceIds: string[]; // every distinct version this text appears in
  rawText: string;
  quality: UnitQuality;
  contentType: ContentType;
  contentClass: ContentClass[]; // what reusable value it carries (beyond the raw fact)
  language: KnowledgeLanguage;
  seniority: SeniorityLevel;
  roleFamily: RoleFamily;
  industry: Industry;
  /** career_methodology_v1 dimension ids this unit teaches about. */
  dimensionIds: string[];
  /** Why it got its quality classification — shown in the review report. */
  evaluation: string;
  /** Anonymized reusable shape. Required unless quality = DO_NOT_REUSE. */
  patternText: string | null;
  /** The transferable lesson, phrased generically. */
  lesson: string | null;
  reviewFlagIds: string[];
}

/** §5 genuine before → after pair across CV versions. Texts are ANONYMIZED. */
export interface BeforeAfterPair {
  pairId: string;
  beforeUnitId: string;
  afterUnitId: string;
  /** Anonymized before/after — no operator company names or metrics. */
  before: string;
  after: string;
  whyImproved: string;
  dimensionIds: string[];
  factPreservationClassification:
    | "SAFE_TO_REWRITE"
    | "NEEDS_USER_CONFIRMATION"
    | "DO_NOT_INFER";
  seniority: SeniorityLevel;
  roleFamily: RoleFamily;
  industry: Industry;
  language: KnowledgeLanguage;
}

/** A reusable structural pattern abstracted from the units (§10–§14). */
export interface ReusablePattern {
  patternId: string;
  kind: "bullet" | "summary" | "project" | "leadership" | "technical";
  contentClass: Exclude<ContentClass, "OPERATOR_SPECIFIC_FACT">;
  name: string;
  /** Slot structure, e.g. "ACTION + OWNERSHIP + SCOPE + OUTCOME". */
  slots: string[];
  /** Fully anonymized template sentence with [slot] placeholders. */
  template: string;
  guidance: string;
  applicableSeniority: SeniorityLevel[];
  language: KnowledgeLanguage;
  dimensionIds: string[];
  derivedFromUnitIds: string[];
}

/** §18 anti-pattern library entry. */
export interface AntiPattern {
  antiPatternId: string;
  name: string;
  description: string;
  /** Anonymized illustration of the bad shape. */
  example: string;
  whyBad: string;
  detection: string;
  dimensionIds: string[];
  derivedFromUnitIds: string[];
}

/** Retrieval request context (§21, §23). */
export interface RetrievalContext {
  language: KnowledgeLanguage;
  seniority: SeniorityLevel;
  roleFamily?: RoleFamily;
  industry?: Industry;
  dimensionId?: string;
  contentType?: ContentType;
}

export interface RetrievalOptions {
  /** "production" = approved-only. "operator_review" also sees candidates. */
  mode: "production" | "operator_review";
  /** Explicitly request WEAK/anti-pattern material for BEFORE examples (§23). */
  includeAntiPatterns?: boolean;
  maxExamples?: number;
}

/** What retrieval is allowed to hand to a prompt — the reusable projection. */
export interface RetrievalExample {
  id: string;
  title: string;
  kind: "example" | "anti_pattern";
  contentClass: Exclude<ContentClass, "OPERATOR_SPECIFIC_FACT">;
  language: KnowledgeLanguage;
  seniority: SeniorityLevel | null;
  roleFamily: RoleFamily | null;
  contentType: ContentType | null;
  dimensionIds: string[];
  /** Anonymized pattern/template/lesson text only — never raw CV text. */
  text: string;
  lesson: string | null;
}

/** Internal pool entry the ranker filters/scores (mirror of a DB row). */
export interface RetrievalPoolEntry {
  id: string;
  status: ApprovalStatus;
  quality: UnitQuality | null; // null for synthetic/manual rows
  example: RetrievalExample;
}
