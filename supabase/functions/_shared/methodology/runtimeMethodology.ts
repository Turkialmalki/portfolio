/**
 * COMPACT RUNTIME METHODOLOGY (Command 05D.2 §6).
 *
 * `compose.ts`'s `composeMethodologyContext()` already does per-request
 * filtering correctly — only applicable rubrics, only the CV's own
 * language guidance, only the current seniority level, target-role/JD
 * sections only when present (Command 05D.1 confirmed this by reading the
 * code: the bloat was never "sending all 7 seniority levels" or "sending
 * both languages"). The bloat is each INCLUDED rubric being a full
 * documentation object — purpose, whatGoodLooksLike prose,
 * recommendationRules, every positive/warning/majorProblem signal, five
 * prose-heavy score anchors — multiplied by ~12 applicable dimensions.
 *
 * `compileRuntimeMethodology()` produces a MUCH smaller projection of the
 * exact same source rubrics for the AI call only: one compact evaluation
 * question, the top few positive signals and red flags, compact score
 * anchors. Nothing here changes `dimensions.ts` (the methodology source of
 * truth) or `recommendationRules` — `findings.ts` reads
 * `recommendationRules` from the FULL rubric via `rubricFor()` directly,
 * never from what was sent to the model, so dropping it from the runtime
 * payload has no effect on recommendation quality (Command 05D.1
 * confirmed `findings.ts` already falls back to
 * `rubricFor(dim).recommendationRules[0]` whenever the AI result carries
 * no recommendations of its own — which the compact contract never asks
 * for in the first place, see analysis/types.ts's `DimensionAIResult`).
 *
 * This is a projection, not a new methodology — every fact here traces to
 * the exact same `DimensionRubric` objects `compose.ts` reads.
 */
import type { AnalysisContext, DimensionId } from "./types.ts";
import { rubricFor } from "./dimensions.ts";
import { expectationFor } from "./seniority.ts";
import { guidanceForCase, CV_LANGUAGE_CASES } from "./language.ts";
import {
  ALLOWED_OPERATIONS,
  FACT_CLASSIFICATION_RULES,
  MISSING_EVIDENCE_QUESTION_GUIDANCE,
  NEVER_INVENT,
} from "./factPreservation.ts";
import { CAREER_METHODOLOGY_VERSION } from "./version.ts";

/** Cap on how much of a positive/warning signal string the runtime payload keeps — the full sentence is documentation-grade prose; the model needs the pattern, not the essay. */
const MAX_SIGNAL_CHARS = 90;
const MAX_ANCHOR_DESC_CHARS = 70;
const MAX_SIGNALS_PER_KIND = 3;
const MAX_ANCHORS = 3;

function trim(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export interface CompactRubric {
  id: DimensionId;
  /** ONE evaluation question — the first (each rubric's are ordered most-to-least central; see dimensions.ts). */
  question: string;
  positiveSignals: string[];
  /** warningSignals + majorProblems merged and capped — "what makes this weak" needs one bucket at runtime, not two. */
  redFlags: string[];
  /** Reduced from 5 prose anchors to the 3 that matter for a compact scoring call: excellent / mid / weak. */
  anchors: Array<{ atOrAbove: number; description: string }>;
}

function compactRubric(dimension: DimensionId): CompactRubric {
  const rubric = rubricFor(dimension);
  const redFlagsSource = [...rubric.warningSignals, ...rubric.majorProblems];
  // Spread across the anchor list rather than always taking the top 3
  // (which would drop the low-score anchor entirely) — first, middle, last.
  const anchors = rubric.scoreAnchors;
  const pickedAnchors =
    anchors.length <= MAX_ANCHORS
      ? anchors
      : [anchors[0], anchors[Math.floor(anchors.length / 2)], anchors[anchors.length - 1]];

  return {
    id: rubric.id,
    question: trim(rubric.evaluationQuestions[0] ?? rubric.purpose, MAX_SIGNAL_CHARS + 20),
    positiveSignals: rubric.positiveSignals.slice(0, MAX_SIGNALS_PER_KIND).map((s) => trim(s, MAX_SIGNAL_CHARS)),
    redFlags: redFlagsSource.slice(0, MAX_SIGNALS_PER_KIND).map((s) => trim(s, MAX_SIGNAL_CHARS)),
    anchors: pickedAnchors.map((a) => ({ atOrAbove: a.atOrAbove, description: trim(a.description, MAX_ANCHOR_DESC_CHARS) })),
  };
}

export interface RuntimeMethodologyContext {
  methodologyVersion: string;
  corePrinciples: string[];
  factPreservation: {
    allowedOperations: readonly string[];
    neverInvent: readonly string[];
    /** classification + rewritePolicy only — titleAr/meaning/example are documentation for humans, not needed at runtime. */
    classifications: Array<{ classification: string; rewritePolicy: string }>;
    missingEvidenceQuestionGuidance: string;
  };
  rubrics: CompactRubric[];
  seniority: { level: string; expects: string[]; neverPenalizeForMissing: string[]; guidance: string };
  language: { case: string; evaluationNote: string; redFlags: string[]; register: string };
  targetRole?: { targetRole: string; jobDescription: string | null };
}

export function compileRuntimeMethodology(context: AnalysisContext, dimensionIds: DimensionId[]): RuntimeMethodologyContext {
  const seniorityExpectation = expectationFor(context.seniority);
  const languageGuidance = guidanceForCase(context.language); // already single-case per compose.ts's own discipline
  const languageCase = CV_LANGUAGE_CASES.find((c) => c.case === context.language);

  const result: RuntimeMethodologyContext = {
    methodologyVersion: CAREER_METHODOLOGY_VERSION,
    corePrinciples: [
      "Score only against the provided rubrics; every score needs quoted evidence from the document.",
      "Evaluate the DOCUMENT, never the person's worth.",
      "State low-confidence findings as possibilities, not facts.",
      "Never produce an overall score — only per-dimension scores.",
    ],
    factPreservation: {
      allowedOperations: ALLOWED_OPERATIONS,
      neverInvent: NEVER_INVENT,
      classifications: FACT_CLASSIFICATION_RULES.map((c) => ({ classification: c.classification, rewritePolicy: c.rewritePolicy })),
      missingEvidenceQuestionGuidance: MISSING_EVIDENCE_QUESTION_GUIDANCE,
    },
    rubrics: dimensionIds.map(compactRubric),
    seniority: {
      level: seniorityExpectation.level,
      expects: seniorityExpectation.expects,
      neverPenalizeForMissing: seniorityExpectation.neverPenalizeForMissing,
      guidance: seniorityExpectation.guidance,
    },
    language: {
      case: context.language,
      evaluationNote: languageCase?.evaluationNote ?? "",
      // languageGuidance may carry one or two LanguageGuidance objects
      // (bilingual case); flatten their redFlags/register compactly.
      redFlags: languageGuidance.flatMap((g) => g.redFlags).slice(0, MAX_SIGNALS_PER_KIND * 2),
      register: languageGuidance.map((g) => g.register).join(" "),
    },
  };

  if (context.targetRole) {
    result.targetRole = { targetRole: context.targetRole, jobDescription: context.jobDescription ?? null };
  }

  return result;
}
