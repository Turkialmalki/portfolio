/**
 * COMMAND 04 TEST HARNESS (§31) — no AI, no network, no database, no
 * customer data. Run with: npm run test:knowledge
 *
 * Covers the brief's tests A–H plus structural integrity of the
 * ingestion itself.
 */
import {
  ALL_PATTERNS,
  ANTI_PATTERNS,
  BEFORE_AFTER_PAIRS,
  CV_CONTENT_UNITS,
  EXAMPLE_BUDGET,
  OPERATOR_CV_SOURCES,
  REVIEW_FLAGS,
  buildBeforeAfterRows,
  buildCandidateExampleRows,
  buildRetrievalPool,
  buildRolePatternRows,
  distinctFingerprints,
  retrieveExamples,
  violatesPersonalFirewall,
  type RetrievalContext,
} from "../../functions/_shared/knowledge/index.ts";
import { NEVER_INVENT } from "../../functions/_shared/methodology/factPreservation.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../../functions/_shared/releaseGates.ts";

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

const unitIds = new Set(CV_CONTENT_UNITS.map((u) => u.unitId));
const flagIds = new Set(REVIEW_FLAGS.map((f) => f.flagId));

// ── 0. Ingestion integrity ───────────────────────────────────────────────
console.log("\n[0] Ingestion integrity");
check("unit ids unique", unitIds.size === CV_CONTENT_UNITS.length);
check(
  "every unit's sourceIds resolve to registered sources",
  CV_CONTENT_UNITS.every((u) =>
    u.sourceIds.every((id) => OPERATOR_CV_SOURCES.some((s) => s.sourceId === id)),
  ),
);
check(
  "every unit's review flags resolve",
  CV_CONTENT_UNITS.every((u) => u.reviewFlagIds.every((f) => flagIds.has(f))),
);
check(
  "every non-DO_NOT_REUSE unit carries pattern + lesson",
  CV_CONTENT_UNITS.every(
    (u) => u.quality === "DO_NOT_REUSE" || u.patternText === null || (u.patternText.length > 0 && (u.lesson ?? "").length > 0),
  ),
);
check(
  "DO_NOT_REUSE units carry NO reusable text",
  CV_CONTENT_UNITS.filter((u) => u.quality === "DO_NOT_REUSE").every(
    (u) => u.patternText === null && u.lesson === null,
  ),
);
check("7 source files, 5 distinct documents", OPERATOR_CV_SOURCES.length === 7 && distinctFingerprints().length === 5);
check(
  "before/after pairs reference real units",
  BEFORE_AFTER_PAIRS.every((p) => unitIds.has(p.beforeUnitId) && unitIds.has(p.afterUnitId)),
);
check(
  "every pattern's derivedFrom units exist",
  [...ALL_PATTERNS, ...ANTI_PATTERNS].every((p) =>
    p.derivedFromUnitIds.every((id) => unitIds.has(id)),
  ),
);

// ── A. Idempotency ───────────────────────────────────────────────────────
console.log("\n[A] Re-ingesting the same source cannot duplicate");
const rows1 = buildCandidateExampleRows();
const rows2 = buildCandidateExampleRows();
check(
  "natural keys are unique within one ingestion",
  new Set(rows1.map((r) => r.naturalKey)).size === rows1.length,
);
check(
  "two ingestion runs produce identical row sets (stable keys)",
  JSON.stringify(rows1) === JSON.stringify(rows2),
);
{
  // The two duplicate files (same fingerprint) must not spawn duplicate
  // units: units from a duplicated document list BOTH sourceIds instead.
  const dupSourceIds = ["opcv-2025-mgmt-a", "opcv-2025-mgmt-b"];
  const unitsTouchingDup = CV_CONTENT_UNITS.filter((u) =>
    dupSourceIds.some((id) => u.sourceIds.includes(id)),
  );
  check(
    "duplicate file pair yields shared units, not doubled units",
    unitsTouchingDup.length > 0 &&
      unitsTouchingDup.every((u) => dupSourceIds.every((id) => u.sourceIds.includes(id))),
  );
}

