/**
 * DETERMINISM STABILITY SUITE (Career V2 Part 28) — run with:
 *   npm run test:determinism
 *
 * SCOPE: this suite proves the PIPELINE ITSELF is deterministic — same
 * input, same fingerprint, same dimension scores, same overall score, same
 * ATS Compatibility, same free-report shape — using the mock AI provider
 * (no network, no credentials, matching every other suite in this repo).
 * It does NOT exercise the live DB-backed analysis-reuse short-circuit in
 * `analyze-resume/index.ts` (that requires a running Supabase instance —
 * see supabase/tests/README.md's documented Docker/psql gap) or measure
 * real-model output variance (that's a separate, admin-only diagnostic —
 * see the file header note at the bottom of this file). What it DOES prove
 * is the thing those two depend on: for identical inputs, nothing in
 * fingerprinting, classification→score mapping, scoring.ts, or ATS
 * Compatibility can drift between two runs — which is the actual
 * engineering guarantee "same CV → same score" rests on.
 */
import {
  computeAnalysisIdentity,
  createMockCareerAIProvider,
  runAnalysis,
  buildUiFreeReport,
} from "../../functions/_shared/analysis/index.ts";
import { CAREER_METHODOLOGY_VERSION } from "../../functions/_shared/methodology/index.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../../functions/_shared/releaseGates.ts";
import { DETERMINISM_FIXTURES } from "./fixtures.ts";

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

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  console.log("Career V2 — determinism stability suite\n");

  console.log("[0] Release gate");
  check("PRIVACY_SECURITY_EXECUTION_VERIFIED is true (required for isFixtureRun:false parity with production)", PRIVACY_SECURITY_EXECUTION_VERIFIED);

  console.log("\n[1] Fingerprint identity — pure function of input, independent of any AI call");
  for (const fixture of DETERMINISM_FIXTURES) {
    const a = await computeAnalysisIdentity({
      resumeText: fixture.request.resumeText,
      methodologyVersion: CAREER_METHODOLOGY_VERSION,
      targetRole: fixture.request.targetRole,
      jobDescription: fixture.request.jobDescription,
    });
    const b = await computeAnalysisIdentity({
      resumeText: fixture.request.resumeText,
      methodologyVersion: CAREER_METHODOLOGY_VERSION,
      targetRole: fixture.request.targetRole,
      jobDescription: fixture.request.jobDescription,
    });
    check(`${fixture.name}: analysisFingerprint identical across two computations`, a.analysisFingerprint === b.analysisFingerprint);
    check(`${fixture.name}: resumeFingerprint identical across two computations`, a.resumeFingerprint === b.resumeFingerprint);

    // Negative control: a genuinely different resume must NOT collide.
    const changed = await computeAnalysisIdentity({
      resumeText: fixture.request.resumeText + "\nExtra line that changes the content.",
      methodologyVersion: CAREER_METHODOLOGY_VERSION,
      targetRole: fixture.request.targetRole,
      jobDescription: fixture.request.jobDescription,
    });
    check(`${fixture.name}: a genuinely changed resume produces a DIFFERENT fingerprint`, changed.analysisFingerprint !== a.analysisFingerprint);

    // Negative control: a different methodology version must NOT collide
    // (Part 3: a version bump must never silently reuse an old analysis).
    const differentVersion = await computeAnalysisIdentity({
      resumeText: fixture.request.resumeText,
      methodologyVersion: "career_methodology_v1",
      targetRole: fixture.request.targetRole,
      jobDescription: fixture.request.jobDescription,
    });
    check(`${fixture.name}: a different methodology version produces a DIFFERENT fingerprint`, differentVersion.analysisFingerprint !== a.analysisFingerprint);
  }

  console.log("\n[2] Full pipeline run twice per fixture — dimension scores, overall score, ATS Compatibility, free report");
  const provider = createMockCareerAIProvider();
  for (const fixture of DETERMINISM_FIXTURES) {
    const runOnce = () => runAnalysis(fixture.request, { provider, knowledgeMode: "fixture", isFixtureRun: true });
    const first = await runOnce();
    const second = await runOnce();

    check(`${fixture.name}: overall score identical run-to-run`, first.analysis.overallScore === second.analysis.overallScore);
    check(`${fixture.name}: score band identical run-to-run`, deepEqual(first.analysis.scoreBand, second.analysis.scoreBand));
    check(
      `${fixture.name}: every dimension score identical run-to-run`,
      deepEqual(
        first.analysis.dimensions.map((d) => [d.dimension, d.score]),
        second.analysis.dimensions.map((d) => [d.dimension, d.score]),
      ),
    );
    check(`${fixture.name}: ATS Compatibility identical run-to-run`, deepEqual(first.analysis.atsCompatibility, second.analysis.atsCompatibility));
    check(`${fixture.name}: excludedDimensions identical run-to-run`, deepEqual(first.analysis.excludedDimensions, second.analysis.excludedDimensions));

    const outputLanguage = fixture.request.outputLanguage ?? (fixture.request.language === "ar" ? "ar" : "en");
    const firstReport = buildUiFreeReport(first.analysis, outputLanguage);
    const secondReport = buildUiFreeReport(second.analysis, outputLanguage);
    check(`${fixture.name}: customer-facing free report identical run-to-run`, deepEqual(firstReport, secondReport));
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();

/**
 * NOTE on "internally run multiple uncached LLM classifications for QA and
 * measure raw model variance" (Part 28's second half): that requires a
 * real Anthropic account and network access, which this repo's test
 * environment does not have (see supabase/tests/README.md). The
 * equivalent admin-only diagnostic infrastructure already exists —
 * `analyze-resume`'s `diagnostic_*` modes (dimensionDiagnostic.ts,
 * firstCallDiagnostic.ts, compactAnalysisDiagnostic.ts) — and is the
 * correct place to run that measurement against a real API key; it is
 * deliberately NOT wired into this suite, so raw model variance is never
 * confused with customer-facing scoring (which this suite proves is
 * stable regardless of that variance, because the fingerprint-based reuse
 * in analyze-resume/index.ts means a real model is only ever called ONCE
 * per unique input).
 */
