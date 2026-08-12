-- Career V2 — deterministic analysis identity (Command: "CAREER V2" Part 2–3).
--
-- Problem: the same unchanged CV could score differently run to run because
-- every resubmission re-called Anthropic and inserted a fresh
-- `resume_analyses` row — nothing recorded WHAT was analyzed (content, not
-- filename) or WITH WHAT methodology, and nothing reused a prior identical
-- result. This migration adds the identity columns; the reuse LOOKUP itself
-- lives in analyze-resume/index.ts (application code, not SQL), which reads
-- these columns through the caller's own RLS-scoped client before ever
-- calling the AI provider.
--
-- `analysis_fingerprint` is
--   sha256(resumeFingerprint + methodologyVersion + targetRoleFingerprint + jobDescriptionFingerprint)
-- computed server-side from the deterministically preprocessed resume text
-- (preprocess.ts's `preprocessResumeText`, already the pipeline's own
-- normalization step — nothing new invented here) plus normalized
-- target-role/job-description text, or the literal string "NONE" when
-- absent. Same inputs → same fingerprint → same row reused; any real change
-- to the resume, the methodology version, the target role, or the job
-- description produces a new fingerprint and a fresh analysis, per Part 3.

alter table public.resumes
  add column content_fingerprint text;

alter table public.resume_analyses
  add column methodology_version text,
  add column resume_fingerprint text,
  add column target_role_fingerprint text,
  add column job_description_fingerprint text,
  add column analysis_fingerprint text;

comment on column public.resumes.content_fingerprint is
  'SHA-256 of the deterministically preprocessed extracted resume text. Identity is content, never filename.';
comment on column public.resume_analyses.methodology_version is
  'CAREER_METHODOLOGY_VERSION at analysis time (additive — analysis_version keeps meaning the pipeline version, unchanged).';
comment on column public.resume_analyses.resume_fingerprint is
  'SHA-256 of the preprocessed resume text this specific analysis ran against.';
comment on column public.resume_analyses.target_role_fingerprint is
  'SHA-256 of the normalized target role string, or the literal "NONE".';
comment on column public.resume_analyses.job_description_fingerprint is
  'SHA-256 of the preprocessed job description text, or the literal "NONE".';
comment on column public.resume_analyses.analysis_fingerprint is
  'sha256(resume_fingerprint + methodology_version + target_role_fingerprint + job_description_fingerprint). Same fingerprint + same user -> the existing row is reused instead of a new AI call (Part 2/3).';

-- One reusable "complete" analysis per (resume, exact analysis identity).
-- Scoped to resume_id — not just user_id — to match the existing
-- reuse/retry key `analyze-resume`/`get-full-review` already use (the same
-- resumeId can be resubmitted to retry; get-full-review reads the latest
-- complete row for a given resume_id). Partial so failed/pending rows (and
-- soft-deleted ones) never block a retry from creating a fresh attempt.
create unique index resume_analyses_reuse_idx
  on public.resume_analyses (resume_id, analysis_fingerprint)
  where status = 'complete' and deleted_at is null and analysis_fingerprint is not null;

-- Lookup pattern is `select ... where resume_id = $1 and
-- analysis_fingerprint = $2 and status = 'complete'` through the existing
-- resume_analyses_select_own RLS policy (still filtered to the caller's own
-- rows) — no new policy needed, this index only makes that lookup and the
-- uniqueness guarantee cheap and race-safe.
create index resumes_content_fingerprint_idx
  on public.resumes (user_id, content_fingerprint);
