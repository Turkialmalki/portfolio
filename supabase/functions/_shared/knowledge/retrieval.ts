/**
 * Command 04 §21–§24 — deterministic example retrieval. No embeddings:
 * structured tag filtering + explicit ranking (language → seniority →
 * role → dimension → quality), a hard context budget, and a projection
 * that can only ever expose reusable pattern text (§8).
 *
 * Where vector retrieval might help LATER (documented per §22): once the
 * example pool grows past a few hundred entries or gains free-text notes
 * that tags can't index (e.g. nuanced domain phrasing), a semantic index
 * over `text + lesson` could replace the dimension/contentType tiebreaks.
 * It should never replace the hard filters (status, language, seniority
 * compatibility) — those are correctness rules, not relevance rules.
 */
import type {
  RetrievalContext,
  RetrievalExample,
  RetrievalOptions,
  RetrievalPoolEntry,
  SeniorityLevel,
} from "./types.ts";

/** §24 prompt context budget: quality over quantity. */
export const EXAMPLE_BUDGET = { default: 3, max: 4 } as const;

const SENIORITY_ORDER: SeniorityLevel[] = [
  "entry",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
];

function seniorityDistance(a: SeniorityLevel, b: SeniorityLevel): number {
  return Math.abs(SENIORITY_ORDER.indexOf(a) - SENIORITY_ORDER.indexOf(b));
}

/**
 * Maximum seniority distance an example may travel. An entry-level user
 * must never receive executive phrasing (§11): distance 2 keeps entry
 * within entry/mid/senior-shaped material and managers within
 * lead–executive material.
 */
export const MAX_SENIORITY_DISTANCE = 2;

function isEligible(
  entry: RetrievalPoolEntry,
  context: RetrievalContext,
  opts: RetrievalOptions,
): boolean {
  // §23: production never sees unapproved rows, under any flag.
  if (opts.mode === "production" && entry.status !== "approved") return false;
  if (entry.status === "rejected") return false;

  // Weak/anti-pattern material only on explicit request (§23, test F).
  const isAntiMaterial = entry.example.kind === "anti_pattern" || entry.quality === "WEAK";
  if (isAntiMaterial && !opts.includeAntiPatterns) return false;
  if (entry.quality === "DO_NOT_REUSE") return false;

  // Language is a hard filter (§21, test D): never cross languages.
  if (entry.example.language !== context.language) return false;

  // Seniority compatibility is a hard filter (test E).
  if (
    entry.example.seniority !== null &&
    seniorityDistance(entry.example.seniority, context.seniority) > MAX_SENIORITY_DISTANCE
  ) {
    return false;
  }
  return true;
}

function score(entry: RetrievalPoolEntry, context: RetrievalContext): number {
  const e = entry.example;
  let s = 0;
  // Seniority proximity (language already hard-filtered).
  if (e.seniority !== null) {
    s += 20 - 6 * seniorityDistance(e.seniority, context.seniority);
  }
  // Role relevance.
  if (context.roleFamily && e.roleFamily === context.roleFamily) s += 15;
  else if (e.roleFamily === "any" || e.roleFamily === null) s += 5;
  // Dimension relevance.
  if (context.dimensionId && e.dimensionIds.includes(context.dimensionId)) s += 10;
  // Content-type match.
  if (context.contentType && e.contentType === context.contentType) s += 6;
  // Quality: strong beats acceptable; null (synthetic/manual, pre-vetted) sits between.
  if (entry.quality === "STRONG") s += 10;
  else if (entry.quality === null) s += 7;
  else if (entry.quality === "ACCEPTABLE") s += 4;
  return s;
}

/**
 * Deterministic top-N retrieval (§23). Stable ordering: score desc, then
 * id asc so identical inputs always return identical outputs.
 */
export function retrieveExamples(
  pool: RetrievalPoolEntry[],
  context: RetrievalContext,
  opts: RetrievalOptions,
): RetrievalExample[] {
  const budget = Math.min(opts.maxExamples ?? EXAMPLE_BUDGET.default, EXAMPLE_BUDGET.max);
  const ranked = pool
    .filter((entry) => isEligible(entry, context, opts))
    .map((entry) => ({ entry, s: score(entry, context) }))
    .sort((a, b) => b.s - a.s || a.entry.id.localeCompare(b.entry.id));
  const top = ranked.slice(0, budget);
  // §23: an explicit anti-pattern request must actually yield one — reserve
  // the last slot for the best anti-material if the top-N is all positives.
  if (opts.includeAntiPatterns && budget > 1 && !top.some(isAnti)) {
    const bestAnti = ranked.find(isAnti);
    if (bestAnti) top.splice(budget - 1, 1, bestAnti);
  }
  return top.map(({ entry }) => entry.example);
}

function isAnti(r: { entry: RetrievalPoolEntry }): boolean {
  return r.entry.example.kind === "anti_pattern" || r.entry.quality === "WEAK";
}