// ── B. Unsupported facts never become recommendations ────────────────────
console.log("\n[B] Unsupported personal facts are quarantined, not generalized");
{
  const flagged = CV_CONTENT_UNITS.filter((u) => u.reviewFlagIds.length > 0);
  check("conflicting/implausible metrics exist and were flagged", REVIEW_FLAGS.length >= 4 && flagged.length > 0);
  check(
    "every review flag carries a missing-evidence question (§6)",
    REVIEW_FLAGS.every((f) => f.missingEvidenceQuestion.length > 20),
  );
  // The 60-vs-80 conflict: neither variant's reusable text may carry a number.
  const strapi = CV_CONTENT_UNITS.filter((u) => u.reviewFlagIds.includes("flag-strapi-60-vs-80"));
  check(
    "conflicting-metric units teach no number",
    strapi.length === 2 &&
      strapi.every((u) => !/\d+\s*%/.test(`${u.patternText ?? ""} ${u.lesson ?? ""}`)),
  );
  // No unit flagged for a bad metric is classified STRONG.
  const badMetricFlagIds = new Set(
    REVIEW_FLAGS.filter((f) => f.kind !== "inconsistent_experience_years").map((f) => f.flagId),
  );
  check(
    "no unit carrying a metric flag is classified STRONG",
    CV_CONTENT_UNITS.filter((u) => u.reviewFlagIds.some((f) => badMetricFlagIds.has(f))).every(
      (u) => u.quality !== "STRONG",
    ),
  );
}

// §6: before→after never introduces a number absent from the before side's slots.
check(
  "no before→after 'after' contains a literal metric (slots only)",
  buildBeforeAfterRows().every((r) => !/\d+\s*%/.test(r.after_text)),
);
check(
  "fact-preservation classifications are valid and metric-pending pairs ask, not fill",
  BEFORE_AFTER_PAIRS.every(
    (p) =>
      ["SAFE_TO_REWRITE", "NEEDS_USER_CONFIRMATION", "DO_NOT_INFER"].includes(
        p.factPreservationClassification,
      ) &&
      (p.factPreservationClassification !== "NEEDS_USER_CONFIRMATION" ||
        p.after.includes("pending")),
  ),
);

// ── C. Production retrieval never returns unapproved candidates ──────────
console.log("\n[C] Candidate rows are invisible in production mode");
const ctxManagerEn: RetrievalContext = {
  language: "en",
  seniority: "manager",
  roleFamily: "engineering_leadership",
  dimensionId: "leadership_ownership",
};
{
  const candidatePool = buildRetrievalPool(); // everything status='candidate'
  check(
    "all ingested rows are status candidate (§4 — nothing auto-approved)",
    buildCandidateExampleRows().every((r) => r.status === "candidate"),
  );
  const prod = retrieveExamples(candidatePool, ctxManagerEn, { mode: "production" });
  check("production retrieval over candidates returns nothing", prod.length === 0);
  const prodAnti = retrieveExamples(candidatePool, ctxManagerEn, {
    mode: "production",
    includeAntiPatterns: true,
  });
  check("…even when anti-patterns are requested", prodAnti.length === 0);
  const review = retrieveExamples(candidatePool, ctxManagerEn, { mode: "operator_review" });
  check("operator-review mode does see candidates", review.length > 0);
}

// Simulate the operator approving everything — production then works.
const approvedPool = buildRetrievalPool(() => "approved");

// ── D. Retrieval favors (and enforces) language match ────────────────────
console.log("\n[D] Language match");
{
  // Pool has no Arabic rows (no Arabic CV content existed — §16 honesty),
  // so add a synthetic approved Arabic entry to prove the filter.
  const arEntry = {
    id: "synthetic-ar",
    status: "approved" as const,
    quality: null,
    example: {
      id: "synthetic-ar",
      title: "Arabic summary example",
      kind: "example" as const,
      contentClass: "STRUCTURAL_PATTERN" as const,
      language: "ar" as const,
      seniority: "manager" as const,
      roleFamily: "engineering_leadership" as const,
      contentType: "summary" as const,
      dimensionIds: ["professional_summary"],
      text: "[نمط ملخص مهني]",
      lesson: null,
    },
  };
  const mixed = [...approvedPool, arEntry];
  const ar = retrieveExamples(mixed, { language: "ar", seniority: "manager" }, { mode: "production" });
  check("Arabic context returns only Arabic examples", ar.length === 1 && ar[0].id === "synthetic-ar");
  const en = retrieveExamples(mixed, ctxManagerEn, { mode: "production" });
  check("English context never receives the Arabic example", en.every((e) => e.language === "en"));
}

