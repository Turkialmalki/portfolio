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

    // ── score (Career V2 Part 1/7/8/25/27: three distinct concepts, never one universal "ATS pass score") ──
    scoreOutOf: "/100",
    scoreRevealLabel: "درجة قوة السيرة",
    cvStrengthLabel: "درجة قوة السيرة",
    scoreWeakLine: "خبرتك قد تكون أقوى من الطريقة اللي تظهر فيها سيرتك الآن.",
    scoreStrongLine: "سيرتك قوية، وفيه فرص بسيطة تخليها أوضح وأقوى.",
    confidenceLabel: { high: "ثقة عالية", medium: "ثقة متوسطة", low: "ثقة منخفضة" },
    atsCompatibilityLabel: "توافق ATS",
    atsCompatibilityFull: "التوافق مع أنظمة التوظيف ATS",
    atsCompatibilityGood: "قابلية قراءة جيدة",
    atsCompatibilityMixed: "قابلية قراءة متوسطة",
    atsCompatibilityWeak: "قابلية قراءة تحتاج تحسين",
    atsCompatibilityDisclaimer:
      "التوافق مع ATS هو تقدير لقابلية قراءة وتنظيم السيرة وفق أنماط شائعة في أنظمة التوظيف، وليس ضماناً للقبول أو الرفض لدى شركة معينة.",
    jobMatchLabel: "مدى التوافق مع الوظيفة",
    jobMatchMissingNote: "أضف وصف الوظيفة لاحقاً لمعرفة مدى تطابق سيرتك معها.",
    evidenceCoverageLabel: "تغطية الأدلة",
    evidenceCoverageTooltip: "يعكس مقدار الأدلة التي وجدناها في السيرة لدعم التقييم.",
    evidenceCoverageLevel: { high: "قوية", medium: "متوسطة", low: "محدودة" },
    strongestAreaLabel: "أقوى جانب",
    whyThisScoreH: "ليش حصلت على هذه الدرجة؟",
    raisedScoreH: "رفع الدرجة",
    loweredScoreH: "خفض الدرجة",
    methodologyBadge: "منهج التقييم v2",

    // ── ATS Compatibility card (Career V2 Part 6/11 — deterministic, code-computed) ──
    atsChecksPassedLabel: "فحص ناجح",
    atsChecksWarningLabel: "فحص فيه تنبيه",
    atsChecksFailedLabel: "فحص فاشل",
    atsReadabilityRiskNote:
      "عدد الفحوصات الفاشلة مرتفع — هذا يشير لخطر في قابلية القراءة الآلية، وليس حكمًا بالرفض من أي نظام توظيف محدد.",

    // ── send report to email (placeholder — real send + animation are separate work) ──
    sendToEmailCta: "أرسل التقرير لبريدي",
    sendToEmailComingSoonTitle: "قريباً",
    sendToEmailComingSoonBody: "إرسال التقرير للبريد الإلكتروني قريباً — هذي معاينة أولية فقط.",
    sendToEmailPlaceholder: "بريدك الإلكتروني",
    sendToEmailSubmit: "إرسال التقرير",
    sendToEmailTitle: "أرسل التقرير لبريدك",
    sendToEmailBody: "خله عندك وارجع له بأي وقت.",
    sendToEmailSending: "جاري الإرسال...",
    sendToEmailSentCta: "تم الإرسال ✓",
    sendToEmailSent: "تم إرسال التقرير ✓",
    sendToEmailCheckInbox: "شيّك بريدك — التقرير وصلك.",
    sendToEmailError: "تعذر إرسال التقرير. حاول مرة ثانية.",

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
    fullHeadline: "كمّل سيرتك، مو بس حلّلها.",
    fullSubheading: "التحليل المجاني يعطيك الصورة العامة. المراجعة الكاملة تعطيك كيف تصلح كل نقطة.",
    fullFound: "وجدنا في سيرتك:",
    fullCounts: {
      recommendations: "توصية للتحسين",
      highPriority: "تغييرات عالية الأولوية",
      sectionsToRewrite: "أقسام تحتاج إعادة صياغة",
      missingEvidenceQuestions: "أسئلة لإكمال الأدلة",
    },
    /* count-based rows carry "{n}" — replaced with the real count and only
       ever rendered when that count is > 0 (never a fabricated number). */
    fullLockedRowRecommendations: "{n} توصية تفصيلية",
    fullLockedRowHighPriority: "{n} تغييرات عالية الأولوية",
    fullLockedRowAts: "خطة تحسين ATS",
    fullLockedRowSections: "توصيات لكل قسم",
    fullLockedRowRewrites: "اقتراحات إعادة صياغة",
    fullLockedRowPriorityOrder: "ترتيب ما يجب إصلاحه أولاً",
    fullLockedRows: [
      "توصيات مفصلة لكل بُعد",
      "تحسينات التوافق مع أنظمة التوظيف (ATS)",
      "خطة عمل مرتبة بالأولوية",
      "توجيه حسب الوظيفة المستهدفة",
      "اقتراحات إعادة صياغة إضافية",
    ],
    fullIncludes: [
      "توصيات تفصيلية",
      "تحسين ATS",
      "خطة عمل بالأولوية",
      "مراجعة قسم بقسم",
      "اقتراحات إعادة صياغة",
    ],
    fullCta: "افتح المراجعة الكاملة بـ $5",
    fullLockedNote: "الدفع يفتح قريباً — التقرير الكامل غير متاح حالياً.",
    fullWhat: "وش تحصل مقابل $5؟ مراجعة مفصلة، إصلاحات مرتبة بالأولوية، وتوجيه قسم بقسم.",
    lockedA11y: "محتوى مقفل — يفتح مع المراجعة الكاملة",
    paymentState: {
      notStarted: "الدفع لم يبدأ",
      pendingVerification: "بانتظار التحقق",
      verified: "تم التحقق ✓",
      opened: "تم فتح التقرير",
    },
    fullCtaPreparing: "جاري تجهيز الدفع...",
    fullCtaError: "تعذر تجهيز الدفع. حاول مرة أخرى.",
    fullPayNote: "بعد الدفع عبر PayPal، ارجع لهذه الصفحة وأرسل رقم العملية للتحقق — تقريرك الكامل يفتح بعد التأكيد.",
    verifyH: "أكدت الدفع؟",
    verifyBody: "أدخل رقم عملية PayPal (أو البريد الذي دفعت منه) وسنفتح تقريرك الكامل بعد التأكيد.",
    verifyRefPlaceholder: "رقم عملية PayPal",
    verifyEmailPlaceholder: "البريد الذي دفعت منه (اختياري)",
    verifySubmitCta: "إرسال للتحقق",
    verifySending: "جاري الإرسال...",
    verifyRequested: "تم استلام طلبك — سنفتح تقريرك الكامل بعد تأكيد الدفع.",
    verifyError: "تعذر إرسال الطلب. حاول مرة أخرى.",
    fullRejectedNote: "لم نتمكن من تأكيد هذه العملية. تحقق من رقم العملية أو تواصل معنا.",
    fullVerifiedNote: "تم تأكيد الدفع ✓ — تقريرك الكامل جاهز.",
    fullUnlockedNote: "تم تأكيد الدفع ✓",
    detailH: "توصيات مفصلة لكل بُعد",
    atsH: "تحسينات التوافق مع أنظمة التوظيف (ATS)",
    actionPlanH: "خطة عمل مرتبة بالأولوية",
    targetRoleH: "توجيه حسب الوظيفة المستهدفة",
    noTargetRoleNote: "ما تم تحديد وظيفة مستهدفة لهذا التحليل — إليك توجيه عام يصلح لمعظم الأدوار.",
    rewriteSuggestionsFullH: "اقتراحات إعادة صياغة إضافية",
    actionPlanEffort: { quick: "سريع", moderate: "متوسط", substantial: "كبير" },

    // ── auth ──
    authH: "وين نرسل لك التقرير؟",
    authEmail: "البريد الإلكتروني",
    authCta: "متابعة",
    authNoPassword: "بدون كلمة مرور.",
    authPending: "تسجيل الدخول يفتح مع الإطلاق — قريباً.",
    authCheckEmail: "أرسلنا رابط دخول لبريدك — افتحه لإكمال تحليل سيرتك.",

    // ── methodology / trust ──
    methodH: "كيف نراجع سيرتك",
    methodBody:
      "نقرأ سيرتك كما يقرأها مسؤول توظيف خبير: التموضع المهني، جودة الخبرات، الأثر والأدلة، المهارات، قابلية القراءة الآلية، والتوافق مع مستواك المهني.",
    methodAI:
      "نحلل سيرتك وفق معايير واضحة، والتقييم النهائي يُحسب بشكل ثابت وليس رقماً عشوائياً من الذكاء الاصطناعي.",
    builtBy: "من بناء تركي المالكي — سنوات من مراجعة وبناء وتطوير الملفات المهنية والمنتجات الرقمية.",

    // ── next services (end of report cross-sell — Career V2 Part J) ──
    nextStepsH: "وش الخطوة التالية؟",
    nextStepsGroup1H: "طور حضورك المهني",
    nextStepsGroup2H: "وعندك فكرة تبغى تبنيها؟",
    nextStepsSeeAll: "عرض كل الخدمات",
    nextServiceCvName: "إعادة كتابة السيرة الذاتية",
    nextServiceCvCta: "أعد كتابة سيرتي",
    nextServiceLinkedinName: "تحسين LinkedIn",
    nextServiceLinkedinCta: "حسّن LinkedIn",
    nextServicePortfolioName: "الموقع الشخصي",
    nextServicePortfolioCta: "ابنِ موقعي الشخصي",

    // ── contact / social footer (Career V2 Part K) ──
    contactH: "تحتاج مساعدة مباشرة؟",
    contactName: "تركي المالكي",
    contactSentence: "إذا عندك سؤال عن تقريرك أو تبغى مساعدة شخصية، تواصل معي مباشرة.",
    contactEmailCta: "راسلني",
    contactLinkedinCta: "LinkedIn",
    contactGithubCta: "GitHub",
    contactSiteCta: "الموقع",

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
    scoreRevealLabel: "CV Strength",
    cvStrengthLabel: "CV Strength",
    scoreWeakLine: "Your experience may be stronger than your CV currently shows.",
    scoreStrongLine: "Your CV is already strong. There are still a few ways to sharpen it.",
    confidenceLabel: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },
    atsCompatibilityLabel: "ATS",
    atsCompatibilityFull: "ATS Compatibility",
    atsCompatibilityGood: "Good readability",
    atsCompatibilityMixed: "Mixed readability",
    atsCompatibilityWeak: "Needs improvement",
    atsCompatibilityDisclaimer:
      "ATS Compatibility estimates how readable and well-structured your CV is for common applicant-tracking patterns — it is not a guarantee of acceptance or rejection by any specific company.",
    jobMatchLabel: "Job Match",
    jobMatchMissingNote: "Add a job description to measure role-specific match.",
    evidenceCoverageLabel: "Evidence coverage",
    evidenceCoverageTooltip: "Reflects how much evidence we found in your CV to support the assessment.",
    evidenceCoverageLevel: { high: "Strong", medium: "Medium", low: "Limited" },
    strongestAreaLabel: "Strongest area",
    whyThisScoreH: "Why this score?",
    raisedScoreH: "Raised the score",
    loweredScoreH: "Lowered the score",
    methodologyBadge: "Methodology v2",

    // ── ATS Compatibility card (Career V2 Part 6/11 — deterministic, code-computed) ──
    atsChecksPassedLabel: "checks passed",
    atsChecksWarningLabel: "checks with a warning",
    atsChecksFailedLabel: "checks failed",
    atsReadabilityRiskNote:
      "A high number of failed checks reads as a readability risk for applicant-tracking systems — not a rejection verdict from any specific company.",

    // ── send report to email (placeholder — real send + animation are separate work) ──
    sendToEmailCta: "Email me this report",
    sendToEmailComingSoonTitle: "Coming soon",
    sendToEmailComingSoonBody: "Emailing your report is coming soon — this is just an early preview.",
    sendToEmailPlaceholder: "Your email",
    sendToEmailSubmit: "Send report",
    sendToEmailTitle: "Send this report to your email",
    sendToEmailBody: "Keep it and come back to it anytime.",
    sendToEmailSending: "Sending...",
    sendToEmailSentCta: "Sent ✓",
    sendToEmailSent: "Report sent ✓",
    sendToEmailCheckInbox: "Check your inbox — it's on its way.",
    sendToEmailError: "Couldn't send the report. Please try again.",

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
    fullHeadline: "Complete your CV, not just diagnose it.",
    fullSubheading: "The free analysis gives you the big picture. The Full Review shows you how to fix every point.",
    fullFound: "In your CV we found:",
    fullCounts: {
      recommendations: "improvement recommendations",
      highPriority: "high-priority changes",
      sectionsToRewrite: "sections to rewrite",
      missingEvidenceQuestions: "missing-evidence questions",
    },
    /* count-based rows carry "{n}" — replaced with the real count and only
       ever rendered when that count is > 0 (never a fabricated number). */
    fullLockedRowRecommendations: "{n} detailed recommendations",
    fullLockedRowHighPriority: "{n} high-priority changes",
    fullLockedRowAts: "ATS improvement plan",
    fullLockedRowSections: "Section-by-section recommendations",
    fullLockedRowRewrites: "Rewrite suggestions",
    fullLockedRowPriorityOrder: "What to fix first, in order",
    fullLockedRows: [
      "Detailed recommendations per dimension",
      "ATS readability improvements",
      "Priority action plan",
      "Target-role guidance",
      "Additional rewrite suggestions",
    ],
    fullIncludes: [
      "Detailed recommendations",
      "ATS improvements",
      "Prioritized action plan",
      "Section-by-section review",
      "Rewrite suggestions",
    ],
    fullCta: "Unlock the Full Review — $5",
    fullLockedNote: "Checkout opens soon — the Full Review is not available yet.",
    fullWhat: "What do you get for $5? A detailed review, prioritized fixes, and section-by-section guidance.",
    lockedA11y: "Locked content — included in the Full Review",
    paymentState: {
      notStarted: "Payment not started",
      pendingVerification: "Awaiting verification",
      verified: "Verified ✓",
      opened: "Report unlocked",
    },
    fullCtaPreparing: "Preparing checkout...",
    fullCtaError: "Couldn't start checkout. Please try again.",
    fullPayNote: "After paying on PayPal, come back to this page and submit your transaction reference to verify — your full report unlocks once confirmed.",
    verifyH: "Paid?",
    verifyBody: "Enter your PayPal transaction reference (or the email you paid with) and we'll unlock your full report once confirmed.",
    verifyRefPlaceholder: "PayPal transaction ID",
    verifyEmailPlaceholder: "Email you paid with (optional)",
    verifySubmitCta: "Submit for verification",
    verifySending: "Submitting...",
    verifyRequested: "Request received — your full report unlocks once payment is confirmed.",
    verifyError: "Couldn't submit. Please try again.",
    fullRejectedNote: "We couldn't confirm that payment. Check the reference or contact us.",
    fullVerifiedNote: "Payment confirmed ✓ — your full report is ready.",
    fullUnlockedNote: "Payment confirmed ✓",
    detailH: "Detailed recommendations per dimension",
    atsH: "ATS readability improvements",
    actionPlanH: "Prioritized action plan",
    targetRoleH: "Target-role guidance",
    noTargetRoleNote: "No target role was provided for this analysis — here's role-neutral guidance that applies broadly.",
    rewriteSuggestionsFullH: "Additional rewrite suggestions",
    actionPlanEffort: { quick: "Quick", moderate: "Moderate", substantial: "Substantial" },

    authH: "Where should we send your report?",
    authEmail: "Email",
    authCta: "Continue",
    authNoPassword: "No password needed.",
    authPending: "Sign-in opens at launch — soon.",
    authCheckEmail: "We sent a sign-in link to your email — open it to continue your analysis.",

    methodH: "How we review your CV",
    methodBody:
      "We read your CV the way an experienced recruiter does: positioning, experience quality, impact and evidence, skills, ATS readability, and alignment with your seniority.",
    methodAI:
      "Your CV is analyzed across structured criteria. The final score is calculated consistently — not guessed by the AI.",
    builtBy:
      "Built by Turki Almalki — from years of reviewing, building and improving professional profiles and digital products.",

    // ── next services (end of report cross-sell — Career V2 Part J) ──
    nextStepsH: "What's next?",
    nextStepsGroup1H: "Level up your professional presence",
    nextStepsGroup2H: "Got an idea you want to build?",
    nextStepsSeeAll: "See all services",
    nextServiceCvName: "CV Rewrite",
    nextServiceCvCta: "Rewrite my CV",
    nextServiceLinkedinName: "LinkedIn Optimization",
    nextServiceLinkedinCta: "Optimize my LinkedIn",
    nextServicePortfolioName: "Personal Website",
    nextServicePortfolioCta: "Build my portfolio",

    // ── contact / social footer (Career V2 Part K) ──
    contactH: "Need direct help?",
    contactName: "Turki Almalki",
    contactSentence: "If you have a question about your report or want personal help, reach out directly.",
    contactEmailCta: "Email me",
    contactLinkedinCta: "LinkedIn",
    contactGithubCta: "GitHub",
    contactSiteCta: "Website",

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
