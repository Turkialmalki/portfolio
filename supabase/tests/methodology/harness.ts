/**
 * METHODOLOGY TEST HARNESS (Command 03 §32–33).
 *
 * Runs the deterministic engine against synthetic fixtures — no AI, no
 * network, no database, no customer data — and enforces the conceptual
 * sanity checks from the brief. Run with: npm run test:methodology
 */
import {
  DIMENSIONS,
  DIMENSION_IDS,
  EVIDENCE_CAP_ID,
  EVIDENCE_CAP_MAX,
  SCORE_BANDS,
  aggregateConfidence,
  bandForScore,
  buildActionPlan,
  composeMethodologyContext,
  computeOverallScore,
  planWeights,
  prioritizeIssues,
  projectFreeReport,
  type CareerAnalysis,
  type Issue,
} from "../../functions/_shared/methodology/index.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../../functions/_shared/releaseGates.ts";
import { ALL_FIXTURES, toDimensionResults, type Fixture } from "./fixtures.ts";

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

function overallFor(fixture: Fixture) {
  return computeOverallScore(toDimensionResults(fixture), fixture.context);
}

// ── 1. Rubric integrity ──────────────────────────────────────────────────
console.log("\n[1] Rubric integrity");
const weightSum = DIMENSIONS.reduce((sum, d) => sum + d.weight, 0);
check("weights sum to exactly 100", weightSum === 100, `got ${weightSum}`);
check(
  "every DimensionId has exactly one rubric",
  DIMENSION_IDS.every((id) => DIMENSIONS.filter((d) => d.id === id).length === 1),
);
check(
  "every rubric is fully populated (§5)",
  DIMENSIONS.every(
    (d) =>
      d.titleAr.length > 0 &&
      d.titleEn.length > 0 &&
      d.purpose.length > 0 &&
      d.whatGoodLooksLike.length > 0 &&
      d.positiveSignals.length > 0 &&
      d.warningSignals.length > 0 &&
      d.majorProblems.length > 0 &&
      d.evaluationQuestions.length > 0 &&
      d.scoreAnchors.length >= 4 &&
      d.recommendationRules.length > 0 &&
      d.applicableSeniority.length > 0,
  ),
);
check(
  "score anchors strictly descending per rubric",
  DIMENSIONS.every((d) =>
    d.scoreAnchors.every((a, i, arr) => i === 0 || a.atOrAbove < arr[i - 1].atOrAbove),
  ),
);
check(
  "JD-dependent dimensions also require a target role",
  DIMENSIONS.every((d) => !d.requiresJobDescription || d.requiresTargetRole),
);

// ── 2. Score bands (§4) ──────────────────────────────────────────────────
console.log("\n[2] Score bands");
let bandGaps = false;
for (let s = 0; s <= 100; s += 1) {
  const hits = SCORE_BANDS.filter((b) => s >= b.min && s <= b.max).length;
  if (hits !== 1) bandGaps = true;
}
check("bands cover 0–100 exactly once each", !bandGaps);
check("boundary 89 is Strong, 90 is Excellent", bandForScore(89).labelEn === "Strong" && bandForScore(90).labelEn === "Excellent");
check("all bands have Arabic labels", SCORE_BANDS.every((b) => b.labelAr.length > 0));

// ── 3. Normalization (§3) ────────────────────────────────────────────────
console.log("\n[3] Weight normalization");
for (const fixture of ALL_FIXTURES) {
  const plan = planWeights(fixture.context);
  const sum = plan.included.reduce((s, w) => s + w.effectiveWeight, 0);
  check(
    `${fixture.name}: effective weights sum to 1`,
    Math.abs(sum - 1) < 1e-9,
    `got ${sum}`,
  );
}
{
  const noJd = planWeights({ seniority: "mid", language: "en", targetRole: "Analyst" });
  check(
    "no JD → keyword_coverage excluded as no_job_description (never scored 0)",
    noJd.excluded.some((e) => e.dimension === "keyword_coverage" && e.reason === "no_job_description") &&
      !noJd.included.some((w) => w.dimension === "keyword_coverage"),
  );
  const noTarget = planWeights({ seniority: "mid", language: "en" });
  check(
    "no target role → target_role_alignment excluded as no_target_role",
    noTarget.excluded.some((e) => e.dimension === "target_role_alignment" && e.reason === "no_target_role"),
  );
  const entry = planWeights({ seniority: "entry", language: "en" });
  check(
    "entry → leadership_ownership excluded at seniority (§9)",
    entry.excluded.some((e) => e.dimension === "leadership_ownership" && e.reason === "not_applicable_at_seniority"),
  );
}

// ── 4. §33 sanity checks against fixtures ────────────────────────────────
console.log("\n[4] Sanity checks (§33) + fixture scores");
const results = ALL_FIXTURES.map((f) => ({ fixture: f, result: overallFor(f) }));
for (const { fixture, result } of results) {
  const band = bandForScore(result.overallScore);
  console.log(
    `        ${fixture.name}: ${result.overallScore} (uncapped ${result.uncappedScore})` +
      ` → "${band.labelEn}" / "${band.labelAr}"` +
      (result.capsApplied.length ? ` [caps: ${result.capsApplied.join(", ")}]` : ""),
  );
}
const by = (name: string) => results.find((r) => r.fixture.name === name)!;

