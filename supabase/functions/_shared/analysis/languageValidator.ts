/**
 * REPORT-LANGUAGE VALIDATOR (Career V2 Part 9).
 *
 * When `context.outputLanguage === "ar"`, every customer-facing prose
 * string in the analysis (dimension reasons, issue/strength summaries,
 * quick-win action/why, target-role verdict, ATS check details) is
 * expected to actually be Arabic — no English explanatory sentences
 * slipping through ("The document shows solid signal in career
 * progression."). Proper nouns, acronyms, and product/technology names
 * have no natural Arabic equivalent and are explicitly allowed (ATS,
 * LinkedIn, SAP, Odoo, React, $27M) — this module must never flag one of
 * those. Evidence excerpts (the customer's own CV text, verbatim) are
 * deliberately NEVER checked here at all — they stay in whatever
 * language the CV itself was written in, on purpose.
 *
 * Deliberately conservative and deterministic: this is a SENTENCE-LEVEL
 * heuristic, not a language-detection model. It flags a field only when
 * it looks like genuine English prose (multiple common English function
 * words in a row) — a lone allow-listed term, a number, or a short code
 * never trips it. False negatives (missing a leak) are an acceptable
 * trade-off for never rejecting a legitimately Arabic report over a
 * proper noun; false positives are the failure mode this module is
 * designed to avoid (§ "do not regenerate solely because one English
 * proper noun exists").
 *
 * NON-FATAL BY DESIGN: a real production incident showed this gate
 * failing an otherwise-complete, structurally-valid analysis outright
 * (ANALYSIS_FAILED) over English prose in a handful of OPTIONAL,
 * code-templatable fields — presentation degradation, not an
 * analysis-integrity problem, and not worth discarding real scoring/ATS/
 * evidence work over. `sanitizeDimensionReason` below is applied at the
 * SOURCE (pipeline.ts, right where the AI's own shortReason is produced)
 * so the dominant leak class never reaches this validator at all
 * anymore; `validateReportLanguage` itself is called as **telemetry
 * only** now (pipeline.ts logs a fallback count, never throws) — see
 * that call site's own comment. There is no "language repair" AI call
 * anywhere in this codebase, before or after this change — a leak is
 * handled by substituting deterministic, already-Arabic text, never by
 * asking the model again.
 */
import type { CareerAnalysis } from "../methodology/types.ts";

/**
 * Proper nouns / technical terms with no natural Arabic equivalent that
 * may appear as-is inside Arabic prose (Career V2 Part 9's explicit
 * allow-list, plus the acronym/product vocabulary the methodology's own
 * SYSTEM_PROMPT already permits in anthropicProvider.ts).
 */
const ALLOWED_TERMS = [
  "ATS",
  "LinkedIn",
  "SAP",
  "Odoo",
  "React",
  "SQL",
  "KPI",
  "CV",
  "PDF",
  "DOCX",
  "AI",
];

/**
 * A standard set of high-frequency English function/stop words — general
 * enough not to be tuned to any one example sentence. Their co-occurrence
 * (≥2 distinct) is what actually distinguishes real English prose from an
 * isolated allow-listed proper noun; Arabic prose containing an
 * allow-listed term (ATS, LinkedIn, $27M, …) never contains these at all.
 */
const ENGLISH_FUNCTION_WORDS =
  /\b(the|this|that|these|those|with|from|and|of|in|on|at|to|as|by|is|are|was|were|be|been|being|has|have|had|do|does|did|will|would|should|could|not|no|but|or|each|every|its|it|whether|for|your|you)\b/gi;

function stripAllowedTerms(text: string): string {
  let out = text;
  for (const term of ALLOWED_TERMS) {
    out = out.replace(new RegExp(`\\b${term}\\b`, "g"), " ");
  }
  // Currency-prefixed figures ($27M, $5) and bare numbers are never English leakage.
  out = out.replace(/\$[\d.,]+[A-Za-z]*/g, " ").replace(/\b\d+([.,]\d+)?%?\b/g, " ");
  return out;
}

