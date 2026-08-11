/**
 * SENIORITY MODEL (Command 03 §9).
 *
 * The same bullet is NOT judged identically at every level. Each level
 * defines what the document is expected to demonstrate, what it must
 * never be punished for lacking, and per-dimension weight multipliers
 * that scoring.ts folds into normalization (a multiplier of 0 excludes
 * the dimension entirely at that level; scores are renormalized so no
 * level is advantaged by exclusion).
 */
import type { DimensionId, SeniorityLevel } from "./types.ts";

export interface SeniorityExpectation {
  level: SeniorityLevel;
  titleAr: string;
  /** What a strong document DOES demonstrate at this level. */
  expects: string[];
  /** What the document must NEVER lose points for lacking at this level. */
  neverPenalizeForMissing: string[];
  /** Guidance handed to the LLM when evaluating at this level. */
  guidance: string;
}

export const SENIORITY_EXPECTATIONS: readonly SeniorityExpectation[] = [
  {
    level: "entry",
    titleAr: "مبتدئ",
    expects: ["execution", "learning velocity", "contribution", "initiative within scope"],
    neverPenalizeForMissing: ["people management", "strategy", "cross-team influence", "budget ownership"],
    guidance:
      "Judge execution, learning, and contribution. Projects, internships, and coursework are legitimate evidence. Do NOT force leadership language onto this document and do NOT penalize its absence.",
  },
  {
    level: "mid",
    titleAr: "متوسط",
    expects: ["independent execution", "ownership of features/workstreams", "collaboration", "growing scope"],
    neverPenalizeForMissing: ["people management", "organizational strategy"],
    guidance:
      "Ownership here means owning work end-to-end, not owning people. Look for independence and the first signs of scope growth.",
  },
  {
    level: "senior",
    titleAr: "أول / خبير",
    expects: ["ownership", "complexity", "independence", "impact", "mentoring signals"],
    neverPenalizeForMissing: ["formal direct reports", "org-level strategy"],
    guidance:
      "Expect end-to-end ownership of complex work and visible impact. Mentoring and informal leadership strengthen; their absence alone does not sink.",
  },
  {
    level: "lead",
    titleAr: "قائد فريق تقني",
    expects: ["technical direction", "cross-team influence", "delivery ownership", "raising others' work"],
    neverPenalizeForMissing: ["formal people-management chains", "P&L ownership"],
    guidance:
      "Expect direction-setting and delivery ownership across a team's work, with influence that crosses team boundaries.",
  },
  {
    level: "manager",
    titleAr: "مدير",
    expects: [
      "team leadership",
      "delivery",
      "hiring and coaching",
      "stakeholder management",
      "organizational outcomes",
    ],
    neverPenalizeForMissing: ["hands-on task minutiae"],
    guidance:
      "A manager document consisting only of individual task descriptions is a major finding (§33): expect team, delivery, people development, and stakeholder content.",
  },
  {
    level: "director",
    titleAr: "مدير تنفيذي أول",
    expects: ["strategy", "portfolio/business impact", "organization scale", "transformation", "decision-making"],
    neverPenalizeForMissing: ["tool-level detail", "individual task content"],
    guidance:
      "Expect multi-team or portfolio scope, strategic decisions, and organizational outcomes. Tool lists are noise at this altitude.",
  },
  {
    level: "executive",
    titleAr: "قيادة عليا",
    expects: ["strategy", "business impact", "organization scale", "transformation", "decision-making"],
    neverPenalizeForMissing: ["tool-level detail", "individual task content", "technology lists"],
    guidance:
      "The document should read as business leadership: direction set, organizations changed, results owned at company scale.",
  },
] as const;

export function expectationFor(level: SeniorityLevel): SeniorityExpectation {
  return SENIORITY_EXPECTATIONS.find((e) => e.level === level)!;
}

/**
 * Per-seniority weight multipliers, applied before normalization.
 * 0 = dimension excluded at that level (recorded as excluded, then the
 * remaining weights are renormalized to 100 — see scoring.ts §3).
 * Dimensions not listed keep multiplier 1 at every level.
 */
export const SENIORITY_WEIGHT_MULTIPLIERS: Partial<
  Record<DimensionId, Partial<Record<SeniorityLevel, number>>>
> = {
  leadership_ownership: {
    entry: 0, // never judged on leadership (§9, §33)
    mid: 0.5, // ownership-of-work only, lightly weighted
    senior: 1,
    lead: 1.25,
    manager: 1.5,
    director: 1.5,
    executive: 1.5,
  },
  career_progression: {
    entry: 0.5, // a short trajectory is not a flaw
  },
};
