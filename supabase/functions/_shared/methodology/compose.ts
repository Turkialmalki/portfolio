/**
 * PROMPT ARCHITECTURE (Command 03 §29).
 *
 * Not one 5,000-line system prompt. The methodology is stored as data
 * (this directory / knowledge.*), and each future AI request receives
 * ONLY the sections relevant to that analysis, composed here:
 *
 *   core rules → fact preservation → the APPLICABLE rubrics only →
 *   seniority guidance for THIS level → language guidance for THIS CV →
 *   role/industry pattern if matched → example slots.
 *
 * A CV with no job description never wastes context on the keyword
 * rubric; an entry-level CV never carries manager guidance. The actual
 * provider call does not exist yet (§35) — this returns typed sections,
 * and rendering them to a provider's message format is Command 05's job.
 */
import type { AnalysisContext } from "./types.ts";
import { CAREER_METHODOLOGY_VERSION } from "./version.ts";
import { rubricFor } from "./dimensions.ts";
import { expectationFor } from "./seniority.ts";
import { planWeights } from "./scoring.ts";
import { guidanceForCase, CV_LANGUAGE_CASES } from "./language.ts";
import {
  ALLOWED_OPERATIONS,
  FACT_CLASSIFICATION_RULES,
  MISSING_EVIDENCE_QUESTION_GUIDANCE,
  NEVER_INVENT,
} from "./factPreservation.ts";
import { INDUSTRY_PATTERNS, ROLE_PATTERNS } from "./contextPatterns.ts";

export interface MethodologySection {
  id: string;
  title: string;
  /** Structured payload — rendered to provider format in Command 05. */
  body: unknown;
}

export function composeMethodologyContext(context: AnalysisContext): MethodologySection[] {
  const sections: MethodologySection[] = [];
  const plan = planWeights(context);

  sections.push({
    id: "core",
    title: "Core rules",
    body: {
      methodologyVersion: CAREER_METHODOLOGY_VERSION,
      principles: [
        "Score only against the provided rubrics; every score needs quoted evidence from the document.",
        "Evaluate the DOCUMENT, never the person's worth.",
        "State low-confidence findings as possibilities, not facts.",
        "The overall score is computed by code from your dimension scores — never produce an overall score yourself.",
      ],
    },
  });

  sections.push({
    id: "fact_preservation",
    title: "Fact preservation (hard rules)",
    body: {
      allowedOperations: ALLOWED_OPERATIONS,
      neverInvent: NEVER_INVENT,
      classifications: FACT_CLASSIFICATION_RULES,
      missingEvidenceQuestions: MISSING_EVIDENCE_QUESTION_GUIDANCE,
    },
  });

  // Only the rubrics this analysis will actually score (§3, §29).
  for (const w of plan.included) {
    const rubric = rubricFor(w.dimension);
    sections.push({
      id: `rubric:${rubric.id}`,
      title: `Rubric — ${rubric.titleEn}`,
      body: rubric,
    });
  }

  sections.push({
    id: `seniority:${context.seniority}`,
    title: `Seniority guidance — ${context.seniority}`,
    body: expectationFor(context.seniority),
  });

  sections.push({
    id: `language:${context.language}`,
    title: "Language guidance",
    body: {
      case: CV_LANGUAGE_CASES.find((c) => c.case === context.language),
      guidance: guidanceForCase(context.language),
    },
  });

  if (context.targetRole) {
    sections.push({
      id: "target_role",
      title: "Target role context",
      body: {
        targetRole: context.targetRole,
        jobDescription: context.jobDescription ?? null,
        reminder:
          "'not demonstrated' means the CV does not document it — never conclude the candidate lacks it.",
      },
    });
  }

  if (context.industry) {
    const industryPattern = INDUSTRY_PATTERNS.find((p) => p.industry === context.industry);
    const rolePatterns = ROLE_PATTERNS.filter((p) => p.industry === context.industry);
    if (industryPattern || rolePatterns.length > 0) {
      sections.push({
        id: `context:${context.industry}`,
        title: "Industry / role patterns",
        body: { industryPattern: industryPattern ?? null, rolePatterns },
      });
    }
  }

  // Slot for knowledge.approved_examples / before_after_patterns rows,
  // selected server-side in Command 05 (the LLM never queries knowledge.*).
  sections.push({
    id: "examples",
    title: "Approved examples",
    body: { note: "populated at request time from the knowledge schema", examples: [] },
  });

  return sections;
}
