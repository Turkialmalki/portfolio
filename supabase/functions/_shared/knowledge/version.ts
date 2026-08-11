/**
 * Command 04 — operator-CV ingestion versioning.
 *
 * Every knowledge row produced by this ingestion carries this string, so
 * re-ingestion replaces exactly its own rows (§28) and provenance of the
 * methodology seed (career_methodology_v1) is never touched (§19).
 */
export const OPERATOR_CV_INGESTION_VERSION = "operator_cv_ingestion_v1";
