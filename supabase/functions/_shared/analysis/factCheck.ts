/**
 * FACT PRESERVATION ENFORCEMENT + METRIC CONFLICT PROTECTION
 * (Command 05 §12–§13).
 *
 * Two separate guards:
 *
 *  1. `enforceRewriteFactPreservation` — every rewrite candidate the AI
 *     provider proposes is checked, not trusted. A candidate marked
 *     SAFE_TO_REWRITE that introduces a number, percentage, or other
 *     checkable token absent from the "before" text is discarded outright
 *     (§12: "If a proposed rewrite introduces unsupported factual content:
 *     discard it"). NEEDS_USER_CONFIRMATION and DO_NOT_INFER candidates
 *     pass through unchanged — their whole point is that strengthening is
 *     deferred to the user, not fabricated here.
 *
 *  2. `detectMetricConflicts` — a heuristic, percentage-focused v1 scan
 *     for the same claim reported with two different numbers (Command 04
 *     found this happens in real operator CVs). Intentionally narrow:
 *     broadening it to currency amounts, headcounts, and other metric
 *     shapes is documented as follow-up work in
 *     docs/career-analysis-engine.md rather than attempted here with a
 *     regex that would start false-positiving on dates and page numbers.
 */
import type { MetricConflict, RewriteCandidateResult } from "./types.ts";

function extractNumericTokens(text: string): string[] {
  return text.match(/\d+(?:\.\d+)?%?/g) ?? [];
}

/**
 * §12: reject any SAFE_TO_REWRITE candidate whose "after" text contains a
 * numeric token not present in "before". A genuinely fact-preserving
 * rewrite never needs to add a number that wasn't already there.
 */
export function enforceRewriteFactPreservation(candidate: RewriteCandidateResult): RewriteCandidateResult | null {
  if (candidate.classification !== "SAFE_TO_REWRITE") return candidate;
  const beforeNumbers = new Set(extractNumericTokens(candidate.before));
  const inventedNumbers = extractNumericTokens(candidate.after).filter((n) => !beforeNumbers.has(n));
  if (inventedNumbers.length > 0) return null;
  return candidate;
}

const PERCENT_RE = /(\d+(?:\.\d+)?)\s?(?:%|percent)/gi;
const CONTEXT_WORD_WINDOW = 4;
const CONTEXT_LOOKBACK_CHARS = 60;

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * §13: finds the same surrounding phrase reported with two or more
 * different percentage values across the document — a strong signal of a
 * conflicting metric across CV versions or sections, which the engine
 * must flag rather than silently pick one.
 *
 * The context key is the fixed-width window of words immediately
 * PRECEDING each number (right-anchored), not an arbitrary-length prefix
 * from wherever a regex happened to start matching — a right-anchored
 * window is what makes "delivery rate by 20%" and "...delivery rate by
 * 35%" group together even when the sentences around them differ, while
 * still refusing to group genuinely unrelated numbers.
 */
export function detectMetricConflicts(text: string): MetricConflict[] {
  const groups = new Map<string, Set<string>>();
  let match: RegExpExecArray | null;
  const re = new RegExp(PERCENT_RE);
  while ((match = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, match.index - CONTEXT_LOOKBACK_CHARS), match.index);
    const words = before.split(/\s+/).filter(Boolean).slice(-CONTEXT_WORD_WINDOW);
    const key = normalizePhrase(words.join(" "));
    if (words.length < CONTEXT_WORD_WINDOW) continue; // not enough shared context to trust the grouping
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(match[1]);
  }

  const conflicts: MetricConflict[] = [];
  for (const [context, values] of groups) {
    if (values.size > 1) conflicts.push({ context, values: [...values] });
  }
  return conflicts;
}
