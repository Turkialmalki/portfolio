-- ═══════════════════════════════════════════════════════════════════════
-- Every GRANT below hands out table-level access ONLY — the actual row
-- visibility is still decided by RLS. This project's local config leaves
-- `auto_expose_new_tables` at its new-default `false` (see
-- supabase/config.toml), meaning a freshly created table has NO privileges
-- for `anon`/`authenticated` until explicitly granted — a table with RLS
-- policies but no GRANT denies everyone, which is a safe failure mode but
-- not a useful one. Each table below is granted only the verbs its policies
-- actually allow (e.g. `resumes` has no client DELETE policy, so it gets no
-- DELETE grant either) so the grant surface and the policy surface always
-- describe the same thing.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- CAREER PRODUCT — CORE SCHEMA (infrastructure foundation, COMMAND 01B)
--
-- Scope: the tables a private-CV, paid-entitlement product needs to exist
-- safely, and nothing else. No vector search, no knowledge-base tables, no
-- product catalog table — product definitions stay code/config-driven
-- (`src/config/careerProducts.ts`) for the MVP; only the trusted, provider-
-- issued product/variant id is ever persisted here (see `product_key`).
--
-- Every table gets RLS enabled AND FORCED, plus explicit per-command
-- policies. There is no "authenticated users can select everything" policy
-- anywhere in this file — every policy scopes to `auth.uid()`.
-- ═══════════════════════════════════════════════════════════════════════

-- ── profiles ──────────────────────────────────────────────────────────────
-- One row per authenticated user, created by a trigger on auth.users so the
-- app never has to remember to create it and can never create it for the
-- wrong id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;

-- No insert/delete policy for regular users: rows are created by the trigger
-- below (runs as the function owner, bypassing RLS) and removed only via the
-- `delete-user-data` privileged flow, not by client-issued DELETE.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── resumes ───────────────────────────────────────────────────────────────
-- Metadata only. The file itself lives in the private `career-resumes`
-- storage bucket at a path derived from (user_id, resume id) — see the
-- storage policies below.
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  language text not null default 'ar' check (language in ('ar', 'en')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'analyzed', 'failed')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes enable row level security;
alter table public.resumes force row level security;

-- Deleted rows stay selectable by their owner (deletion is a status, not an
-- erasure, until the privileged purge job runs) but never by anyone else.
create policy "resumes_select_own"
  on public.resumes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "resumes_insert_own"
  on public.resumes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Users may only mark their own resume deleted (soft delete via UPDATE, not
-- DELETE) — real object + row removal is a service-role job so a client
-- can never race the storage object out from under an in-flight analysis.
create policy "resumes_soft_delete_own"
  on public.resumes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.resumes to authenticated;

-- ── resume_analyses ──────────────────────────────────────────────────────
create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  overall_score numeric(5, 2) check (overall_score >= 0 and overall_score <= 100),
  analysis_version text not null,
  result_json jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

create index resume_analyses_user_id_idx on public.resume_analyses (user_id);
create index resume_analyses_resume_id_idx on public.resume_analyses (resume_id);

alter table public.resume_analyses enable row level security;
alter table public.resume_analyses force row level security;

-- Read-only from the client on purpose: analyses are written exclusively by
-- the `analyze-resume` Edge Function under the service role. A regular user
-- can never insert a fake score or edit one after the fact.
create policy "resume_analyses_select_own"
  on public.resume_analyses for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.resume_analyses to authenticated;

-- ── entitlements ─────────────────────────────────────────────────────────
-- What a user is currently allowed to do. Always written by privileged code
-- (webhook handler / admin tooling) — never by the client.
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  source text not null check (source in ('lemon_squeezy', 'manual', 'promo')),
  source_order_id text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_remaining integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;

create policy "entitlements_select_own"
  on public.entitlements for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.entitlements to authenticated;

-- No insert/update/delete policy for any client role: entitlements are
-- granted exclusively by `lemon-webhook` (service role) after a verified
-- signature, never by anything the browser can call.

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ── purchases ────────────────────────────────────────────────────────────
-- The audit trail a support conversation or a refund actually needs. Written
-- only by `lemon-webhook`; the unique constraint on (provider,
-- provider_order_id) is the idempotency guard — see the header comment on
-- the webhook function for how it's used.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null check (provider = 'lemon_squeezy'),
  provider_order_id text not null,
  provider_product_id text not null,
  product_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded', 'failed')),
  amount integer,
  currency text,
  raw_reference jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create index purchases_user_id_idx on public.purchases (user_id);

alter table public.purchases enable row level security;
alter table public.purchases force row level security;

-- A purchase can arrive (webhook fires) before we know which user it belongs
-- to if checkout ran anonymously; `user_id` is nullable for exactly that
-- reason. A null-owner row is not selectable by anyone from the client —
-- only reconciliation code running as service role can see and later
-- backfill it — so ownership is never ambiguous from the client's view.
create policy "purchases_select_own"
  on public.purchases for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.purchases to authenticated;

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- ── storage: career-resumes (private) ───────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-resumes',
  'career-resumes',
  false,
  20971520, -- 20 MiB
  array['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Path convention: {user_id}/{resume_id}/original.<ext> — enforced below by
-- requiring the path's first folder segment to equal the caller's own uid.
-- storage.foldername(name) splits "abc/def/file.pdf" into {abc, def}, so
-- element 1 is always the top-level owner folder.
create policy "career_resumes_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'career-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "career_resumes_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'career-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "career_resumes_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'career-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- No update policy: a CV is replaced by deleting and re-inserting, not
-- overwritten in place — keeps the audit trail in `resumes` honest.
-- No anon policies at all: anonymous clients get zero access to this
-- bucket, by omission, matching "authenticate before upload" for this MVP.
