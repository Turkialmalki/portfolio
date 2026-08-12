/**
 * DETERMINISTIC ATS COMPATIBILITY CHECK (Career V2 Part 5).
 *
 * Separate on purpose from `findings.ts`'s `buildAtsAnalysis` (which is
 * still the LLM's own `ats_readability` dimension judgment, weighted into
 * the CV Strength score). THIS module produces the customer-facing "ATS
 * Compatibility" number from code alone — zero AI involvement — because a
 * trust-sensitive claim about parseability should never drift between
 * identical runs, and because "can a machine parse this document
 * structurally" is exactly the kind of thing code measures more reliably
 * than a model asked to guess.
 *
 * Scope, deliberately narrow (Part 5/25): these are observable
 * resume-parsing/readability characteristics common to how modern ATS
 * parsers process documents — never a claim about any specific vendor
 * (Workday/Greenhouse/Lever/Ashby), never a pass/fail guarantee. A
 * visually distinctive resume is NEVER penalized for being attractive;
 * every check here fires only on an actual extraction/structuring
 * difficulty this pipeline itself demonstrated (structureUncertain,
 * unparsed dates, missing standard sections, etc.), not on design taste.
 *
 * Runs entirely on what the pipeline already computed deterministically —
 * `NormalizedResume` (structure.ts, no AI) and the redaction counts
 * (redact.ts, no AI) — so it costs nothing extra and can never disagree
 * with itself between two runs of the same document.
 *
 * Image-only / unreadable-text resumes never reach this module at all:
 * the parser (parser/index.ts) already rejects them upstream with
 * SCAN_REQUIRES_TEXT_PDF / PDF_NO_EXTRACTABLE_TEXT before any analysis
 * begins — Part 29's "تعذر قراءة النص بشكل موثوق" case is that parser
 * error, surfaced to the customer as a parse failure, not as a fabricated
 * ATS score of 0.
 */
import type { AtsCheckResult, AtsCheckStatus, AtsCompatibilityResult } from "../methodology/types.ts";
import type { NormalizedResume } from "./types.ts";

/** Weight, in points toward atsCompatibilityScore/100, per status. */
const STATUS_POINTS: Record<AtsCheckStatus, number> = { pass: 100, warning: 55, fail: 10 };

function check(
  id: string,
  labelEn: string,
  labelAr: string,
  status: AtsCheckStatus,
  detailEn: string,
  detailAr: string,
): AtsCheckResult {
  return { id, labelEn, labelAr, status, detailEn, detailAr };
}

/**
 * §Part 5: FILE PARSEABILITY. By the time a `NormalizedResume` exists at
 * all, the parser already succeeded (a failed extraction never reaches
 * this pipeline) — this check only distinguishes a thin-but-real
 * extraction (very little usable text) from a healthy one.
 */
function checkFileParseability(normalized: NormalizedResume): AtsCheckResult {
  const chars = normalized.rawTextReference.trim().length;
  if (chars < 200) {
    return check(
      "file_parseability",
      "Extractable text",
      "استخراج النص",
      "warning",
      "Very little text could be extracted from this file — automated systems may see an unusually short document.",
      "تم استخراج نص قليل جداً من هذا الملف — قد تراه أنظمة التوظيف الآلية مستنداً قصيراً بشكل غير معتاد.",
    );
  }
  return check(
    "file_parseability",
    "Extractable text",
    "استخراج النص",
    "pass",
    "The file's text extracted cleanly and is non-empty.",
    "تم استخراج نص الملف بشكل سليم وهو غير فارغ.",
  );
}

/**
 * §Part 5: IDENTITY EXTRACTION. Email/phone were already redacted before
 * this stage (privacy) — their COUNTS (from redact.ts) tell us whether an
 * ATS-style parser would have found them, without this module ever
 * touching the actual contact data. `header` presence stands in for a
 * detectable name/identity block (structure.ts never invents a header).
 */
function checkIdentityExtraction(
  normalized: NormalizedResume,
  redactedEmailCount: number,
  redactedPhoneCount: number,
): AtsCheckResult {
  const hasHeader = !!normalized.header && normalized.header.trim().length > 0;
  const hasEmail = redactedEmailCount > 0;
  const found = [hasHeader, hasEmail].filter(Boolean).length;
  // Phone is common but genuinely optional on many CVs — never counted
  // against the document, only mentioned when present.
  const phoneNote = redactedPhoneCount > 0 ? " A phone number was also detected." : "";
  const phoneNoteAr = redactedPhoneCount > 0 ? " كما تم اكتشاف رقم هاتف." : "";
  if (found === 2) {
    return check(
      "identity_extraction",
      "Contact identity",
      "بيانات التواصل",
      "pass",
      `A name/header block and an email address were both detected.${phoneNote}`,
      `تم اكتشاف عنوان/اسم في الأعلى وبريد إلكتروني معاً.${phoneNoteAr}`,
    );
  }
  if (found === 1) {
    return check(
      "identity_extraction",
      "Contact identity",
      "بيانات التواصل",
      "warning",
      `${hasHeader ? "A header block was detected but no email address." : "An email address was detected but no clear header block."} Automated systems may only capture partial contact identity.`,
      `${hasHeader ? "تم اكتشاف عنوان/اسم في الأعلى دون بريد إلكتروني." : "تم اكتشاف بريد إلكتروني دون عنوان/اسم واضح في الأعلى."} قد تلتقط الأنظمة الآلية بيانات تواصل جزئية فقط.`,
    );
  }
  return check(
    "identity_extraction",
    "Contact identity",
    "بيانات التواصل",
    "fail",
    "Neither a clear header/name block nor an email address could be detected.",
    "لم يتم اكتشاف عنوان/اسم واضح في الأعلى ولا بريد إلكتروني.",
  );
}

