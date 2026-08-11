/**
 * DETERMINISTIC MOCK AI PROVIDER (Command 05 §32).
 *
 * Built first, on purpose: the whole pipeline — validation, evidence
 * verification, fact preservation, scoring, projection, retrieval,
 * errors — must be testable with no external AI account, no network, no
 * credentials (§32). This provider reads real signal out of the
 * `NormalizedResume` (weak-verb ratios, buzzword density, numeric
 * evidence, bullet counts, summary length…) and turns it into
 * `DimensionAIResult`s deterministically: same resume in, same scores out,
 * every time. It is intentionally simple heuristics, not a simulation of
 * what a real model would say — its job is to exercise the pipeline
 * faithfully, not to be a good CV reviewer. A real provider adapter
 * (§33) replaces this without the pipeline changing at all.
 *
 * Every evidence quote this provider emits is a verbatim substring of the
 * resume it was given, so it should always survive evidenceValidation.ts
 * — the mock is not exempt from the same verification a real model's
 * output goes through.
 */
import type { AnalysisContext, DimensionId, Evidence } from "../methodology/types.ts";
import type {
  AIConfidence,
  AnalyzeDimensionsInput,
  CareerAIProvider,
  DimensionAIResult,
  NormalizedResume,
  RewriteCandidateResult,
  RewriteGenerationInput,
} from "./types.ts";

const WEAK_VERB_RE = /^(responsible for|worked on|participated in|helped with|assisted with|involved in)/i;
const STRONG_VERB_RE =
  /^(led|built|launched|managed|designed|implemented|drove|delivered|owned|created|improved|reduced|increased|negotiated|mentored|coached|architected|shipped|scaled|founded|established|streamlined|automated|resolved|analyzed|developed|directed)/i;
const GENERIC_SUMMARY_RE =
  /(highly motivated|results-driven|seeking a challenging|hardworking team player|passionate professional|dynamic individual|proven track record of success)/i;
const BUZZWORD_RE = /\b(synergy|synergies|dynamic|passionate|results-driven|go-getter|thought leader)\b/i;
// Bullet-level buzzword/vague detector: content-free language that must
// never count as "specific" evidence just because the sentence is long.
const BULLET_VAGUE_OR_BUZZWORD_RE =
  /\b(various|multiple|several|numerous|synergy|synergies|dynamic|passionate|results-driven|excellence|transformative|championed|game-changing|cutting-edge)\b/i;
// Decision/ownership-shaped leadership signals — deliberately excludes bare
// mentions like "stakeholders" or "team", which are too weak on their own
// to count as demonstrated leadership (§9: vocabulary is not evidence).
const LEADERSHIP_SIGNAL_RE = /\b(led (the|a|an)|managed (a |the )?team|mentored|hired|coached|direct reports|owned the (team|delivery|roadmap|strategy))\b/i;

interface Signals {
  allBullets: string[];
  weakCount: number;
  strongCount: number;
  numericBulletCount: number;
  /** Bullets carrying a checkable specific — a number OR a sufficiently detailed, non-buzzword claim (named systems/scopes count, per the methodology's own evidence_specificity rubric: specificity ≠ metrics). */
  specificBulletCount: number;
  duplicateBulletCount: number;
  hasSummary: boolean;
  genericSummary: boolean;
  buzzwordCount: number;
  skillsCount: number;
  demonstratedSkillCount: number;
  entryCount: number;
  recentEntryBulletCount: number;
}

