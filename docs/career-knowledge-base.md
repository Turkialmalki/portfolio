# Operator CV Knowledge Base — `operator_cv_ingestion_v1` (Command 04)

The operator's own CVs (7 files, 5 distinct versions) ingested into the
protected `knowledge` schema as an **approved knowledge base + example
library + retrieval context** for `career_methodology_v1`. This is not
model training; it is structured, reviewable product knowledge.

**Source of truth:** [supabase/functions/_shared/knowledge/](../supabase/functions/_shared/knowledge/)
(TypeScript). The seed migration
([20260812400002](../supabase/migrations/20260812400002_operator_cv_knowledge_v1.sql))
is **generated** by `npm run generate:cv-knowledge-seed` — never edit it by
hand. Tests: `npm run test:knowledge` (35 checks, no Docker/Deno/network).

## Hard rules honored

- **Operator sources only (§29):** the seven files listed in
  [operatorCvSources.ts](../supabase/functions/_shared/knowledge/operatorCvSources.ts)
  were explicitly provided in the Command 04 session. No directory
  scanning, no customer material of any kind.
- **Nothing auto-approved (§4):** all 72 ingested `approved_examples`
  rows are `status = 'candidate'`. Production retrieval returns
  `status = 'approved'` only (harness test C), so until review happens,
  the scanner would see only Command 03's synthetic examples.
- **Personal-detail firewall (§8):** raw CV text lives only inside
  `content.operatorFact` (`nonReusable: true`) in the service-role-only
  knowledge workspace. Everything retrieval can surface — pattern
  templates, lessons, before/after texts, role guidance — is anonymized
  slot-form, verified at generation time *and* in the harness against the
  operator-identifying-terms and operator-metrics lists.
- **No invented facts (§6):** conflicting/implausible metrics became
  review flags with missing-evidence questions; no flagged number was
  taught, reused, or "fixed".
- **Privacy gate unchanged (§30):** `PRIVACY_SECURITY_EXECUTION_VERIFIED`
  remains `false`. Customer scanning stays blocked.

## Ingestion architecture

```
7 PDF files ──► operatorCvSources.ts   (provenance, fingerprints, dup groups)
                     │
                     ▼
        operatorCvUnits.ts             42 evaluated content units
        (raw fact + quality + tags + anonymized patternText + lesson)
                     │
        ├─ operatorCvBeforeAfter.ts    5 genuine version-evolution pairs
        ├─ reusablePatterns.ts         19 patterns + 11 anti-patterns (abstraction layer)
        └─ REVIEW_FLAGS                5 flags + missing-evidence questions
                     │
                     ▼
        ingest.ts  ──► stable natural keys ──► generate-cv-knowledge-seed.mjs
                     │                              │ (firewall gate re-run here)
                     ▼                              ▼
        retrieval.ts (deterministic ranker)   20260812400002_….sql (candidates)
```

Idempotency (§28): units are extracted per distinct *document*
(fingerprint), so the two duplicate file pairs share units (both
`sourceIds` recorded) instead of doubling them; every row carries a stable
natural key; the seed deletes exactly `operator_cv_ingestion_v1` rows
before inserting. Re-running ingestion replaces, never duplicates, and
never touches the `career_methodology_v1` seed.

## Source files analyzed

| sourceId | File | Version | Period |
|---|---|---|---|
| opcv-2023-lead | TurkiAlmalki-Resume (4) (5).pdf | v1 — "Engineering Leader, 6+ yrs" | ~2023–24 |
| opcv-2024-em | TurkiAlmalki-MyResumes.pdf | v2 — "EM, 7+ yrs" (+Monshaat, Munaseb, TuwaiqPay) | ~2025 |
| opcv-2025-mgmt-a/b | TurkiAlmalki---MyResume.pdf + (1).pdf | v3 — "8+ yrs", leadership/SAMA emphasis (**identical pair**) | ~2025–26 |
| opcv-2025-arch-a/b | TurkiAlmalki----MyResume.pdf + (7).pdf | v4 — "8+ yrs", architecture emphasis (**identical pair**) | ~2025–26 |
| opcv-2026-em | Turki-Almalki--CV.pdf | v5 — "EM, 9+ yrs" (latest, best writing) | ~2026 |

All five versions are **English only** — see the Arabic gap below.

## Content units: 42 extracted, evaluated against career_methodology_v1

| Quality | Count | Meaning |
|---|---:|---|
| STRONG | 9 | approved-structural-example material |
| ACCEPTABLE | 20 | factually useful, not primary examples |
| WEAK | 11 | BEFORE / anti-pattern material |
| DO_NOT_REUSE | 2 | excluded from every reuse path |

By language: en 42, ar 0. By seniority: senior 9 · lead 12 · manager 17 ·
entry 2 (award/education) · mid 0. By role family: software_engineering
16 · engineering_leadership 22 · any 2 (+2 misc). Most-taught dimensions:
experience_quality, achievement_impact, evidence_specificity,
leadership_ownership, seniority_alignment, language_quality.

Being the operator's CVs did **not** exempt content: 13 of 42 units
(31%) were classified WEAK or DO_NOT_REUSE, and four summary versions
carry flagged metrics.

## Knowledge rows seeded (all candidates)

- `approved_examples`: **72** = 42 CV units (raw fact + reusable half) +
  19 reusable patterns (6 bullet, 3 summary, 4 project, 3 leadership,
  3 technical) + 11 anti-patterns.
- `before_after_patterns`: **5** anonymized genuine version-evolution pairs.
- `role_patterns`: **1** (`engineering_leadership` guidance — generic).

## Top strongest examples (curated)

