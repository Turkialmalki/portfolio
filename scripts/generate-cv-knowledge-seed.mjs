/**
 * GENERATES the operator-CV knowledge seed migration from the TypeScript
 * source in supabase/functions/_shared/knowledge/ (Command 04 §19, §28).
 *
 * Same contract as generate-methodology-seed.mjs: the TS modules are the
 * single source of truth; the SQL migration is a committed build artifact.
 * Never hand-edit the generated file — change the TS and re-run:
 *
 *   npm run generate:cv-knowledge-seed
 *
 * Idempotency (§28): the migration deletes exactly this ingestion
 * version's rows (scoped by ingestionVersion / category prefix) before
 * inserting rows keyed by stable natural keys — re-running ingestion of
 * the same sources replaces rather than duplicates, and never touches the
 * career_methodology_v1 seed (§19).
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const build = (p) => require(path.join(root, ".knowledge-tests-build/functions/_shared/knowledge", p));

const { OPERATOR_CV_INGESTION_VERSION: V } = build("version.js");
const {
  buildCandidateExampleRows,
  buildBeforeAfterRows,
  buildRolePatternRows,
  violatesPersonalFirewall,
} = build("ingest.js");

const TAG = "$ocv1$";
const jsonb = (value) => {
  const text = JSON.stringify(value);
  if (text.includes(TAG)) throw new Error("payload collides with dollar-quote tag");
  return `${TAG}${text}${TAG}::jsonb`;
};
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Hard §8 gate at generation time: anonymized payloads (patterns,
// anti-patterns, before/after rows) must carry no operator identity.
const exampleRows = buildCandidateExampleRows();
for (const row of exampleRows) {
  if (!row.anonymized) continue;
  const leak = violatesPersonalFirewall(JSON.stringify(row.content));
  if (leak) throw new Error(`firewall: anonymized row ${row.naturalKey} contains operator term "${leak}"`);
}
const beforeAfterRows = buildBeforeAfterRows();
for (const row of beforeAfterRows) {
  const leak = violatesPersonalFirewall(row.before_text + " " + row.after_text);
  if (leak) throw new Error(`firewall: before/after ${row.category} contains operator term "${leak}"`);
}
const rolePatternRows = buildRolePatternRows();

const keys = exampleRows.map((r) => r.naturalKey);
if (new Set(keys).size !== keys.length) throw new Error("duplicate natural keys in ingestion");

const lines = [];
lines.push(`-- GENERATED FILE — do not edit by hand.
-- Source of truth: supabase/functions/_shared/knowledge/ (TypeScript).
-- Regenerate with: npm run generate:cv-knowledge-seed
--
-- Command 04: ingests the OPERATOR'S OWN CVs (and nothing else — §29)
-- into the protected \`knowledge\` schema as ${V}.
-- Every approved_examples row is status = 'candidate' (§4): nothing here
-- is auto-approved, and production retrieval selects status='approved'
-- only. Raw operator CV text appears solely inside content.operatorFact
-- (nonReusable: true) — the operator ingestion workspace permitted by
-- §20; the reusable projections are anonymized and firewall-checked at
-- generation time (§8).
--
-- Scoped idempotency (§28): deletes replace exactly this ingestion
-- version's rows; the career_methodology_v1 seed is never touched (§19).

delete from knowledge.before_after_patterns
  where category like ${lit(V + ":%")};
delete from knowledge.role_patterns
  where pattern->>'ingestionVersion' = ${lit(V)};
delete from knowledge.approved_examples
  where source = 'operator_cv' and content->>'ingestionVersion' = ${lit(V)};
`);

for (const row of exampleRows) {
  lines.push(
    `insert into knowledge.approved_examples (title, role_family, experience_level, language, content, source, anonymized, status, approved_by) values (${lit(
      row.title,
    )}, ${row.role_family ? lit(row.role_family) : "null"}, ${
      row.experience_level ? lit(row.experience_level) : "null"
    }, ${lit(row.language)}, ${jsonb({ naturalKey: row.naturalKey, ...row.content })}, ${lit(
      row.source,
    )}, ${row.anonymized}, ${lit(row.status)}, ${lit(row.approved_by)});`,
  );
}

for (const row of beforeAfterRows) {
  lines.push(
    `insert into knowledge.before_after_patterns (category, role_family, before_text, after_text, explanation) values (${lit(
      row.category,
    )}, ${row.role_family ? lit(row.role_family) : "null"}, ${lit(row.before_text)}, ${lit(
      row.after_text,
    )}, ${lit(row.explanation)});`,
  );
}

for (const row of rolePatternRows) {
  lines.push(
    `insert into knowledge.role_patterns (role_family, experience_level, pattern) values (${lit(
      row.role_family,
    )}, ${row.experience_level ? lit(row.experience_level) : "null"}, ${jsonb(row.pattern)});`,
  );
}

const out = path.join(root, "supabase/migrations/20260812400002_operator_cv_knowledge_v1.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${out}`);
console.log(`  approved_examples: ${exampleRows.length} rows (all status='candidate')`);
console.log(`  before_after_patterns: ${beforeAfterRows.length} rows`);
console.log(`  role_patterns: ${rolePatternRows.length} rows`);
