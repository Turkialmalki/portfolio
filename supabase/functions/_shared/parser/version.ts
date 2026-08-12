/**
 * RESUME PARSER VERSIONING (Command 05B §19, mirrors analysis/version.ts).
 *
 * Distinct from ANALYSIS_PIPELINE_VERSION, CAREER_METHODOLOGY_VERSION, and
 * OPERATOR_CV_INGESTION_VERSION. This one changes when the FILE → TEXT
 * boundary's shape changes — extraction logic, normalization rules,
 * validation limits — even if nothing downstream of it changes. Every
 * `ParsedResume` carries this so a report can always be traced back to
 * exactly which parser produced the normalized text it was scored from.
 */
export const RESUME_PARSER_VERSION = "resume_parser_v1";
