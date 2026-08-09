import {
  INDIVIDUAL_TOTAL,
  INTAKE_URLS,
  SERVICES,
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
  /** `null` on a coming-soon service — see the config header. */
  price: Price | null;
  checkoutUrl: string | null;
  status: "live" | "coming-soon";
  intakeUrl: string;
};

/* The Arabic below is written, not translated. It is the tone a Saudi
   professional actually uses in writing: short sentences, plain verbs, no
   MSA scaffolding ("قم بـ", "من خلال", "يُعدّ"), no marketing adjectives.
   Where the English is a clever line, the Arabic is its own clear line — the
   two say the same thing without being the same sentence. */
export const CAREER_SERVICES: CareerService[] = [
  {
    id: "resumeReview",
    index: "01",
    name: { ar: "مراجعة السيرة الذاتية", en: "Resume Review" },
    headline: { ar: "اعرف وش اللي يحتاج تحسين في سيرتك.", en: "See what your CV is missing." },
    outcome: {
      ar: "مراجعة صريحة تبيّن لك وش اللي يوقف سيرتك قبل ما توصل لأحد.",
      en: "An honest read of what stops your CV before a human ever sees it.",
    },
    delivery: { ar: "خلال 48 ساعة", en: "48 hours" },
    cta: { ar: "راجع سيرتي", en: "Review my CV" },
    ...SERVICES.resumeReview,
    intakeUrl: INTAKE_URLS.resumeReview,
  },
  {
    id: "resumeWriting",
    index: "02",
    name: { ar: "كتابة السيرة الذاتية", en: "Resume Writing" },
    headline: { ar: "خلّ خبرتك تظهر بشكل أقوى.", en: "Turn experience into impact." },
    outcome: {
      ar: "إعادة كتابة كاملة، وكل سطر يوضّح وش الفرق اللي سويته.",
      en: "A full rewrite: every line says what changed because of you.",
    },
    delivery: { ar: "3–4 أيام عمل", en: "3–4 business days" },
    cta: { ar: "اكتب سيرتي", en: "Rewrite my CV" },
    ...SERVICES.resumeWriting,
    intakeUrl: INTAKE_URLS.resumeWriting,
  },
  {
    id: "publicSpeaking",
    index: "03",
    name: { ar: "الإلقاء والعروض", en: "Public Speaking" },
    headline: { ar: "اعرض بطريقة يتذكرونها.", en: "Speak so people remember." },
    outcome: {
      ar: "خدمة لمساعدتك على تقديم أفكارك وعروضك بشكل أوضح وأكثر تأثيرًا.",
      en: "Presentation and speaking support designed to help you communicate with more confidence and impact.",
    },
    delivery: { ar: "جلسة 90 دقيقة", en: "90-minute session" },
    /* Not a buy label: this service is not for sale yet, so its action is the
       quiet interest link the coming-soon state renders instead. */
    cta: { ar: "مهتم بالخدمة؟ تواصل معي", en: "Interested? Contact me" },
    ...SERVICES.publicSpeaking,
    intakeUrl: INTAKE_URLS.publicSpeaking,
  },
  {
    id: "linkedinOptimization",
    index: "04",
    name: { ar: "تحسين لينكدإن", en: "LinkedIn Optimization" },
    headline: { ar: "خلّ ملفك أوضح،\nوأسهل للوصول.", en: "Be easier to find.\nHarder to forget." },
    outcome: {
      ar: "ملف يوصّلك للفرصة الصح، مو لأي فرصة.",
      en: "A profile that surfaces for the right opportunity, not any opportunity.",
    },
    delivery: { ar: "3 أيام عمل", en: "3 business days" },
    cta: { ar: "حسّن ملفي", en: "Optimize my LinkedIn" },
    ...SERVICES.linkedinOptimization,
    intakeUrl: INTAKE_URLS.linkedinOptimization,
  },
  {
    id: "mvpPortfolio",
    index: "05",
    name: { ar: "بناء منتج أو موقع شخصي", en: "MVP / Portfolio Creation" },
    // "شيء" here needed an accusative it can't carry in this register, and the
    // isolated hamza opens a gap at display size. A concrete noun fixes both.
    headline: { ar: "خلّ فكرتك منتج شغّال.", en: "Turn your idea or experience into something real." },
    outcome: {
      ar: "منتج أولي أو موقع شخصي — تصميم، وتطوير، ونشر.",
      en: "A working MVP or personal site — designed, built, shipped.",
    },
    delivery: { ar: "5–7 أيام عمل", en: "5–7 business days" },
    cta: { ar: "ابدأ المشروع", en: "Build my MVP / Portfolio" },
    ...SERVICES.mvpPortfolio,
    intakeUrl: INTAKE_URLS.mvpPortfolio,
  },
  {
    id: "dashboardReporting",
    index: "06",
    name: { ar: "التقارير ولوحات المتابعة", en: "Report & Dashboard" },
    headline: { ar: "خلّ بياناتك تعطيك قرار.", en: "Turn data into decisions." },
    outcome: {
      ar: "تقارير ولوحات تختصر أرقامك الكثيرة في صورة واضحة.",
      en: "Professional reports and dashboards that turn complex information into a clear story.",
    },
    delivery: { ar: "5–7 أيام عمل", en: "5–7 business days" },
    cta: { ar: "ابدأ لوحتي", en: "Build my dashboard" },
    ...SERVICES.dashboardReporting,
    intakeUrl: INTAKE_URLS.dashboardReporting,
  },
];

