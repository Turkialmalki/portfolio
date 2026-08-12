/**
 * INPUT SCHEMA VALIDATION (Command 05 §3).
 *
 * Rejects malformed requests before any AI invocation — no wasted call,
 * no half-processed state. Limits are generous (a real CV, even a long
 * one, fits well inside them) but finite, so a request can't be used to
 * push an unbounded string into a prompt.
 */
import { SENIORITY_LEVELS } from "../methodology/types.ts";
import type { AnalyzeResumeRequest, ValidationError, ValidationResult } from "./types.ts";
import { SUPPORTED_LANGUAGES } from "./types.ts";

export const LIMITS = {
  resumeTextMin: 30,
  resumeTextMax: 20_000,
  targetRoleMax: 200,
  roleFamilyMax: 100,
  industryMax: 100,
  jobDescriptionMax: 10_000,
} as const;

export function validateAnalyzeResumeRequest(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ field: "$", reason: "request body must be a JSON object" }] };
  }
  const r = input as Record<string, unknown>;

  const resumeText = r.resumeText;
  if (typeof resumeText !== "string" || resumeText.trim().length === 0) {
    errors.push({ field: "resumeText", reason: "resumeText is required and must be a non-empty string" });
  } else if (resumeText.length < LIMITS.resumeTextMin) {
    errors.push({ field: "resumeText", reason: `resumeText must be at least ${LIMITS.resumeTextMin} characters` });
  } else if (resumeText.length > LIMITS.resumeTextMax) {
    errors.push({ field: "resumeText", reason: `resumeText must be at most ${LIMITS.resumeTextMax} characters` });
  }

  const language = r.language;
  if (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language as never)) {
    errors.push({ field: "language", reason: `language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}` });
  }

  if (r.outputLanguage !== undefined) {
    if (r.outputLanguage !== "ar" && r.outputLanguage !== "en") {
      errors.push({ field: "outputLanguage", reason: "outputLanguage must be one of: ar, en" });
    }
  }

  const seniority = r.seniority;
  if (typeof seniority !== "string" || !SENIORITY_LEVELS.includes(seniority as never)) {
    errors.push({ field: "seniority", reason: `seniority must be one of: ${SENIORITY_LEVELS.join(", ")}` });
  }

  if (r.targetRole !== undefined) {
    if (typeof r.targetRole !== "string" || r.targetRole.length > LIMITS.targetRoleMax) {
      errors.push({ field: "targetRole", reason: `targetRole must be a string of at most ${LIMITS.targetRoleMax} characters` });
    }
  }
  if (r.roleFamily !== undefined) {
    if (typeof r.roleFamily !== "string" || r.roleFamily.length > LIMITS.roleFamilyMax) {
      errors.push({ field: "roleFamily", reason: `roleFamily must be a string of at most ${LIMITS.roleFamilyMax} characters` });
    }
  }
  if (r.industry !== undefined) {
    if (typeof r.industry !== "string" || r.industry.length > LIMITS.industryMax) {
      errors.push({ field: "industry", reason: `industry must be a string of at most ${LIMITS.industryMax} characters` });
    }
  }
  if (r.jobDescription !== undefined) {
    if (typeof r.jobDescription !== "string" || r.jobDescription.length > LIMITS.jobDescriptionMax) {
      errors.push({ field: "jobDescription", reason: `jobDescription must be a string of at most ${LIMITS.jobDescriptionMax} characters` });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const request: AnalyzeResumeRequest = {
    resumeText: resumeText as string,
    language: language as AnalyzeResumeRequest["language"],
    outputLanguage: r.outputLanguage as AnalyzeResumeRequest["outputLanguage"],
    seniority: seniority as AnalyzeResumeRequest["seniority"],
    targetRole: r.targetRole as string | undefined,
    roleFamily: r.roleFamily as string | undefined,
    industry: r.industry as string | undefined,
    jobDescription: r.jobDescription as string | undefined,
  };
  return { ok: true, request };
}
