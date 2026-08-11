/**
 * Command 04 §1 — provenance registry for the operator's own CV files.
 *
 * HARD RULE (§29): this list is the ONLY ingestion input. Nothing in this
 * module or its consumers scans directories, uploads, or any customer
 * material. Every file below was explicitly provided by the operator in
 * the Command 04 session.
 *
 * The seven files contain FIVE distinct documents: two pairs are exact
 * content duplicates (same text, saved twice under different names).
 * Duplicates share a contentFingerprint; unit extraction dedupes on it,
 * so re-ingesting a duplicate can never double the knowledge base (§28).
 */
import type { OperatorCvSource } from "./types.ts";

const INGESTED_AT = "2026-08-12";

export const OPERATOR_CV_SOURCES: OperatorCvSource[] = [
  {
    sourceId: "opcv-2023-lead",
    filename: "TurkiAlmalki-Resume (4) (5).pdf",
    language: "en",
    documentVersion: "v1 — 'Engineering Leader, 6+ years' (Emkan current role)",
    estimatedPeriod: "~2023–2024 (Emkan listed as Present)",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2023-lead-6yrs",
  },
  {
    sourceId: "opcv-2024-em",
    filename: "TurkiAlmalki-MyResumes.pdf",
    language: "en",
    documentVersion: "v2 — 'Engineering Manager, 7+ years' (adds Monshaat, Munaseb, TuwaiqPay)",
    estimatedPeriod: "~2025 (TuwaiqPay Feb 2025 – Present)",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2024-em-7yrs",
  },
  {
    sourceId: "opcv-2025-mgmt-a",
    filename: "TurkiAlmalki---MyResume.pdf",
    language: "en",
    documentVersion: "v3 — 'Engineering Leader, 8+ years' (leadership/SAMA emphasis)",
    estimatedPeriod: "~2025–2026",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2025-mgmt-8yrs",
  },
  {
    sourceId: "opcv-2025-mgmt-b",
    filename: "TurkiAlmalki---MyResume (1).pdf",
    language: "en",
    documentVersion: "v3 — duplicate of TurkiAlmalki---MyResume.pdf (identical text)",
    estimatedPeriod: "~2025–2026",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2025-mgmt-8yrs",
  },
  {
    sourceId: "opcv-2025-arch-a",
    filename: "TurkiAlmalki----MyResume.pdf",
    language: "en",
    documentVersion: "v4 — 'Engineering Leader, 8+ years' (system-architecture emphasis)",
    estimatedPeriod: "~2025–2026",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2025-arch-8yrs",
  },
  {
    sourceId: "opcv-2025-arch-b",
    filename: "TurkiAlmalki----MyResume (7).pdf",
    language: "en",
    documentVersion: "v4 — duplicate of TurkiAlmalki----MyResume.pdf (identical text)",
    estimatedPeriod: "~2025–2026",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2025-arch-8yrs",
  },
  {
    sourceId: "opcv-2026-em",
    filename: "Turki-Almalki--CV.pdf",
    language: "en",
    documentVersion: "v5 — 'Engineering Manager, 9+ years' (latest, most disciplined writing)",
    estimatedPeriod: "~2026 (current)",
    source: "operator_cv",
    ingestedAt: INGESTED_AT,
    contentFingerprint: "fp-2026-em-9yrs",
  },
];

/** Distinct documents (fingerprint groups) — the unit of extraction. */
export function distinctFingerprints(): string[] {
  return [...new Set(OPERATOR_CV_SOURCES.map((s) => s.contentFingerprint))];
}

/** All sourceIds sharing a fingerprint — recorded on each extracted unit. */
export function sourceIdsForFingerprint(fp: string): string[] {
  return OPERATOR_CV_SOURCES.filter((s) => s.contentFingerprint === fp).map((s) => s.sourceId);
}

/**
 * Terms that identify the operator personally. The personal-detail
 * firewall (§8) asserts none of these ever appears in a patternText,
 * template, before/after pair, or retrieval projection. Raw unit text
 * keeps them — that is the operator workspace, service-role only (§20).
 */
export const OPERATOR_IDENTIFYING_TERMS: string[] = [
  "Turki",
  "Almalki",
  "Monshaat",
  "Emkan",
  "Alrajhi",
  "Al Rajhi",
  "Munaseb",
  "TuwaiqPay",
  "Wa'ed",
  "Wa’ed",
  "KAUST",
  "KFU",
  "King Faisal",
  "Zayed University",
  "MISK",
  "Sarie",
  "Simah",
  "Nafath",
  "Yaqeen",
  "0550866000",
  "turkialmalki",
];

/**
 * Operator-specific metrics: real numbers from Turki's CVs that must never
 * leak into another user's rewrite (§6, §8). Patterns use [slots] instead.
 */
export const OPERATOR_METRIC_STRINGS: string[] = [
  "150%",
  "95%",
  "90%",
  "80%",
  "60%",
  "20+ engineers",
  "100k",
];
