-- ═══════════════════════════════════════════════════════════════════════
-- CAREER PRIVACY, SECURITY & TRUST — foundation (Command 02)
--
-- Builds on 01B (career_core.sql) and 01C (generic_payment_verification.sql).
-- Adds nothing that lets AI methodology, scoring, or the /career UI exist —
-- purely the privacy/consent/deletion substrate those features must sit on
-- top of. See docs/career-privacy.md for the full data-flow picture this
-- migration implements.
--
-- Same discipline as the prior two migrations: RLS enabled AND FORCED on
-- every new table, every policy scoped to auth.uid(), every privileged
-- write path either a security-definer function with EXECUTE revoked from
-- PUBLIC, or a table grant that exactly matches its policy surface.
--
-- Order below is dependency order, not narrative order: consent (Part A)
-- has to exist before knowledge.approved_examples (Part B) can foreign-key
-- into it.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- PART A — consent model (Command 02 §9–10)
--
-- Default is NO ROW: a user with zero rows here has granted nothing. A
-- row's existence with a null `revoked_at` is the only thing that ever
-- means "consented." Nothing else — not payment, not account creation,
-- not scanner usage — is ever read as consent anywhere in this schema.
-- ═══════════════════════════════════════════════════════════════════════

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null check (consent_type in ('knowledge_contribution')),
  policy_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- One ACTIVE (unrevoked) grant per (user, consent_type) at a time. Granting
-- again after a revocation inserts a new row rather than reusing the old
-- one — full history stays append-only and auditable; see the trigger
-- below for why an old row can never be resurrected in place.
create unique index user_consents_active_unique
  on public.user_consents (user_id, consent_type)
  where revoked_at is null;

create index user_consents_user_id_idx on public.user_consents (user_id);

alter table public.user_consents enable row level security;
alter table public.user_consents force row level security;

create policy "user_consents_select_own"
  on public.user_consents for select
  to authenticated
  using (user_id = (select auth.uid()));

-- A user may only ever grant consent FOR THEMSELVES — this is what makes
-- Security Test G ("user cannot grant themselves knowledge-contribution
-- consent for another user") fail closed: `user_id` is checked against the
-- caller's own auth.uid() by RLS, not trusted from the row the client sent.
create policy "user_consents_insert_own"
  on public.user_consents for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and revoked_at is null
  );

-- Update is allowed only to revoke — the trigger below is what actually
-- enforces that (RLS can scope *which rows*, not *which columns*).
create policy "user_consents_revoke_own"
  on public.user_consents for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No delete policy anywhere: a consent decision is never erased, only
-- superseded by a revocation row-state change or a fresh grant row. This
-- is what makes "revoked consent reads as inactive" (Test H) a permanent,
-- auditable fact instead of something a client could undo by deleting the
-- row and re-inserting an unrevoked one.

create function public.enforce_consent_append_only()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.consent_type is distinct from old.consent_type
     or new.policy_version is distinct from old.policy_version
     or new.granted_at is distinct from old.granted_at
     or new.created_at is distinct from old.created_at then
    raise exception 'consent_rows_are_append_only';
  end if;

  -- revoked_at may move from null → a timestamp exactly once. It may
  -- never move backwards to null (no self-service "un-revoke") and never
  -- move from one timestamp to a different one (no backdating).
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'consent_revocation_is_final';
  end if;

  return new;
end;
$$;

create trigger user_consents_append_only
  before update on public.user_consents
  for each row execute function public.enforce_consent_append_only();

grant select, insert, update on public.user_consents to authenticated;
grant select, insert, update on public.user_consents to service_role;

-- The check any future ingestion path MUST call before treating a user's
-- material as usable — not just at upload time, but again at the moment
-- of ingestion, so a revocation between "approved" and "ingested" is
-- honored (Command 02 §10). security definer + revoked from PUBLIC: only
-- backend/service-role code can call it, since it can check ANY user's
-- consent, not just the caller's own row.
create function public.has_active_consent(p_user_id uuid, p_consent_type text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_consents
    where user_id = p_user_id
      and consent_type = p_consent_type
      and revoked_at is null
  );
$$;

