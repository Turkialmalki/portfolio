/**
 * REUSABLE CAREER TRUST COPY (Command 02 §20–21) — the exact strings future
 * upload/report components should reuse rather than re-authoring inline.
 * Not wired into any component yet (no Career UI exists in this command);
 * this is the approved-text source of truth so the wording stays
 * consistent between here, `/career/privacy`, and whatever component ships
 * it first.
 *
 * Wording constraints that must hold for every string below:
 *  - Arabic is authored naturally, not machine-translated legalese.
 *  - Never claim "AI trained by Turki" — no fine-tuning/training exists.
 *    The accurate claim is "AI-powered analysis built around a methodology",
 *    not "a model Turki trained."
 *  - Never claim a specific deletion timeframe ("we delete after 24
 *    hours") unless a scheduled job actually enforces it — see
 *    `supabase/functions/_shared/retention.ts`. None does yet.
 */

export const CAREER_UPLOAD_MICROCOPY = {
  ar: {
    line1: "سيرتك خاصة بك.",
    line2: "نستخدمها لتقديم التحليل المطلوب، ولا نضيفها تلقائيًا إلى بيانات تدريب أو أمثلة مشتركة.",
    linkLabel: "كيف نتعامل مع بياناتك؟",
  },
  en: {
    line1: "Your resume stays private.",
    line2: "We use it to provide the analysis you request and do not automatically add it to training data or shared examples.",
    linkLabel: "How we handle your data",
  },
  href: "/career/privacy",
} as const;

export const CAREER_AI_TRUST_EXPLANATION = {
  ar: "تحليل مدعوم بالذكاء الاصطناعي ومبني على منهجية واضحة لمراجعة السيرة والمسار المهني.",
  en: "AI-powered analysis built around Turki's career review methodology.",
} as const;
