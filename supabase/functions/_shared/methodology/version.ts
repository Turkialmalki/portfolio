/**
 * METHODOLOGY VERSIONING (Command 03 §1).
 *
 * Every analysis ever produced must record the methodology version that
 * produced it, so scoring rules can improve later without silently
 * changing the meaning of old reports. Rules live in the modules of this
 * directory — never hardcoded into ad-hoc prompts — and a change to
 * weights, bands, caps, or rubric semantics REQUIRES a new version string
 * here plus a new seed of `knowledge.career_rubrics` rows carrying it.
 */
export const CAREER_METHODOLOGY_VERSION = "career_methodology_v1";

export type MethodologyVersion = typeof CAREER_METHODOLOGY_VERSION;
