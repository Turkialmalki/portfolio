# Career Review Methodology — `career_methodology_v1` (Command 03)

The Career product is **not** "upload your CV and an AI gives advice."
It is a structured review engine: **my review methodology + explicit
scoring rules + approved examples + role/seniority context**, with the
AI as the execution engine for reasoning and writing. The methodology is
the product; this document makes any score auditable.

**Source of truth:** the TypeScript modules in
[supabase/functions/_shared/methodology/](../supabase/functions/_shared/methodology/).
Everything below describes what that code does. The knowledge-schema
seed ([20260812300001](../supabase/migrations/20260812300001_career_methodology_v1_knowledge.sql))
is **generated** from those modules by `npm run generate:methodology-seed`
— never edit the SQL by hand.

## Core principle

A score is never "the AI thinks this is 73." Every score =
**defined criteria + observable evidence + weighting + explicit score
band**, and the system can always answer *why* a CV received its score:

- the LLM scores each **dimension** against its rubric and must quote
  evidence (`section` / `role` / exact `text`) for every finding;
- the **overall score is computed by code** ([scoring.ts](../supabase/functions/_shared/methodology/scoring.ts)),
  never by the LLM — same inputs, same output, explainable line by line.

## Versioning

`CAREER_METHODOLOGY_VERSION = "career_methodology_v1"`
([version.ts](../supabase/functions/_shared/methodology/version.ts)).
Every future analysis records `methodology_version`, so scoring can
improve later without silently changing old reports. Any change to
weights, bands, caps, or rubric semantics requires a new version string
and a new knowledge seed carrying it.

## What we score: 15 dimensions and their weights

Defined in [dimensions.ts](../supabase/functions/_shared/methodology/dimensions.ts).
Weights sum to exactly 100 (harness-asserted) and are deliberately unequal:

| Dimension | Weight | Why |
|---|---:|---|
| Experience Quality | 12 | The section a hiring decision actually leans on |
| Achievement / Impact | 12 | "What changed because of this person" is the product's core question |
| Evidence / Specificity | 10 | The anti-hollow-prose dimension; polished emptiness must not win |
| Positioning | 8 | One coherent identity, or the reader gives up |
| ATS Readability | 7 | Real risk, but indicators only (see below) |
| Target Role Alignment | 7 | Contextual — only when a target role is given |
| Professional Summary | 6 | First read; heavily gamed by boilerplate |
| Career Progression | 6 | Contextual growth story, no moral judgments |
| Leadership / Ownership | 6 | Seniority-adjusted (below) |
| Skills Relevance | 6 | Demonstrated beats enumerated |
| Language Quality | 6 | Per-language conventions (below) |
| Keyword Coverage | 5 | Contextual — only when a JD is given; never rewards stuffing |
| Content Prioritization | 4 | Space allocation, information density — never page-count rules |
| Seniority Alignment | 3 | Register matches claimed level, both directions |
| Redundancy / Noise | 2 | Real but secondary |

Each dimension carries a full rubric: `id`, Arabic + English titles,
`purpose`, `weight`, `whatGoodLooksLike`, `positiveSignals[]`,
`warningSignals[]`, `majorProblems[]`, `evaluationQuestions[]`, five
descending `scoreAnchors`, `recommendationRules[]`,
`applicableSeniority[]`, `requiresTargetRole`, `requiresJobDescription`.
Experience additionally defines the **bullet-quality scale 0–5**, where
a 5 requires strong ownership + outcome + credible scope — **not** a
number.

## Universal vs contextual dimensions, and the normalization formula

Universal (always scored): positioning, summary, experience,
achievement, skills, ATS, evidence, language, prioritization,
redundancy, seniority alignment.

Contextual:

- `target_role_alignment` requires a **target role**;
- `keyword_coverage` requires a target role **and** a **job description**;
- `leadership_ownership` is seniority-dependent (excluded at entry);
- `career_progression` is down-weighted at entry (×0.5).

Missing optional context must never read as a zero. The engine
**excludes** the dimension (recording why: `no_target_role`,
`no_job_description`, `not_applicable_at_seniority`) and renormalizes:

```
adjustedWeight_i  = baseWeight_i × seniorityMultiplier_i   (0 ⇒ excluded)
effectiveWeight_i = adjustedWeight_i / Σ adjustedWeights    (Σ = 1)
uncapped          = round( Σ  score_i × effectiveWeight_i )
overall           = min(uncapped, caps…)
```

So a CV with no JD is scored on the remaining dimensions at
proportionally larger weights — no penalty, no free points.

