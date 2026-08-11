/**
 * SYNTHETIC METHODOLOGY FIXTURES (Command 03 §32).
 *
 * Fictional people only — no real customer data, no real CVs. Each
 * fixture models what the LLM stage will eventually produce (per-
 * dimension scores with confidence) for a characteristic document, so
 * the DETERMINISTIC parts — weights, normalization, caps, priority,
 * projection, language handling, optional-JD handling — can be tested
 * today with no AI involved.
 */
import type {
  AnalysisContext,
  Confidence,
  DimensionId,
  DimensionResult,
} from "../../functions/_shared/methodology/index.ts";

export interface Fixture {
  name: string;
  description: string;
  context: AnalysisContext;
  /** Scores for every dimension; the engine ignores non-applicable ones. */
  scores: Record<DimensionId, number>;
  confidence?: Partial<Record<DimensionId, Confidence>>;
}

export function toDimensionResults(fixture: Fixture): DimensionResult[] {
  return (Object.entries(fixture.scores) as [DimensionId, number][]).map(
    ([dimension, score]) => ({
      dimension,
      score,
      confidence: fixture.confidence?.[dimension] ?? "high",
      evidence: [
        { section: "Experience", role: "Synthetic Role", text: `[synthetic evidence for ${dimension}]` },
      ],
      reason: `Synthetic fixture score for ${dimension}.`,
      recommendations: [],
    }),
  );
}

export const fixture_entry_weak: Fixture = {
  name: "fixture_entry_weak",
  description:
    "Recent graduate 'Noor Al-Fiktiri': generic objective, task-only bullets, big skills list. No target role given. Must land in a low band WITHOUT being judged on leadership.",
  context: { seniority: "entry", language: "en" },
  scores: {
    positioning: 45,
    professional_summary: 30,
    experience_quality: 40,
    achievement_impact: 35,
    career_progression: 55,
    leadership_ownership: 0, // must be EXCLUDED, not counted (§9, §33)
    skills_relevance: 45,
    ats_readability: 70,
    target_role_alignment: 0, // excluded: no target role
    keyword_coverage: 0, // excluded: no JD
    evidence_specificity: 35,
    language_quality: 60,
    content_prioritization: 45,
    redundancy_noise: 55,
    seniority_alignment: 65,
  },
  confidence: { career_progression: "medium", evidence_specificity: "medium" },
};

export const fixture_senior_strong: Fixture = {
  name: "fixture_senior_strong",
  description:
    "Senior engineer 'Sami Example' targeting a named role with a JD: owned systems, clear outcomes, verified metrics where real. Should reach the Strong band or better.",
  context: {
    seniority: "senior",
    language: "en",
    targetRole: "Senior Backend Engineer",
    jobDescription: "[synthetic JD: distributed systems, mentoring, on-call ownership]",
    industry: "technology_software",
  },
  scores: {
    positioning: 90,
    professional_summary: 85,
    experience_quality: 88,
    achievement_impact: 90,
    career_progression: 85,
    leadership_ownership: 82,
    skills_relevance: 88,
    ats_readability: 90,
    target_role_alignment: 88,
    keyword_coverage: 85,
    evidence_specificity: 90,
    language_quality: 88,
    content_prioritization: 85,
    redundancy_noise: 90,
    seniority_alignment: 90,
  },
};

export const fixture_manager_tasks_only: Fixture = {
  name: "fixture_manager_tasks_only",
  description:
    "Manager 'Reem Placeholder' whose CV is entirely individual task descriptions: no team, delivery, hiring, or stakeholder content. Leadership must drag the score meaningfully (§33).",
  context: { seniority: "manager", language: "en" },
  scores: {
    positioning: 65,
    professional_summary: 60,
    experience_quality: 55,
    achievement_impact: 45,
    career_progression: 60,
    leadership_ownership: 20, // the §33 case — weighted 1.5× at manager
    skills_relevance: 65,
    ats_readability: 80,
    target_role_alignment: 0, // excluded
    keyword_coverage: 0, // excluded
    evidence_specificity: 55,
    language_quality: 70,
    content_prioritization: 60,
    redundancy_noise: 70,
    seniority_alignment: 40,
  },
};

