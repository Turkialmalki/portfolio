# Career Analysis Engine — `career_analysis_pipeline_v1` (Command 05)

This is the machinery that turns a CV plus context into a `CareerAnalysis`
by running `career_methodology_v1` ([docs/career-methodology.md](career-methodology.md))
and the operator-CV knowledge base ([docs/career-knowledge-base.md](career-knowledge-base.md))
through an AI provider — deterministically supervised at every step. Not
"send the CV to an LLM and ask it to review it": the methodology and the
deterministic scoring engine stay in control; the AI's job is bounded to
per-dimension evidence, reasoning, and one rewrite candidate.

**Source of truth:** the TypeScript modules in
[supabase/functions/_shared/analysis/](../supabase/functions/_shared/analysis/).
The Edge Function
([supabase/functions/analyze-resume/](../supabase/functions/analyze-resume/))
is a thin, gated wrapper around `runAnalysis()` from that directory —
all the real logic lives in `_shared/analysis` so it is testable under
Node with no Docker, no network, and no AI credentials
(`npm run test:analysis`).

## Privacy gate status — READ THIS FIRST

```
PRIVACY_SECURITY_EXECUTION_VERIFIED = false
```

([releaseGates.ts](../supabase/functions/_shared/releaseGates.ts)) — the
privacy/RLS test suite A–H/K has never been *executed* against a real
stack. This command therefore ships an engine that **refuses real
customer analysis twice, independently**:

1. `runAnalysis()` itself throws unless the caller passes
   `isFixtureRun: true` — refusing to run in "real" mode while the gate
   is false, regardless of who calls it (`pipeline.ts`).
2. `analyze-resume`'s Edge Function is authenticated only by an
   `x-admin-key` header checked against `ADMIN_API_KEY` (same pattern as
   `verify-payment`), and rejects any request body that doesn't set
   `mode: "fixture_test"`. There is no browser-reachable, user-session
   path into this function — none was built, on purpose (§42: no public
   UI in this command).

Both checks would have to be independently removed to reach real
customer data through this code, and neither removal is a side effect of
anything else in this command.

## Pipeline

```
CV TEXT + USER CONTEXT
        │
        ▼
  §3 request validation           (validateRequest.ts)
        │
        ▼
  §5 deterministic preprocessing  (preprocess.ts)
        │
        ▼
  §6 contact-field redaction      (redact.ts)
        │
        ▼
  §7 structure extraction         (structure.ts)          → NormalizedResume
        │
        ▼
  §14–17 retrieval                (retrievalContext.ts)   → 0–4 approved examples
        │
        ▼
  §8 Stage B+C: ONE AI call       (mockProvider / real adapter, via provider.ts)
     — every dimension `scoring.ts` will weight for this context,
       universal + contextual in the same call (see rationale in
       pipeline.ts's doc comment)
        │
        ▼
  §29 schema validation           (schemaValidation.ts) — one controlled repair retry
        │
        ▼
  §11 evidence verification       (evidenceValidation.ts)
        │
        ▼
  §9/§27–28 deterministic scoring (methodology/scoring.ts) → overallScore, band, confidence
        │
        ▼
  §13 metric-conflict scan        (factCheck.ts)
        │
        ▼
  §20–26 findings                 (findings.ts) — issues, strengths, quick wins,
                                     missing-evidence questions, ATS indicators,
                                     action plan — all rule-based, not a second AI call
        │
        ▼
  §8 Stage D: ONE AI call         generateRewrite() → §12 fact-preservation check
        │
        ▼
  CareerAnalysis  ──────────────────────────────────────────────────────
        │                                              │
        ▼                                              ▼
  §27 projectFreeReport()                    §28 projectFullReport()
  (methodology/projection.ts — unchanged from Command 03)
```

**Exactly two AI calls per analysis**, by design — see the doc comment
at the top of [pipeline.ts](../supabase/functions/_shared/analysis/pipeline.ts)
for the full reasoning. Strengths, issues, quick wins, the action plan,
and ATS indicators are computed from the already-validated dimension
results by `findings.ts`, not asked of the model a second time.

## Input schema (§3)

`AnalyzeResumeRequest` ([types.ts](../supabase/functions/_shared/analysis/types.ts)):

```ts
{
  resumeText: string;        // 30–20,000 chars
  language: "ar" | "en" | "bilingual";
  seniority: SeniorityLevel; // entry…executive
  targetRole?: string;       // ≤200 chars
  roleFamily?: string;       // ≤100 chars
  industry?: string;         // ≤100 chars
  jobDescription?: string;   // ≤10,000 chars
}
```

`validateAnalyzeResumeRequest()` rejects anything malformed **before**
any AI call — proven by test harness §0 (a too-short resume never
reaches `runAnalysis`).

## CV parsing boundary (§4)

This command does **not** parse PDF/DOCX. The boundary is:

```
UPLOAD → PARSER (not built) → NORMALIZED RESUME TEXT → ANALYSIS ENGINE (this command)
```

