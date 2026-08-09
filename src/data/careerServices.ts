import { CHECKOUT_URLS, INTAKE_URLS, PRICING_SAR } from "@/config/careerServices";

export type Lang = "ar" | "en";
type Bi = { ar: string; en: string };

export type CareerService = {
  id: "cvReview" | "cvRewrite" | "linkedin" | "portfolio";
  name: Bi;
  /** Short outcome statement shown right under the product visual. */
  outcome: Bi;
  label: Bi;
  description: Bi;
  deliverables: Bi[];
  delivery: Bi;
  price: number;
  cta: Bi;
  checkoutUrl: string;
  intakeUrl: string;
  /** Visual weight — higher tiers get slightly stronger emphasis, never loud. */
  tier: 1 | 2 | 3 | 4;
};

export const CAREER_SERVICES: CareerService[] = [
  {
    id: "cvReview",
    name: { ar: "مراجعة السيرة الذاتية", en: "CV Review" },
    outcome: { ar: "اعرف ما الذي يُضعف سيرتك الذاتية.", en: "Know what is holding your CV back." },
    label: {
      ar: "لمن يريد رأيًا احترافيًا قبل إجراء التعديلات.",
      en: "For when you want an expert opinion before making changes.",
    },
    description: {
      ar: "أراجع سيرتك الذاتية الحالية وأحدد التعديلات الأكثر أثرًا بالنسبة للدور الذي تستهدفه.",
      en: "I'll review your current CV and identify the changes that will have the biggest impact for your target role.",
    },
    deliverables: [
      { ar: "مراجعة تفصيلية للسيرة الذاتية", en: "Detailed CV review" },
      { ar: "تقييم التوافق مع أنظمة ATS وسهولة القراءة", en: "ATS and readability assessment" },
      { ar: "ملاحظات حول البنية والتموضع", en: "Structure and positioning feedback" },
      { ar: "مراجعة الإنجازات والأثر", en: "Achievement and impact review" },
      { ar: "توصيات مرتبة حسب الأولوية", en: "Priority recommendations" },
      { ar: "ملاحظات مكتوبة", en: "Written feedback" },
      { ar: "جلسة عرض قصيرة", en: "Short walkthrough" },
    ],
    delivery: { ar: "٤٨ ساعة", en: "48 hours" },
    price: PRICING_SAR.cvReview,
    cta: { ar: "احصل على مراجعة السيرة الذاتية", en: "Get CV Review" },
    checkoutUrl: CHECKOUT_URLS.cvReview,
    intakeUrl: INTAKE_URLS.cvReview,
    tier: 1,
  },
  {
    id: "cvRewrite",
    name: { ar: "إعادة كتابة السيرة الذاتية", en: "CV Rewrite" },
    outcome: { ar: "من سيرة عادية إلى سيرة تُحدث فرقًا.", en: "From an ordinary CV to one that stands out." },
    label: {
      ar: "لمن يريد تحويل خبرته إلى سيرة ذاتية أقوى.",
      en: "For when you want me to do the work.",
    },
    description: {
      ar: "إعادة كتابة كاملة لسيرتك الذاتية تركّز على تموضع خبراتك وإنجازاتك ونقاط قوتك بما يخدم الأدوار التي تستهدفها.",
      en: "A complete rewrite of your CV focused on positioning your experience, achievements, and strengths for the roles you want.",
    },
    deliverables: [
      { ar: "إعادة كتابة كاملة للسيرة الذاتية", en: "Complete CV rewrite" },
      { ar: "بنية متوافقة مع أنظمة ATS", en: "ATS-friendly structure" },
      { ar: "نقاط تركّز على الإنجازات", en: "Achievement-focused bullet points" },
      { ar: "تموضع مهني أقوى", en: "Stronger professional positioning" },
      { ar: "سرد قصصي احترافي أوضح", en: "Clearer executive storytelling" },
      { ar: "جولتا مراجعة", en: "Two revision rounds" },
    ],
    delivery: { ar: "٣-٤ أيام عمل", en: "3–4 business days" },
    price: PRICING_SAR.cvRewrite,
    cta: { ar: "ابدأ إعادة كتابة سيرتي", en: "Start My CV Rewrite" },
    checkoutUrl: CHECKOUT_URLS.cvRewrite,
    intakeUrl: INTAKE_URLS.cvRewrite,
    tier: 2,
  },
  {
    id: "linkedin",
    name: { ar: "تحسين لينكدإن", en: "LinkedIn Optimization" },
    outcome: { ar: "ملف يجذب الفرصة الصحيحة، لا أي فرصة.", en: "A profile that attracts the right opportunity." },
    label: {
      ar: "حوّل ملفك على لينكدإن إلى أداة مهنية أقوى.",
      en: "Turn your LinkedIn profile into a stronger career asset.",
    },
    description: {
      ar: "أعمل على تحسين ملفك الشخصي على لينكدإن ليصبح أكثر وضوحًا وملاءمة وأسهل فهمًا لمسؤولي التوظيف.",
      en: "I'll optimize your LinkedIn profile so your experience is clearer, more relevant, and easier for recruiters and hiring managers to understand.",
    },
    deliverables: [
      { ar: "تحسين العنوان الرئيسي", en: "Headline optimization" },
      { ar: "إعادة كتابة قسم النبذة", en: "About section rewrite" },
      { ar: "تحسين قسم الخبرات", en: "Experience optimization" },
      { ar: "استراتيجية الكلمات المفتاحية", en: "Keyword strategy" },
      { ar: "توصيات التموضع", en: "Positioning recommendations" },
      { ar: "مراجعة بنية الملف الشخصي", en: "Profile structure review" },
      { ar: "توجيه لصورة الغلاف والملف الشخصي", en: "Banner/profile image direction" },
    ],
    delivery: { ar: "٣ أيام عمل", en: "3 business days" },
    price: PRICING_SAR.linkedin,
    cta: { ar: "حسّن ملفي على لينكدإن", en: "Optimize My LinkedIn" },
    checkoutUrl: CHECKOUT_URLS.linkedin,
    intakeUrl: INTAKE_URLS.linkedin,
    tier: 2,
  },
  {
    id: "portfolio",
    name: { ar: "الموقع الشخصي", en: "Personal Portfolio" },
    outcome: { ar: "حضور رقمي يليق بخبرتك.", en: "A digital presence that matches your experience." },
    label: {
      ar: "حوّل خبرتك ومشاريعك إلى حضور رقمي احترافي.",
      en: "For professionals who need more than a CV.",
    },
    description: {
      ar: "موقع شخصي أنيق واحترافي يحوّل خبراتك ومشاريعك إلى حضور رقمي احترافي يمكنك مشاركته بثقة.",
      en: "A clean, premium personal website that turns your experience and projects into a professional digital presence you can confidently share.",
    },
    deliverables: [
      { ar: "موقع شخصي احترافي بصفحة واحدة", en: "Premium one-page website" },
      { ar: "تموضع مهني واضح", en: "Professional positioning" },
      { ar: "مشاريع ودراسات حالة", en: "Projects / case studies" },
      { ar: "تصميم متجاوب بالكامل", en: "Responsive design" },
      { ar: "توجيه للهوية الشخصية", en: "Personal brand direction" },
      { ar: "نشر الموقع", en: "Deployment" },
      { ar: "رابط شخصي قابل للمشاركة", en: "Shareable personal URL" },
    ],
    delivery: { ar: "٥-٧ أيام عمل", en: "5–7 business days" },
    price: PRICING_SAR.portfolio,
    cta: { ar: "ابنِ موقعي الشخصي", en: "Build My Portfolio" },
    checkoutUrl: CHECKOUT_URLS.portfolio,
    intakeUrl: INTAKE_URLS.portfolio,
    tier: 4,
  },
];

