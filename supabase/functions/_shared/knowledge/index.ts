/** Command 04 — operator-CV knowledge base: single import surface. */
export * from "./types.ts";
export { OPERATOR_CV_INGESTION_VERSION } from "./version.ts";
export {
  OPERATOR_CV_SOURCES,
  OPERATOR_IDENTIFYING_TERMS,
  OPERATOR_METRIC_STRINGS,
  distinctFingerprints,
  sourceIdsForFingerprint,
} from "./operatorCvSources.ts";
export { CV_CONTENT_UNITS, REVIEW_FLAGS, unitsByQuality } from "./operatorCvUnits.ts";
export { BEFORE_AFTER_PAIRS } from "./operatorCvBeforeAfter.ts";
export {
  ALL_PATTERNS,
  ANTI_PATTERNS,
  BULLET_PATTERNS,
  LEADERSHIP_PATTERNS,
  PROJECT_PATTERNS,
  SUMMARY_PATTERNS,
  TECHNICAL_PATTERNS,
} from "./reusablePatterns.ts";
export { EXAMPLE_BUDGET, MAX_SENIORITY_DISTANCE, retrieveExamples } from "./retrieval.ts";
export {
  buildBeforeAfterRows,
  buildCandidateExampleRows,
  buildRetrievalPool,
  buildRolePatternRows,
  violatesPersonalFirewall,
  type CandidateBeforeAfterRow,
  type CandidateExampleRow,
} from "./ingest.ts";
