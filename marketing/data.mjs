/**
 * WHAT GOES ON A CARD.
 *
 * Prices and checkout URLs are NOT written here — they are read out of
 * `src/config/careerServices.ts` at build time by `build-cards.mjs`, so a
 * repricing moves the posters too and a poster can never quote a figure the
 * site no longer charges. What lives here is the poster's own editorial copy:
 * the line that sells the service, which is deliberately shorter and blunter
 * than the page's narrative version.
 *
 * The `sketch` field names the motif drawn behind the type. Each one is a
 * still of the corresponding scene on /services — the annotated CV, the
 * rewrite, the profile that ranks first, the shipped stack, the dashboard —
 * so a customer who taps through recognises the page they land on.
 */

export const BRAND = {
  site: "turkialmalki.com/services",
  name: { en: "Turki Almalki", ar: "تركي المالكي" },
  role: {
    en: "Engineering leader · Product builder",
    ar: "قائد هندسة برمجيات · بناء منتجات",
  },
};

export const CARDS = [
  {
    id: "resumeReview",
    index: "01",
    sketch: "review",
    name: { en: "Resume Review", ar: "مراجعة السيرة الذاتية" },
    headline: { en: "See what your\nCV is missing.", ar: "اعرف وش ينقص\nسيرتك الذاتية." },
    outcome: {
      en: "An honest read of what stops your CV before a human ever sees it.",
      ar: "مراجعة صريحة تبيّن لك وش اللي يوقف سيرتك قبل ما توصل لأحد.",
    },
    delivery: { en: "48 hours", ar: "خلال 48 ساعة" },
    bullets: {
      en: ["ATS compatibility, scored", "Line-level notes, not vibes", "What to fix first"],
      ar: ["فحص توافق ATS بدرجة واضحة", "ملاحظات على مستوى السطر", "وش تصلح أول"],
    },
  },
  {
    id: "resumeWriting",
    index: "02",
    sketch: "rewrite",
    name: { en: "Resume Writing", ar: "كتابة السيرة الذاتية" },
    headline: { en: "Turn experience\ninto impact.", ar: "خلّ خبرتك\nتظهر أقوى." },
    outcome: {
      en: "A full rewrite: every line says what changed because of you.",
      ar: "إعادة كتابة كاملة، وكل سطر يوضّح وش الفرق اللي سويته.",
    },
    delivery: { en: "3–4 business days", ar: "3–4 أيام عمل" },
    bullets: {
      en: ["Rewritten line by line", "Written to pass ATS and people", "Formatted, final, ready to send"],
      ar: ["إعادة كتابة سطرًا بسطر", "تعدّي أنظمة ATS وعين البشر", "منسّقة وجاهزة للإرسال"],
    },
  },
  {
    id: "publicSpeaking",
    index: "03",
    sketch: "speaking",
    comingSoon: true,
    name: { en: "Public Speaking", ar: "الإلقاء والعروض" },
    headline: { en: "Speak so people\nremember.", ar: "اعرض بطريقة\nيتذكرونها." },
    outcome: {
      en: "Presentation and speaking support, so you communicate with more confidence and impact.",
      ar: "خدمة تساعدك تقدّم أفكارك وعروضك بوضوح وثقة أكبر.",
    },
    delivery: { en: "90-minute session", ar: "جلسة 90 دقيقة" },
    bullets: {
      en: ["Your talk, restructured", "Delivery coached live", "Slides that carry you"],
      ar: ["إعادة بناء العرض", "تدريب مباشر على الإلقاء", "شرائح تخدم كلامك"],
    },
    kicker: {
      en: "Literature, Publishing & Translation Commission",
      ar: "هيئة الأدب والنشر والترجمة",
    },
  },
  {
    id: "linkedinOptimization",
    index: "04",
    sketch: "linkedin",
    name: { en: "LinkedIn Optimization", ar: "تحسين لينكدإن" },
    headline: { en: "Be easier to find.\nHarder to forget.", ar: "خلّ ملفك أوضح،\nوأسهل للوصول." },
    outcome: {
      en: "A profile that surfaces for the right opportunity, not any opportunity.",
      ar: "ملف يوصّلك للفرصة الصح، مو لأي فرصة.",
    },
    delivery: { en: "3 business days", ar: "3 أيام عمل" },
    bullets: {
      en: ["Headline recruiters search for", "About section that reads", "Experience rewritten to match"],
      ar: ["عنوان يبحث عنه الموظِّف", "نبذة تُقرأ فعلًا", "خبرات مكتوبة تخدم العنوان"],
    },
  },
  {
    id: "mvpPortfolio",
    index: "05",
    sketch: "work",
    name: { en: "MVP / Portfolio", ar: "منتج أولي أو موقع شخصي" },
    headline: { en: "Turn your idea\ninto something real.", ar: "خلّ فكرتك\nمنتج شغّال." },
    outcome: {
      en: "A working MVP or personal site — designed, built, shipped.",
      ar: "منتج أولي أو موقع شخصي — تصميم، وتطوير، ونشر.",
    },
    delivery: { en: "5–7 business days", ar: "5–7 أيام عمل" },
    bullets: {
      en: ["Designed and built end to end", "Live on your own domain", "Yours — code included"],
      ar: ["تصميم وتطوير من الصفر", "منشور على نطاقك", "الكود لك"],
    },
  },
  {
    id: "dashboardReporting",
    index: "06",
    sketch: "data",
    name: { en: "Report & Dashboard", ar: "التقارير ولوحات المتابعة" },
    headline: { en: "Turn data\ninto decisions.", ar: "خلّ بياناتك\nتعطيك قرار." },
    outcome: {
      en: "Reports and dashboards that turn complex information into a clear story.",
      ar: "تقارير ولوحات تختصر أرقامك الكثيرة في صورة واضحة.",
    },
    delivery: { en: "5–7 business days", ar: "5–7 أيام عمل" },
    bullets: {
      en: ["Your numbers, one screen", "Built on your real data", "Updates without you rebuilding it"],
      ar: ["أرقامك في شاشة واحدة", "مبنية على بياناتك الحقيقية", "تتحدث بدون ما تعيد بناءها"],
    },
  },
  {
    id: "completeBundle",
    index: "07",
    sketch: "bundle",
    name: { en: "Complete Package", ar: "الباقة المتكاملة" },
    headline: { en: "Everything.\nWorking together.", ar: "كل شيء،\nمربوط ببعضه." },
    outcome: {
      en: "CV, LinkedIn, speaking, product and reporting — one professional story.",
      ar: "السيرة، ولينكدإن، والعرض، والمنتج، واللوحة — قصة مهنية واحدة.",
    },
    delivery: { en: "Everything above, together", ar: "كل اللي فوق، مع بعض" },
    bullets: {
      en: ["All five services", "Sequenced, not scattered", "One story end to end"],
      ar: ["الخدمات الخمس كاملة", "بترتيب، مو متفرقة", "قصة واحدة من البداية للنهاية"],
    },
  },
];

/** The overview poster's own words. */
export const OVERVIEW = {
  eyebrow: { en: "Career & product services", ar: "خدمات مهنية ومنتجات" },
  headline: { en: "Chaos,\nresolved.", ar: "من الفوضى\nإلى الوضوح." },
  sub: {
    en: "Pick what you need. I'll take it from there.",
    ar: "اختر اللي تحتاجه، وأنا أكمل الباقي.",
  },
  soon: { en: "Coming soon", ar: "قريبًا" },
};