/** §Part 5: SECTION DETECTION — the standard sections a resume parser looks for. */
function checkSectionDetection(normalized: NormalizedResume): AtsCheckResult {
  const present = {
    experience: normalized.experience.length > 0,
    education: normalized.education.length > 0,
    skills: normalized.skills.length > 0,
    summary: !!normalized.summary && normalized.summary.trim().length > 0,
  };
  const coreCount = [present.experience, present.education, present.skills].filter(Boolean).length;
  if (coreCount === 3) {
    return check(
      "section_detection",
      "Standard sections",
      "الأقسام القياسية",
      "pass",
      `Experience, education, and skills sections were all detected${present.summary ? ", along with a summary" : ""}.`,
      `تم اكتشاف أقسام الخبرة والتعليم والمهارات جميعها${present.summary ? "، إضافة إلى ملخص مهني" : ""}.`,
    );
  }
  if (coreCount >= 1) {
    const missing: string[] = [];
    if (!present.experience) missing.push("experience");
    if (!present.education) missing.push("education");
    if (!present.skills) missing.push("skills");
    const missingAr: Record<string, string> = { experience: "الخبرة", education: "التعليم", skills: "المهارات" };
    return check(
      "section_detection",
      "Standard sections",
      "الأقسام القياسية",
      "warning",
      `Some standard sections were not detected: ${missing.join(", ")}. A parser may not classify this content correctly.`,
      `لم يتم اكتشاف بعض الأقسام القياسية: ${missing.map((m) => missingAr[m]).join("، ")}. قد لا يصنّف المحلل هذا المحتوى بشكل صحيح.`,
    );
  }
  return check(
    "section_detection",
    "Standard sections",
    "الأقسام القياسية",
    "fail",
    "No standard section headings (experience, education, skills) could be detected at all.",
    "لم يتم اكتشاف أي من عناوين الأقسام القياسية (الخبرة، التعليم، المهارات).",
  );
}

/**
 * §Part 5: EXPERIENCE STRUCTURE — org/title/dates recognizable per entry.
 * `entry.uncertain` is structure.ts's own signal that it couldn't
 * confidently split a block into title/company/dates.
 */
function checkExperienceStructure(normalized: NormalizedResume): AtsCheckResult {
  const entries = normalized.experience;
  if (entries.length === 0) {
    return check(
      "experience_structure",
      "Experience structure",
      "بنية الخبرات",
      "warning",
      "No experience entries were detected to evaluate structure for.",
      "لم يتم اكتشاف أي خبرات لتقييم بنيتها.",
    );
  }
  const confident = entries.filter((e) => !e.uncertain).length;
  const ratio = confident / entries.length;
  if (ratio >= 0.8) {
    return check(
      "experience_structure",
      "Experience structure",
      "بنية الخبرات",
      "pass",
      `${confident} of ${entries.length} experience entries have a clearly recognizable title, organization, and date range.`,
      `${confident} من ${entries.length} خبرات تحتوي على مسمى وجهة وتاريخ واضحين.`,
    );
  }
  if (ratio >= 0.4) {
    return check(
      "experience_structure",
      "Experience structure",
      "بنية الخبرات",
      "warning",
      `Only ${confident} of ${entries.length} experience entries clearly separate title, organization, and dates — a parser may merge or misread the rest.`,
      `${confident} فقط من ${entries.length} خبرات تفصل بوضوح بين المسمى والجهة والتاريخ — قد يدمج المحلل أو يسيء قراءة الباقي.`,
    );
  }
  return check(
    "experience_structure",
    "Experience structure",
    "بنية الخبرات",
    "fail",
    `Most experience entries (${entries.length - confident} of ${entries.length}) don't clearly separate title, organization, and dates.`,
    `معظم الخبرات (${entries.length - confident} من ${entries.length}) لا تفصل بوضوح بين المسمى والجهة والتاريخ.`,
  );
}