`resumeText` is assumed to already be clean parsed text. Building the
upload/parser step is explicitly out of scope here (§4, §42).

## Preprocessing & redaction (§5–§6)

`preprocessResumeText()` normalizes line endings, bullet glyphs, and
incidental whitespace — it never rewrites wording, dates, names, metrics,
or technologies.

`redactContactFields()` strips emails and phone-shaped digit runs
(≥7 digits, so years/percentages/team sizes are never touched — tested)
before anything reaches an AI provider. Full street-address redaction is
a documented gap: no reliable bilingual (EN+AR) pattern exists that
wouldn't also damage legitimate content (a city name inside a project
description), so it's left unredacted rather than risk exactly the
damage §6 warns against. Professional links (LinkedIn, GitHub, portfolio
URLs) are deliberately preserved — they can be legitimate ATS/positioning
evidence.

## Structure extraction (§7)

`extractNormalizedResume()` is **deterministic only** — a bilingual
(EN+AR) heading vocabulary splits the text into sections; a
date-range/heuristic parser splits the experience section into entries
and bullets. It never invents a missing section: no detected "Skills"
heading means `skills: []`. Where no headings are found at all,
`structureUncertain: true` is set so downstream stages (and a future
report) can say so honestly. AI-assisted structure extraction is
documented as future work (§7 allows it), not built here.

## AI provider abstraction (§30–§33)

`CareerAIProvider` ([types.ts](../supabase/functions/_shared/analysis/types.ts))
is two methods: `analyzeDimensions()` and `generateRewrite()`. Neither
the methodology nor the pipeline knows or cares which model is behind it.

- **Mock provider** ([mockProvider.ts](../supabase/functions/_shared/analysis/mockProvider.ts)) —
  built first, per §32. Deterministic heuristics over the
  `NormalizedResume` (weak/strong verb ratios, buzzword density, numeric
  and "specific claim" evidence, duplicate bullets, skill demonstration)
  produce the same scores for the same resume every time. It exists to
  exercise the pipeline faithfully, not to be a good reviewer.
