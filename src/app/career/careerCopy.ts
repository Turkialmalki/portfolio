/**
 * ALL /career COPY, both languages, in one place (Command 06A §35–§37).
 * Arabic is authored as the original — professional, Saudi-friendly,
 * simple — never translated English. No guarantees, no shaming, no
 * "AI magic" language anywhere in this file (§43).
 */
import type { CareerErrorCode } from "./careerTypes";

export const CAREER_COPY = {
  ar: {
    // ── hero ──
    heroKicker: "Career · مراجعة السيرة الذاتية",
    heroH1a: "خبرتك تستاهل",
    heroH1b: "تظهر بشكل أوضح.",
    heroSub: "حلّل سيرتك واعرف وش يحتاج يتغير قبل ما ترسلها للفرصة الجاية.",
    heroScanLabel: "جاري الفحص",
    heroSeeClearly: "شوف سيرتك بوضوح قبل ما ترسلها.",
    heroDemoNote: "مثال توضيحي — النتيجة الحقيقية تعتمد على سيرتك أنت.",
    heroCta: "حلّل سيرتك مجاناً",
    heroTrust: ["PDF أو DOCX", "تحليل خاص", "بدون استخدام تلقائي للتدريب"],
    scrollHint: "اسحب للأسفل",

    // ── upload ──
    uploadNowYours: "الآن دور سيرتك.",
    uploadH: "ارفع سيرتك الذاتية",
    uploadFormats: "PDF أو DOCX — حتى 8MB",
    uploadPromise: "بنحللها ونوضح لك:",
    uploadPoints: ["أهم المشاكل", "نقاط القوة", "تقييم واضح", "أول خطوة للتحسين"],
    uploadCta: "اختيار السيرة الذاتية",
    uploadDrop: "أو اسحب الملف هنا",
    privacyTitle: "سيرتك تبقى خاصة.",
    privacyPoints: [
      "تُحفظ في مساحة خاصة لا يصل لها غيرك.",
      "لا تُضاف تلقائيًا لأي بيانات تدريب أو أمثلة مشتركة.",
      "تقدر تحذفها متى ما شئت.",
      "تُستخدم فقط للتحليل اللي طلبته.",
    ],
    privacyLink: "كيف نتعامل مع بياناتك؟",
    demoBadge: "وضع تجريبي — بيانات توضيحية فقط، ملفك لا يغادر جهازك",
    betaTitle: "قريباً — نسخة تجريبية خاصة",
    betaBody: "التحليل الحقيقي يفتح بعد اكتمال فحوصات الخصوصية والأمان. تقدر تستكشف التجربة كاملة الآن.",

    // ── processing ──
    processingStages: [
      "قراءة سيرتك",
      "فهم خبراتك",
      "تحليل الإنجازات والأثر",
      "مراجعة الوضوح والتوافق",
      "حساب التقييم",
    ],
    processingHold: "لحظات — نجهز النتيجة النهائية",
    processingA11y: "جاري تحليل سيرتك الذاتية",

    // ── score ──
    scoreOutOf: "/100",
    scoreRevealLabel: "تقييم سيرتك",
    scoreWeakLine: "خبرتك قد تكون أقوى من الطريقة اللي تظهر فيها سيرتك الآن.",
    scoreStrongLine: "سيرتك قوية، وفيه فرص بسيطة تخليها أوضح وأقوى.",
    confidenceLabel: { high: "ثقة عالية", medium: "ثقة متوسطة", low: "ثقة منخفضة" },

    // ── free report ──
    dimensionsH: "وين تقف سيرتك",
    dimensionsExpand: "عرض كل الأبعاد",
    dimensionsCollapse: "عرض أقل",
    issuesH: "أهم 3 نقاط تحتاج تحسين",
    issuesHStrong: "فرص بسيطة تخلي سيرتك أقوى",
    severity: { critical: "حرجة", high: "مهمة", medium: "متوسطة", low: "بسيطة" },
    strengthsH: "وش اللي فعلاً ممتاز في سيرتك؟",
    quickWinH: "أول خطوة",
    quickWinWhy: "ليش؟",
    rewriteH: "قبل / بعد",
    rewriteBefore: "قبل",
    rewriteAfter: "بعد",
    rewriteDemoNote: "مثال توضيحي — إعادة الصياغة الحقيقية ضمن المراجعة الكاملة.",

    // ── full review ──
    fullH: "المراجعة الكاملة",
    fullFound: "وجدنا في سيرتك:",
    fullCounts: {
      recommendations: "توصية للتحسين",
      highPriority: "تغييرات عالية الأولوية",
      sectionsToRewrite: "أقسام تحتاج إعادة صياغة",
      missingEvidenceQuestions: "أسئلة لإكمال الأدلة",
    },
    fullLockedRows: [
      "توصيات مفصلة لكل بُعد",
      "تحسينات التوافق مع أنظمة التوظيف (ATS)",
      "خطة عمل مرتبة بالأولوية",
      "توجيه حسب الوظيفة المستهدفة",
      "اقتراحات إعادة صياغة إضافية",
    ],
    fullCta: "راجع التقرير الكامل بـ $5",
    fullLockedNote: "الدفع يفتح قريباً — التقرير الكامل غير متاح حالياً.",
    fullWhat: "وش تحصل مقابل $5؟ مراجعة مفصلة، إصلاحات مرتبة بالأولوية، وتوجيه قسم بقسم.",
    lockedA11y: "محتوى مقفل — يفتح مع المراجعة الكاملة",

    // ── auth ──
    authH: "وين نرسل لك التقرير؟",
    authEmail: "البريد الإلكتروني",
    authCta: "متابعة",
    authNoPassword: "بدون كلمة مرور.",
    authPending: "تسجيل الدخول يفتح مع الإطلاق — قريباً.",

    // ── methodology / trust ──
    methodH: "كيف نراجع سيرتك",
    methodBody:
      "نقرأ سيرتك كما يقرأها مسؤول توظيف خبير: التموضع المهني، جودة الخبرات، الأثر والأدلة، المهارات، قابلية القراءة الآلية، والتوافق مع مستواك المهني.",
    methodAI:
      "نحلل سيرتك وفق معايير واضحة، والتقييم النهائي يُحسب بشكل ثابت وليس رقماً عشوائياً من الذكاء الاصطناعي.",
    builtBy: "من بناء تركي المالكي — سنوات من مراجعة وبناء وتطوير الملفات المهنية والمنتجات الرقمية.",

    // ── returning ──
    returningH: "تقريرك الأخير",
    returningNew: "تحليل جديد",
    returningView: "عرض التقرير",

    // ── errors ──
    errorRetry: "حاول مرة أخرى",
    errorBack: "رجوع",
  },

  en: {
    heroKicker: "Career · CV Review",
    heroH1a: "Your experience deserves",
    heroH1b: "a clearer CV.",
    heroSub: "See what should change before you send your next application.",
    heroScanLabel: "Scanning",
    heroSeeClearly: "See what recruiters see.",
    heroDemoNote: "Illustrative example — your real score depends on your CV.",
    heroCta: "Analyze your CV — Free",
    heroTrust: ["PDF or DOCX", "Private analysis", "No automatic use for training"],
    scrollHint: "Scroll",

    uploadNowYours: "Now, yours.",
    uploadH: "Upload your CV",
    uploadFormats: "PDF or DOCX — up to 8MB",
    uploadPromise: "We'll show you:",
    uploadPoints: [
      "what is holding it back",
      "what already works",
      "your current score",
      "the first thing to improve",
    ],
    uploadCta: "Choose your CV",
    uploadDrop: "or drop the file here",
    privacyTitle: "Your CV stays private.",
    privacyPoints: [
      "Stored in a private space only you can reach.",
      "Never automatically added to training data or shared examples.",
      "You can delete it whenever you want.",
      "Used only for the analysis you request.",
    ],
    privacyLink: "How we handle your data",
    demoBadge: "Demo mode — synthetic data only, your file never leaves this device",
    betaTitle: "Private beta — opening soon",
    betaBody:
      "Real analysis opens once our privacy and security checks are complete. You can explore the full experience now.",

    processingStages: [
      "Reading your CV",
      "Understanding your experience",
      "Evaluating impact and evidence",
      "Checking structure and ATS readability",
      "Calculating your score",
    ],
    processingHold: "One moment — finalizing your result",
    processingA11y: "Analyzing your CV",

    scoreOutOf: "/100",
    scoreRevealLabel: "Your CV score",
    scoreWeakLine: "Your experience may be stronger than your CV currently shows.",
    scoreStrongLine: "Your CV is already strong. There are still a few ways to sharpen it.",
    confidenceLabel: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },

    dimensionsH: "Where your CV stands",
    dimensionsExpand: "Show all dimensions",
    dimensionsCollapse: "Show less",
    issuesH: "Top 3 issues holding your CV back",
    issuesHStrong: "Opportunities to make it even stronger",
    severity: { critical: "Critical", high: "High", medium: "Medium", low: "Low" },
    strengthsH: "What already works",
    quickWinH: "Quick win",
    quickWinWhy: "Why?",
    rewriteH: "Before / After",
    rewriteBefore: "Before",
    rewriteAfter: "After",
    rewriteDemoNote: "Illustrative example — real rewrites are part of the Full Review.",

    fullH: "Full Review",
    fullFound: "In your CV we found:",
    fullCounts: {
      recommendations: "improvement recommendations",
      highPriority: "high-priority changes",
      sectionsToRewrite: "sections to rewrite",
      missingEvidenceQuestions: "missing-evidence questions",
    },
    fullLockedRows: [
      "Detailed recommendations per dimension",
      "ATS readability improvements",
      "Priority action plan",
      "Target-role guidance",
      "Additional rewrite suggestions",
    ],
    fullCta: "Unlock the Full Review — $5",
    fullLockedNote: "Checkout opens soon — the Full Review is not available yet.",
    fullWhat: "What do you get for $5? A detailed review, prioritized fixes, and section-by-section guidance.",
    lockedA11y: "Locked content — included in the Full Review",

    authH: "Where should we send your report?",
    authEmail: "Email",
    authCta: "Continue",
    authNoPassword: "No password needed.",
    authPending: "Sign-in opens at launch — soon.",

    methodH: "How we review your CV",
    methodBody:
      "We read your CV the way an experienced recruiter does: positioning, experience quality, impact and evidence, skills, ATS readability, and alignment with your seniority.",
    methodAI:
      "Your CV is analyzed across structured criteria. The final score is calculated consistently — not guessed by the AI.",
    builtBy:
      "Built by Turki Almalki — from years of reviewing, building and improving professional profiles and digital products.",

    returningH: "Your last report",
    returningNew: "New analysis",
    returningView: "View report",

    errorRetry: "Try again",
    errorBack: "Back",
  },
} as const;

