/**
 * DETERMINISTIC ANALYSIS IDENTITY (Career V2, Parts 2–3).
 *
 * The same unchanged CV must not appear as 55 today, 59 tomorrow, 62 on
 * another run just because the LLM happened to generate slightly different
 * numbers for the same input. The fix here is not hiding the number or
 * rounding harder — it's never re-running the AI at all when the inputs
 * haven't changed: same resume content + same methodology version + same
 * target role + same job description → the exact same stored analysis is
 * reused, byte for byte.
 *
 * Fingerprinting deliberately reuses the pipeline's OWN normalization
 * (`preprocessResumeText` from preprocess.ts) rather than inventing a
 * second one — two different normalizations of "the same" text could
 * disagree at the edges and defeat the whole point.
 *
 * Identity is content, never filename — `computeResumeFingerprint` never
 * sees `original_filename`.
 */
import { preprocessResumeText } from "./preprocess.ts";

const NO_CONTEXT = "NONE";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 of the deterministically preprocessed resume text. */
export async function computeResumeFingerprint(resumeText: string): Promise<string> {
  return sha256Hex(preprocessResumeText(resumeText));
}

/**
 * Target role is free text a user types ("Senior Product Manager" vs
 * "senior product manager  "); normalize whitespace/case before hashing so
 * cosmetic differences don't force a re-analysis, while an actual role
 * change does.
 */
export async function computeTargetRoleFingerprint(targetRole: string | undefined): Promise<string> {
  if (!targetRole || targetRole.trim().length === 0) return NO_CONTEXT;
  return sha256Hex(targetRole.trim().toLowerCase().replace(/\s+/g, " "));
}

export async function computeJobDescriptionFingerprint(jobDescription: string | undefined): Promise<string> {
  if (!jobDescription || jobDescription.trim().length === 0) return NO_CONTEXT;
  return sha256Hex(preprocessResumeText(jobDescription));
}

export interface AnalysisIdentity {
  resumeFingerprint: string;
  targetRoleFingerprint: string;
  jobDescriptionFingerprint: string;
  analysisFingerprint: string;
}

/**
 * analysisFingerprint =
 *   sha256(resumeFingerprint + methodologyVersion + targetRoleFingerprint + jobDescriptionFingerprint)
 *
 * Any of the four inputs changing produces a new fingerprint and therefore
 * a fresh analysis (Part 3) — nothing here silently recalculates an old
 * report when the methodology version moves; a different methodologyVersion
 * argument is exactly what makes that a NEW fingerprint instead of a reuse.
 */
export async function computeAnalysisIdentity(params: {
  resumeText: string;
  methodologyVersion: string;
  targetRole?: string;
  jobDescription?: string;
}): Promise<AnalysisIdentity> {
  const resumeFingerprint = await computeResumeFingerprint(params.resumeText);
  const targetRoleFingerprint = await computeTargetRoleFingerprint(params.targetRole);
  const jobDescriptionFingerprint = await computeJobDescriptionFingerprint(params.jobDescription);
  const analysisFingerprint = await sha256Hex(
    resumeFingerprint + params.methodologyVersion + targetRoleFingerprint + jobDescriptionFingerprint,
  );
  return { resumeFingerprint, targetRoleFingerprint, jobDescriptionFingerprint, analysisFingerprint };
}
