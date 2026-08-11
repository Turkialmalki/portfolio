/**
 * Command 04 §4, §19–§20, §28 — turns the evaluated units, pairs, and
 * patterns into candidate knowledge rows.
 *
 * Key properties:
 *  - IDEMPOTENT: every row carries a stable natural key
 *    (`content.unitId` / `patternId` / `pairId` + ingestionVersion), and
 *    the generated seed deletes exactly this ingestion version's rows
 *    before inserting — re-ingesting the same sources can never duplicate.
 *  - NEVER AUTO-APPROVED: every approved_examples row is status
 *    'candidate' (§4). Promotion to 'approved' is a manual operator UPDATE
 *    (documented in docs/career-knowledge-base.md).
 *  - FIREWALLED: the reusable projection (what retrieval may surface) is
 *    built here from pattern/lesson text only; raw CV text rides along in
 *    `operatorFact`, marked non-reusable, for operator review (§20 allows
 *    the source material in the operator workspace — knowledge.* is
 *    service-role only).
 */
import type {
  ApprovalStatus,
  CvContentUnit,
  RetrievalPoolEntry,
  UnitQuality,
} from "./types.ts";
import { OPERATOR_CV_INGESTION_VERSION } from "./version.ts";
import { CV_CONTENT_UNITS, REVIEW_FLAGS } from "./operatorCvUnits.ts";
import { BEFORE_AFTER_PAIRS } from "./operatorCvBeforeAfter.ts";
import { ALL_PATTERNS, ANTI_PATTERNS } from "./reusablePatterns.ts";
import {
  OPERATOR_CV_SOURCES,
  OPERATOR_IDENTIFYING_TERMS,
  OPERATOR_METRIC_STRINGS,
} from "./operatorCvSources.ts";

const V = OPERATOR_CV_INGESTION_VERSION;

export interface CandidateExampleRow {
  /** Stable natural key → idempotent re-ingestion (§28). */
  naturalKey: string;
  title: string;
  role_family: string | null;
  experience_level: string | null;
  language: "ar" | "en";
  source: "operator_cv";
  anonymized: boolean;
  status: ApprovalStatus;
  approved_by: string;
  content: Record<string, unknown>;
}

export interface CandidateBeforeAfterRow {
  category: string; // `${V}:<pairId>` — the idempotency scope (§19)
  role_family: string | null;
  before_text: string;
  after_text: string;
  explanation: string;
}

/** §8: text allowed into reusable projections must carry no operator identity. */
export function violatesPersonalFirewall(text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of OPERATOR_IDENTIFYING_TERMS) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  for (const metric of OPERATOR_METRIC_STRINGS) {
    if (text.includes(metric)) return metric;
  }
  return null;
}

function unitRow(unit: CvContentUnit): CandidateExampleRow {
  const reusable =
    unit.quality === "DO_NOT_REUSE" || unit.patternText === null
      ? null
      : {
          contentClass: unit.contentClass.filter((c) => c !== "OPERATOR_SPECIFIC_FACT"),
          patternText: unit.patternText,
          lesson: unit.lesson,
        };
  return {
    naturalKey: `${V}:unit:${unit.unitId}`,
    title: `Operator CV — ${unit.contentType} — ${unit.unitId} (${unit.quality})`,
    role_family: unit.roleFamily,
    experience_level: unit.seniority,
    language: unit.language,
    source: "operator_cv",
    // Reusable half is anonymized by construction; the row as a whole
    // still contains the raw operator fact, so anonymized = false and the
    // firewall lives in the retrieval projection instead.
    anonymized: false,
    status: "candidate",
    approved_by: "turki",
    content: {
      ingestionVersion: V,
      kind: unit.quality === "WEAK" ? "anti_pattern_example" : "cv_unit",
      unitId: unit.unitId,
      quality: unit.quality,
      contentType: unit.contentType,
      dimensionIds: unit.dimensionIds,
      evaluation: unit.evaluation,
      reviewFlagIds: unit.reviewFlagIds,
      reusable,
      operatorFact: {
        nonReusable: true,
        sourceIds: unit.sourceIds,
        rawText: unit.rawText,
      },
    },
  };
}

function patternRow(p: (typeof ALL_PATTERNS)[number]): CandidateExampleRow {
  return {
    naturalKey: `${V}:pattern:${p.patternId}`,
    title: `Pattern — ${p.name}`,
    role_family: null,
    experience_level: null,
    language: p.language,
    source: "operator_cv",
    anonymized: true, // templates carry no operator facts (harness-verified)
    status: "candidate",
    approved_by: "turki",
    content: {
      ingestionVersion: V,
      ...p,
      patternKind: p.kind,
      kind: "reusable_pattern",
    },
  };
}

function antiPatternRow(a: (typeof ANTI_PATTERNS)[number]): CandidateExampleRow {
  return {
    naturalKey: `${V}:anti:${a.antiPatternId}`,
    title: `Anti-pattern — ${a.name}`,
    role_family: null,
    experience_level: null,
    language: "en",
    source: "operator_cv",
    anonymized: true,
    status: "candidate",
    approved_by: "turki",
    content: {
      ingestionVersion: V,
      kind: "anti_pattern",
      ...a,
    },
  };
}