export const fixture_arabic_generic: Fixture = {
  name: "fixture_arabic_generic",
  description:
    "Arabic-only CV for 'مثال افتراضي': natural professional Arabic (language itself is fine) but a generic summary and duty-list bullets. Arabic structure must cost nothing by itself (§33).",
  context: { seniority: "mid", language: "ar" },
  scores: {
    positioning: 55,
    professional_summary: 35,
    experience_quality: 50,
    achievement_impact: 45,
    career_progression: 60,
    leadership_ownership: 55,
    skills_relevance: 60,
    ats_readability: 65,
    target_role_alignment: 0, // excluded
    keyword_coverage: 0, // excluded
    evidence_specificity: 45,
    language_quality: 78, // the Arabic is GOOD Arabic — scored by its own conventions
    content_prioritization: 55,
    redundancy_noise: 60,
    seniority_alignment: 65,
  },
  confidence: { achievement_impact: "medium" },
};

export const fixture_technical_good_no_metrics: Fixture = {
  name: "fixture_technical_good_no_metrics",
  description:
    "Senior specialist 'Firas Synthetic': strong ownership, named systems, credible concrete outcomes — but not a single number (confidential employer). Must still be able to score highly (§33).",
  context: { seniority: "senior", language: "en", industry: "banking_financial_services" },
  scores: {
    positioning: 85,
    professional_summary: 80,
    experience_quality: 85,
    achievement_impact: 82, // outcomes stated factually, no figures — still strong
    career_progression: 82,
    leadership_ownership: 78,
    skills_relevance: 85,
    ats_readability: 88,
    target_role_alignment: 0, // excluded
    keyword_coverage: 0, // excluded
    evidence_specificity: 85, // specificity ≠ metrics: named systems and scopes count
    language_quality: 85,
    content_prioritization: 82,
    redundancy_noise: 88,
    seniority_alignment: 85,
  },
};

export const fixture_job_match_partial: Fixture = {
  name: "fixture_job_match_partial",
  description:
    "Mid-level analyst 'Dana Testcase' applying against a JD she partially matches: core keywords half-demonstrated, transferable work untranslated into the JD's vocabulary.",
  context: {
    seniority: "mid",
    language: "en",
    targetRole: "Data Analyst",
    jobDescription: "[synthetic JD: SQL, dashboarding, stakeholder reporting, forecasting]",
    industry: "data_analytics",
  },
  scores: {
    positioning: 70,
    professional_summary: 65,
    experience_quality: 70,
    achievement_impact: 65,
    career_progression: 70,
    leadership_ownership: 60,
    skills_relevance: 65,
    ats_readability: 80,
    target_role_alignment: 60,
    keyword_coverage: 55,
    evidence_specificity: 65,
    language_quality: 75,
    content_prioritization: 70,
    redundancy_noise: 75,
    seniority_alignment: 70,
  },
  confidence: { target_role_alignment: "medium", keyword_coverage: "medium" },
};

/** The §33 stress case: beautiful prose, zero checkable evidence. */
export const fixture_polished_no_evidence: Fixture = {
  name: "fixture_polished_no_evidence",
  description:
    "Ghost-written CV for 'Lina Mockdata': immaculate language and structure, but not one verifiable fact. The evidence cap must hold the overall out of the top bands.",
  context: { seniority: "senior", language: "en" },
  scores: {
    positioning: 92,
    professional_summary: 90,
    experience_quality: 80,
    achievement_impact: 75,
    career_progression: 85,
    leadership_ownership: 80,
    skills_relevance: 85,
    ats_readability: 95,
    target_role_alignment: 0, // excluded
    keyword_coverage: 0, // excluded
    evidence_specificity: 30, // below the cap threshold
    language_quality: 95,
    content_prioritization: 90,
    redundancy_noise: 90,
    seniority_alignment: 88,
  },
};

export const ALL_FIXTURES: Fixture[] = [
  fixture_entry_weak,
  fixture_senior_strong,
  fixture_manager_tasks_only,
  fixture_arabic_generic,
  fixture_technical_good_no_metrics,
  fixture_job_match_partial,
  fixture_polished_no_evidence,
];
