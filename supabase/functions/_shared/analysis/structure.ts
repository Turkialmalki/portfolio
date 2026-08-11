/**
 * DETERMINISTIC RESUME STRUCTURE EXTRACTION (Command 05 §7).
 *
 * Regex/heading-based only — no AI in this stage (§4, §7: "this may
 * initially use deterministic parsing + AI assistance later"). Splits the
 * preprocessed, redacted text into named sections by matching a bilingual
 * heading vocabulary, then makes a best-effort split of the experience
 * section into entries and bullets.
 *
 * The hard rule: NEVER INVENT a missing section. A CV with no "Skills"
 * heading gets `skills: []`, not a guessed list. Where the parser cannot
 * confidently identify structure at all, `structureUncertain` is set so
 * downstream stages (and the report) can say so honestly instead of
 * silently pretending the document parsed cleanly.
 */
import type { NormalizedResume, ResumeExperienceEntry } from "./types.ts";

interface HeadingRule {
  section: keyof typeof SECTION_KEYS;
  patterns: RegExp[];
}

const SECTION_KEYS = {
  summary: null,
  experience: null,
  education: null,
  skills: null,
  certifications: null,
  projects: null,
} as const;

const HEADING_RULES: HeadingRule[] = [
  { section: "summary", patterns: [/^(professional )?summary$/i, /^profile$/i, /^objective$/i, /^الملخص( المهني)?$/, /^نبذة( عني)?$/] },
  { section: "experience", patterns: [/^(work |professional )?experience$/i, /^employment( history)?$/i, /^career history$/i, /^الخبرة( العملية| المهنية)?$/, /^الخبرات$/] },
  { section: "education", patterns: [/^education$/i, /^academic background$/i, /^التعليم$/, /^المؤهلات العلمية$/] },
  { section: "skills", patterns: [/^(technical )?skills$/i, /^competencies$/i, /^المهارات$/] },
  { section: "certifications", patterns: [/^certifications?$/i, /^licenses?( (and|&) certifications?)?$/i, /^الشهادات$/] },
  { section: "projects", patterns: [/^projects?$/i, /^المشاريع$/] },
];

function matchHeading(line: string): keyof typeof SECTION_KEYS | null {
  const trimmed = line.trim().replace(/[:：]+$/, "");
  if (trimmed.length === 0 || trimmed.length > 40) return null;
  for (const rule of HEADING_RULES) {
    if (rule.patterns.some((p) => p.test(trimmed))) return rule.section;
  }
  return null;
}

interface RawBlock {
  section: keyof typeof SECTION_KEYS | "header" | "other";
  heading: string;
  lines: string[];
}

function splitIntoBlocks(text: string): RawBlock[] {
  const lines = text.split("\n");
  const blocks: RawBlock[] = [{ section: "header", heading: "", lines: [] }];

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      blocks.push({ section: heading, heading: line.trim(), lines: [] });
      continue;
    }
    // Non-matched, non-empty line with heading-like shape (short, no
    // sentence punctuation, and not a bullet) after the header block —
    // treat as an "other" section boundary rather than silently folding
    // unknown content into whatever section came before it.
    const trimmed = line.trim();
    const looksLikeUnknownHeading =
      trimmed.length > 0 &&
      trimmed.length <= 40 &&
      !trimmed.startsWith("-") &&
      /^[A-Za-z؀-ۿ][A-Za-z؀-ۿ\s&/]*$/.test(trimmed) &&
      blocks[blocks.length - 1].section !== "header" &&
      blocks[blocks.length - 1].lines.length > 0 &&
      blocks[blocks.length - 1].lines[blocks[blocks.length - 1].lines.length - 1].trim() === "";
    if (looksLikeUnknownHeading) {
      blocks.push({ section: "other", heading: trimmed, lines: [] });
      continue;
    }
    blocks[blocks.length - 1].lines.push(line);
  }
  return blocks;
}

const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4})\s*[-–—to]{1,3}\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4}|present|current|now|حاضر|الآن)/i;
const YEAR_ONLY_RE = /\b(19|20)\d{2}\b/;

function looksLikeEntryHeader(line: string): boolean {
  const t = line.trim();
  if (t.length === 0 || t.startsWith("-")) return false;
  return DATE_RANGE_RE.test(t) || (t.length < 100 && /[|,–—-]/.test(t));
}

function parseExperienceBlock(lines: string[]): ResumeExperienceEntry[] {
  const entries: ResumeExperienceEntry[] = [];
  let current: ResumeExperienceEntry | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) continue;

    if (line.startsWith("-")) {
      if (!current) {
        // A bullet with no header line yet: open an uncertain entry rather
        // than dropping content or inventing a title/company.
        current = { title: null, company: null, dates: null, bullets: [], uncertain: true };
        entries.push(current);
      }
      current.bullets.push(line.replace(/^-+\s*/, ""));
      continue;
    }

    if (looksLikeEntryHeader(line) || current === null) {
      const dateMatch = line.match(DATE_RANGE_RE)?.[0] ?? (YEAR_ONLY_RE.test(line) ? line.match(YEAR_ONLY_RE)![0] : null);
      const withoutDates = dateMatch ? line.replace(dateMatch, "").trim() : line;
      const parts = withoutDates.split(/\s*[|,–—-]\s*/).filter(Boolean);
      current = {
        title: parts[0] ?? (withoutDates || null),
        company: parts[1] ?? null,
        dates: dateMatch,
        bullets: [],
        uncertain: parts.length < 2 || !dateMatch,
      };
      entries.push(current);
      continue;
    }

    // A non-bullet continuation line under an open entry (e.g. a
    // description paragraph): keep it as a bullet-shaped fact rather than
    // discarding it.
    current.bullets.push(line);
  }

  return entries;
}

export function extractNormalizedResume(preprocessedRedactedText: string): NormalizedResume {
  const blocks = splitIntoBlocks(preprocessedRedactedText);
  const header = blocks[0]?.lines.join("\n").trim() || null;

  const bySection = new Map<string, string[]>();
  const otherSections: NormalizedResume["otherSections"] = [];
  let sawAnyHeading = false;

  for (const block of blocks) {
    if (block.section === "header") continue;
    if (block.section === "other") {
      const text = block.lines.join("\n").trim();
      if (text.length > 0) otherSections.push({ heading: block.heading, text });
      continue;
    }
    sawAnyHeading = true;
    const existing = bySection.get(block.section) ?? [];
    bySection.set(block.section, [...existing, ...block.lines]);
  }

  const summaryLines = bySection.get("summary") ?? [];
  const experienceLines = bySection.get("experience") ?? [];
  const educationLines = bySection.get("education") ?? [];
  const skillsLines = bySection.get("skills") ?? [];
  const certificationLines = bySection.get("certifications") ?? [];
  const projectLines = bySection.get("projects") ?? [];

  const listify = (lines: string[]): string[] =>
    lines
      .join("\n")
      .split("\n")
      .map((l) => l.replace(/^-+\s*/, "").trim())
      .filter(Boolean);

  return {
    header,
    summary: summaryLines.join("\n").trim() || null,
    experience: parseExperienceBlock(experienceLines),
    education: listify(educationLines),
    skills: listify(skillsLines).flatMap((l) => l.split(/,\s*/)).filter(Boolean),
    certifications: listify(certificationLines),
    projects: listify(projectLines),
    otherSections,
    rawTextReference: preprocessedRedactedText,
    structureUncertain: !sawAnyHeading,
  };
}
