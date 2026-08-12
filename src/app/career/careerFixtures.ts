/**
 * SYNTHETIC UI FIXTURES — SAFE_SYNTHETIC_DEMO_MODE data (Command 06A §11,
 * §56). While `PRIVACY_SECURITY_EXECUTION_VERIFIED` is false no real CV may
 * be analyzed, so the /career UI develops and demos against these fixture
 * reports instead.
 *
 * These are UI DATA ONLY. They duplicate no production logic: every score,
 * band, issue/strength/quick-win count below is copied from the REAL
 * validated Anthropic fixture runs recorded in `full-suite-results.json`
 * (11/11 successful, all overall scores produced by scoring.ts):
 *
 *   weak_entry_english    20 · 3 issues · 2 strengths · quick win  · 12 dims
 *   strong_senior_english 84 · 0 issues · 2 strengths · none       · 15 dims
 *   arabic_generic        11 · 3 issues · 2 strengths · quick win  · 13 dims
 *   manager_tasks_only    20 · 3 issues · 2 strengths · quick win  · 13 dims
 *   job_match_partial     46 · 3 issues · 2 strengths · quick win  · 15 dims
 *
 * The finding TEXT is synthetic (the harness result file stores counts, not
 * prose) but written to the same shape and tone the engine produces. Score
 * bands are copied verbatim from methodology/scoreBands.ts. No real person's
 * CV content appears anywhere in this file.
 */
import type { UiFreeReport } from "./careerTypes";

export type CareerFixtureKey =
  | "weak_entry"
  | "strong_senior"
  | "arabic_generic"
  | "manager_tasks"
  | "job_match_partial";

const BAND_MAJOR = {
  min: 0,
  labelEn: "Major structural and content problems",
  labelAr: "السيرة الذاتية تحتاج إعادة بناء جوهرية في الهيكل والمحتوى",
};
const BAND_WEAK = {
  min: 45,
  labelEn: "Weak positioning / significant issues",
  labelAr: "التموضع المهني في السيرة ضعيف ويحتاج إعادة صياغة",
};
const BAND_STRONG = { min: 80, labelEn: "Strong", labelAr: "قوي" };

const weakEntry: UiFreeReport = {
  overallScore: 20,
  scoreBand: BAND_MAJOR,
  confidence: "high",
  reportLang: "en",
  dimensionSummary: [
    { dimension: "positioning", score: 18, summary: "No clear professional identity — the CV never says what role it is for." },
    { dimension: "professional_summary", score: 15, summary: "The objective describes what the candidate wants, not what they offer." },
    { dimension: "experience_quality", score: 24, summary: "Roles list duties (\"responsible for…\") with no scope or outcomes." },
    { dimension: "achievement_impact", score: 12, summary: "Not a single quantified result appears anywhere in the document." },
    { dimension: "career_progression", score: 35, summary: "Two roles with no visible growth in scope or title between them." },
    { dimension: "skills_relevance", score: 28, summary: "Skills are a flat comma list with no tie to any experience entry." },
    { dimension: "ats_readability", score: 42, summary: "Single column parses, but section headers are non-standard." },
    { dimension: "evidence_specificity", score: 14, summary: "Claims like \"improved processes\" are never backed by a specific." },
    { dimension: "language_quality", score: 38, summary: "Readable, but passive phrasing weakens almost every bullet." },
    { dimension: "content_prioritization", score: 25, summary: "The strongest experience is buried below coursework." },
    { dimension: "redundancy_noise", score: 30, summary: "\"References available upon request\" and repeated duties add noise." },
    { dimension: "seniority_alignment", score: 26, summary: "Reads below the experience level the dates imply." },
  ],
  topIssues: [
    {
      dimension: "achievement_impact",
      severity: "critical",
      summary: "Every bullet describes a duty, not a result. There is no number, scale, or outcome a reader could remember — the experience is invisible.",
    },
    {
      dimension: "positioning",
      severity: "high",
      summary: "The CV never states a target role. A recruiter has to guess what job this document is applying for, and guessing costs you the shortlist.",
    },
    {
      dimension: "evidence_specificity",
      severity: "high",
      summary: "General claims (\"improved processes\", \"worked with teams\") appear without a single concrete example, so none of them build trust.",
    },
  ],
  topStrengths: [
    {
      dimension: "ats_readability",
      summary: "The single-column layout extracts cleanly — the structure is machine-readable even where the content is thin.",
    },
    {
      dimension: "career_progression",
      summary: "The dates are continuous with no unexplained gaps, which reads as stability.",
    },
  ],
  quickWin: {
    dimension: "achievement_impact",
    action: "Rewrite your top bullet to state one concrete result with a number — even an approximate one you can defend.",
    why: "One measurable outcome near the top changes how every following line is read.",
  },
  rewriteExample: {
    before: "Responsible for handling customer requests and improving processes.",
    after: "Resolved ~40 customer requests weekly and documented the intake process, cutting repeat tickets.",
    note: "Clearer ownership. Stronger outcome. No invented facts.",
  },
  fullReviewCounts: {
    recommendations: 9,
    highPriority: 3,
    sectionsToRewrite: 4,
    missingEvidenceQuestions: 3,
  },
};