// A UNION of the two language shapes (not just "en") so `CAREER_COPY[lang]`
// is assignable everywhere while both literals stay `as const`-checked.
export type CareerCopy = (typeof CAREER_COPY)[keyof typeof CAREER_COPY];

/** §15: safe error codes → helpful bilingual copy. Raw codes never render. */
export const CAREER_ERRORS: Record<
  CareerErrorCode,
  { ar: { title: string; body: string }; en: { title: string; body: string } }
> = {
  UNSUPPORTED_FILE: {
    ar: { title: "نوع الملف غير مدعوم", body: "نقبل حالياً ملفات PDF أو DOCX فقط. جرّب حفظ سيرتك بأحد هذين النوعين." },
    en: { title: "That file type isn't supported", body: "We currently accept PDF or DOCX. Try saving your CV as one of those." },
  },
  FILE_TOO_LARGE: {
    ar: { title: "الملف أكبر من الحد المسموح", body: "الحد الأقصى 8MB. السير الذاتية عادة أصغر من ذلك بكثير — جرّب نسخة أخف." },
    en: { title: "That file is too large", body: "The limit is 8MB. CVs are usually far smaller — try a lighter export." },
  },
  FILE_TOO_SMALL: {
    ar: { title: "الملف يبدو فارغاً", body: "الملف أصغر من أن يكون سيرة ذاتية. تأكد أنك اخترت الملف الصحيح." },
    en: { title: "That file looks empty", body: "The file is too small to be a CV. Make sure you picked the right one." },
  },
  PARSE_FAILED: {
    ar: { title: "تعذرت قراءة الملف", body: "ما قدرنا نستخرج نصاً من هذا الملف. إذا كانت سيرتك صورة ممسوحة ضوئياً، جرّب نسخة PDF نصية أو DOCX." },
    en: { title: "We couldn't read that file", body: "No text could be extracted. If your CV is a scanned image, try a text-based PDF or DOCX instead." },
  },
  ANALYSIS_FAILED: {
    ar: { title: "تعذر إكمال التحليل الآن", body: "صار خلل أثناء التحليل. حاول مرة أخرى." },
    en: { title: "We couldn't complete the analysis right now", body: "Something went wrong during analysis. Please try again." },
  },
  ANALYSIS_TIMEOUT: {
    ar: { title: "التحليل أخذ وقتاً أطول من المتوقع", body: "ما اكتمل التحليل في الوقت المحدد. حاول مرة أخرى." },
    en: { title: "The analysis took longer than expected", body: "It didn't finish in time. Please try again." },
  },
  NETWORK: {
    ar: { title: "انقطع الاتصال", body: "تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى." },
    en: { title: "Connection lost", body: "Check your internet connection and try again." },
  },
  GATED: {
    ar: { title: "التحليل الحقيقي غير متاح بعد", body: "نفتح التحليل بعد اكتمال فحوصات الخصوصية والأمان. التجربة التوضيحية متاحة الآن." },
    en: { title: "Real analysis isn't open yet", body: "Analysis opens once our privacy and security checks are complete. The demo experience is available now." },
  },
};