/** §Part 5: SKILLS EXTRACTION — parsed as discrete, listable text. */
function checkSkillsExtraction(normalized: NormalizedResume): AtsCheckResult {
  const count = normalized.skills.length;
  if (count >= 4) {
    return check(
      "skills_extraction",
      "Skills extraction",
      "استخراج المهارات",
      "pass",
      `${count} distinct skills were parsed as separate, listable items.`,
      `تم استخراج ${count} مهارة كعناصر منفصلة وقابلة للسرد.`,
    );
  }
  if (count >= 1) {
    return check(
      "skills_extraction",
      "Skills extraction",
      "استخراج المهارات",
      "warning",
      `Only ${count} skill(s) parsed as separate items — a skills section may be present but not clearly delimited.`,
      `تم استخراج ${count} مهارة فقط كعناصر منفصلة — قد يكون قسم المهارات موجوداً لكن غير مفصول بوضوح.`,
    );
  }
  return check(
    "skills_extraction",
    "Skills extraction",
    "استخراج المهارات",
    "fail",
    "No skills could be parsed as separate, listable items.",
    "لم يتم استخراج أي مهارات كعناصر منفصلة وقابلة للسرد.",
  );
}

/** §Part 5: DATE READABILITY — how many experience entries have a parseable date range. */
function checkDateReadability(normalized: NormalizedResume): AtsCheckResult {
  const entries = normalized.experience;
  if (entries.length === 0) {
    return check(
      "date_readability",
      "Date readability",
      "وضوح التواريخ",
      "warning",
      "No experience entries were available to check for readable dates.",
      "لا توجد خبرات متاحة للتحقق من وضوح تواريخها.",
    );
  }
  const withDates = entries.filter((e) => e.dates && e.dates.trim().length > 0).length;
  const ratio = withDates / entries.length;
  if (ratio >= 0.8) {
    return check(
      "date_readability",
      "Date readability",
      "وضوح التواريخ",
      "pass",
      `${withDates} of ${entries.length} experience entries have a recognizable date pattern.`,
      `${withDates} من ${entries.length} خبرات تحتوي على نمط تاريخ واضح.`,
    );
  }
  if (ratio >= 0.4) {
    return check(
      "date_readability",
      "Date readability",
      "وضوح التواريخ",
      "warning",
      `Only ${withDates} of ${entries.length} experience entries have a recognizable date pattern — chronology may be hard to reconstruct automatically.`,
      `${withDates} فقط من ${entries.length} خبرات تحتوي على نمط تاريخ واضح — قد يصعب استخلاص التسلسل الزمني آلياً.`,
    );
  }
  return check(
    "date_readability",
    "Date readability",
    "وضوح التواريخ",
    "fail",
    `Most experience entries (${entries.length - withDates} of ${entries.length}) have no recognizable date pattern.`,
    `معظم الخبرات (${entries.length - withDates} من ${entries.length}) لا تحتوي على نمط تاريخ واضح.`,
  );
}

/**
 * §Part 5: TEXT STRUCTURE — heading recognizability and fragmentation.
 * `structureUncertain` (never saw a single standard heading) and a high
 * count of unclassified "other" sections are structure.ts's own signals
 * of a document that fights text extraction — never a judgment about
 * visual design.
 */
function checkTextStructure(normalized: NormalizedResume): AtsCheckResult {
  if (normalized.structureUncertain) {
    return check(
      "text_structure",
      "Heading structure",
      "وضوح العناوين",
      "fail",
      "No standard section headings were recognizable anywhere in the extracted text — this is the strongest structural risk signal for automated parsing.",
      "لم يتم التعرف على أي عناوين أقسام قياسية في النص المستخرج — هذا أقوى مؤشر على خطر هيكلي في القراءة الآلية.",
    );
  }
  const otherCount = normalized.otherSections.length;
  if (otherCount >= 4) {
    return check(
      "text_structure",
      "Heading structure",
      "وضوح العناوين",
      "warning",
      `${otherCount} sections used non-standard headings a parser wouldn't recognize by name — content likely survives, but section labeling may be lost.`,
      `${otherCount} أقسام استخدمت عناوين غير قياسية قد لا يتعرف عليها المحلل بالاسم — يبقى المحتوى غالباً، لكن قد يفقد تصنيف القسم.`,
    );
  }
  return check(
    "text_structure",
    "Heading structure",
    "وضوح العناوين",
    "pass",
    "Standard section headings were recognized and the document structure is linear and text-first.",
    "تم التعرف على عناوين الأقسام القياسية وبنية المستند خطية ومعتمدة على النص أولاً.",
  );
}

export function computeAtsCompatibility(
  normalized: NormalizedResume,
  redaction: { redactedEmailCount: number; redactedPhoneCount: number },
): AtsCompatibilityResult {
  const checks = [
    checkFileParseability(normalized),
    checkIdentityExtraction(normalized, redaction.redactedEmailCount, redaction.redactedPhoneCount),
    checkSectionDetection(normalized),
    checkExperienceStructure(normalized),
    checkSkillsExtraction(normalized),
    checkDateReadability(normalized),
    checkTextStructure(normalized),
  ];

  const atsChecksPassed = checks.filter((c) => c.status === "pass").length;
  const atsChecksWarning = checks.filter((c) => c.status === "warning").length;
  const atsChecksFailed = checks.filter((c) => c.status === "fail").length;
  const atsCompatibilityScore = Math.round(
    checks.reduce((sum, c) => sum + STATUS_POINTS[c.status], 0) / checks.length,
  );

  return { atsCompatibilityScore, atsChecksPassed, atsChecksWarning, atsChecksFailed, checks };
}
