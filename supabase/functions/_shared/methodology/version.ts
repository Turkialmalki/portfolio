/**
 * METHODOLOGY VERSIONING (Command 03 §1).
 *
 * Every analysis ever produced must record the methodology version that
 * produced it, so scoring rules can improve later without silently
 * changing the meaning of old reports. Rules live in the modules of this
 * directory — never hardcoded into ad-hoc prompts — and a change to
 * weights, bands, caps, or rubric semantics REQUIRES a new version string
 * here plus a new seed of `knowledge.career_rubrics` rows carrying it.
 *
 * v1 → v2 (Career V2): the LLM stopped inventing a raw 0–100 number per
 * dimension and now returns a constrained rubric classification
 * (signalLevel + evidenceQuality — see types.ts), which scoring.ts's
 * `rubricScoreFor` turns into the number deterministically. This is a
 * real scoring-methodology change — analyses already stored under v1 keep
 * their v1 value and are NEVER silently recalculated under v2 (Career V2
 * Part 3); the analysis-reuse fingerprint (fingerprint.ts) includes this
 * version string precisely so a version bump always produces a fresh
 * fingerprint, never a false cache hit against a differently-scored v1
 * row.
 */
export const CAREER_METHODOLOGY_VERSION = "career_methodology_v2";

export type MethodologyVersion = typeof CAREER_METHODOLOGY_VERSION;