export const COMPLETE_BUNDLE = {
  id: "completeBundle" as const,
  index: "07",
  name: { ar: "الباقة المتكاملة", en: "Complete Professional Package" },
  headline: { ar: "كل شيء،\nمربوط ببعضه.", en: "Everything. Working together." },
  outcome: {
    ar: "السيرة، ولينكدإن، والعرض، والمنتج، واللوحة — قصة مهنية واحدة.",
    en: "CV, LinkedIn, speaking, product and reporting — one professional story.",
  },
  cta: { ar: "خذ الباقة كاملة", en: "Get the complete package" },
  ...SERVICES.completeBundle,
  individualTotal: INDIVIDUAL_TOTAL,
  intakeUrl: INTAKE_URLS.completeBundle,
};

/** Everything the price rail steps through, in scroll order. */
export const PRICE_RAIL = [
  ...CAREER_SERVICES.map((s) => ({ index: s.index, name: s.name, price: s.price })),
  { index: COMPLETE_BUNDLE.index, name: COMPLETE_BUNDLE.name, price: COMPLETE_BUNDLE.price },
];

/**
 * English → USD, Arabic → SAR. Never both.
 *
 * NUMERALS: the whole Arabic site uses Western digits (19, not ١٩). That is
 * what Saudi business, banking and product interfaces actually use, and it is
 * the only convention that stays consistent once real data is on the page —
 * the dashboard, the ATS score, the CV dates and the price rail all carry
 * figures, and half of them could never be Arabic-Indic. `en-US` grouping is
 * therefore deliberate here: `ar-SA` would emit ١٩ and split the convention.
 */
export function formatPrice(price: Price, lang: Lang) {
  return lang === "ar"
    ? `${price.sar.toLocaleString("en-US")} ريال`
    : `$${price.usd.toLocaleString("en-US")}`;
}

/** COMING SOON, wherever a price would otherwise be. */
export const COMING_SOON: Bi = { ar: "قريبًا", en: "Coming Soon" };

/**
 * What goes in a price slot — a figure, or the availability if there is no
 * figure to print. Every readout that can face a coming-soon service (the
 * price rail, the phone panels) goes through this, so none of them can fall
 * back to a stale number.
 */
export function priceLabel(price: Price | null, lang: Lang) {
  return price ? formatPrice(price, lang) : COMING_SOON[lang];
}

/**
 * THE SAFETY NET.
 *
 * Not every visitor knows which service they need, and some need something
 * that is not on this page at all. This section is the alternative to leaving.
 */
export const TALK = {
  eyebrow: { ar: "غير متأكد من الخدمة المناسبة؟", en: "Not sure what you need?" },
  headline: { ar: "خلّنا نتكلم عن احتياجك.", en: "Let's talk about what you need." },
  body: {
    ar: "شاركني وش تحتاج، وأساعدك في اختيار الخدمة المناسبة أو تحديد الحل الأنسب لك.",
    en: "Tell me what you're trying to achieve and I'll help you choose the right service — or suggest a custom approach.",
  },
  meeting: { ar: "احجز اجتماعًا معي", en: "Book a meeting" },
  contact: { ar: "تواصل معي", en: "Contact me" },
} satisfies Record<string, Bi>;