const strongSenior: UiFreeReport = {
  overallScore: 84,
  scoreBand: BAND_STRONG,
  confidence: "high",
  reportLang: "en",
  dimensionSummary: [
    { dimension: "positioning", score: 88, summary: "A precise senior identity, stated in the first line and held throughout." },
    { dimension: "professional_summary", score: 85, summary: "Three lines: scope, domain, one signature result. Exactly enough." },
    { dimension: "experience_quality", score: 86, summary: "Each role shows scope, team size, and what changed on their watch." },
    { dimension: "achievement_impact", score: 82, summary: "Most bullets carry a quantified outcome; a few could be sharper." },
    { dimension: "career_progression", score: 90, summary: "Clean upward arc — scope visibly grows role over role." },
    { dimension: "leadership_ownership", score: 87, summary: "Leadership is demonstrated through decisions, not adjectives." },
    { dimension: "skills_relevance", score: 80, summary: "Skills tie to the experience entries that prove them." },
    { dimension: "ats_readability", score: 84, summary: "Standard headings and clean structure parse without loss." },
    { dimension: "target_role_alignment", score: 78, summary: "Well aligned; two core themes of the target role could surface earlier." },
    { dimension: "keyword_coverage", score: 76, summary: "Core terms covered; a few supporting keywords appear only once." },
    { dimension: "evidence_specificity", score: 83, summary: "Claims are consistently backed with named systems and figures." },
    { dimension: "language_quality", score: 85, summary: "Active, economical sentences; no filler detected." },
    { dimension: "content_prioritization", score: 81, summary: "Strongest material leads. Older roles are correctly compressed." },
    { dimension: "redundancy_noise", score: 86, summary: "Very little repetition; every line earns its place." },
    { dimension: "seniority_alignment", score: 88, summary: "Reads exactly at the seniority the dates and scope imply." },
  ],
  topIssues: [],
  topStrengths: [
    {
      dimension: "achievement_impact",
      summary: "Outcomes are quantified and attributable — a reader can tell what this person changed, not just where they sat.",
    },
    {
      dimension: "career_progression",
      summary: "The progression story is legible in ten seconds: scope grows, titles follow, nothing needs explaining.",
    },
  ],
  quickWin: null,
  rewriteExample: null,
  fullReviewCounts: {
    recommendations: 5,
    highPriority: 0,
    sectionsToRewrite: 1,
    missingEvidenceQuestions: 2,
  },
};