## Seniority model

[seniority.ts](../supabase/functions/_shared/methodology/seniority.ts)
defines expectations for **entry / mid / senior / lead / manager /
director / executive** — what each level's document should demonstrate
(entry: execution, learning, contribution; senior: ownership,
complexity, independence, impact; lead: technical direction, cross-team
influence, delivery; manager: team leadership, delivery, hiring/coaching,
stakeholders, organizational outcomes; director/executive: strategy,
portfolio/business impact, organization scale, transformation) **and
what it must never be penalized for lacking** (entry: people management,
strategy; executive: tool lists, task detail).

Weight multipliers: `leadership_ownership` — entry 0 (excluded), mid
0.5, senior 1, lead 1.25, manager/director/executive 1.5;
`career_progression` — entry 0.5. Verified consequences: an entry
candidate loses **nothing** for not managing people; a manager CV of
pure task descriptions scores measurably lower than the identical
document judged as a senior IC (55 vs 58 in the fixture).

## Score bands

| Range | English | Arabic |
|---|---|---|
| 90–100 | Excellent | ممتاز |
| 80–89 | Strong | قوي |
| 70–79 | Good, with meaningful improvements available | جيد، مع فرص تحسين واضحة |
| 60–69 | Needs improvement | بحاجة إلى تطوير |
| 45–59 | Weak positioning / significant issues | التموضع المهني في السيرة ضعيف ويحتاج إعادة صياغة |
| 0–44 | Major structural and content problems | السيرة الذاتية تحتاج إعادة بناء جوهرية في الهيكل والمحتوى |

Arabic labels are written independently, not translated. All labels
describe the **document**, never the person — no "terrible resume",
"bad candidate", or "unqualified" anywhere in the system.

## Scoring calculation and the evidence cap

The one non-linear rule (`scoring.ts`): if `evidence_specificity < 40`,
the overall score is **capped at 74** — the top of "Good". Excellent
writing with zero checkable evidence cannot reach the top bands
(fixture: uncapped 79 → capped 74). Every cap that fires is recorded in
`metadata.capsApplied`, so the report can explain it. Conversely,
specificity ≠ metrics: the metric-free-but-concrete fixture scores 84
(Strong) — strong factual statements without numbers score well, and
nothing in the system incentivizes fabricating a number.

## Fact preservation (hard rules)

[factPreservation.ts](../supabase/functions/_shared/methodology/factPreservation.ts):

- **May:** improve wording, restructure, shorten, clarify, strengthen
  verbs, suggest where evidence is missing.
- **Must never invent:** revenue, percentages, users, team size,
  budgets, rankings, awards, dates, technologies, employers, job titles,
  responsibilities, results.
- Every rewrite operation is classified **SAFE_TO_REWRITE** (meaning
  preserved exactly) / **NEEDS_USER_CONFIRMATION** (stronger only if the
  user supplies evidence — ask, then rewrite) / **DO_NOT_INFER**
  (strengthening would require invention; polish wording only).
- When information is missing the engine generates a
  `missingEvidenceQuestion` — e.g. *"You mention improving performance.
  Do you know approximately how much it improved, or what changed after
  your work?"* — quoting the CV's own claim and never suggesting a
  candidate answer.

## Target role and job description logic

With a **target role**: evaluate whether positioning, experience,
skills, summary, and terminology support it. With a **JD**: extract
required skills, preferred skills, responsibilities, and domain terms;
tier keywords **CORE / SUPPORTING / OPTIONAL**; classify each as
**strong_match / partial_match / not_demonstrated** — where
`not_demonstrated` explicitly means *the CV doesn't document it*, never
*the candidate doesn't have it*. Recommendations favor evidence-based
inclusion inside real bullets; they never grow a skills list or stuff
keywords.

## ATS model and its limits

We do **not** simulate any ATS vendor and never claim "your resume will
pass ATS." We assess readability/compatibility **indicators**:
parseability, heading clarity, section structure, standard section
naming, contact structure, keyword relevance, and content trapped in
graphics/tables. Every ATS finding carries that framing, and the report
schema includes a mandatory disclaimer field.

## Arabic / English model

[language.ts](../supabase/functions/_shared/methodology/language.ts):
separate guidance per language, never cross-applied.

- **English:** clarity, grammar, brevity, verb strength, repetition,
  buzzwords, sentence structure.
