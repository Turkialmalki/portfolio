/**
 * ATS COMPATIBILITY FIXTURE SUITE (Career V2 Part 29).
 *
 * Text-level fixtures for the checks named in Part 5's list — this suite
 * exercises the deterministic ATS engine (atsCompatibility.ts) at exactly
 * the layer it operates on (preprocessed/redacted TEXT → NormalizedResume
 * → AtsCompatibilityResult), the same layer pipeline.ts feeds it in
 * production. The PDF/DOCX binary-extraction mechanics themselves (can we
 * get text out of a real .pdf/.docx file at all) are already covered by
 * supabase/tests/parser's real fixture files (80/80 passing) — duplicating
 * binary generation here would test the parser twice and the ATS engine
 * zero extra times.
 *
 * "image-only/scanned PDF" (Part 29) is deliberately NOT a fixture here:
 * per atsCompatibility.ts's own header comment, that document never
 * reaches this module at all — the parser rejects it upstream with
 * SCAN_REQUIRES_TEXT_PDF/PDF_NO_EXTRACTABLE_TEXT (see parser/pdfExtract.ts,
 * exercised by supabase/tests/parser) BEFORE any analysis begins. Part 29's
 * own instruction — "for an image-only resume return 'تعذر قراءة النص
 * بشكل موثوق' rather than pretending to score ATS compatibility" — is
 * exactly what that upstream rejection already does; asserting it a
 * second time at the ATS-engine layer would be asserting something this
 * layer structurally cannot receive.
 */

export interface AtsFixture {
  name: string;
  description: string;
  rawText: string;
}

const CLEAN_ENGLISH = `John Fictional
john.fictional@example.com | 555-000-1111

Summary
Product manager with 8 years of experience shipping B2B SaaS products.

Experience
Senior Product Manager | Fictional Software Co | Jan 2021 - Present
- Led the launch of a new billing platform, growing net revenue retention by 9%.
- Owned the roadmap for three squads across pricing and checkout.

Product Manager | Fictional Apps Inc | Jun 2017 - Dec 2020
- Shipped the mobile onboarding redesign, reducing signup drop-off by 22%.
- Partnered with design and engineering on a quarterly release cadence.

Education
BSc Computer Science, Fictional State University, 2017

Skills
Product strategy, SQL, Roadmapping, A/B testing, Stakeholder management`;

const CLEAN_DOCX_STYLE = `Maya Fictional
maya.fictional@example.com

Summary
Marketing lead specializing in lifecycle campaigns for fintech products.

Experience
Marketing Lead | Fictional Fintech Co | Mar 2020 - Present
- Built the lifecycle email program from zero, driving a 31% lift in activation.
- Managed a $2M annual paid-acquisition budget across four channels.

Marketing Manager | Fictional Growth Ltd | Aug 2016 - Feb 2020
- Ran quarterly campaign experiments, doubling qualified lead volume.

Education
BA Marketing, Fictional University, 2016

Skills
Lifecycle marketing, paid acquisition, campaign analytics, Braze, HubSpot`;

// Simulates the text a multi-column/fragmented layout often decodes to:
// short interleaved fragments, no recognizable heading vocabulary, dates
// and duties scattered without clear line structure.
const FRAGMENTED = `Fictional Person Contact Somewhere
2019 Analyst role duties included various tasks Fictional Co Skills
listed here Python Excel 2021 promoted senior title duties again
References scattered no clear section markers project alpha project
beta metrics unclear achievements unclear education somewhere maybe
2015 degree mentioned inline without its own heading block anywhere`;

const MISSING_SKILLS = `Sara Fictional
sara.fictional@example.com

Summary
Operations manager with a background in logistics and vendor management.

Experience
Operations Manager | Fictional Logistics Co | 2019 - Present
- Managed a network of 12 regional vendors, cutting delivery delays by 15%.
- Led the transition to a new warehouse management system.

Education
BSc Supply Chain Management, Fictional University, 2015`;

const MISSING_EDUCATION = `Ali Fictional
ali.fictional@example.com

Summary
Backend engineer focused on distributed systems.

Experience
Backend Engineer | Fictional Systems Ltd | 2020 - Present
- Built the event-sourcing pipeline used by four downstream teams.
- Reduced deployment time from 40 minutes to 6 minutes.

Skills
Go, Kubernetes, PostgreSQL, distributed systems`;

// Every "date" here is deliberately unparseable — no year, no month/year
// range, no recognizable range separator.
const UNPARSEABLE_DATES = `Noor Fictional
noor.fictional@example.com

Summary
Customer success manager.

Experience
Customer Success Manager, Fictional Software Co, a while back until recently
- Managed a portfolio of enterprise accounts.
Customer Success Associate, Fictional Apps Inc, before that
- Supported onboarding for new customers.

Education
BA Business, Fictional University, a few years ago

Skills
Account management, onboarding, customer success`;

const ARABIC = `نورة مثال
noura.example@example.com

الملخص المهني
مديرة منتج لديها 7 سنوات خبرة في تطوير منتجات SaaS للشركات.

الخبرة العملية
مديرة منتج أول | شركة مثالية للبرمجيات | يناير 2021 - حتى الآن
- قادت إطلاق منصة فوترة جديدة رفعت الإيرادات الصافية 9%.
- أدارت خارطة طريق لثلاث فرق في التسعير والدفع.

مديرة منتج | شركة تطبيقات مثالية | يونيو 2017 - ديسمبر 2020
- أطلقت إعادة تصميم تجربة التسجيل، ما قلل معدل التسرب 22%.

التعليم
بكالوريوس علوم حاسب، جامعة مثالية، 2017

المهارات
استراتيجية المنتج، SQL، تخطيط خارطة الطريق، اختبار A/B`;

export const ATS_FIXTURES: AtsFixture[] = [
  { name: "clean_single_column_english", description: "Clean, well-structured single-column English CV (represents a clean PDF).", rawText: CLEAN_ENGLISH },
  { name: "clean_docx_style", description: "Clean, well-structured CV in typical DOCX-export text shape.", rawText: CLEAN_DOCX_STYLE },
  { name: "multi_column_fragmented", description: "Simulates the merged/interleaved text a multi-column or heavily-designed PDF often decodes to.", rawText: FRAGMENTED },
  { name: "missing_skills_section", description: "Otherwise well-structured CV with no skills section at all.", rawText: MISSING_SKILLS },
  { name: "missing_education", description: "Otherwise well-structured CV with no education section at all.", rawText: MISSING_EDUCATION },
  { name: "unparseable_dates", description: "Experience entries present but no date range is machine-readable.", rawText: UNPARSEABLE_DATES },
  { name: "arabic_resume", description: "Clean, well-structured Arabic CV with Arabic section headings.", rawText: ARABIC },
];