1. **u-arj-led-2026** — "Led the development of [product] using [tech],
   contributing to [outcome 1] and [outcome 2]" — the workhorse
   ACTION+PRODUCT+TECH+VERIFIED-OUTCOME bullet with honest attribution.
2. **u-mun-integrations** — "Architected and launched a
   regulation-compliant system integrated with [named systems ×3]" —
   named third-party integrations as self-authenticating evidence; no
   metric needed.
3. **u-mon-innovation-2026** — the manager remit bullet: "turning
   [input state] into [output state]" at portfolio altitude.
4. **u-mon-direction-2026** — leadership as owned artifacts (direction,
   standards, plans) + stakeholder surface.
5. **u-mun-team** — the minimal complete manager bullet: team +
   deliverable + overseen scope.
6. **u-comp-mentoring** — people leadership made checkable: mentee count
   + mechanisms.
7. **u-arj-middleware** — the metric-free strong technical bullet:
   mechanism built + named system + purpose.
8. **u-arj-frontarch-2026** — practice establishment: senior influence
   without direct reports, honestly qualitative outcome.
9. **u-sum-2026** — manager summary in three sentences, zero invented
   numbers (trim the tech list).

## Top before → after transformations

1. **ba-app-bullet-ownership** — self-praise + tech dump → ownership verb
   + tech inside the action + second verified outcome (SAFE_TO_REWRITE).
2. **ba-manager-altitude** — sprints/ceremonies → the remit they served;
   the canonical seniority-alignment rewrite (SAFE_TO_REWRITE).
3. **ba-summary-identity** — "broad set of skills… seeking to leverage" →
   one identity + domains + sectors; unverifiable % dropped, not replaced
   (SAFE_TO_REWRITE).
4. **ba-integration-mechanism** — "managed integrations" → the middleware
   actually built (SAFE_TO_REWRITE).
5. **ba-portal-structure-not-metric** — structure improved while the
   outcome slot ships **empty pending verification**, because the metric
   mutated between versions (NEEDS_USER_CONFIRMATION) — the pair that
   teaches rewriting and fact-checking are different operations.

## Top weak-pattern lessons (anti-pattern library, 11 entries)

- **ap-vapor-outcome** — "…which led to customer satisfaction."
- **ap-implausible-metric** — a feeling "increased by" a triple-digit % ;
  flag, never fix.
- **ap-tech-dump-parens** — "with extensive knowledge of ([six tools])".
- **ap-everything-bullet** — 7 improvement areas, 0 observables.
- **ap-fake-executive-tone** — chained abstractions + "100% compliance".
- **ap-title-inflation-static-register** — bigger title, same prose.
- **ap-ai-verb-costume** — Spearheaded/Leveraged/Orchestrated…; identical
  bullet skeletons; "results-driven" summaries. The engine must sound human.
- plus participation-as-leadership, ceremony minutiae, unverifiable
  quality %, seeking-objective.

## Review flags awaiting operator answers (5)

| Flag | Question for Turki |
|---|---|
| strapi 60% vs 80% | Which figure is measured, and what exactly was measured? |
| satisfaction "150%" | Reviews grew 150% (v1) or satisfaction grew 150% (later)? Which is the real observable? |
| "quality by 95%" | What was actually measured? |
| "100% regulatory compliance" | What audit/observable backs the absolute? |
| years 6+→9+ | Time passing (fine) — confirm current figure for consistency. |

## Approval workflow

Rows enter as `status='candidate'`. To review, list candidates
(service-role only):

```sql
select id, title, content->>'quality' as quality
from knowledge.approved_examples
where status = 'candidate' order by title;

update knowledge.approved_examples set status = 'approved' where id = '…';
update knowledge.approved_examples set status = 'rejected' where id = '…';
```

## Retrieval strategy (V1: deterministic, no embeddings — §22)

[retrieval.ts](../supabase/functions/_shared/knowledge/retrieval.ts):
hard filters first — production ⇒ `approved` only; language exact match;
seniority distance ≤ 2 (entry can never receive manager+ material);
WEAK/anti-pattern only when explicitly requested (with a reserved slot so
an explicit request actually yields one). Then deterministic scoring:
seniority proximity → role family → dimension → content type → quality;
stable tiebreak by id. Context budget: **3 examples default, 4 max**
(§24). Vector retrieval becomes worth revisiting only if the pool grows
past a few hundred entries or gains untagged free text — and would only
ever replace the relevance tiebreaks, never the correctness filters.

## Knowledge gaps (honest — §27)

Covered: software engineering (senior/lead), engineering leadership
(lead/manager), fintech/banking/government industries, English only.

**Not covered** (do not pretend otherwise): **Arabic** (no Arabic CV
content existed; the two Arabic assets in the system are Command 03
synthetics — no native Arabic pattern library yet), HR, marketing, sales,
legal, healthcare, finance/accounting, design, data science, **entry/mid
IC levels** (only award/education units), **director/executive levels**,
academic and public-sector-specific formats. Fill later via manually
approved examples, synthetic examples, and role-specific guidance — not
by stretching these patterns.

## Test results

`npm run test:knowledge` — **35/35 PASS** (ingestion integrity; §31 A–H:
idempotency, no-invention, candidate invisibility in production, language
match, seniority compatibility, opt-in weak examples, personal-detail
firewall, fact-preservation + gates). `npm run test:methodology` still
**42/42 PASS**.

## Ready for Command 05

The prompt composer's examples slot can now be filled by
`retrieveExamples()` over approved rows; candidates await operator
review; the firewall projection defines exactly what may enter a prompt.
Still blocked, unchanged: anything touching customer CVs, until the
privacy tests run green and a human flips the gate.