- **Arabic:** clarity, professional tone, natural phrasing, unnecessary
  literal translation, repetition, bureaucratic wording, awkward
  English-to-Arabic structure. Strong Arabic sounds like professional
  Arabic written by a person — not a government memo, not slang.

Three supported cases — Arabic-only, English-only, bilingual — none
inherently better; fit depends on target market, role, and user
preference. Bilingual CVs are checked per-language *and* for factual
divergence between versions. Scoring is language-blind by construction:
identical dimension scores produce identical overalls regardless of
language (harness-verified).

## Industry / role context

[contextPatterns.ts](../supabase/functions/_shared/methodology/contextPatterns.ts):
13 extensible industry categories with a small useful V1 — five role
patterns (software engineer, PM, data analyst, HR, project manager) and
three industry patterns (government, banking, executive), each carrying
expected signals, common pitfalls, and keyword hints. Growth happens in
`knowledge.role_patterns`, not in code.

## Findings: strengths, priority, quick wins

Every analysis identifies `strengths[]` — the product is never purely
negative. Each issue gets `severity` (critical/high/medium/low) and
`effort` (quick/moderate/substantial);
[priority.ts](../supabase/functions/_shared/methodology/priority.ts)
computes `priorityRank = severity×10 + effort`, so severity dominates
and quick fixes lead within a severity — the action plan always says
what to fix **first**. `quickWins[]` (rewrite headline, remove generic
objective, merge duplicate bullets…) feed the free tier.

## Confidence

Per-dimension `high / medium / low`. Overall confidence aggregates by
effective weight: ≥25% low-confidence weight ⇒ low; ≥40% low+medium ⇒
medium; else high. Low-confidence findings must be *phrased* as
possibilities, not facts — that guidance ships in every composed prompt.

## Free vs full report

Structure only — no payment gating in this command
([projection.ts](../supabase/functions/_shared/methodology/projection.ts)).

- **Free:** overall score + band, per-dimension one-line summary, top 3
  issues (summaries only), top 2 strengths, 1 rewrite example, 1 quick
  win. Harness-verified: no evidence objects and no missing-evidence
  questions leak into the free projection.
- **Full:** the complete `CareerAnalysis` — all findings, all evidence,
  all recommendations, all rewrites, ATS detail, target-role detail,
  missing-evidence questions, prioritized action plan.

## Prompt architecture

No 5,000-line prompt
([compose.ts](../supabase/functions/_shared/methodology/compose.ts)).
Context is composed per analysis from typed sections: core rules → fact
preservation → **only the applicable rubrics** → this level's seniority
guidance → this CV's language guidance → matched role/industry patterns
→ an examples slot filled server-side from `knowledge.*`. A no-JD CV
never carries the keyword rubric; an entry CV never carries manager
guidance. Rendering to a provider's message format is Command 05.

## Knowledge database

Seeded by the generated migration into the protected `knowledge` schema
(service-role only, outside PostgREST — see
[career-privacy.md](career-privacy.md)): 19 `career_rubrics` rows (15
dimensions + scoring/seniority/fact-preservation/language models), 15
`role_patterns` rows (roles, industries, seniority expectations), 4
`before_after_patterns`, 2 fully **synthetic** `approved_examples`.
Product knowledge stays completely separate from customer resumes; my
own CVs are **not** ingested yet (that is Command 04).

## Test harness

`npm run test:methodology` — compiles the methodology with the project's
own `tsc` (no Docker, no Deno, no network) and runs
[supabase/tests/methodology/harness.ts](../supabase/tests/methodology/harness.ts)
against seven synthetic fixtures (fictional people only). **42/42 checks
pass**, including every §33 sanity requirement:

| Sanity check | Result |
|---|---|
| Excellent writing + zero evidence ≠ 95 (cap → 74) | PASS |
| Strong technical CV without metrics can still score highly (84) | PASS |
| Entry candidate loses nothing for not managing people | PASS |
| Manager CV of pure tasks loses points for missing leadership/outcomes | PASS |
| No JD ⇒ no keyword penalty (excluded, not zeroed) | PASS |
| Arabic sentence structure never lowers a score by itself | PASS |

## Release gate

`PRIVACY_SECURITY_EXECUTION_VERIFIED = false`
([releaseGates.ts](../supabase/functions/_shared/releaseGates.ts)).
Command 02's privacy/RLS tests A–H/K are written but have **never been
executed** (no Docker in any environment so far). The product is **not
production-ready**, and Command 05 must not connect real CV uploads or
scanning to customer data until those tests run green and a human flips
the gate. Methodology work proceeds regardless — it touches no customer
data.