check(
  "polished prose + zero evidence does NOT reach the top bands (cap fires)",
  by("fixture_polished_no_evidence").result.uncappedScore > EVIDENCE_CAP_MAX &&
    by("fixture_polished_no_evidence").result.overallScore === EVIDENCE_CAP_MAX &&
    by("fixture_polished_no_evidence").result.capsApplied.includes(EVIDENCE_CAP_ID),
);
check(
  "technically strong CV with NO numerical metrics can still score highly (≥80)",
  by("fixture_technical_good_no_metrics").result.overallScore >= 80,
  `got ${by("fixture_technical_good_no_metrics").result.overallScore}`,
);
{
  // Entry-level: flipping the (excluded) leadership score 0 → 100 must
  // change nothing — no points lost for not managing people.
  const flipped: Fixture = {
    ...by("fixture_entry_weak").fixture,
    scores: { ...by("fixture_entry_weak").fixture.scores, leadership_ownership: 100 },
  };
  check(
    "entry-level candidate loses nothing for absent leadership",
    overallFor(flipped).overallScore === by("fixture_entry_weak").result.overallScore,
  );
}
{
  // No JD: flipping the (excluded) keyword score must change nothing.
  const f = by("fixture_arabic_generic").fixture;
  const flipped: Fixture = { ...f, scores: { ...f.scores, keyword_coverage: 100 } };
  check(
    "missing JD causes no keyword penalty (excluded, not zeroed)",
    overallFor(flipped).overallScore === by("fixture_arabic_generic").result.overallScore,
  );
}
{
  // Arabic parity: identical dimension scores in ar vs en → identical overall.
  const f = by("fixture_arabic_generic").fixture;
  const asEnglish: Fixture = { ...f, context: { ...f.context, language: "en" } };
  check(
    "Arabic CV with identical dimension scores gets an identical overall (no structural penalty)",
    overallFor(asEnglish).overallScore === by("fixture_arabic_generic").result.overallScore,
  );
}
{
  // Manager judged as manager: task-only leadership (20) drags a manager
  // harder than it would drag a senior IC with the same scores.
  const f = by("fixture_manager_tasks_only").fixture;
  const asSenior: Fixture = { ...f, context: { ...f.context, seniority: "senior" } };
  const managerScore = by("fixture_manager_tasks_only").result.overallScore;
  check(
    "manager CV of pure tasks scores below the same document judged as senior IC",
    managerScore < overallFor(asSenior).overallScore,
    `manager ${managerScore} vs senior ${overallFor(asSenior).overallScore}`,
  );
  check(
    "manager tasks-only lands below 60 (needs improvement or lower)",
    managerScore < 60,
    `got ${managerScore}`,
  );
}
check(
  "strong senior fixture reaches Strong or better",
  by("fixture_senior_strong").result.overallScore >= 80,
  `got ${by("fixture_senior_strong").result.overallScore}`,
);
check(
  "weak entry fixture lands in a low band without being insulted by the label",
  by("fixture_entry_weak").result.overallScore < 60,
  `got ${by("fixture_entry_weak").result.overallScore}`,
);

// ── 5. Priority model (§23) ──────────────────────────────────────────────
console.log("\n[5] Priority model");
const rawIssues: Omit<Issue, "priorityRank">[] = [
  { dimension: "redundancy_noise", severity: "medium", effort: "quick", summary: "M/Q", evidence: [], recommendations: [], confidence: "high" },
  { dimension: "leadership_ownership", severity: "critical", effort: "substantial", summary: "C/S", evidence: [], recommendations: [], confidence: "high" },
  { dimension: "professional_summary", severity: "high", effort: "quick", summary: "H/Q", evidence: [], recommendations: [], confidence: "high" },
  { dimension: "achievement_impact", severity: "high", effort: "substantial", summary: "H/S", evidence: [], recommendations: [], confidence: "medium" },
];
const ordered = prioritizeIssues(rawIssues).map((i) => i.summary);
check(
  "severity dominates, quick-fix wins inside a severity",
  JSON.stringify(ordered) === JSON.stringify(["C/S", "H/Q", "H/S", "M/Q"]),
  ordered.join(" → "),
);
const plan = buildActionPlan(prioritizeIssues(rawIssues));
check("action plan is 1-indexed and ordered identically", plan[0].order === 1 && plan[0].issueSummary === "C/S" && plan.length === 4);

