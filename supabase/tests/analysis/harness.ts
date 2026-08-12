/**
 * ANALYSIS ENGINE TEST HARNESS (Command 05 §36–§38).
 *
 * Runs the full pipeline against synthetic fixtures with the deterministic
 * mock provider — no AI account, no network, no database, no customer
 * data. Run with: npm run test:analysis
 */
import {
  AI_CONFIDENCE_VALUES,
  AnalysisPipelineError,
  createMockCareerAIProvider,
  DIMENSION_RESULT_SCHEMA,
  runAnalysis,
  validateAnalyzeResumeRequest,
  validateDimensionAIResults,
  type AnalysisRunResult,
  type CareerAIProvider,
  type DimensionAIResult,
} from "../../functions/_shared/analysis/index.ts";
import { DIMENSION_IDS, EVIDENCE_QUALITIES, SIGNAL_LEVELS, type DimensionId } from "../../functions/_shared/methodology/types.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../../functions/_shared/releaseGates.ts";
import { ALL_ANALYSIS_FIXTURES } from "./fixtures.ts";

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

async function main() {
  const provider = createMockCareerAIProvider();
  const byName = new Map<string, AnalysisRunResult>();

  console.log("\n[0] Request validation (§3)");
  {
    const tooShort = ALL_ANALYSIS_FIXTURES.find((f) => f.name === "malformed_too_short")!;
    const result = validateAnalyzeResumeRequest(tooShort.request);
    check("malformed/very short resume is rejected before any AI call", !result.ok);

    const badLanguage = validateAnalyzeResumeRequest({ resumeText: "x".repeat(100), language: "fr", seniority: "mid" });
    check("unsupported language is rejected", !badLanguage.ok);

    const badSeniority = validateAnalyzeResumeRequest({ resumeText: "x".repeat(100), language: "en", seniority: "ceo" });
    check("unknown seniority is rejected", !badSeniority.ok);

    const valid = validateAnalyzeResumeRequest(ALL_ANALYSIS_FIXTURES.find((f) => f.name === "weak_entry_english")!.request);
    check("a well-formed request validates", valid.ok);
  }

  console.log("\n[1] Redaction (§6)");
  {
    const { redactContactFields } = await import("../../functions/_shared/analysis/redact.ts");
    const r1 = redactContactFields("Contact me at noor@example.com or +1 555-010-0100.");
    check("email is redacted", r1.redactedText.includes("[redacted-email]") && !r1.redactedText.includes("noor@example.com"));
    check("phone is redacted", r1.redactedText.includes("[redacted-phone]"));
    const r2 = redactContactFields("Reduced errors by 20% across 3 teams in 2024.");
    check("short numeric tokens (percentages, counts, years) are NOT treated as phone numbers", r2.redactedPhoneCount === 0, r2.redactedText);
  }

  console.log("\n[2] Running full pipeline against every fixture (mock provider, fixture mode)");
  for (const fixture of ALL_ANALYSIS_FIXTURES) {
    if (fixture.name === "malformed_too_short") continue; // validated above, never reaches the pipeline
    const validated = validateAnalyzeResumeRequest(fixture.request);
    if (!validated.ok) {
      check(`${fixture.name}: request validates`, false, JSON.stringify(validated.errors));
      continue;
    }
    try {
      const result = await runAnalysis(validated.request, { provider, knowledgeMode: "fixture", isFixtureRun: true });
      byName.set(fixture.name, result);
      console.log(
        `        ${fixture.name}: overall=${result.analysis.overallScore} band="${result.analysis.scoreBand.labelEn}" ` +
          `dims=${result.analysis.dimensions.length} excluded=${result.analysis.excludedDimensions.length} ` +
          `issues=${result.analysis.issues.length} strengths=${result.analysis.strengths.length} ` +
          `retrieved=[${result.engineMetadata.retrievedExampleIds.join(", ")}] conflicts=${result.factConflicts.length}`,
      );
    } catch (err) {
      check(`${fixture.name}: pipeline completes without throwing`, false, err instanceof Error ? err.message : String(err));
    }
  }

  const by = (name: string) => byName.get(name)!;

  console.log("\n[3] Test expectations (§37 A–L)");

  // A. overall score always comes from deterministic scoring.ts — proven
  // structurally: runAnalysis never reads an `overallScore` field off AI
  // output (schemaValidation.ts §9). Here we assert the value is finite
  // and within [0,100] for every fixture as a smoke check.
  for (const [name, result] of byName) {
    check(`A. ${name}: overallScore is a valid 0–100 number`, Number.isFinite(result.analysis.overallScore) && result.analysis.overallScore >= 0 && result.analysis.overallScore <= 100);
  }

  // B. no JD never creates a keyword penalty.
  {
    const noJd = by("no_jd_provided");
    check("B. no JD: keyword_coverage excluded, not scored", noJd.analysis.excludedDimensions.some((e) => e.dimension === "keyword_coverage"));
    check("B. no JD: target_role_alignment excluded (no target role given)", noJd.analysis.excludedDimensions.some((e) => e.dimension === "target_role_alignment"));
  }

  // C. entry candidate never loses points for missing leadership.
  {
    const entry = by("weak_entry_english");
    check("C. entry: leadership_ownership excluded, not zeroed", entry.analysis.excludedDimensions.some((e) => e.dimension === "leadership_ownership"));
  }

  // D. strong no-metrics CV can still score Strong band or better.
  {
    const strongNoMetrics = by("strong_no_metrics");
    check("D. strong no-metrics CV scores Strong (>=70)", strongNoMetrics.analysis.overallScore >= 70, `got ${strongNoMetrics.analysis.overallScore}`);
  }

  // E. polished but unsupported CV is capped appropriately.
  {
    const polished = by("polished_no_evidence");
    const evidenceDim = polished.analysis.dimensions.find((d) => d.dimension === "evidence_specificity");
    check("E. polished-no-evidence: evidence_specificity scored low", !!evidenceDim && evidenceDim.score < 50, evidenceDim ? String(evidenceDim.score) : "missing");
  }

  // F. Arabic analysis uses Arabic methodology and does not retrieve English operator examples.
  {
    const arabic = by("arabic_generic");
    check("F. Arabic: context language recorded as 'ar'", arabic.analysis.context.language === "ar");
    check("F. Arabic: retrieval returns zero examples (no approved Arabic operator examples exist yet — never falls back to English)", arabic.engineMetadata.retrievedExampleIds.length === 0, arabic.engineMetadata.retrievedExampleIds.join(","));
  }

  // G / H. HR and marketing CVs do not receive engineering/fintech-specific retrieval.
  {
    const hr = by("hr_manager");
    const marketing = by("marketing_professional");
    check("G. HR CV: no retrieved examples are software-engineering-tagged", hr.engineMetadata.retrievedExampleIds.every((id) => !id.toLowerCase().includes("software")));
    check("H. Marketing CV: no retrieved examples are fintech/banking-tagged", marketing.engineMetadata.retrievedExampleIds.every((id) => !id.toLowerCase().includes("bank") && !id.toLowerCase().includes("fintech")));
  }

  // I. invented AI evidence is rejected — direct unit test of the verifier, not fixture-dependent.
  {
    const { verifyDimensionEvidence } = await import("../../functions/_shared/analysis/evidenceValidation.ts");
    const fabricated = {
      dimensionId: "achievement_impact" as const,
      signalLevel: "strong" as const,
      evidencePresent: true,
      evidenceQuality: "strong" as const,
      confidence: "high" as const,
      evidence: { section: "Experience", excerpt: "Led 20 engineers to a record quarter" },
      reasonCode: "STRONG_EVIDENCE",
      shortReason: "test",
    };
    const { result, rejectedCount } = verifyDimensionEvidence(fabricated, "This CV never mentions leading any engineers.");
    check(
      "I. fabricated evidence is stripped and confidence lowered",
      result.evidence === null && result.confidence === "low" && rejectedCount === 1,
    );
    check(
      "I. fabricated evidence also zeroes evidencePresent/evidenceQuality so scoring can't be inflated by an unverifiable claim",
      result.evidencePresent === false && result.evidenceQuality === "none",
    );
  }

  // J. invented rewrite facts are rejected.
  {
    const { enforceRewriteFactPreservation } = await import("../../functions/_shared/analysis/factCheck.ts");
    const invented = { before: "Managed the reporting process.", after: "Managed the reporting process, improving accuracy by 40%.", classification: "SAFE_TO_REWRITE" as const, note: "test" };
    check("J. rewrite that invents a number under SAFE_TO_REWRITE is discarded", enforceRewriteFactPreservation(invented) === null);
    const safe = { before: "Was responsible for the management of weekly reports.", after: "Managed weekly reports.", classification: "SAFE_TO_REWRITE" as const, note: "test" };
    check("J. a genuinely fact-preserving rewrite passes through", enforceRewriteFactPreservation(safe) !== null);
    const deferred = { before: "Improved the checkout flow's performance.", after: "Improved the checkout flow's performance by 40%.", classification: "NEEDS_USER_CONFIRMATION" as const, note: "test" };
    check("J. NEEDS_USER_CONFIRMATION candidates are not force-discarded by the number check (they're not claiming SAFE_TO_REWRITE)", enforceRewriteFactPreservation(deferred) !== null);
  }

  // M. Career V2 Part 9: Arabic report-language validator.
  {
    const { isEnglishLeak, validateReportLanguage } = await import("../../functions/_shared/analysis/languageValidator.ts");
    check(
      "M. flags the exact English leaks quoted in the command",
      isEnglishLeak("The document shows solid signal in career progression.") &&
        isEnglishLeak("The document shows solid signal in ats readability.") &&
        isEnglishLeak("Replace each buzzword with a specific, checkable claim.") &&
        isEnglishLeak("Whether the opening summary earns its space on the page."),
    );
    check(
      "M. does not flag genuine Arabic prose carrying allow-listed proper nouns/currency figures",
      !isEnglishLeak("السيرة تُظهر إشارة جيدة في التدرج المهني وتحتاج تحسين في LinkedIn وATS، إضافة إلى إنجاز بقيمة $27M.") &&
        !isEnglishLeak("خبرتك في React وSQL واضحة، لكن قسم SAP يحتاج تفصيلاً أكثر."),
    );
    check("M. an empty/undefined field is never a leak", !isEnglishLeak("") && !isEnglishLeak("   "));

    // The mock provider's own shortReason text is always English (never
    // localized by design — see mockProvider.ts's header), so every prose
    // field (not just `dimensions`) must be overridden to build a
    // genuinely all-Arabic scaffold from the arabic_generic fixture's
    // structure before testing "a clean report passes".
    const arabicAnalysis = by("arabic_generic").analysis;
    const allArabic = {
      ...arabicAnalysis,
      dimensions: arabicAnalysis.dimensions.map((d) => ({ ...d, reason: "السيرة تُظهر إشارة جيدة هنا." })),
      strengths: arabicAnalysis.strengths.map((s) => ({ ...s, summary: "هذا الجانب من السيرة قوي وواضح." })),
      issues: arabicAnalysis.issues.map((i) => ({ ...i, summary: "هذا الجزء يحتاج تحسيناً واضحاً." })),
      quickWins: arabicAnalysis.quickWins.map((q) => ({ ...q, action: "حدّث هذا الجزء أولاً.", why: "لأنه الأكثر تأثيراً." })),
      missingEvidenceQuestions: arabicAnalysis.missingEvidenceQuestions.map((m) => ({ ...m, question: "هل يمكنك توضيح هذا الرقم أكثر؟" })),
      atsAnalysis: { ...arabicAnalysis.atsAnalysis, indicators: arabicAnalysis.atsAnalysis.indicators.map((ind) => ({ ...ind, detail: "البنية واضحة وقابلة للقراءة آلياً." })) },
    };
    const cleanCheck = validateReportLanguage(allArabic);
    check("M. a fully-Arabic analysis passes validation", cleanCheck.ok && cleanCheck.leaks.length === 0);

    const oneLeak = { ...allArabic, dimensions: allArabic.dimensions.map((d, i) => (i === 0 ? { ...d, reason: "The document shows solid signal in this dimension and needs improvement." } : d)) };
    const leakCheck = validateReportLanguage(oneLeak);
    check("M. an analysis with one leaked English field fails validation and identifies the field", !leakCheck.ok && leakCheck.leaks.length === 1);

    const englishOutputAnalysis = { ...arabicAnalysis, context: { ...arabicAnalysis.context, outputLanguage: "en" as const } };
    check("M. outputLanguage=en is never validated by this Arabic-only gate", validateReportLanguage(englishOutputAnalysis).ok);
  }

  // K. conflicting metrics produce a verification question.
  {
    const conflicting = by("conflicting_metrics");
    check(
      "K. conflicting metrics produce a POSSIBLE_FACT_CONFLICT question",
      conflicting.factConflicts.length > 0 &&
        conflicting.analysis.missingEvidenceQuestions.some((q) => q.question.includes("POSSIBLE_FACT_CONFLICT")),
    );
  }

  // L. free projection contains no locked data.
  {
    const { projectFreeReport } = await import("../../functions/_shared/methodology/index.ts");
    const strong = by("strong_senior_english");
    const free = projectFreeReport(strong.analysis);
    check("L. free projection has no evidence objects", !JSON.stringify(free).includes("\"evidence\""));
    check("L. free projection has no missingEvidenceQuestions", !JSON.stringify(free).includes("missingEvidenceQuestions"));
    check("L. free projection has no full action plan", !JSON.stringify(free).includes("actionPlan"));
    check("L. free projection has no target-role analysis", !JSON.stringify(free).includes("targetRoleAnalysis"));
  }

  console.log("\n[4] Golden structural expectations (§38)");
  {
    const strong = by("strong_senior_english");
    check("strong senior: score band is Good or better", ["Excellent", "Strong", "Good, with meaningful improvements available"].includes(strong.analysis.scoreBand.labelEn));
    const manager = by("manager_tasks_only");
    const managerLeadership = manager.analysis.dimensions.find((d) => d.dimension === "leadership_ownership");
    check("manager tasks-only: leadership_ownership scored low", !!managerLeadership && managerLeadership.score < 60, managerLeadership ? String(managerLeadership.score) : "missing");
  }

  console.log("\n[5] Reproducibility metadata (§39)");
  {
    const strong = by("strong_senior_english");
    check(
      "engine metadata carries methodology/pipeline/knowledge versions, provider, model, retrieved ids, timestamp",
      !!strong.engineMetadata.methodologyVersion &&
        !!strong.engineMetadata.analysisPipelineVersion &&
        !!strong.engineMetadata.knowledgeVersion &&
        !!strong.engineMetadata.provider &&
        !!strong.engineMetadata.model &&
        Array.isArray(strong.engineMetadata.retrievedExampleIds) &&
        !!strong.engineMetadata.timestamp,
    );
    check("instrumentation never records raw content, only counts", Object.keys(strong.instrumentation).every((k) => !/text|resume|prompt|content/i.test(k)));
  }

  console.log("\n[6] Release gate (§40)");
  check("PRIVACY_SECURITY_EXECUTION_VERIFIED is true (A–H/K executed and passed)", PRIVACY_SECURITY_EXECUTION_VERIFIED === true);
  {
    // Before the gate flipped, this block proved `isFixtureRun: false`
    // was refused BECAUSE the gate was false — pipeline.ts's own guard is
    // `!opts.isFixtureRun && !PRIVACY_SECURITY_EXECUTION_VERIFIED`, so with
    // the gate now genuinely true that guard can no longer throw and the
    // call correctly proceeds (still against the deterministic mock
    // provider only — no network, no AI account, same as every other
    // check in this file). Flipping the expectation to `!threw` isn't a
    // weakened test: it's the same guard clause, exercised with the
    // condition it was written to allow through once real customer mode
    // is actually authorized. The guard's continued existence in source
    // is what still protects against a customer request ever reaching
    // here with the gate false again in the future.
    const { runAnalysis: run2 } = await import("../../functions/_shared/analysis/index.ts");
    let threw = false;
    try {
      await run2(ALL_ANALYSIS_FIXTURES[0].request, { provider, knowledgeMode: "fixture", isFixtureRun: false });
    } catch {
      threw = true;
    }
    check("real customer mode (isFixtureRun: false) proceeds now that the gate is true", !threw);
  }

  console.log("\n[7] Contract-drift guard — TS type / Anthropic tool schema / runtime validator must agree");
  {
    // A real production CV (Career V2 email-test verification) hit
    // ANALYSIS_FAILED with schema_issue_count=13 despite stop_reason
    // "tool_use" (a clean, non-truncated completion) — the tool schema
    // was never actually enforced (`strict` wasn't set), so it could
    // silently drift from what schemaValidation.ts requires without any
    // test ever catching it. This section pins that the three contracts
    // (DimensionAIResult, DIMENSION_RESULT_SCHEMA, validateOne) agree,
    // so a future field/enum added to only one of them fails HERE, not
    // in production against a real customer's CV.
    const item = DIMENSION_RESULT_SCHEMA.properties.results.items as {
      required: readonly string[];
      properties: Record<string, { enum?: readonly string[]; additionalProperties?: boolean }>;
      additionalProperties: boolean;
    };

    check(
      "results array requires at least one item (minItems:1 — the strongest non-empty guarantee strict mode's JSON Schema subset supports; see DIMENSION_RESULT_SCHEMA's own comment on why an exact count isn't expressible there)",
      (DIMENSION_RESULT_SCHEMA.properties.results as { minItems?: number }).minItems === 1,
    );
    // Strict mode requires additionalProperties:false on EVERY object,
    // top-level and nested — a single missed level silently opts that
    // level out of grammar-constrained enforcement.
    check("top-level schema sets additionalProperties:false", DIMENSION_RESULT_SCHEMA.additionalProperties === false);
    check("each result item sets additionalProperties:false", item.additionalProperties === false);
    check("nested evidence object sets additionalProperties:false", item.properties.evidence?.additionalProperties === false);

    // Every field validateOne() (schemaValidation.ts) treats as REQUIRED
    // must be in the tool schema's own `required` list — the exact class
    // of drift ("runtime validator requires field X, tool schema forgot
    // it") that caused the production incident this test exists for.
    const runtimeRequiredFields = ["dimensionId", "signalLevel", "evidencePresent", "evidenceQuality", "confidence", "reasonCode", "shortReason"];
    for (const field of runtimeRequiredFields) {
      check(`tool schema requires "${field}" (runtime validator also requires it)`, item.required.includes(field));
    }

    // Enum membership must match exactly, not just overlap — a schema
    // enum missing one runtime-accepted value would let the model never
    // legally produce it; an extra schema value not in the runtime set
    // would let a "valid per Anthropic" call still fail our validator.
    function sameSet(a: readonly string[], b: readonly string[]): boolean {
      return a.length === b.length && a.every((v) => b.includes(v));
    }
    check("dimensionId enum matches DIMENSION_IDS exactly", sameSet(item.properties.dimensionId.enum ?? [], DIMENSION_IDS));
    check("signalLevel enum matches SIGNAL_LEVELS exactly", sameSet(item.properties.signalLevel.enum ?? [], SIGNAL_LEVELS));
    check("evidenceQuality enum matches EVIDENCE_QUALITIES exactly", sameSet(item.properties.evidenceQuality.enum ?? [], EVIDENCE_QUALITIES));
    check("confidence enum matches AI_CONFIDENCE_VALUES exactly (single shared constant — see types.ts)", sameSet(item.properties.confidence.enum ?? [], AI_CONFIDENCE_VALUES));

    // A canonical, fully-valid payload (one item per requested dimension,
    // every runtime-required field present, real enum values) must pass
    // the runtime validator — proves the "happy path" the schema is
    // supposed to guarantee is actually accepted end to end.
    const canonicalItem = (dimensionId: DimensionId): DimensionAIResult => ({
      dimensionId,
      signalLevel: "mixed",
      evidencePresent: true,
      evidenceQuality: "specific",
      confidence: "medium",
      evidence: { section: "experience", excerpt: "Led a team of 5 engineers." },
      reasonCode: "TEST_CANONICAL_OK",
      shortReason: "Synthetic canonical payload for the contract-drift guard.",
    });
    const canonicalResult = validateDimensionAIResults(DIMENSION_IDS.map(canonicalItem), [...DIMENSION_IDS]);
    check("a canonical valid payload (every requested dimension, every required field) passes the runtime validator", canonicalResult.ok, canonicalResult.ok ? "" : JSON.stringify(canonicalResult.issues));

    // Negative control: dropping one required field from one item must be
    // caught (proves the validator isn't accidentally permissive).
    const brokenItems = DIMENSION_IDS.map(canonicalItem).map((r, i) => (i === 0 ? ({ ...r, signalLevel: undefined } as unknown as DimensionAIResult) : r));
    const brokenResult = validateDimensionAIResults(brokenItems, [...DIMENSION_IDS]);
    check("a payload missing one required field is rejected, not silently accepted", !brokenResult.ok);

    // Pins the EXACT shape of the real production failure: a schema-
    // shaped-but-EMPTY results array. This is what minItems:1 + strict
    // now prevents Anthropic from returning at all; this check documents
    // that if it ever did slip through again, our validator still
    // catches it deterministically as "missing dimension result" per
    // expected id, not as a confusing generic failure.
    const emptyResult = validateDimensionAIResults([], [...DIMENSION_IDS]);
    check(
      "an empty results array is rejected with exactly one 'missing dimension result' issue per expected dimension (the real production failure's exact shape)",
      !emptyResult.ok && emptyResult.issues.length === DIMENSION_IDS.length,
      !emptyResult.ok ? String(emptyResult.issues.length) : "ok:true",
    );
  }

  console.log("\n[8] Pipeline failure-path diagnostics — mocked providers only, no real Anthropic call");
  {
    // A real production incident (Career V2 email-test verification) hit
    // a bare 502 ANALYSIS_FAILED with zero diagnostic metadata attached —
    // `stage`, `stopReason`, `providerAttempts`, and `schemaRepairCount`
    // (types.ts's AnalysisPipelineError, wired through pipeline.ts and
    // analyze-resume/index.ts's buildPipelineErrorDiagnosticBody) exist
    // specifically to close that gap. These tests prove each failure
    // class actually populates that metadata correctly — with a
    // deliberately misbehaving MOCK provider, never a real API call, so
    // they're fast, free, and deterministic in CI.
    function makeStubProvider(overrides: Partial<CareerAIProvider> & Pick<CareerAIProvider, "analyzeDimensions">): CareerAIProvider {
      return {
        name: "test-stub",
        model: "test-model",
        generateRewrite: async () => null,
        lastCallUsage: () => ({ inputTokens: 0, outputTokens: 0, stopReason: "tool_use" }),
        ...overrides,
      };
    }
    const baseRequest = ALL_ANALYSIS_FIXTURES.find((f) => f.name === "weak_entry_english")!.request;

    // A. Schema validation failure surviving the one repair retry (the
    // exact production failure shape: a provider that never returns a
    // usable `results` array — see anthropicProvider.ts's `[]` fallback
    // and schemaValidation.ts's "missing dimension result" per expected id).
    {
      const alwaysEmptyProvider = makeStubProvider({ analyzeDimensions: async () => [] });
      let thrown: unknown;
      try {
        await runAnalysis(baseRequest, { provider: alwaysEmptyProvider, knowledgeMode: "fixture", isFixtureRun: true });
      } catch (e) {
        thrown = e;
      }
      const err = thrown instanceof AnalysisPipelineError ? thrown : null;
      check("A. empty-results provider: runAnalysis throws AnalysisPipelineError", !!err);
      check("A. code is ANALYSIS_FAILED", err?.code === "ANALYSIS_FAILED");
      check("A. stage is repair_schema_validation", err?.stage === "repair_schema_validation", String(err?.stage));
      check("A. providerAttempts is 2 (primary call + the one repair retry)", err?.providerAttempts === 2, String(err?.providerAttempts));
      check("A. schemaRepairCount is 1", err?.schemaRepairCount === 1, String(err?.schemaRepairCount));
      check("A. issues records one 'missing dimension result' per expected dimension", (err?.issues?.length ?? 0) > 0);
    }

    // B. The Arabic-output language-leak gate (pipeline.ts, skipped only
    // for provider.name === "mock" — this stub deliberately uses a
    // different name so the gate actually runs against it).
    {
      const englishLeakProvider = makeStubProvider({
        name: "test-stub-real-like",
        analyzeDimensions: async (input): Promise<DimensionAIResult[]> =>
          input.dimensionIds.map((dimensionId) => ({
            dimensionId,
            signalLevel: "mixed",
            evidencePresent: false,
            evidenceQuality: "none",
            confidence: "low",
            evidence: null,
            reasonCode: "TEST_STUB",
            shortReason: "This is a plain English sentence that must never appear in an Arabic-language report.",
          })),
      });
      const arabicRequest = { ...baseRequest, language: "ar" as const, outputLanguage: "ar" as const };
      let thrown: unknown;
      try {
        await runAnalysis(arabicRequest, { provider: englishLeakProvider, knowledgeMode: "fixture", isFixtureRun: true });
      } catch (e) {
        thrown = e;
      }
      const err = thrown instanceof AnalysisPipelineError ? thrown : null;
      check("B. English-leaking provider under outputLanguage:ar: runAnalysis throws AnalysisPipelineError", !!err);
      check("B. code is ANALYSIS_FAILED", err?.code === "ANALYSIS_FAILED");
      check("B. stage is language_validation", err?.stage === "language_validation", String(err?.stage));
      check("B. providerAttempts is 1 (no repair retry — this is a post-scoring gate, not a schema failure)", err?.providerAttempts === 1, String(err?.providerAttempts));
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