revoke execute on function public.has_active_consent(uuid, text) from public;
grant execute on function public.has_active_consent(uuid, text) to service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- PART B — data classification, enforced by schema, not just documented
--
--   A. PRIVATE CUSTOMER DATA   → public.resumes, public.resume_analyses
--                                 (existing, 01B) + storage `career-resumes`
--   B. PAYMENT / ACCOUNT DATA  → public.purchases, public.entitlements
--                                 (existing, 01B/01C)
--   C. PRODUCT KNOWLEDGE       → knowledge.* (NEW — separate Postgres
--                                 schema, not just separate tables)
--   D. ANALYTICS               → not a database concern in this MVP; see
--                                 src/lib/careerAnalytics.ts (frontend-side
--                                 allowlist, no PII ever reaches GTM/dataLayer)
--
-- Putting C in its own schema, outside `api.schemas` in config.toml
-- (["public", "graphql_public"]), is what makes "A cannot accidentally
-- become C" a property of the deployment, not a habit an engineer has to
-- remember: knowledge.* is unreachable through PostgREST — no publishable
-- key, no user JWT, no RLS policy on a public-schema table can ever expose
-- it — and reachable only from a service-role Postgres connection, which
-- today no Edge Function opens against it (nothing in this command reads
-- or writes knowledge.* — see Part D below).
-- ═══════════════════════════════════════════════════════════════════════

create schema knowledge;

comment on schema knowledge is
  'TURKI CAREER KNOWLEDGE — rubrics, approved examples, patterns. Physically separate from the `public` schema that holds live customer data, and NOT in api.schemas (supabase/config.toml), so it is unreachable from the browser or from PostgREST under any key. Nothing in this codebase writes to it yet; see docs/career-privacy.md for the ingestion rules this schema is designed around.';

-- ── knowledge.career_rubrics ─────────────────────────────────────────────
-- Scoring/evaluation criteria. Operator-authored, never derived from a
-- specific customer's CV.
create table knowledge.career_rubrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_family text,
  version text not null,
  criteria jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── knowledge.approved_examples ──────────────────────────────────────────
-- The ONLY table in this schema that could ever, structurally, trace back
-- to a real customer — and only through `source_consent_id`, a nullable
-- pointer to the consent record that authorized it. There is deliberately
-- no foreign key to `public.resumes` or `public.resume_analyses`: an
-- approved example's `content` must already be the anonymized text itself,
-- not a live reference to the customer's row, so revoking consent or
-- deleting the source resume later can never silently mutate or delete an
-- already-approved example out from under the knowledge base (see §10 of
-- the brief — revocation only blocks *future* use, documented in
-- docs/career-privacy.md).
create table knowledge.approved_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  role_family text,
  experience_level text,
  language text not null default 'en' check (language in ('ar', 'en')),
  content jsonb not null,
  source text not null
    check (source in ('operator_cv', 'manual_example', 'synthetic', 'customer_opt_in')),
  -- Required precisely when source = 'customer_opt_in' — enforced below,
  -- not just documented, so a customer example can never be inserted
  -- without a recorded consent to point at.
  source_consent_id uuid references public.user_consents (id),
  anonymized boolean not null default false,
  approved_by text not null,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint approved_examples_customer_source_requires_consent
    check (source <> 'customer_opt_in' or source_consent_id is not null),
  constraint approved_examples_customer_source_requires_anonymization
    check (source <> 'customer_opt_in' or anonymized)
);

-- ── knowledge.before_after_patterns ──────────────────────────────────────
create table knowledge.before_after_patterns (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  role_family text,
  before_text text not null,
  after_text text not null,
  explanation text,
  source_example_id uuid references knowledge.approved_examples (id),
  created_at timestamptz not null default now()
);

-- ── knowledge.role_patterns ───────────────────────────────────────────────
create table knowledge.role_patterns (
  id uuid primary key default gen_random_uuid(),
  role_family text not null,
  experience_level text,
  pattern jsonb not null,
  created_at timestamptz not null default now()
);

-- Belt-and-suspenders on top of the schema boundary itself: RLS enabled
-- and forced on every knowledge.* table, with ZERO policies for anon/
-- authenticated — a default-deny that holds even if a future migration
-- ever adds `knowledge` to api.schemas by mistake. Only service_role
-- (which bypasses RLS entirely, same as every other privileged path in
-- this codebase) can read or write these tables, and only from
-- server-side code that intentionally connects to them — none exists yet.
alter table knowledge.career_rubrics enable row level security;
alter table knowledge.career_rubrics force row level security;
alter table knowledge.approved_examples enable row level security;
alter table knowledge.approved_examples force row level security;
alter table knowledge.before_after_patterns enable row level security;
alter table knowledge.before_after_patterns force row level security;
alter table knowledge.role_patterns enable row level security;
alter table knowledge.role_patterns force row level security;

revoke all on schema knowledge from public, anon, authenticated;
grant usage on schema knowledge to service_role;
grant select, insert, update, delete on all tables in schema knowledge to service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- PART C — deletion audit trail (Command 02 §7–8)
-- ═══════════════════════════════════════════════════════════════════════