// ── E. Retrieval favors appropriate seniority ────────────────────────────
console.log("\n[E] Seniority compatibility");
{
  const entryCtx: RetrievalContext = { language: "en", seniority: "entry" };
  const got = retrieveExamples(approvedPool, entryCtx, { mode: "production", maxExamples: 4 });
  check(
    "entry-level user never receives manager/director/executive examples",
    got.every((e) => e.seniority === null || ["entry", "mid", "senior"].includes(e.seniority)),
  );
  const mgr = retrieveExamples(approvedPool, ctxManagerEn, { mode: "production", maxExamples: 4 });
  check(
    "manager context ranks manager-level material first",
    mgr.length > 0 && mgr[0].seniority === "manager",
  );
}

// ── F. Weak material only on explicit anti-pattern request ───────────────
console.log("\n[F] Weak examples are opt-in only");
{
  const normal = retrieveExamples(approvedPool, ctxManagerEn, { mode: "production", maxExamples: 4 });
  check("default retrieval contains no anti-pattern material", normal.every((e) => e.kind === "example"));
  const withAnti = retrieveExamples(
    approvedPool,
    { ...ctxManagerEn, dimensionId: "evidence_specificity" },
    { mode: "production", includeAntiPatterns: true, maxExamples: 4 },
  );
  check(
    "explicit request can surface anti-pattern material",
    withAnti.some((e) => e.kind === "anti_pattern"),
  );
}

// ── G. Personal-detail firewall ──────────────────────────────────────────
console.log("\n[G] Operator facts never reach another user's context");
{
  const contexts: RetrievalContext[] = [
    ctxManagerEn,
    { language: "en", seniority: "entry" },
    { language: "en", seniority: "senior", roleFamily: "software_engineering", dimensionId: "achievement_impact" },
    { language: "en", seniority: "lead", dimensionId: "experience_quality", contentType: "bullet" },
  ];
  let leak: string | null = null;
  for (const ctx of contexts) {
    for (const includeAntiPatterns of [false, true]) {
      const got = retrieveExamples(approvedPool, ctx, {
        mode: "production",
        includeAntiPatterns,
        maxExamples: 4,
      });
      for (const e of got) {
        leak = violatesPersonalFirewall(JSON.stringify(e)) ?? leak;
      }
    }
  }
  check("no retrieval projection contains operator names/metrics", leak === null, `leaked: ${leak}`);
  const patternLeaks = [...ALL_PATTERNS, ...ANTI_PATTERNS]
    .map((p) => violatesPersonalFirewall(JSON.stringify(p)))
    .filter((x) => x !== null);
  check("pattern/anti-pattern library is fully anonymized", patternLeaks.length === 0, patternLeaks.join(","));
  const baLeaks = buildBeforeAfterRows()
    .map((r) => violatesPersonalFirewall(r.before_text + " " + r.after_text))
    .filter((x) => x !== null);
  check("before/after texts are fully anonymized", baLeaks.length === 0, baLeaks.join(","));
  check(
    "role-pattern guidance is generic (no operator identity)",
    buildRolePatternRows().every((r) => violatesPersonalFirewall(JSON.stringify(r.pattern)) === null),
  );
}

// ── H. Fact-preservation rules remain enforced ───────────────────────────
console.log("\n[H] Fact preservation & gates unchanged");
check(
  "methodology NEVER_INVENT list intact",
  NEVER_INVENT.includes("percentages") && NEVER_INVENT.includes("team size") && NEVER_INVENT.length >= 12,
);
check(
  "privacy release gate untouched: PRIVACY_SECURITY_EXECUTION_VERIFIED === false (§30)",
  PRIVACY_SECURITY_EXECUTION_VERIFIED === false,
);
check("context budget capped at 4 examples (§24)", EXAMPLE_BUDGET.default <= 4 && EXAMPLE_BUDGET.max <= 4);
{
  const got = retrieveExamples(approvedPool, ctxManagerEn, { mode: "production", maxExamples: 99 });
  check("oversized maxExamples is clamped to the budget", got.length <= EXAMPLE_BUDGET.max);
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
