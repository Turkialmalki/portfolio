/**
 * ATS COMPATIBILITY ENGINE TEST HARNESS (Career V2 Part 29) — run with:
 *   npm run test:ats
 *
 * Feeds each fixture through the EXACT same deterministic stages
 * pipeline.ts uses (preprocess → redact → extractNormalizedResume →
 * computeAtsCompatibility) and asserts the engine actually responds to
 * observable parsing/structuring quality — never a flat score regardless
 * of input, and never punishing content merely for being visually
 * distinctive when the parser demonstrably still recovered it fine.
 */
import { preprocessResumeText, redactContactFields, extractNormalizedResume, computeAtsCompatibility } from "../../functions/_shared/analysis/index.ts";
import { ATS_FIXTURES } from "./fixtures.ts";

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function run(rawText: string) {
  const preprocessed = preprocessResumeText(rawText);
  const redaction = redactContactFields(preprocessed);
  const normalized = extractNormalizedResume(redaction.redactedText);
  return computeAtsCompatibility(normalized, redaction);
}

function statusOf(result: ReturnType<typeof computeAtsCompatibility>, id: string): string | undefined {
  return result.checks.find((c) => c.id === id)?.status;
}

async function main() {
  console.log("Career V2 — ATS Compatibility fixture suite\n");

  const byName = new Map(ATS_FIXTURES.map((f) => [f.name, run(f.rawText)]));
  for (const f of ATS_FIXTURES) {
    const r = byName.get(f.name)!;
    console.log(`  ${f.name}: score=${r.atsCompatibilityScore} pass=${r.atsChecksPassed} warn=${r.atsChecksWarning} fail=${r.atsChecksFailed}`);
  }
  console.log();

  console.log("[1] Clean CVs score well, on both PDF-style and DOCX-style text");
  const clean = byName.get("clean_single_column_english")!;
  const docx = byName.get("clean_docx_style")!;
  check("clean_single_column_english: high compatibility score (>=80)", clean.atsCompatibilityScore >= 80);
  check("clean_single_column_english: zero failed checks", clean.atsChecksFailed === 0);
  check("clean_docx_style: high compatibility score (>=80) — format-agnostic once extracted", docx.atsCompatibilityScore >= 80);
  check("clean_docx_style: zero failed checks", docx.atsChecksFailed === 0);

  console.log("\n[2] Fragmented/multi-column text is flagged as a real structural risk");
  const fragmented = byName.get("multi_column_fragmented")!;
  check("multi_column_fragmented: materially lower score than the clean fixture", fragmented.atsCompatibilityScore < clean.atsCompatibilityScore - 20);
  check("multi_column_fragmented: text_structure check is not 'pass'", statusOf(fragmented, "text_structure") !== "pass");
  check("multi_column_fragmented: at least one failed check", fragmented.atsChecksFailed >= 1);

  console.log("\n[3] Missing sections are detected specifically, not just as a generic low score");
  const missingSkills = byName.get("missing_skills_section")!;
  check("missing_skills_section: skills_extraction check fails", statusOf(missingSkills, "skills_extraction") === "fail");
  check("missing_skills_section: section_detection is not 'pass' (skills missing)", statusOf(missingSkills, "section_detection") !== "pass");
  check("missing_skills_section: experience_structure still reads fine (only skills is missing)", statusOf(missingSkills, "experience_structure") === "pass");

  const missingEducation = byName.get("missing_education")!;
  check("missing_education: section_detection is not 'pass' (education missing)", statusOf(missingEducation, "section_detection") !== "pass");
  check("missing_education: skills_extraction still reads fine (only education is missing)", statusOf(missingEducation, "skills_extraction") === "pass");

  console.log("\n[4] Unparseable dates are detected without penalizing unrelated checks");
  const badDates = byName.get("unparseable_dates")!;
  check("unparseable_dates: date_readability check is not 'pass'", statusOf(badDates, "date_readability") !== "pass");
  check("unparseable_dates: section_detection still reads fine (sections are present, only dates are unreadable)", statusOf(badDates, "section_detection") === "pass");

  console.log("\n[5] Arabic CVs are evaluated on the same structural terms as English — never penalized for language");
  const arabic = byName.get("arabic_resume")!;
  check("arabic_resume: high compatibility score (>=80), same bar as English", arabic.atsCompatibilityScore >= 80);
  check("arabic_resume: section_detection passes (Arabic headings are recognized)", statusOf(arabic, "section_detection") === "pass");
  check("arabic_resume: identity_extraction passes", statusOf(arabic, "identity_extraction") === "pass");

  console.log("\n[6] Determinism — same fixture, same result, twice");
  for (const f of ATS_FIXTURES) {
    const again = run(f.rawText);
    const first = byName.get(f.name)!;
    check(`${f.name}: identical result run-to-run`, JSON.stringify(first) === JSON.stringify(again));
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