- **Real provider** — **NOT CONFIGURED.** `resolveProvider()`
  ([provider.ts](../supabase/functions/_shared/analysis/provider.ts))
  checks for `AI_PROVIDER_API_KEY` and falls back to the mock either way
  today, because no real adapter exists yet (§33: "do not invent
  credentials"). Wiring a real adapter is a deliberate follow-up that
  implements `CareerAIProvider` against a real SDK, entirely inside an
  Edge Function — never in browser-reachable code (§31).

## §9 hard rule: the LLM never produces an overall score

Structurally enforced, not just documented: `DimensionAIResult`
(the *only* shape a provider may return) has no `overallScore` field.
`schemaValidation.ts` reads exactly `dimensionId`, `score`, `confidence`,
`evidence`, `reason`, `recommendations` off raw AI JSON — any
`overallScore` key a misbehaving provider includes is simply never read.
`CareerAnalysis.overallScore` has exactly one producer:
`scoring.ts`'s `computeOverallScore()`.

## Evidence verification (§11)

`verifyDimensionEvidence()` normalizes both the quoted evidence and the
source text (lowercase, Unicode NFKC, punctuation stripped, whitespace
collapsed) and requires the evidence to be a substring of the source. A
dimension result that loses **all** its evidence to this check has its
confidence forced to `"low"` and its `reason` annotated — the score is
left as-is (an imprecise quote doesn't necessarily mean the score itself
was ungrounded), but a low-confidence, evidence-stripped finding reads
very differently in a report. Verified with a fabricated-evidence unit
test (harness §I).

## Fact preservation (§12) and metric-conflict protection (§13)

`enforceRewriteFactPreservation()` discards any `SAFE_TO_REWRITE`
candidate whose "after" text introduces a numeric token absent from
"before" — a genuinely fact-preserving rewrite never needs a new number.
`NEEDS_USER_CONFIRMATION`/`DO_NOT_INFER` candidates pass through
unchanged, since their entire point is deferring strengthening to the
user rather than inventing it (tested: harness §J, all three cases).

`detectMetricConflicts()` is a **v1, percentage-focused heuristic**: it
finds the same right-anchored 4-word context (the words immediately
before a percentage) reported with two different values and surfaces a
`POSSIBLE_FACT_CONFLICT` missing-evidence question rather than picking
one (tested: harness §K). Broadening it to currency amounts, headcounts,
and other metric shapes is documented follow-up — a naive regex there
starts false-positiving on dates and page numbers.

## Retrieval integration (§14–§17)

`buildAndRunRetrieval()` wires in Command 04's deterministic ranker
(`retrieveExamples`) unchanged, plus a light keyword-based role-family
detector against `ROLE_PATTERNS`' hint lists. Two behaviors fall out of
the existing ranker for free:

- **Arabic (§1, §16):** `retrieveExamples` hard-filters by language. The
  knowledge base currently has **zero** approved Arabic operator
  examples (Command 04 finding), so an Arabic request retrieves zero
  examples today — never English examples translated on the fly. This is
  verified structurally (harness §F), not mocked.
- **Role/industry fallback (§16):** when no role family is confidently
  detected, `context.roleFamily` is simply left `undefined`; the ranker
  still scores role-agnostic examples reasonably without ever forcing an
  HR or marketing CV into software-engineering material (harness §G/§H).

## Knowledge approval safety (§0)

`KnowledgeMode` is `"approved" | "fixture"` — there is no `"all"`.
`retrievalOptionsFor()` resolves **both** modes to
`retrieveExamples`'s `"production"` filter (approved-only); the modes
differ only in where the retrieval *pool* comes from (a future live DB
query vs. the in-repo `buildRetrievalPool()`), never in what status is
allowed through. Practically, this means retrieval returns **zero**
real operator examples today, because none of the 72 candidate rows have
been promoted to `approved` yet — expected and correct, not a bug.

## Schema validation (§29)

`validateDimensionAIResults()` checks every field's type/range, rejects
unknown or duplicate `dimensionId`s, and requires every *expected*
dimension (from `planWeights()`) to be present. On failure, the pipeline
retries the provider call **exactly once** (`DEFAULT_TIMEOUTS.maxSchemaRepairRetries = 1`)
before failing with `ANALYSIS_FAILED` — never an infinite loop.

## Findings generation (§20–§26)

All rule-based, in [findings.ts](../supabase/functions/_shared/analysis/findings.ts):

- **Issues** — one per dimension scoring below 70, severity from score
  band, effort from a static per-dimension map, ranked by
  `priority.ts` (unchanged from Command 03).
- **Strengths** — minimum 2, drawn from the highest-scoring
  evidence-backed dimensions, phrased proportionally to the actual score
  (a weak CV gets modest, precise strengths — never manufactured praise).
- **Quick wins** — the top 3 "quick"-effort issues.
- **Missing-evidence questions** — from evidence-thin `achievement_impact`
  / `evidence_specificity` results, plus one per detected metric
  conflict.
- **ATS analysis** — indicators only, always carrying the
  never-pass/fail disclaimer (§20).

## Free vs paid projection (§27–§28)

Unchanged from Command 03: `projectFreeReport()` /
`projectFullReport()` in `methodology/projection.ts`. Verified again
here end-to-end against a real pipeline run (harness §L): no evidence
objects, no `missingEvidenceQuestions`, no `actionPlan`, no
`targetRoleAnalysis` leak into the free tier.

## Reproducibility (§39)

Every run's `AnalysisEngineMetadata` carries `methodologyVersion`
(`career_methodology_v1`), `analysisPipelineVersion`
(`career_analysis_pipeline_v1`), `knowledgeVersion`
(`operator_cv_ingestion_v1`), `provider`, `model`,
`retrievedExampleIds`, and a `timestamp`. LLM prose is not expected to be
deterministic; which system produced a given report always is knowable.

## Cost / performance instrumentation (§34) and timeouts (§35)

`AnalysisInstrumentation` records only counts and identifiers —
`inputCharCount`, `examplesRetrieved`, `aiCallCount`, `retryCount`,
`durationMs`, `provider`, `model` — never raw CV content, prompts, or AI
responses (harness asserts no content-shaped keys). `DEFAULT_TIMEOUTS`
bounds each provider call (20s), the schema-repair retry (1), and the
whole analysis (45s); a timeout surfaces as the public `ANALYSIS_TIMEOUT`
code, never a stack trace.

## Test fixtures (§36–§38)

[supabase/tests/analysis/](../supabase/tests/analysis/) — 12 fictional
resumes (weak entry, strong senior with JD, manager tasks-only, generic
Arabic, strong-no-metrics, partial JD match, no-JD, malformed/too-short,
conflicting metrics, polished-no-evidence, HR manager, marketing
professional) run through the **full** pipeline with the mock provider.
`npm run test:analysis` — 42 checks, all green as of this command,
covering request validation, redaction, all twelve §37 test
expectations (A–L), two golden structural checks (§38), reproducibility
metadata, and the release gate. `npm run test:methodology` (42 checks)
and `npm run test:knowledge` (35 checks) remain green — this command
changed neither module.

## What is ready next

- A real `CareerAIProvider` adapter (Command 05 leaves this
  intentionally unimplemented — §33).
- CV upload + PDF/DOCX parsing feeding `resumeText` (§4 boundary).
- Promoting operator-CV knowledge rows from `candidate` to `approved` so
  retrieval actually surfaces examples in production.
- Running the privacy/RLS suite A–H/K against a real stack and recording
  it in docs/career-privacy.md — the only thing that can ever flip
  `PRIVACY_SECURITY_EXECUTION_VERIFIED` to `true`.
- Broadening `detectMetricConflicts()` beyond percentages, and address
  redaction, once a safer pattern is designed.
- The public Career UI (§42) — explicitly not this command's job.
