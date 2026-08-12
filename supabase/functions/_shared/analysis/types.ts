/**
 * THE ANALYSIS ENGINE'S TYPE SYSTEM (Command 05 §3, §7, §10, §30, §39).
 *
 * Three layers, kept structurally distinct:
 *   - INPUT: `AnalyzeResumeRequest` — what a caller may ever submit.
 *   - MID: `NormalizedResume` — the deterministic structural extraction
 *     the AI provider evaluates against (§7).
 *   - AI CONTRACT: `DimensionAIResult` / `RewriteCandidateResult` — the
 *     ONLY shapes a `CareerAIProvider` may return (§10, §30). Notice
 *     neither carries an overall score — see scoring.ts's hard rule.
 *
 * Dependency-free like methodology/knowledge, for the same reason: it
 * must run identically under Deno (Edge Functions) and Node (tests).
 */
import type {
  AnalysisContext,
  CareerAnalysis,
  DimensionId,
  EvidenceQuality,
  Evidence,
  FactClassification,
  SeniorityLevel,
  SignalLevel,
} from "../methodology/types.ts";
import type { RetrievalExample } from "../knowledge/types.ts";

// ── §3 input schema ───────────────────────────────────────────────────────
export type SupportedLanguage = "ar" | "en" | "bilingual";
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ["ar", "en", "bilingual"];

export interface AnalyzeResumeRequest {
  resumeText: string;
  language: SupportedLanguage;
  /** The customer's UI language — controls what language customer-facing prose is written in. Optional; defaults to `language` (narrowed to ar/en) when omitted. */
  outputLanguage?: "ar" | "en";
  seniority: SeniorityLevel;
  targetRole?: string;
  roleFamily?: string;
  industry?: string;
  jobDescription?: string;
}

export interface ValidationError {
  field: string;
  reason: string;
}
export type ValidationResult =
  | { ok: true; request: AnalyzeResumeRequest }
  | { ok: false; errors: ValidationError[] };

// ── §6 redaction ─────────────────────────────────────────────────────────
export interface RedactionResult {
  redactedText: string;
  redactedEmailCount: number;
  redactedPhoneCount: number;
}

// ── §7 normalized structure ─────────────────────────────────────────────
export interface ResumeExperienceEntry {
  title: string | null;
  company: string | null;
  dates: string | null;
  bullets: string[];
  /** True when the parser could not confidently split this block into title/company/dates. */
  uncertain: boolean;
}

export interface NormalizedResume {
  header: string | null;
  summary: string | null;
  experience: ResumeExperienceEntry[];
  education: string[];
  skills: string[];
  certifications: string[];
  projects: string[];
  otherSections: Array<{ heading: string; text: string }>;
  /** The exact preprocessed + redacted text every downstream stage evaluates and evidence is verified against (§11). */
  rawTextReference: string;
  /** True when section boundaries could not be confidently identified anywhere in the document (§7: never invent a missing section). */
  structureUncertain: boolean;
}

// ── §9–§10 AI provider contract ──────────────────────────────────────────
export type AIConfidence = "high" | "medium" | "low";

/**
 * What a `CareerAIProvider` returns per dimension — the COMPACT contract
 * (Command 05D.2 §3), replacing the old dimensionId/score/confidence/
 * evidence[]/reason/recommendations[] shape after the real-provider
 * diagnostic (Command 05D.1) proved the old contract's per-dimension
 * output was too large to complete within a usable token budget (12
 * dimensions × a long free-text reason + a recommendations array +
 * multiple evidence quotes routinely exceeded max_tokens before finishing
 * even one dimension).
 *
 * Deliberately has no `overallScore` field — if a provider implementation
 * is tempted to add one, TypeScript gives it nowhere to put it. If raw
 * provider JSON contains one anyway (a misbehaving model),
 * schemaValidation.ts drops it before this type is ever constructed (§9
 * hard rule — unchanged by this contract shrink).
 *
 * What got REMOVED and why it's safe:
 *   - `evidence: Evidence[]` → `evidence: {section, excerpt} | null` (at
 *     most one quote). Multiple evidence quotes per dimension were never
 *     required for scoring or for evidenceValidation.ts's verification —
 *     one verifiable quote is exactly as load-bearing as three.
 *   - `recommendations: string[]` → removed entirely. findings.ts
 *     (`buildIssues`) already falls back to
 *     `rubricFor(dimension).recommendationRules[0]` whenever an AI result
 *     carries no recommendations — a fixed, code-owned fallback, not a
 *     capability loss.
 *   - `reason: string` (long, LLM-generated prose) → `reasonCode` (a
 *     coarse, mostly-fixed bucket — see methodology/reasonCodes.ts) +
 *     `shortReason` (one short sentence of nuance, length-guided but not
 *     hard-truncated by validation — see schemaValidation.ts).
 *
 * Career V2 Part 4 removed the last thing the LLM invented unconstrained:
 * `score: number`. It now returns a rubric CLASSIFICATION —
 * `signalLevel` (which of the rubric's own 5 anchor bands the CV falls
 * in) + `evidencePresent`/`evidenceQuality` (how much of that
 * classification is backed by a checkable quote) — and
 * `methodology/scoring.ts`'s `rubricScoreFor` is the ONLY place that
 * becomes a number. Both fields are closed enums enforced by Anthropic's
 * own tool-use JSON schema (the same mechanism `confidence` and
 * `dimensionId` already use successfully here — NOT the same mechanism
 * `reasonCode` deliberately avoids; see schemaValidation.ts's note on why
 * `reasonCode` stays a free string).
 */