/** Every candidate approved_examples row this ingestion produces. */
export function buildCandidateExampleRows(): CandidateExampleRow[] {
  return [
    ...CV_CONTENT_UNITS.map(unitRow),
    ...ALL_PATTERNS.map(patternRow),
    ...ANTI_PATTERNS.map(antiPatternRow),
  ];
}

/** before_after_patterns rows (anonymized on both sides, §5). */
export function buildBeforeAfterRows(): CandidateBeforeAfterRow[] {
  return BEFORE_AFTER_PAIRS.map((p) => ({
    category: `${V}:${p.pairId}`,
    role_family: p.roleFamily,
    before_text: p.before,
    after_text: p.after,
    explanation: `${p.whyImproved} [${p.factPreservationClassification}; dimensions: ${p.dimensionIds.join(", ")}; seniority: ${p.seniority}; language: ${p.language}; provenance: ${p.beforeUnitId} → ${p.afterUnitId}]`,
  }));
}

/**
 * §9/§11 role guidance distilled from the ingestion — generic by
 * construction (engineering-leadership expectations, not Turki's story).
 */
export function buildRolePatternRows(): { role_family: string; experience_level: string | null; pattern: Record<string, unknown> }[] {
  return [
    {
      role_family: "engineering_leadership",
      experience_level: null,
      pattern: {
        ingestionVersion: V,
        kind: "role",
        id: "engineering_leadership_v1",
        roleFamily: "engineering_leadership",
        industry: "technology",
        expectedSignals: [
          "a remit-level bullet per leadership role: the transformation owned, not the ceremonies attended",
          "people scope made checkable (team size, mentee count) with the mechanisms used",
          "owned artifacts named: technical direction, standards, delivery plans, stakeholder surface",
          "technical credibility at review/guide altitude, not hands-on task claims",
        ],
        commonPitfalls: [
          "title rises between versions while the prose register stays at the old level",
          "process vocabulary (sprints, ceremonies) carrying weight outcomes should carry",
          "department-leadership claims with no scope and vapor outcomes",
          "table-stakes rituals (standups) presented as achievements",
        ],
        keywordHints: ["technical direction", "delivery", "mentoring", "standards", "stakeholders", "roadmap"],
      },
    },
  ];
}

/**
 * Builds the retrieval pool exactly as the production scanner will see it
 * (used by the harness; later mirrored by the DB query in Command 05).
 */
export function buildRetrievalPool(
  statusOverride?: (naturalKey: string) => ApprovalStatus,
): RetrievalPoolEntry[] {
  const pool: RetrievalPoolEntry[] = [];
  for (const row of buildCandidateExampleRows()) {
    const c = row.content as {
      kind: string;
      quality?: UnitQuality;
      unitId?: string;
      patternId?: string;
      antiPatternId?: string;
      dimensionIds?: string[];
      contentType?: string;
      reusable?: { contentClass: string[]; patternText: string; lesson: string | null } | null;
      template?: string;
      guidance?: string;
      example?: string;
      whyBad?: string;
      contentClass?: string;
      applicableSeniority?: string[];
    };
    // Only rows with reusable content enter the pool at all.
    let text: string | null = null;
    let lesson: string | null = null;
    let contentClass = "STRUCTURAL_PATTERN";
    if (c.kind === "cv_unit" || c.kind === "anti_pattern_example") {
      if (!c.reusable) continue; // DO_NOT_REUSE units never reach retrieval
      text = c.reusable.patternText;
      lesson = c.reusable.lesson;
      contentClass = c.reusable.contentClass[0] ?? "STRUCTURAL_PATTERN";
    } else if (c.kind === "reusable_pattern") {
      text = `${c.template}`;
      lesson = c.guidance ?? null;
      contentClass = c.contentClass ?? "STRUCTURAL_PATTERN";
    } else if (c.kind === "anti_pattern") {
      text = `${c.example}`;
      lesson = c.whyBad ?? null;
      contentClass = "LANGUAGE_PATTERN";
    }
    if (text === null) continue;
    pool.push({
      id: row.naturalKey,
      status: statusOverride ? statusOverride(row.naturalKey) : row.status,
      quality: c.quality ?? null,
      example: {
        id: row.naturalKey,
        title: row.title,
        kind: c.kind === "anti_pattern" || c.kind === "anti_pattern_example" ? "anti_pattern" : "example",
        contentClass: contentClass as RetrievalPoolEntry["example"]["contentClass"],
        language: row.language,
        seniority: (row.experience_level as RetrievalPoolEntry["example"]["seniority"]) ?? null,
        roleFamily: (row.role_family as RetrievalPoolEntry["example"]["roleFamily"]) ?? null,
        contentType: (c.contentType as RetrievalPoolEntry["example"]["contentType"]) ?? null,
        dimensionIds: c.dimensionIds ?? [],
        text,
        lesson,
      },
    });
  }
  return pool;
}

export { CV_CONTENT_UNITS, REVIEW_FLAGS, BEFORE_AFTER_PAIRS, ALL_PATTERNS, ANTI_PATTERNS, OPERATOR_CV_SOURCES };