/**
 * Flags a string as English-leaked prose when, after stripping allowed
 * terms/figures, at least TWO distinct common English function words
 * appear — a single stray English word (a name, an acronym not yet
 * allow-listed) is not enough to fail the whole report on its own.
 */
export function isEnglishLeak(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const stripped = stripAllowedTerms(text);
  const matches = stripped.match(ENGLISH_FUNCTION_WORDS) ?? [];
  const distinct = new Set(matches.map((m) => m.toLowerCase()));
  return distinct.size >= 2;
}

export interface LanguageLeak {
  field: string;
  text: string;
}

/**
 * SOURCE-LEVEL fallback for the AI's own `shortReason`/`reason` text —
 * after Career V2's code-templated fixes (findings.ts's strengths/
 * quickWins/missingEvidenceQuestions, evidenceValidation.ts's
 * verification-caveat suffix), this is the ONE remaining genuinely
 * AI-authored customer-facing prose field; every other field
 * `validateReportLanguage` checks either is code-templated already or
 * traces back to this exact same text (`issues.*.summary`,
 * `atsAnalysis.*.detail`, and a present `targetRoleAnalysis.
 * positioningVerdict` are all literally the same string). Applying the
 * fallback HERE, before the text is copied into any of those other
 * fields, fixes all of them in one place — a "second AI call to repair
 * language" is neither necessary nor implemented anywhere in this
 * codebase (the analysis simply reads the deterministic fallback);
 * `validateReportLanguage` below remains only as defense-in-depth for a
 * field this sanitization doesn't cover.
 */
export function sanitizeDimensionReason(text: string, dimensionTitleAr: string, outputLanguage: "ar" | "en"): { text: string; fellBack: boolean } {
  if (outputLanguage !== "ar" || !isEnglishLeak(text)) return { text, fellBack: false };
  return {
    text: `هذا الجانب من سيرتك (${dimensionTitleAr}) يحتاج مراجعة وتحسين — التفاصيل الكاملة متوفرة في المراجعة الكاملة.`,
    fellBack: true,
  };
}

export interface LanguageValidationResult {
  ok: boolean;
  leaks: LanguageLeak[];
}

/**
 * Validates every customer-facing prose field on a completed analysis
 * when its outputLanguage is Arabic. `context.outputLanguage` (not the
 * CV's own detected `context.language`) is the gate — an Arabic-CV
 * analysis whose customer chose English output is validated as English
 * (i.e. not validated by this module at all; only the ar path is
 * checked, matching the product's actual honesty requirement).
 */
export function validateReportLanguage(analysis: CareerAnalysis): LanguageValidationResult {
  const outputLanguage = analysis.context.outputLanguage ?? (analysis.context.language === "ar" ? "ar" : "en");
  if (outputLanguage !== "ar") return { ok: true, leaks: [] };

  const leaks: LanguageLeak[] = [];
  const record = (field: string, text: string | undefined | null) => {
    if (text && isEnglishLeak(text)) leaks.push({ field, text });
  };

  for (const d of analysis.dimensions) record(`dimensions.${d.dimension}.reason`, d.reason);
  for (const s of analysis.strengths) record(`strengths.${s.dimension}.summary`, s.summary);
  for (const i of analysis.issues) record(`issues.${i.dimension}.summary`, i.summary);
  for (const q of analysis.quickWins) {
    record(`quickWins.${q.dimension}.action`, q.action);
    record(`quickWins.${q.dimension}.why`, q.why);
  }
  for (const m of analysis.missingEvidenceQuestions) record(`missingEvidenceQuestions.${m.dimension}.question`, m.question);
  if (analysis.targetRoleAnalysis) {
    record("targetRoleAnalysis.positioningVerdict", analysis.targetRoleAnalysis.positioningVerdict);
  }
  for (const ind of analysis.atsAnalysis.indicators) record(`atsAnalysis.${ind.check}.detail`, ind.detail);

  return { ok: leaks.length === 0, leaks };
}
