/**
 * GENERATES the knowledge-schema seed migration from the TypeScript
 * methodology source (Command 03 §30).
 *
 * The TS modules in supabase/functions/_shared/methodology/ are the
 * SINGLE SOURCE OF TRUTH; the SQL migration is a build artifact of this
 * script, committed so `supabase db push` can apply it without Node.
 * Never hand-edit the generated migration — change the TS and re-run:
 *
 *   npm run generate:methodology-seed
 *
 * (The npm script compiles the methodology first; this file imports the
 * compiled CommonJS output from .methodology-tests-build/.)
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const build = (p) => require(path.join(root, ".methodology-tests-build/functions/_shared/methodology", p));

const { CAREER_METHODOLOGY_VERSION } = build("version.js");
const { DIMENSIONS, BULLET_QUALITY_SCALE } = build("dimensions.js");
const { SCORE_BANDS } = build("scoreBands.js");
const { SENIORITY_EXPECTATIONS, SENIORITY_WEIGHT_MULTIPLIERS } = build("seniority.js");
const { EVIDENCE_CAP_THRESHOLD, EVIDENCE_CAP_MAX, EVIDENCE_CAP_ID } = build("scoring.js");
const { ALLOWED_OPERATIONS, NEVER_INVENT, FACT_CLASSIFICATION_RULES, MISSING_EVIDENCE_QUESTION_GUIDANCE } = build("factPreservation.js");
const { ARABIC_GUIDANCE, ENGLISH_GUIDANCE, CV_LANGUAGE_CASES } = build("language.js");
const { ROLE_PATTERNS, INDUSTRY_PATTERNS } = build("contextPatterns.js");

const V = CAREER_METHODOLOGY_VERSION;
// Dollar-quote tag; jsonb payloads are operator-authored and never
// contain it (verified below before writing).
const TAG = "$mv1$";
const jsonb = (value) => {
  const text = JSON.stringify(value);
  if (text.includes(TAG)) throw new Error("payload collides with dollar-quote tag");
  return `${TAG}${text}${TAG}::jsonb`;
};
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const lines = [];
lines.push(`-- GENERATED FILE — do not edit by hand.
-- Source of truth: supabase/functions/_shared/methodology/ (TypeScript).
-- Regenerate with: npm run generate:methodology-seed
--
-- Seeds ${V} into the protected \`knowledge\` schema (Command 03 §30).
-- knowledge.* is PRODUCT KNOWLEDGE: operator-authored rubrics, patterns,
-- and synthetic examples — completely separate from customer resumes,
-- unreachable from PostgREST, service-role only (see
-- 20260812200001_career_privacy_foundation.sql). Nothing in this file
-- derives from any real customer's CV.

-- Idempotent per methodology version: replace this version's rows.
delete from knowledge.before_after_patterns
  where category like ${lit(V + ":%")};
delete from knowledge.role_patterns
  where pattern->>'methodologyVersion' = ${lit(V)};
delete from knowledge.approved_examples
  where source = 'synthetic' and content->>'methodologyVersion' = ${lit(V)};
delete from knowledge.career_rubrics where version = ${lit(V)};
`);

// ── career_rubrics: one row per dimension + the engine-level models ──────
for (const rubric of DIMENSIONS) {
  lines.push(
    `insert into knowledge.career_rubrics (name, role_family, version, criteria) values (${lit(
      `dimension:${rubric.id}`,
    )}, null, ${lit(V)}, ${jsonb(rubric)});`,
  );
}

const engineModels = {
  scoring_model: {
    description:
      "Deterministic overall-score model: weighted mean of applicable dimensions, contextual exclusion + renormalization, evidence cap.",
    weights: Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.weight])),
    seniorityWeightMultipliers: SENIORITY_WEIGHT_MULTIPLIERS,
    evidenceCap: { threshold: EVIDENCE_CAP_THRESHOLD, max: EVIDENCE_CAP_MAX, id: EVIDENCE_CAP_ID },
    scoreBands: SCORE_BANDS,
    bulletQualityScale: BULLET_QUALITY_SCALE,
  },
  seniority_model: { expectations: SENIORITY_EXPECTATIONS },
  fact_preservation: {
    allowedOperations: ALLOWED_OPERATIONS,
    neverInvent: NEVER_INVENT,
    classifications: FACT_CLASSIFICATION_RULES,
    missingEvidenceQuestionGuidance: MISSING_EVIDENCE_QUESTION_GUIDANCE,
  },
  language_model: {
    arabic: ARABIC_GUIDANCE,
    english: ENGLISH_GUIDANCE,
    cvLanguageCases: CV_LANGUAGE_CASES,
  },
};
for (const [name, model] of Object.entries(engineModels)) {
  lines.push(
    `insert into knowledge.career_rubrics (name, role_family, version, criteria) values (${lit(
      `model:${name}`,
    )}, null, ${lit(V)}, ${jsonb(model)});`,
  );
}

// ── role_patterns: role families, industry notes, seniority rows ─────────
for (const p of ROLE_PATTERNS) {
  lines.push(
    `insert into knowledge.role_patterns (role_family, experience_level, pattern) values (${lit(
      p.roleFamily,
    )}, null, ${jsonb({ methodologyVersion: V, kind: "role", ...p })});`,
  );
}
for (const p of INDUSTRY_PATTERNS) {
  lines.push(
    `insert into knowledge.role_patterns (role_family, experience_level, pattern) values (${lit(
      `industry:${p.industry}`,
    )}, null, ${jsonb({ methodologyVersion: V, kind: "industry", ...p })});`,
  );
}
for (const e of SENIORITY_EXPECTATIONS) {
  lines.push(
    `insert into knowledge.role_patterns (role_family, experience_level, pattern) values ('any', ${lit(
      e.level,
    )}, ${jsonb({ methodologyVersion: V, kind: "seniority", ...e })});`,
  );
}

// ── before_after_patterns: operator-authored, synthetic text only ────────
const beforeAfter = [
  {
    category: `${V}:verb_strength`,
    role_family: null,
    before: "Was responsible for the management of the deployment process for the platform.",
    after: "Managed platform deployments.",
    explanation: "SAFE_TO_REWRITE: stronger verb, two-thirds shorter, every fact intact.",
  },
  {
    category: `${V}:generic_summary`,
    role_family: null,
    before: "Highly motivated results-driven professional seeking a challenging opportunity to utilize my skills.",
    after: "Backend engineer, 6 years in payments infrastructure, focused on reliability at scale.",
    explanation:
      "Replace boilerplate with identity + domain + specialization. The 'after' is a TEMPLATE shape — real facts must come from the user's own CV, never invented.",
  },
  {
    category: `${V}:missing_evidence_question`,
    role_family: null,
    before: "Improved the performance of the reporting system.",
    after: "You mention improving performance. Do you know approximately how much it improved, or what changed after your work?",
    explanation:
      "NEEDS_USER_CONFIRMATION: the 'after' is the QUESTION we ask, not a rewrite — never write a number the CV doesn't contain (§7).",
  },
  {
    category: `${V}:arabic_translationese`,
    role_family: null,
    before: "أنا شخص متحمس وذو دافع عالٍ أبحث عن فرصة تحديّة لاستغلال مهاراتي.",
    after: "مطوّر برمجيات بخبرة خمس سنوات في الأنظمة المصرفية، متخصص في بناء الخدمات الخلفية الموثوقة.",
    explanation:
      "Translationese boilerplate → natural professional Arabic with identity + domain. Template shape only; facts always the user's own.",
  },
];
for (const p of beforeAfter) {
  lines.push(
    `insert into knowledge.before_after_patterns (category, role_family, before_text, after_text, explanation) values (${lit(
      p.category,
    )}, ${p.role_family ? lit(p.role_family) : "null"}, ${lit(p.before)}, ${lit(p.after)}, ${lit(p.explanation)});`,
  );
}

// ── approved_examples: fully synthetic, fictional people ─────────────────
const examples = [
  {
    title: "Synthetic — strong senior engineer bullet set (no metrics)",
    role_family: "software_engineer",
    experience_level: "senior",
    language: "en",
    content: {
      methodologyVersion: V,
      kind: "bullet_set",
      note: "Fictional person; demonstrates bullet-quality 4–5 WITHOUT numbers (§12: a 5 does not require a metric).",
      bullets: [
        "Owned the payment-reconciliation service end to end, from design review through on-call, for the bank's retail platform.",
        "Led the migration off the legacy settlement batch job; the team retired the last mainframe dependency ahead of the compliance deadline.",
        "Mentored two mid-level engineers through their first production launches.",
      ],
    },
  },
  {
    title: "Synthetic — Arabic professional summary, mid-level",
    role_family: "data_analyst",
    experience_level: "mid",
    language: "ar",
    content: {
      methodologyVersion: V,
      kind: "summary",
      note: "Fictional person; natural professional Arabic register (§16–17).",
      text: "محلل بيانات بخبرة أربع سنوات في قطاع التجزئة، متخصص في بناء لوحات المتابعة وتحويل البيانات إلى قرارات تشغيلية للإدارة التجارية.",
    },
  },
];
for (const e of examples) {
  lines.push(
    `insert into knowledge.approved_examples (title, role_family, experience_level, language, content, source, anonymized, approved_by) values (${lit(
      e.title,
    )}, ${lit(e.role_family)}, ${lit(e.experience_level)}, ${lit(e.language)}, ${jsonb(
      e.content,
    )}, 'synthetic', true, 'turki');`,
  );
}

const out = path.join(root, "supabase/migrations/20260812300001_career_methodology_v1_knowledge.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${out}`);
console.log(`  career_rubrics: ${DIMENSIONS.length + Object.keys(engineModels).length} rows`);
console.log(`  role_patterns: ${ROLE_PATTERNS.length + INDUSTRY_PATTERNS.length + SENIORITY_EXPECTATIONS.length} rows`);
console.log(`  before_after_patterns: ${beforeAfter.length} rows`);
console.log(`  approved_examples: ${examples.length} rows (synthetic only)`);