const arabicGeneric: UiFreeReport = {
  overallScore: 11,
  scoreBand: BAND_MAJOR,
  confidence: "high",
  reportLang: "ar",
  dimensionSummary: [
    { dimension: "positioning", score: 10, summary: "لا يوجد مسمى مهني واضح — السيرة لا تحدد أي وظيفة تستهدف." },
    { dimension: "professional_summary", score: 8, summary: "الهدف الوظيفي عبارة عامة تصلح لأي شخص وأي وظيفة." },
    { dimension: "experience_quality", score: 14, summary: "الخبرات مكتوبة كمهام يومية بدون نطاق أو نتيجة." },
    { dimension: "achievement_impact", score: 6, summary: "لا يوجد رقم واحد أو نتيجة ملموسة في كامل السيرة." },
    { dimension: "career_progression", score: 22, summary: "التواريخ موجودة لكن لا يظهر أي تطور بين الأدوار." },
    { dimension: "skills_relevance", score: 15, summary: "المهارات قائمة عامة (حاسب آلي، عمل جماعي) بلا ربط بالخبرة." },
    { dimension: "ats_readability", score: 30, summary: "التنسيق بسيط ويُقرأ آليًا، لكن العناوين غير قياسية." },
    { dimension: "evidence_specificity", score: 8, summary: "كل الادعاءات عامة — لا مشروع مسمى ولا مثال محدد." },
    { dimension: "language_quality", score: 25, summary: "اللغة سليمة لكنها إنشائية أكثر منها مهنية." },
    { dimension: "content_prioritization", score: 18, summary: "المعلومات الشخصية تأخذ مساحة أكبر من الخبرة العملية." },
    { dimension: "redundancy_noise", score: 20, summary: "تكرار لنفس العبارات في أكثر من قسم يضعف التركيز." },
    { dimension: "seniority_alignment", score: 16, summary: "السيرة تظهر بمستوى أقل من سنوات الخبرة المذكورة." },
    { dimension: "leadership_ownership", score: 12, summary: "لا يظهر أي دور قيادي أو تحمّل مسؤولية واضح." },
  ],
  topIssues: [
    {
      dimension: "achievement_impact",
      severity: "critical",
      summary: "السيرة كاملة بدون أي إنجاز ملموس — كل سطر يصف مهمة، ولا يوجد ما يخبر القارئ وش تغيّر بسببك.",
    },
    {
      dimension: "positioning",
      severity: "critical",
      summary: "ما فيه مسمى وظيفي مستهدف. اللي يقرأ سيرتك لازم يخمّن وش الوظيفة اللي تدور عليها — وهذا أول سبب للتجاهل.",
    },
    {
      dimension: "content_prioritization",
      severity: "high",
      summary: "المعلومات الشخصية والدورات تتصدر الصفحة، بينما الخبرة العملية — أهم شيء عندك — مدفونة في الأسفل.",
    },
  ],
  topStrengths: [
    {
      dimension: "ats_readability",
      summary: "التنسيق بسيط وبعمود واحد، وهذا يخلي الأنظمة الآلية تقرأ المحتوى بدون فقدان.",
    },
    {
      dimension: "career_progression",
      summary: "التواريخ متسلسلة وواضحة بدون فجوات غير مفسّرة.",
    },
  ],
  quickWin: {
    dimension: "positioning",
    action: "أضف سطرًا واحدًا أعلى السيرة يحدد المسمى الوظيفي اللي تستهدفه بالضبط.",
    why: "سطر واحد واضح يغيّر طريقة قراءة كل اللي بعده.",
  },
  rewriteExample: {
    before: "القيام بمهام إدارية متنوعة ومساعدة الفريق في الأعمال اليومية.",
    after: "نظمت جدولة ومتابعة أكثر من 30 معاملة أسبوعيًا، وقلصت زمن الرد الداخلي.",
    note: "أوضح في المسؤولية والأثر — بدون إضافة معلومات غير موجودة.",
  },
  fullReviewCounts: {
    recommendations: 10,
    highPriority: 4,
    sectionsToRewrite: 5,
    missingEvidenceQuestions: 3,
  },
};

const managerTasks: UiFreeReport = {
  overallScore: 20,
  scoreBand: BAND_MAJOR,
  confidence: "high",
  reportLang: "en",
  dimensionSummary: [
    { dimension: "positioning", score: 30, summary: "Says \"manager\" but positions like an individual contributor." },
    { dimension: "professional_summary", score: 22, summary: "Summary lists responsibilities, not leadership outcomes." },
    { dimension: "experience_quality", score: 24, summary: "Management roles described as task lists — no team, no budget, no scope." },
    { dimension: "achievement_impact", score: 12, summary: "No delivered outcome is attributed to the candidate's leadership." },
    { dimension: "career_progression", score: 45, summary: "Titles progress to manager, but the content never does." },
    { dimension: "leadership_ownership", score: 10, summary: "Not one decision, hire, or escalation is owned on paper." },
    { dimension: "skills_relevance", score: 32, summary: "Tools listed; management competencies absent." },
    { dimension: "ats_readability", score: 50, summary: "Parses cleanly with standard sections." },
    { dimension: "evidence_specificity", score: 15, summary: "\"Managed the team\" appears four times with no specifics." },
    { dimension: "language_quality", score: 40, summary: "Grammatical but uniformly passive." },
    { dimension: "content_prioritization", score: 28, summary: "Early-career detail outweighs the management years." },
    { dimension: "redundancy_noise", score: 26, summary: "The same coordination duty is restated across three roles." },
    { dimension: "seniority_alignment", score: 14, summary: "Reads two levels below the title on the page." },
  ],
  topIssues: [
    {
      dimension: "leadership_ownership",
      severity: "critical",
      summary: "The title says manager but the bullets say assistant: no team size, no decision, no outcome you owned. The seniority claim is unsupported.",
    },
    {
      dimension: "achievement_impact",
      severity: "high",
      summary: "Years of management produced no stated result — nothing shipped, saved, grown, or fixed is attributed to you.",
    },
    {
      dimension: "redundancy_noise",
      severity: "medium",
      summary: "The same coordination duties are copy-pasted across three roles, which reads as one year of experience three times.",
    },
  ],
  topStrengths: [
    {
      dimension: "career_progression",
      summary: "The title trajectory itself is real and visible — coordinator to manager over six years.",
    },
    {
      dimension: "ats_readability",
      summary: "Standard headings and simple formatting parse without loss.",
    },
  ],
  quickWin: {
    dimension: "leadership_ownership",
    action: "Add the team size and one decision you owned to your current role's first bullet.",
    why: "A single concrete leadership fact makes the manager title believable.",
  },
  rewriteExample: {
    before: "Responsible for managing the team and coordinating daily tasks.",
    after: "Led a 6-person operations team; introduced a weekly planning cycle that cut missed handoffs.",
    note: "Clearer ownership. Stronger outcome. No invented facts.",
  },
  fullReviewCounts: {
    recommendations: 8,
    highPriority: 3,
    sectionsToRewrite: 4,
    missingEvidenceQuestions: 4,
  },
};