export const CAREER_UPGRADE = {
  id: "careerUpgrade" as const,
  name: { ar: "ترقية المسار المهني", en: "Career Upgrade" },
  badge: { ar: "الأكثر طلبًا", en: "MOST POPULAR" },
  headline: {
    ar: "كل شيء تحتاجه لتقديم نفسك بشكل أقوى.",
    en: "Everything you need to present yourself more powerfully.",
  },
  supporting: {
    ar: "سيرتك الذاتية وملفك على LinkedIn — بتجربة مهنية واحدة ومتناسقة.",
    en: "Your CV and LinkedIn profile — one consistent professional story.",
  },
  description: {
    ar: "سيرتك الذاتية وملفك على لينكدإن يجب أن يرويا القصة نفسها. سأعمل على مواءمة الاثنين حول الدور الذي تستهدفه بحيث يبدو حضورك المهني متسقًا من أول بحث لمسؤول التوظيف وحتى المقابلة.",
    en: "Your CV and LinkedIn profile should tell the same story. I'll align both around your target position so your professional presence feels consistent from the first recruiter search to the interview.",
  },
  deliverables: [
    { ar: "إعادة كتابة السيرة الذاتية", en: "CV Rewrite" },
    { ar: "تحسين لينكدإن", en: "LinkedIn Optimization" },
    { ar: "تموضع حول الدور المستهدف", en: "Target-role positioning" },
    { ar: "هوية مهنية متسقة", en: "Consistent personal branding" },
    { ar: "جولتا مراجعة للسيرة الذاتية", en: "Two CV revision rounds" },
    { ar: "مراجعة نهائية للملف الشخصي", en: "Final profile review" },
  ],
  individualValue: PRICING_SAR.careerUpgradeIndividualValue,
  packagePrice: PRICING_SAR.careerUpgradePackage,
  savings: PRICING_SAR.careerUpgradeSavings,
  cta: { ar: "ابدأ تطوير مسارك المهني", en: "Start My Career Upgrade" },
  checkoutUrl: CHECKOUT_URLS.careerUpgrade,
  intakeUrl: INTAKE_URLS.careerUpgrade,
};
