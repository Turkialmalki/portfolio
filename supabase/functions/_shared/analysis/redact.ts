/**
 * CONTACT DATA MINIMIZATION (Command 05 §6).
 *
 * Strips the two contact fields that are both (a) reliably detectable by
 * pattern and (b) never load-bearing for a rubric evaluation: email
 * addresses and phone numbers. Professional links (LinkedIn, GitHub,
 * portfolio URLs) are deliberately left alone — a rubric may legitimately
 * reference "the CV lists a portfolio link" as ATS/positioning evidence.
 *
 * Full street address is explicitly out of scope for this v1: there is no
 * reliable language-agnostic (EN+AR) address pattern that would not also
 * false-positive on legitimate career content (a company address inside a
 * project description, a city name that is also a common word). Rather
 * than risk damaging real content per §6's own instruction ("do not
 * damage legitimate career content while redacting"), this is left
 * unredacted and documented as a known gap for a future, more careful
 * pass — see docs/career-analysis-engine.md.
 */
import type { RedactionResult } from "./types.ts";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Phone-shaped runs: digits, optionally grouped with spaces/dashes/dots/
// parens, optionally with a leading '+'. Matched candidates are only
// redacted if they contain at least 7 digits, so short numeric tokens
// (years, percentages, team sizes like "1-2") are never touched.
const PHONE_CANDIDATE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}/g;

export function redactContactFields(text: string): RedactionResult {
  let redactedEmailCount = 0;
  let redactedPhoneCount = 0;

  let out = text.replace(EMAIL_RE, () => {
    redactedEmailCount += 1;
    return "[redacted-email]";
  });

  out = out.replace(PHONE_CANDIDATE_RE, (match) => {
    const digitCount = (match.match(/\d/g) ?? []).length;
    if (digitCount < 7) return match;
    redactedPhoneCount += 1;
    return "[redacted-phone]";
  });

  return { redactedText: out, redactedEmailCount, redactedPhoneCount };
}
