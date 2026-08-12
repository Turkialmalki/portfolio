/**
 * FACT PRESERVATION ENFORCEMENT + METRIC CONFLICT PROTECTION
 * (Command 05 §12–§13, broadened by Command 05B §18).
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
 *  2. `detectMetricConflicts` — a heuristic scan for the same claim
 *     reported with two different numbers (Command 04 found this happens
 *     in real operator CVs), now covering three metric shapes instead of
 *     percentage alone: percentages, currency/revenue amounts, and
 *     user/customer/team counts. All three reuse the same right-anchored
 *     "same preceding words = same underlying fact" grouping — the part
 *     of the original design that keeps false positives down — so
 *     broadening to new shapes didn't mean broadening the risk profile.
 *     Dates and durations are deliberately NOT included here: a CV
 *     legitimately repeats similar-looking date fragments across many
 *     unrelated roles far more often than it repeats the same metric
 *     phrase, so the false-positive risk is materially different and
 *     this stays out per §18's own instruction ("if confidence is
 *     insufficient: do nothing") — documented as deferred in
 *     docs/career-resume-parser.md rather than attempted with a
 *     regex likely to flag unrelated employment dates as "conflicting."
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

const CONTEXT_WORD_WINDOW = 4;
const CONTEXT_LOOKBACK_CHARS = 60;

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Shared right-anchored grouping used by every metric shape below: the
 * context key is the fixed-width window of words immediately PRECEDING
 * each matched value, not an arbitrary-length prefix from wherever the
 * regex happened to start matching. That's what makes "delivery rate by
 * 20%" and "...delivery rate by 35%" group together even when the
 * sentences around them differ, while still refusing to group genuinely
 * unrelated numbers that don't share their immediate preceding words
 * (§13, generalized by §18).
 *
 * `normalizeValue` turns a raw regex match into the string two mentions
 * must be EQUAL to for them to count as "the same value" — this is where
 * unit/magnitude gets folded in (so "50" and "50k" are never treated as
 * the same value just because both matched \d+).
 */
function detectConflictsForPattern(text: string, pattern: RegExp, normalizeValue: (match: RegExpExecArray) => string): MetricConflict[] {
  const groups = new Map<string, Set<string>>();
  let match: RegExpExecArray | null;
  const re = new RegExp(pattern);
  while ((match = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, match.index - CONTEXT_LOOKBACK_CHARS), match.index);
    const words = before.split(/\s+/).filter(Boolean).slice(-CONTEXT_WORD_WINDOW);
    if (words.length < CONTEXT_WORD_WINDOW) continue; // not enough shared context to trust the grouping
    const key = normalizePhrase(words.join(" "));
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(normalizeValue(match));
  }

  const conflicts: MetricConflict[] = [];
  for (const [context, values] of groups) {
    if (values.size > 1) conflicts.push({ context, values: [...values] });
  }
  return conflicts;
}

const PERCENT_RE = /(\d+(?:\.\d+)?)\s?(?:%|percent)/gi;

// Currency amounts: "$1.2M", "$50k", "SAR 100,000", "ر.س 5000" — the
// symbol/code is captured only to require *some* currency marker (so a
// bare number is never treated as money), and folded out of the grouped
// value itself (a conflict is about the amount, not which symbol was used
// for it — a real CV sometimes mixes "$" and "USD" for the same figure).
const CURRENCY_RE = /(?:\$|USD|SAR|SR|ر\.س)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(k|K|m|M|million|thousand|مليون|ألف)?/g;

// User/customer/team counts: "50,000 users", "team of 12", "12 engineers".
// Requires an explicit count-shaped noun immediately after the number so
// this never fires on an unrelated adjacent number (a year, a bullet
// index) that merely happens to precede common words.
const COUNT_RE = /(\d{1,3}(?:,\d{3})*)\+?\s?(users|customers|clients|engineers|people|members|reports|team members|employees)\b/gi;
const TEAM_OF_RE = /team of\s+(\d{1,3}(?:,\d{3})*)\+?/gi;

/** §13/§18: detects the same underlying fact reported with two different values, across percentage, currency, and count/headcount shapes. */
export function detectMetricConflicts(text: string): MetricConflict[] {
  const percent = detectConflictsForPattern(text, PERCENT_RE, (m) => `${m[1]}%`);
  const currency = detectConflictsForPattern(text, CURRENCY_RE, (m) => `${m[1]}${m[2] ? m[2].toLowerCase() : ""}`);
  const counts = detectConflictsForPattern(text, COUNT_RE, (m) => m[1].replace(/,/g, ""));
  const teamOf = detectConflictsForPattern(text, TEAM_OF_RE, (m) => m[1].replace(/,/g, ""));
  return [...percent, ...currency, ...counts, ...teamOf];
}