const jobMatchPartial: UiFreeReport = {
  overallScore: 46,
  scoreBand: BAND_WEAK,
  confidence: "medium",
  reportLang: "en",
  dimensionSummary: [
    { dimension: "positioning", score: 48, summary: "A real identity exists but doesn't face the target role." },
    { dimension: "professional_summary", score: 44, summary: "Solid summary aimed at the wrong audience for this JD." },
    { dimension: "experience_quality", score: 58, summary: "Good role detail; the relevant projects are under-told." },
    { dimension: "achievement_impact", score: 42, summary: "Some outcomes quantified, most left as duties." },
    { dimension: "career_progression", score: 62, summary: "Progression is clear and steady." },
    { dimension: "leadership_ownership", score: 50, summary: "Ownership appears in one role, then disappears." },
    { dimension: "skills_relevance", score: 40, summary: "Half the JD's core skills are absent from the page." },
    { dimension: "ats_readability", score: 66, summary: "Parses well; a two-column skills box risks reordering." },
    { dimension: "target_role_alignment", score: 34, summary: "The CV demonstrates a neighboring role, not the target one." },
    { dimension: "keyword_coverage", score: 30, summary: "Core JD terms appear rarely or not at all." },
    { dimension: "evidence_specificity", score: 45, summary: "Named projects exist but lack figures." },
    { dimension: "language_quality", score: 60, summary: "Clean, direct sentences throughout." },
    { dimension: "content_prioritization", score: 43, summary: "The most JD-relevant work sits on page two." },
    { dimension: "redundancy_noise", score: 55, summary: "Minor repetition in the skills section." },
    { dimension: "seniority_alignment", score: 52, summary: "Level reads right; emphasis does not." },
  ],
  topIssues: [
    {
      dimension: "target_role_alignment",
      severity: "high",
      summary: "The CV proves a neighboring role, not the one in the job description — the relevant 30% of your experience is scattered instead of leading.",
    },
    {
      dimension: "keyword_coverage",
      severity: "high",
      summary: "Several core terms from the JD never appear, so both the ATS pass and the human skim under-rate a genuinely relevant background.",
    },
    {
      dimension: "content_prioritization",
      severity: "medium",
      summary: "The most JD-relevant project is on page two. For this application it should be the first thing a reader meets.",
    },
  ],
  topStrengths: [
    {
      dimension: "career_progression",
      summary: "A steady, legible progression that supports the level the target role requires.",
    },
    {
      dimension: "language_quality",
      summary: "Writing is clean and direct — restructuring this CV is re-ordering, not rewriting.",
    },
  ],
  quickWin: {
    dimension: "content_prioritization",
    action: "Move the platform-migration project to the top of your current role.",
    why: "It is your strongest evidence for this specific JD, and right now it is the last thing read.",
  },
  rewriteExample: {
    before: "Worked on the migration project with the platform team.",
    after: "Drove the platform migration for 3 core services, coordinating a 4-person team to a zero-downtime cutover.",
    note: "Clearer ownership. Stronger outcome. No invented facts.",
  },
  fullReviewCounts: {
    recommendations: 8,
    highPriority: 3,
    sectionsToRewrite: 3,
    missingEvidenceQuestions: 2,
  },
};

export const CAREER_FIXTURES: Record<CareerFixtureKey, UiFreeReport> = {
  weak_entry: weakEntry,
  strong_senior: strongSenior,
  arabic_generic: arabicGeneric,
  manager_tasks: managerTasks,
  job_match_partial: jobMatchPartial,
};

export const FIXTURE_LABELS: Record<CareerFixtureKey, string> = {
  weak_entry: "Weak · entry level (EN)",
  strong_senior: "Strong · senior (EN)",
  arabic_generic: "Generic (AR)",
  manager_tasks: "Manager, tasks only (EN)",
  job_match_partial: "Partial job match (EN)",
};

/** Demo-mode default: matches the visitor's UI language so the demo report reads natively. */
export function defaultFixtureFor(lang: "ar" | "en"): CareerFixtureKey {
  return lang === "ar" ? "arabic_generic" : "weak_entry";
}
