/**
 * INDUSTRY / ROLE CONTEXT (Command 03 §21).
 *
 * Extensible context architecture with a deliberately small, useful V1 —
 * not a thousand industry rules. Categories are the extension points;
 * `rolePatterns` and `industryPatterns` are the data that grows over
 * time (mirrored into knowledge.role_patterns by the seed migration).
 */

export const INDUSTRY_CATEGORIES = [
  "technology_software",
  "product",
  "data_analytics",
  "cybersecurity",
  "banking_financial_services",
  "human_resources",
  "marketing",
  "sales",
  "operations",
  "consulting",
  "project_management",
  "government_public_sector",
  "executive_leadership",
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];

export interface RolePattern {
  id: string;
  roleFamily: string;
  industry: IndustryCategory;
  /** What strong CVs in this family tend to demonstrate. */
  expectedSignals: string[];
  /** Family-specific pitfalls worth flagging. */
  commonPitfalls: string[];
  /** Terms that naturally belong — hints for coverage, never for stuffing. */
  keywordHints: string[];
}

export interface IndustryPattern {
  id: string;
  industry: IndustryCategory;
  /** Industry-level evaluation notes that apply across its role families. */
  notes: string[];
}

/** V1: a handful of genuinely useful patterns. Grow in the knowledge DB. */
export const ROLE_PATTERNS: readonly RolePattern[] = [
  {
    id: "software_engineer_v1",
    roleFamily: "software_engineer",
    industry: "technology_software",
    expectedSignals: [
      "systems or products named, with the person's part in them clear",
      "technical scope: scale, constraints, or complexity visible",
      "outcomes framed as shipped/improved/unblocked, not 'coded'",
    ],
    commonPitfalls: [
      "technology lists standing in for accomplishments",
      "project descriptions that never say what the person did",
      "senior engineers writing task-level bullets",
    ],
    keywordHints: ["architecture", "shipped", "scale", "reliability", "code review", "on-call"],
  },
  {
    id: "product_manager_v1",
    roleFamily: "product_manager",
    industry: "product",
    expectedSignals: [
      "products/features owned and the decision-making behind them",
      "user or business outcomes attached to launches",
      "cross-functional surface area (engineering, design, stakeholders)",
    ],
    commonPitfalls: [
      "process vocabulary (roadmaps, ceremonies) with no product outcome",
      "claiming team outcomes without the PM's own contribution legible",
    ],
    keywordHints: ["launched", "adoption", "discovery", "prioritization", "stakeholders", "metrics"],
  },
  {
    id: "data_analyst_v1",
    roleFamily: "data_analyst",
    industry: "data_analytics",
    expectedSignals: [
      "questions answered and decisions the analysis changed",
      "data scale, sources, or pipelines described concretely",
      "tools in service of findings, not as the headline",
    ],
    commonPitfalls: [
      "dashboard counts instead of decisions influenced",
      "SQL/Python listed with no analysis story",
    ],
    keywordHints: ["insight", "decision", "pipeline", "modeling", "dashboard", "stakeholders"],
  },
  {
    id: "hr_specialist_v1",
    roleFamily: "hr_specialist",
    industry: "human_resources",
    expectedSignals: [
      "processes owned (recruiting, onboarding, performance) with volumes/scope",
      "outcomes for the organization: time-to-hire, retention context, program adoption",
    ],
    commonPitfalls: [
      "policy administration listed with no organizational effect",
      "confidentiality used as a reason to write nothing concrete (scope can be stated without names)",
    ],
    keywordHints: ["talent acquisition", "onboarding", "employee relations", "performance management"],
  },
  {
    id: "project_manager_v1",
    roleFamily: "project_manager",
    industry: "project_management",
    expectedSignals: [
      "projects with scope, budget-or-team size, and delivery outcomes",
      "risk and stakeholder management shown as decisions, not vocabulary",
    ],
    commonPitfalls: [
      "methodology certifications carrying the document instead of delivered projects",
      "'managed project X' with no size, outcome, or role clarity",
    ],
    keywordHints: ["delivery", "scope", "risk", "stakeholders", "milestones", "budget"],
  },
] as const;

export const INDUSTRY_PATTERNS: readonly IndustryPattern[] = [
  {
    id: "government_public_sector_v1",
    industry: "government_public_sector",
    notes: [
      "Formal register and committee/initiative naming are normal here — do not flag them as bureaucratic noise the way a startup CV would be judged.",
      "Outcomes may be programmatic (services launched, compliance achieved, citizens served) rather than commercial.",
    ],
  },
  {
    id: "banking_financial_services_v1",
    industry: "banking_financial_services",
    notes: [
      "Regulatory and risk vocabulary is substantive, not filler.",
      "Numbers are often confidential; scope statements without figures are acceptable evidence — never push for numbers the person may not be allowed to share.",
    ],
  },
  {
    id: "executive_leadership_v1",
    industry: "executive_leadership",
    notes: [
      "Evaluate at the altitude of strategy, transformation, and organizational outcomes; tool and task detail is a prioritization finding at this level.",
    ],
  },
] as const;