create table public.deletion_audit (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('resume', 'resume_analysis', 'career_account')),
  entity_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('soft_delete', 'hard_delete', 'purge')),
  performed_by text not null,
  created_at timestamptz not null default now()
);

create index deletion_audit_user_id_idx on public.deletion_audit (user_id);

alter table public.deletion_audit enable row level security;
alter table public.deletion_audit force row level security;

-- Users can see their own deletion history (transparency — this is what
-- backs the "Your choices" section of /career/privacy) but can never
-- write to it: every row is inserted by a service-role deletion function,
-- never by the client.
create policy "deletion_audit_select_own"
  on public.deletion_audit for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.deletion_audit to authenticated;
grant select, insert on public.deletion_audit to service_role;

-- ── resume_analyses gets a deletion marker, matching resumes' existing one ─
alter table public.resume_analyses add column deleted_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════
-- PART D — deletion RPCs (Command 02 §7–8)
--
-- Both are security-definer, both re-check ownership against the caller's
-- OWN verified id (passed by the Edge Function from auth.getUser(), never
-- trusted from the request body) rather than trusting the Edge Function's
-- own check alone — same double-check pattern as request_payment_verification
-- in the 01C migration. Both are idempotent: calling twice is a no-op the
-- second time, never an error.
-- ═══════════════════════════════════════════════════════════════════════

create function public.delete_resume(
  p_resume_id uuid,
  p_user_id uuid,
  p_performed_by text default 'delete-resume-edge-function'
) returns table (resume_id uuid, storage_path text, already_deleted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resume public.resumes;
begin
  select * into v_resume from public.resumes where id = p_resume_id for update;

  -- Not found and "found but belongs to someone else" return the SAME
  -- exception, on purpose — a caller learns nothing about whether a
  -- resume id they don't own exists (Command 02 §7: "User A must never be
  -- able to delete User B's CV by guessing an ID", and §5's broader
  -- "known/guessed object path → no information leak").
  if not found or v_resume.user_id is distinct from p_user_id then
    raise exception 'resume_not_found';
  end if;

  if v_resume.deleted_at is not null then
    -- Idempotent no-op: still hand back the storage path so a retried
    -- call can safely re-attempt storage cleanup (e.g. a prior call's
    -- storage.remove() failed after the DB commit succeeded).
    return query select v_resume.id, v_resume.storage_path, true;
    return;
  end if;

  update public.resumes set deleted_at = now() where id = p_resume_id;
  update public.resume_analyses
    set deleted_at = now()
    where resume_id = p_resume_id and deleted_at is null;

  insert into public.deletion_audit (entity_type, entity_id, user_id, action, performed_by)
  values ('resume', p_resume_id, p_user_id, 'soft_delete', p_performed_by);

  return query select v_resume.id, v_resume.storage_path, false;
end;
$$;

revoke execute on function public.delete_resume(uuid, uuid, text) from public;
grant execute on function public.delete_resume(uuid, uuid, text) to service_role;

-- Foundation for "Delete my Career data": every resume + analysis a user
-- owns, soft-deleted in one transaction. Deliberately does NOT touch
-- `purchases` or `entitlements` — see docs/career-privacy.md, "Career
-- content vs. financial records", for why those are kept even when a user
-- deletes their career content (refund/dispute handling, tax/accounting
-- retention, fraud prevention — the same reasons any paid product keeps a
-- financial audit trail after a customer deletes their account).
create function public.delete_career_data(
  p_user_id uuid,
  p_performed_by text default 'delete-career-data-edge-function'
) returns table (resume_id uuid, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with target as (
    select r.id, r.storage_path
    from public.resumes r
    where r.user_id = p_user_id and r.deleted_at is null
    for update
  ),
  deleted_resumes as (
    update public.resumes
      set deleted_at = now()
      where id in (select id from target)
      returning id
  ),
  deleted_analyses as (
    update public.resume_analyses
      set deleted_at = now()
      where user_id = p_user_id and deleted_at is null
      returning id
  ),
  audit_rows as (
    insert into public.deletion_audit (entity_type, entity_id, user_id, action, performed_by)
    select 'resume', id, p_user_id, 'soft_delete', p_performed_by from deleted_resumes
    union all
    select 'career_account', p_user_id, p_user_id, 'soft_delete', p_performed_by
    where exists (select 1 from deleted_resumes)
    returning 1
  )
  select target.id, target.storage_path from target;
end;
$$;

revoke execute on function public.delete_career_data(uuid, text) from public;
grant execute on function public.delete_career_data(uuid, text) to service_role;
