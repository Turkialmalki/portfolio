/**
 * FACT PRESERVATION (Command 03 §7–8) — the HARD rule of this product.
 *
 * The engine improves how truth is expressed. It never manufactures
 * truth. When information is missing, the engine ASKS (a
 * missingEvidenceQuestion) — this is a product feature, not a failure
 * mode. These rules are composed verbatim into every rewrite-capable
 * prompt (compose.ts) and stored in the knowledge schema.
 */
import type { FactClassification } from "./types.ts";

/** Operations the engine MAY perform on a customer's text. */
export const ALLOWED_OPERATIONS = [
  "improve wording",
  "restructure",
  "shorten",
  "clarify",
  "strengthen verbs",
  "suggest where evidence is missing",
] as const;

/** Fact classes the engine must NEVER invent, infer, or 'round up'. */
export const NEVER_INVENT = [
  "revenue",
  "percentages",
  "users",
  "team size",
  "budgets",
  "rankings",
  "awards",
  "dates",
  "technologies",
  "employers",
  "job titles",
  "responsibilities",
  "results",
] as const;

export interface FactClassificationRule {
  classification: FactClassification;
  titleAr: string;
  meaning: string;
  rewritePolicy: string;
  example: { before: string; handling: string };
}

/**
 * §8: every candidate rewrite operation is classified BEFORE any text is
 * produced. The future rewrite tool routes on this classification.
 */
export const FACT_CLASSIFICATION_RULES: readonly FactClassificationRule[] = [
  {
    classification: "SAFE_TO_REWRITE",
    titleAr: "آمنة لإعادة الصياغة",
    meaning: "Language can improve without any change of meaning — every fact in equals every fact out.",
    rewritePolicy: "Rewrite freely; verify afterwards that no noun, number, scope, or claim appeared or vanished.",
    example: {
      before: "Was responsible for the management of the deployment process for the platform.",
      handling: "→ 'Managed platform deployments.' Same fact, stronger verb, shorter.",
    },
  },
  {
    classification: "NEEDS_USER_CONFIRMATION",
    titleAr: "تحتاج تأكيد المستخدم",
    meaning: "The statement could become materially stronger IF the user supplies evidence the CV doesn't contain.",
    rewritePolicy: "Do not strengthen yet. Emit a missingEvidenceQuestion; strengthen only with the user's answer.",
    example: {
      before: "Improved the checkout flow's performance.",
      handling:
        "→ Ask: 'You mention improving performance. Do you know approximately how much it improved, or what changed after your work?' Never write '40% faster' unprompted.",
    },
  },
  {
    classification: "DO_NOT_INFER",
    titleAr: "لا يجوز الاستنتاج",
    meaning: "Making this stronger would require inventing information from the NEVER_INVENT list.",
    rewritePolicy: "Leave the factual content untouched. Wording may still be polished; substance may not grow.",
    example: {
      before: "Worked at a fintech startup.",
      handling: "The employer's name, the person's title there, and what they did are not inferable — do not guess any of them.",
    },
  },
] as const;

/**
 * Template guidance for generating missingEvidenceQuestions (§7): point
 * at the exact claim, ask for the underlying observable, and explicitly
 * allow 'I don't know' — an approximate honest answer beats a precise
 * invented one.
 */
export const MISSING_EVIDENCE_QUESTION_GUIDANCE =
  "Quote the CV's own claim, then ask for the observable behind it: what changed, roughly how much, over what scope, affecting whom. Offer 'approximately' and 'I'm not sure' as acceptable answers. Never suggest a candidate number, name, or scope in the question itself — that would be dictating the answer.";
