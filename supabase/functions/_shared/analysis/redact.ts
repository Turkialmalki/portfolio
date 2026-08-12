/**
 * CONTACT DATA MINIMIZATION (Command 05 §6, strengthened by Command 05B
 * §17 now that real parser output — not just hand-typed fixtures — feeds
 * this boundary).
 *
 * Strips contact fields that are both (a) reliably detectable by pattern
 * and (b) never load-bearing for a rubric evaluation: email addresses,
 * phone numbers (including Saudi/international formats — `+966`, `00966`,
 * and local `05…` mobile numbers), and P.O. Box mailing lines. Professional
 * links (LinkedIn, GitHub, portfolio URLs) are deliberately left alone — a
 * rubric may legitimately reference "the CV lists a portfolio link" as
 * ATS/positioning evidence.
 *
 * Full street address remains out of scope beyond the narrow P.O. Box
 * case: there is no reliable language-agnostic (EN+AR) street-address
 * pattern that would not also false-positive on legitimate career content
 * (a company address inside a project description, a city name that is
 * also a common word). The P.O. Box line is the one address-shaped
 * pattern precise enough to be safe — "P.O. Box"/"ص.ب" essentially never
 * appears in a CV for any reason other than a mailing address. Rather
 * than risk damaging real content per §6's own instruction ("do not
 * damage legitimate career content while redacting"), the rest is left
 * unredacted and documented as a known gap for a future, more careful
 * pass — see docs/career-analysis-engine.md and
 * docs/career-resume-parser.md.
 */
import type { RedactionResult } from "./types.ts";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Phone-shaped runs: digits, optionally grouped with spaces/dashes/dots/
// parens, optionally with a leading '+' or international-dial '00'
// prefix. Group sizes go down to a single digit (not just 2-4) so a
// Saudi mobile number written with the operator digit isolated —
// "+966 5 0000 0000" — is caught in full rather than partially. Matched
// candidates are only redacted if they contain at least 7 digits, so
// short numeric tokens (years, percentages, team sizes like "1-2",
// money/duration figures) are never touched — verified in
// supabase/tests/parser/harness.ts (§27.K).
const PHONE_CANDIDATE_RE = /(?:\+\d{1,3}[\s.-]?|00\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?){2,6}\d{1,4}/g;

// A P.O. Box line — precise enough to redact the whole line, EN + AR.
// Deliberately does NOT match generic street/city text (§17: never touch
// company locations, job locations, or project names).
const PO_BOX_LINE_RE = /^.*\b(?:P\.?\s?O\.?\s?Box|ص\s?\.?\s?ب)\b[^\n]*$/gim;

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

  out = out.replace(PO_BOX_LINE_RE, "[redacted-address]");

  return { redactedText: out, redactedEmailCount, redactedPhoneCount };
}