function computeSignals(resume: NormalizedResume): Signals {
  const allBullets = resume.experience.flatMap((e) => e.bullets);
  const seen = new Set<string>();
  let duplicateBulletCount = 0;
  for (const b of allBullets) {
    const key = b.trim().toLowerCase();
    if (seen.has(key)) duplicateBulletCount += 1;
    else seen.add(key);
  }
  const skillsLower = resume.skills.map((s) => s.toLowerCase());
  const bulletsLower = allBullets.join(" \n ").toLowerCase();
  const demonstratedSkillCount = skillsLower.filter((s) => s.length > 1 && bulletsLower.includes(s)).length;

  return {
    allBullets,
    weakCount: allBullets.filter((b) => WEAK_VERB_RE.test(b.trim())).length,
    strongCount: allBullets.filter((b) => STRONG_VERB_RE.test(b.trim())).length,
    numericBulletCount: allBullets.filter((b) => /\d/.test(b)).length,
    specificBulletCount: allBullets.filter(
      (b) => (/\d/.test(b) || b.trim().length >= 55) && !BULLET_VAGUE_OR_BUZZWORD_RE.test(b),
    ).length,
    duplicateBulletCount,
    hasSummary: !!resume.summary && resume.summary.trim().length > 0,
    genericSummary: !!resume.summary && GENERIC_SUMMARY_RE.test(resume.summary),
    buzzwordCount: (resume.summary ?? "").match(new RegExp(BUZZWORD_RE, "gi"))?.length ?? 0,
    skillsCount: resume.skills.length,
    demonstratedSkillCount,
    entryCount: resume.experience.length,
    recentEntryBulletCount: resume.experience[0]?.bullets.length ?? 0,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function evid(section: string, text: string, role?: string): Evidence {
  return role ? { section, role, text } : { section, text };
}

function confidenceFor(evidenceCount: number, uncertain: boolean): AIConfidence {
  if (uncertain || evidenceCount === 0) return "low";
  if (evidenceCount === 1) return "medium";
  return "high";
}

type Scorer = (
  s: Signals,
  resume: NormalizedResume,
  context: AnalysisContext,
) => Omit<DimensionAIResult, "dimensionId">;

const SCORERS: Partial<Record<DimensionId, Scorer>> = {
  positioning: (s, resume) => {
    const score = clamp(50 + (s.hasSummary ? 20 : -10) + (resume.header ? 10 : 0) - (s.genericSummary ? 15 : 0));
    const evidence = resume.header ? [evid("Header", resume.header)] : [];
    return {
      score,
      confidence: confidenceFor(evidence.length, resume.structureUncertain),
      evidence,
      reason: resume.header
        ? "Header/summary present; identity legibility inferred from summary presence and specificity."
        : "No clear header identified; positioning cannot be confidently assessed from structure alone.",
      recommendations: s.genericSummary ? ["Rewrite the summary opening to state a specific professional identity."] : [],
    };
  },
  professional_summary: (s, resume) => {
    if (!resume.summary) {
      return {
        score: 20,
        confidence: "medium",
        evidence: [],
        reason: "No professional summary section was identified.",
        recommendations: ["Add a two-to-four line professional summary naming role, level, and domain."],
      };
    }
    const score = clamp(75 - (s.genericSummary ? 35 : 0) - s.buzzwordCount * 8);
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [evid("Summary", resume.summary.slice(0, 200))],
      reason: s.genericSummary
        ? "Summary opens with generic boilerplate phrasing rather than a specific claim."
        : "Summary present with domain-specific language.",
      recommendations: s.genericSummary
        ? ["Replace the generic opening with one fact from the experience section."]
        : [],
    };
  },
  experience_quality: (s) => {
    const total = s.allBullets.length;
    const score = total === 0 ? 15 : clamp(35 + (s.strongCount / total) * 55 - (s.duplicateBulletCount / total) * 30);
    const evidence = s.allBullets.slice(0, 2).map((b) => evid("Experience", b));
    return {
      score,
      confidence: confidenceFor(evidence.length, total === 0),
      evidence,
      reason: total === 0
        ? "No experience bullets were identified to evaluate."
        : `${s.strongCount} of ${total} bullets open with an ownership verb; ${s.duplicateBulletCount} duplicated bullets detected.`,
      recommendations: s.weakCount > 0 ? ["Replace weak openers ('responsible for', 'worked on') with ownership verbs."] : [],
    };
  },
  achievement_impact: (s) => {
    const total = s.allBullets.length;
    // Metrics are useful but not mandatory (methodology §33): a specific,
    // credible claim carries most of the weight; numbers add a bonus on
    // top rather than being the only path to a high score.
    const score = total === 0 ? 15 : clamp(30 + (s.specificBulletCount / total) * 45 + (s.numericBulletCount / total) * 25);
    const evidence = s.allBullets.filter((b) => /\d/.test(b) || b.trim().length >= 55).slice(0, 2).map((b) => evid("Experience", b));
    return {
      score,
      confidence: confidenceFor(evidence.length, total === 0),
      evidence,
      reason: total === 0
        ? "No experience content available to assess outcomes."
        : `${s.specificBulletCount} of ${total} bullets state a specific, checkable claim (${s.numericBulletCount} with an explicit number).`,
      recommendations: s.numericBulletCount === 0 && s.specificBulletCount === 0 ? ["Ask for the underlying outcome behind each responsibility bullet rather than inventing one."] : [],
    };
  },
  career_progression: (s, resume) => {
    const score = clamp(55 + Math.min(s.entryCount, 4) * 5);
    return {
      score,
      confidence: confidenceFor(resume.experience.length, resume.structureUncertain),
      evidence: resume.experience.slice(0, 1).map((e) => evid("Experience", `${e.title ?? ""} ${e.company ?? ""}`.trim() || "role")),
      reason: `${resume.experience.length} role(s) identified in the experience section.`,
      recommendations: [],
    };
  },
  leadership_ownership: (s, resume, context) => {
    const hits = s.allBullets.filter((b) => LEADERSHIP_SIGNAL_RE.test(b));
    const expectHigh = ["manager", "director", "executive", "lead"].includes(context.seniority);
    const score = hits.length === 0 ? (expectHigh ? 20 : 55) : clamp(35 + hits.length * 18);
    return {
      score,
      confidence: confidenceFor(hits.length, false),
      evidence: hits.slice(0, 2).map((b) => evid("Experience", b)),
      reason: hits.length > 0
        ? `${hits.length} bullet(s) show leadership/ownership language.`
        : expectHigh
          ? "No leadership/ownership content found at a level where it is expected."
          : "No explicit leadership content found; not weighted heavily at this seniority.",
      recommendations: expectHigh && hits.length === 0
        ? ["Surface team, delivery, or stakeholder outcomes the person can substantiate."]
        : [],
    };
  },
  skills_relevance: (s, resume) => {
    const ratio = s.skillsCount === 0 ? 0 : s.demonstratedSkillCount / s.skillsCount;
    const score = s.skillsCount === 0 ? 25 : clamp(40 + ratio * 60);
    return {
      score,
      confidence: confidenceFor(resume.skills.length > 0 ? 1 : 0, false),
      evidence: resume.skills.slice(0, 3).map((sk) => evid("Skills", sk)),
      reason: s.skillsCount === 0
        ? "No skills section identified."
        : `${s.demonstratedSkillCount} of ${s.skillsCount} listed skills appear demonstrated inside experience bullets.`,
      recommendations: ratio < 0.4 && s.skillsCount > 0 ? ["Cut or evidence skills the experience section never demonstrates."] : [],
    };
  },
  ats_readability: (s, resume) => {
    const score = clamp(70 + (resume.structureUncertain ? -30 : 15) + (resume.otherSections.length > 3 ? -10 : 0));
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [],
      reason: resume.structureUncertain
        ? "No standard section headings were confidently detected — structure may be harder for automated systems to parse."
        : "Standard section headings detected; single-column linear structure inferred from text order.",
      recommendations: resume.structureUncertain ? ["Use standard section headings (Experience, Education, Skills)."] : [],
    };
  },
  target_role_alignment: (s, resume, context) => {
    if (!context.targetRole) return { score: 0, confidence: "low", evidence: [], reason: "excluded: no target role", recommendations: [] };
    const roleWords = context.targetRole.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const headerText = `${resume.header ?? ""} ${resume.summary ?? ""}`.toLowerCase();
    const hits = roleWords.filter((w) => headerText.includes(w));
    const score = clamp(45 + (hits.length / Math.max(roleWords.length, 1)) * 45);
    return {
      score,
      confidence: confidenceFor(hits.length, false),
      evidence: hits.length > 0 && resume.summary ? [evid("Summary", resume.summary.slice(0, 200))] : [],
      reason: `${hits.length} of ${roleWords.length} target-role terms appear in the header/summary.`,
      recommendations: hits.length === 0 ? [`Name the target role or its family explicitly in the summary.`] : [],
    };
  },
  keyword_coverage: (s, resume, context) => {
    if (!context.jobDescription) return { score: 0, confidence: "low", evidence: [], reason: "excluded: no job description", recommendations: [] };
    const jdWords = Array.from(new Set(context.jobDescription.toLowerCase().match(/[a-z][a-z+.#]{2,}/g) ?? []));
    const resumeText = resume.rawTextReference.toLowerCase();
    const covered = jdWords.filter((w) => resumeText.includes(w));
    const score = jdWords.length === 0 ? 50 : clamp((covered.length / jdWords.length) * 100);
    return {
      score,
      confidence: confidenceFor(covered.length, false),
      evidence: [],
      reason: `${covered.length} of ${jdWords.length} distinct job-description terms appear somewhere in the document.`,
      recommendations: [],
    };
  },
  evidence_specificity: (s) => {
    const total = s.allBullets.length;
    const vagueCount = s.allBullets.filter((b) => BULLET_VAGUE_OR_BUZZWORD_RE.test(b)).length;
    const score = total === 0 ? 15 : clamp(30 + (s.specificBulletCount / total) * 55 - (vagueCount / total) * 25);
    return {
      score,
      confidence: confidenceFor(s.specificBulletCount, total === 0),
      evidence: s.allBullets.filter((b) => /\d/.test(b) || b.trim().length >= 55).slice(0, 2).map((b) => evid("Experience", b)),
      reason: total === 0
        ? "No experience content available to assess specificity."
        : `${s.specificBulletCount} of ${total} bullets are concrete and checkable; ${vagueCount} lean on vague quantifiers or buzzwords.`,
      recommendations: vagueCount > 0 ? ["Ask for the underlying fact behind vague quantifiers/buzzwords rather than guessing one."] : [],
    };
  },
  language_quality: (s, resume) => {
    const score = clamp(80 - s.buzzwordCount * 10 - s.weakCount * 5);
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [],
      reason: `${s.buzzwordCount} buzzword(s) detected in the summary; ${s.weakCount} weak-verb bullet opener(s) in the experience section.`,
      recommendations: s.weakCount > 0 ? ["Rewrite weak-verb openers with stronger ownership verbs, keeping every fact unchanged."] : [],
    };
  },
  content_prioritization: (s, resume) => {
    const score = clamp(65 + (resume.experience[0]?.bullets.length ?? 0) * 2 - resume.otherSections.length * 3);
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [],
      reason: "Space allocation inferred from relative section and bullet-count sizes.",
      recommendations: [],
    };
  },
  redundancy_noise: (s) => {
    const total = s.allBullets.length;
    const score = total === 0 ? 70 : clamp(90 - (s.duplicateBulletCount / total) * 80);
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [],
      reason: `${s.duplicateBulletCount} duplicated bullet(s) detected across the experience section.`,
      recommendations: s.duplicateBulletCount > 0 ? ["Keep the strongest instance of each repeated idea; cut the rest."] : [],
    };
  },
  seniority_alignment: (s, resume, context) => {
    const leadershipWords = /\b(led|managed|mentored|strategy|organization)\b/i;
    const hasLeadership = s.allBullets.some((b) => leadershipWords.test(b));
    const expectLeadership = ["manager", "director", "executive", "lead"].includes(context.seniority);
    const score = expectLeadership ? clamp(hasLeadership ? 80 : 40) : clamp(75);
    return {
      score,
      confidence: confidenceFor(1, false),
      evidence: [],
      reason: expectLeadership
        ? hasLeadership
          ? "Leadership-register content present, consistent with claimed seniority."
          : "Claimed seniority implies leadership register the document does not clearly show."
        : "Content register assessed as broadly consistent with claimed seniority.",
      recommendations: [],
    };
  },
};

function analyzeDimensionsMock(input: AnalyzeDimensionsInput): DimensionAIResult[] {
  const signals = computeSignals(input.normalizedResume);
  return input.dimensionIds.map((dimensionId) => {
    const scorer = SCORERS[dimensionId];
    if (!scorer) {
      return {
        dimensionId,
        score: 50,
        confidence: "low" as const,
        evidence: [],
        reason: "No heuristic implemented for this dimension in the mock provider.",
        recommendations: [],
      };
    }
    const result = scorer(signals, input.normalizedResume, input.context);
    return { dimensionId, ...result };
  });
}

async function generateRewriteMock(input: RewriteGenerationInput): Promise<RewriteCandidateResult | null> {
  const before = input.candidateBefore;
  const trimmed = before.trim();

  // Deterministic, fact-preserving rewrite: strengthen a known weak-verb
  // pattern without adding or removing any noun, number, or scope.
  const weakPatterns: Array<[RegExp, string]> = [
    [/^was responsible for the management of\s+/i, "Managed "],
    [/^was responsible for\s+/i, "Owned "],
    [/^responsible for\s+/i, "Owned "],
    [/^worked on\s+/i, "Contributed to "],
    [/^helped with\s+/i, "Supported "],
    [/^participated in\s+/i, "Took part in "],
  ];

  for (const [pattern, replacement] of weakPatterns) {
    if (pattern.test(trimmed)) {
      const after = trimmed.replace(pattern, replacement).replace(/\.$/, "").trim();
      const finalAfter = after.charAt(0).toUpperCase() + after.slice(1) + (after.endsWith(".") ? "" : ".");
      return {
        before: trimmed,
        after: finalAfter,
        classification: "SAFE_TO_REWRITE",
        note: "Replaced a weak-verb opener with a stronger ownership verb; no fact added or removed.",
      };
    }
  }
  return null;
}

export function createMockCareerAIProvider(): CareerAIProvider {
  return {
    name: "mock",
    model: "deterministic-heuristic-v1",
    analyzeDimensions: (input) => Promise.resolve(analyzeDimensionsMock(input)),
    generateRewrite: (input) => generateRewriteMock(input),
  };
}
