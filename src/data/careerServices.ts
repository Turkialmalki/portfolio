import {
  CHECKOUT_URLS,
  INDIVIDUAL_TOTAL,
  INTAKE_URLS,
  PRICING,
  type Price,
  type ServiceId,
} from "@/config/careerServices";

export type Lang = "ar" | "en";
type Bi = { ar: string; en: string };

export type CareerService = {
  id: ServiceId;
  /** Two-digit index used by the price rail and the section chapter marks. */
  index: string;
  name: Bi;
  /** The one line that carries the section. */
  headline: Bi;
  /** Supporting line — one sentence, never a paragraph. */
  outcome: Bi;
  delivery: Bi;
  cta: Bi;
  price: Price;
  checkoutUrl: string;
  intakeUrl: string;
};

export const CAREER_SERVICES: CareerService[] = [
  {
    id: "resumeReview",
    index: "01",
    name: { ar: "مراجعة السيرة الذاتية", en: "Resume Review" },
    headline: { ar: "اعرف ما الذي يُضعف سيرتك.", en: "See what your CV is missing." },
    outcome: {
      ar: "مراجعة صريحة تكشف ما يوقف سيرتك قبل أن تصل إلى إنسان.",
      en: "An honest read of what stops your CV before a human ever sees it.",
    },
    delivery: { ar: "٤٨ ساعة", en: "48 hours" },
    cta: { ar: "راجع سيرتي", en: "Review my CV" },
    price: PRICING.resumeReview,
    checkoutUrl: CHECKOUT_URLS.resumeReview,
    intakeUrl: INTAKE_URLS.resumeReview,
  },
  {
    id: "resumeWriting",
    index: "02",
    name: { ar: "كتابة السيرة الذاتية", en: "Resume Writing" },
    headline: { ar: "حوّل خبرتك إلى أثر.", en: "Turn experience into impact." },
    outcome: {
      ar: "إعادة كتابة كاملة: كل سطر يقول ما الذي تغيّر بسببك.",
      en: "A full rewrite: every line says what changed because of you.",
    },
    delivery: { ar: "٣-٤ أيام عمل", en: "3–4 business days" },
    cta: { ar: "أعد كتابة سيرتي", en: "Rewrite my CV" },
    price: PRICING.resumeWriting,
    checkoutUrl: CHECKOUT_URLS.resumeWriting,
    intakeUrl: INTAKE_URLS.resumeWriting,
  },
  {
    id: "publicSpeaking",
    index: "03",
    name: { ar: "الإلقاء والعرض", en: "Public Speaking" },
    headline: { ar: "تحدّث بطريقة تترك أثرًا.", en: "Speak so people remember." },
    outcome: {
      ar: "تدريب على العرض والإلقاء: البناء، الحضور، والإيقاع.",
      en: "Presentation and delivery coaching: structure, presence, pacing.",
    },
    delivery: { ar: "جلسة ٩٠ دقيقة", en: "90-minute session" },
    cta: { ar: "طوّر عرضي", en: "Improve my presentation" },
    price: PRICING.publicSpeaking,
    checkoutUrl: CHECKOUT_URLS.publicSpeaking,
    intakeUrl: INTAKE_URLS.publicSpeaking,
  },
  {
    id: "linkedinOptimization",
    index: "04",
    name: { ar: "تحسين لينكدإن", en: "LinkedIn Optimization" },
    headline: { ar: "أسهل في الظهور.\nأصعب في النسيان.", en: "Be easier to find.\nHarder to forget." },
    outcome: {
      ar: "ملف يجد الفرصة الصحيحة، لا أي فرصة.",
      en: "A profile that surfaces for the right opportunity, not any opportunity.",
    },
    delivery: { ar: "٣ أيام عمل", en: "3 business days" },
    cta: { ar: "حسّن ملفي", en: "Optimize my LinkedIn" },
    price: PRICING.linkedinOptimization,
    checkoutUrl: CHECKOUT_URLS.linkedinOptimization,
    intakeUrl: INTAKE_URLS.linkedinOptimization,
  },
  {
    id: "mvpPortfolio",
    index: "05",
    name: { ar: "بناء منتج أو موقع شخصي", en: "MVP / Portfolio Creation" },
    headline: { ar: "حوّل فكرتك أو خبرتك إلى شيء حقيقي.", en: "Turn your idea or experience into something real." },
    outcome: {
      ar: "منتج أولي أو موقع شخصي — مصمّم ومبني ومنشور.",
      en: "A working MVP or personal site — designed, built, shipped.",
    },
    delivery: { ar: "٥-٧ أيام عمل", en: "5–7 business days" },
    cta: { ar: "ابنِ منتجي", en: "Build my MVP / Portfolio" },
    price: PRICING.mvpPortfolio,
    checkoutUrl: CHECKOUT_URLS.mvpPortfolio,
    intakeUrl: INTAKE_URLS.mvpPortfolio,
  },
  {
    id: "dashboardReporting",
    index: "06",
    name: { ar: "التقارير ولوحات المتابعة", en: "Report & Dashboard" },
    headline: { ar: "حوّل بياناتك إلى قرارات.", en: "Turn data into decisions." },
    outcome: {
      ar: "تقارير ولوحات متابعة تحوّل المعلومات المعقّدة إلى قصة واضحة.",
      en: "Professional reports and dashboards that turn complex information into a clear story.",
    },
    delivery: { ar: "٥-٧ أيام عمل", en: "5–7 business days" },
    cta: { ar: "ابنِ لوحتي", en: "Build my dashboard" },
    price: PRICING.dashboardReporting,
    checkoutUrl: CHECKOUT_URLS.dashboardReporting,
    intakeUrl: INTAKE_URLS.dashboardReporting,
  },
];

export const COMPLETE_BUNDLE = {
  id: "completeBundle" as const,
  index: "07",
  name: { ar: "الباقة المتكاملة", en: "Complete Professional Package" },
  headline: { ar: "كل شيء. يعمل معًا.", en: "Everything. Working together." },
  outcome: {
    ar: "السيرة، لينكدإن، الإلقاء، المنتج، واللوحة — قصة مهنية واحدة.",
    en: "CV, LinkedIn, speaking, product and reporting — one professional story.",
  },
  cta: { ar: "احصل على الباقة المتكاملة", en: "Get the complete package" },
  price: PRICING.completeBundle,
  individualTotal: INDIVIDUAL_TOTAL,
  checkoutUrl: CHECKOUT_URLS.completeBundle,
  intakeUrl: INTAKE_URLS.completeBundle,
};

/** Everything the price rail steps through, in scroll order. */
export const PRICE_RAIL = [
  ...CAREER_SERVICES.map((s) => ({ index: s.index, name: s.name, price: s.price })),
  { index: COMPLETE_BUNDLE.index, name: COMPLETE_BUNDLE.name, price: COMPLETE_BUNDLE.price },
];

/** English → USD, Arabic → SAR. Never both. */
export function formatPrice(price: Price, lang: Lang) {
  return lang === "ar"
    ? `${price.sar.toLocaleString("ar-SA")} ريال`
    : `$${price.usd.toLocaleString("en-US")}`;
}