export interface DimensionAIResult {
  dimensionId: DimensionId;
  signalLevel: SignalLevel;
  evidencePresent: boolean;
  evidenceQuality: EvidenceQuality;
  confidence: AIConfidence;
  evidence: { section: string; excerpt: string } | null;
  reasonCode: string;
  shortReason: string;
}

export interface AnalyzeDimensionsInput {
  normalizedResume: NormalizedResume;
  context: AnalysisContext;
  dimensionIds: DimensionId[];
  /** Composed, filtered methodology sections (compose.ts) — rendered to provider format by the provider adapter. */
  methodologySections: unknown;
  /** §14: 0–4 retrieved examples, already budgeted and ranked. */
  examples: RetrievalExample[];
}

export interface RewriteGenerationInput {
  normalizedResume: NormalizedResume;
  context: AnalysisContext;
  /** The exact CV text being considered for rewrite — must appear verbatim in rawTextReference. */
  candidateBefore: string;
  dimension: DimensionId;
}

export interface RewriteCandidateResult {
  before: string;
  after: string;
  classification: FactClassification;
  note: string;
}

/**
 * §30: the methodology/scoring engine never knows which model is behind
 * this. Two calls only, by design (§8 — documented in
 * docs/career-analysis-engine.md): one dimension pass, one rewrite pass.
 */
export interface CareerAIProvider {
  readonly name: string;
  readonly model: string;
  analyzeDimensions(input: AnalyzeDimensionsInput): Promise<DimensionAIResult[]>;
  generateRewrite(input: RewriteGenerationInput): Promise<RewriteCandidateResult | null>;
  /**
   * Token usage + provider stop reason for the MOST RECENT call only
   * (either method above) — counts and a short fixed-vocabulary status
   * string, never content (§34's "no raw content" discipline extends
   * here — `stopReason` is Anthropic's own enum value, e.g. "end_turn" /
   * "max_tokens" / "tool_use", never model output). Optional because
   * mockProvider.ts has no real usage to report. pipeline.ts reads this
   * immediately after each call and accumulates into `instrumentation` —
   * see Command 05C §5 (token usage / cost measurement) and Command
   * 05D.3 (stop_reason surfaced for the real-AI reliability suite).
   */
  lastCallUsage?(): { inputTokens: number; outputTokens: number; stopReason: string | null } | undefined;
}

// ── §0 knowledge mode ─────────────────────────────────────────────────────
/** Never "all" — see knowledgeMode.ts. */
export type KnowledgeMode = "approved" | "fixture";

// ── §8 pipeline run ───────────────────────────────────────────────────────
export interface AnalysisRunOptions {
  provider: CareerAIProvider;
  knowledgeMode: KnowledgeMode;
  /**
   * Must be `true` for every call in this command — real customer mode is
   * blocked at both this layer and the Edge Function layer while
   * PRIVACY_SECURITY_EXECUTION_VERIFIED is false (§2, §40).
   */
  isFixtureRun: boolean;
}

// ── §29 schema validation ─────────────────────────────────────────────────
export interface SchemaIssue {
  path: string;
  issue: string;
}

// ── §13 fact conflicts ─────────────────────────────────────────────────────
export interface MetricConflict {
  /** The surrounding phrase the conflicting numbers share (normalized). */
  context: string;
  values: string[];
}

// ── §34 instrumentation (no raw content, ever) ────────────────────────────
export interface AnalysisInstrumentation {
  inputCharCount: number;
  examplesRetrieved: number;
  aiCallCount: number;
  retryCount: number;
  durationMs: number;
  provider: string;
  model: string;
  /** Summed across every AI call this run made (real provider only — 0 on the mock). */
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Anthropic's own stop_reason from the MOST RECENT dimension call (real provider only) — a short fixed-vocabulary string, never model output. Command 05D.3. */
  stopReason: string | null;
}

// ── §39 reproducibility metadata ──────────────────────────────────────────
export interface AnalysisEngineMetadata {
  methodologyVersion: CareerAnalysis["methodologyVersion"];
  analysisPipelineVersion: string;
  knowledgeVersion: string;
  provider: string;
  model: string;
  retrievedExampleIds: string[];
  timestamp: string;
}

export interface AnalysisRunResult {
  analysis: CareerAnalysis;
  engineMetadata: AnalysisEngineMetadata;
  instrumentation: AnalysisInstrumentation;
  factConflicts: MetricConflict[];
}

// ── Pipeline failure — never leaks internals to the customer (§35) ────────
export type AnalysisFailureCode = "ANALYSIS_FAILED" | "ANALYSIS_TIMEOUT";

export class AnalysisPipelineError extends Error {
  readonly code: AnalysisFailureCode;
  readonly issues?: SchemaIssue[];
  constructor(code: AnalysisFailureCode, message: string, issues?: SchemaIssue[]) {
    super(message);
    this.code = code;
    this.issues = issues;
  }
}
