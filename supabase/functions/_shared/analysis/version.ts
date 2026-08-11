/**
 * ANALYSIS PIPELINE VERSIONING (Command 05 §39).
 *
 * Distinct from CAREER_METHODOLOGY_VERSION (the brain) and
 * OPERATOR_CV_INGESTION_VERSION (the knowledge). This one changes when the
 * PIPELINE's shape changes — stage count, evidence-validation rules,
 * fact-preservation enforcement, schema contracts — even if the
 * methodology and knowledge underneath stay the same version. Every
 * CareerAnalysis's engine metadata carries all three so a report can
 * always be traced to exactly which brain, knowledge, and machinery
 * produced it.
 */
export const ANALYSIS_PIPELINE_VERSION = "career_analysis_pipeline_v1";