// ── 6. Free/paid projection (§25) ────────────────────────────────────────
console.log("\n[6] Free vs paid projection");
{
  const f = by("fixture_job_match_partial").fixture;
  const dims = toDimensionResults(f);
  const score = overallFor(f);
  const issues = prioritizeIssues(rawIssues);
  const analysis: CareerAnalysis = {
    methodologyVersion: "career_methodology_v1",
    overallScore: score.overallScore,
    scoreBand: (({ min, labelEn, labelAr }) => ({ min, labelEn, labelAr }))(bandForScore(score.overallScore)),
    confidence: aggregateConfidence(dims, score.weightPlan),
    context: f.context,
    dimensions: dims.filter((d) => score.weightPlan.included.some((w) => w.dimension === d.dimension)),
    excludedDimensions: score.weightPlan.excluded,
    strengths: [
      { dimension: "ats_readability", summary: "Clean, parseable structure.", evidence: [] },
      { dimension: "language_quality", summary: "Clear professional English.", evidence: [] },
      { dimension: "career_progression", summary: "Visible growth in scope.", evidence: [] },
    ],
    issues,
    quickWins: [
      { dimension: "professional_summary", action: "Replace the objective paragraph with a two-line identity summary.", why: "First thing every reader sees." },
      { dimension: "skills_relevance", action: "Cut undemonstrated skills.", why: "Shorter list, stronger signal." },
    ],
    missingEvidenceQuestions: [
      {
        dimension: "achievement_impact",
        context: { section: "Experience", role: "Analyst", text: "Improved reporting workflows." },
        question: "You mention improving reporting workflows. Do you know approximately what changed after your work?",
      },
    ],
    rewriteExamples: [
      {
        before: "Was responsible for the management of weekly reports.",
        after: "Managed weekly reporting for the sales team.",
        classification: "SAFE_TO_REWRITE",
        note: "Stronger verb, same facts — nothing added.",
      },
    ],
    targetRoleAnalysis: {
      targetRole: f.context.targetRole!,
      hasJobDescription: true,
      positioningVerdict: "Partial support; transferable work untranslated.",
      keywordFindings: [
        { keyword: "SQL", tier: "core", match: "strong_match", evidence: [] },
        { keyword: "forecasting", tier: "core", match: "not_demonstrated", evidence: [] },
      ],
      gaps: ["forecasting not demonstrated in any bullet"],
    },
    atsAnalysis: {
      indicators: [{ check: "standard section names", status: "ok", detail: "All sections standard." }],
      disclaimer: "Readability indicators only — no claim about any specific ATS.",
    },
    actionPlan: buildActionPlan(issues),
    metadata: { analyzedAt: "2026-08-12T00:00:00Z", capsApplied: score.capsApplied },
  };

  const free = projectFreeReport(analysis);
  check("free: at most 3 issues, 2 strengths, 1 rewrite, 1 quick win",
    free.topIssues.length === 3 && free.topStrengths.length === 2 && free.rewriteExample !== null && free.quickWin !== null);
  check("free: issues arrive highest-priority first", free.topIssues[0].summary === "C/S");
  check("free: no evidence objects leak into the free tier",
    !JSON.stringify(free).includes("\"evidence\""));
  check("free: missing-evidence questions are paid-only",
    !JSON.stringify(free).includes("missingEvidenceQuestions"));
  check("full report retains everything", analysis.missingEvidenceQuestions.length === 1 && analysis.targetRoleAnalysis !== undefined);
  check("confidence aggregates to a defined level", ["high", "medium", "low"].includes(free.confidence));
}

// ── 7. Prompt composition (§29) ──────────────────────────────────────────
console.log("\n[7] Prompt composition");
{
  const noJd = composeMethodologyContext({ seniority: "entry", language: "ar" });
  const ids = noJd.map((s) => s.id);
  check("no-JD entry Arabic context: keyword & target-role rubrics omitted",
    !ids.includes("rubric:keyword_coverage") && !ids.includes("rubric:target_role_alignment"));
  check("entry context: leadership rubric omitted", !ids.includes("rubric:leadership_ownership"));
  check("entry context: seniority section is entry's", ids.includes("seniority:entry"));
  check("Arabic-only context carries only Arabic language guidance",
    JSON.stringify(noJd.find((s) => s.id === "language:ar")?.body).includes("\"ar\"") &&
      !ids.includes("language:en"));
  const full = composeMethodologyContext({
    seniority: "manager", language: "en", targetRole: "Engineering Manager",
    jobDescription: "[jd]", industry: "technology_software",
  });
  const fullIds = full.map((s) => s.id);
  check("full context includes contextual rubrics, target role, and industry patterns",
    fullIds.includes("rubric:keyword_coverage") && fullIds.includes("target_role") && fullIds.includes("context:technology_software"));
  check("core + fact-preservation sections always present",
    fullIds.includes("core") && fullIds.includes("fact_preservation") &&
      ids.includes("core") && ids.includes("fact_preservation"));
}

// ── 8. Release gate ──────────────────────────────────────────────────────
console.log("\n[8] Release gate");
check(
  "PRIVACY_SECURITY_EXECUTION_VERIFIED is still false (A–H/K unexecuted)",
  PRIVACY_SECURITY_EXECUTION_VERIFIED === false,
);

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
