-- ═══════════════════════════════════════════════════════════════════════
-- CAREER PRIVACY & SECURITY TESTS (Command 02 §22–23)
--
-- Run against the LOCAL Supabase stack only, with FAKE fixture data only
-- (Command 02 §23 — never a real CV). Requires `supabase start` to be
-- running (Postgres on 127.0.0.1:54322 by default).
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/career_privacy_security.sql
--
-- Each test is a DO block that RAISE EXCEPTIONs on failure (aborting the
-- whole script under ON_ERROR_STOP) and RAISE NOTICEs "PASS: <name>" on
-- success, so a clean run prints one PASS line per test and nothing else.
-- Everything runs inside one transaction and is rolled back at the end —
-- this script never leaves fixture rows behind in a real database.
--
-- Simulating "as user X" for RLS: Supabase's `auth.uid()` reads
-- `request.jwt.claims->>'sub'`. Setting that GUC + `set local role
-- authenticated` is the standard way to exercise RLS from plain SQL —
-- see Supabase's own RLS testing docs. No real JWT is minted or needed.
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- ── Fixtures — fake test users only, per Command 02 §23 ─────────────────
-- Test User Alpha / alpha@example.test / +966500000001
-- Test User Beta  / beta@example.test  / +966500000002
-- Minimal auth.users columns needed for local GoTrue's schema to accept
-- the rows without a real signup flow.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alpha@example.test', crypt('test-fixture-only', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'beta@example.test', crypt('test-fixture-only', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- profiles rows are normally created by the on_auth_user_created trigger;
-- confirm that actually fired rather than inserting profiles by hand.
do $$
begin
  if (select count(*) from public.profiles where id in
      ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) <> 2 then
    raise exception 'FIXTURE SETUP FAILED: handle_new_user trigger did not create both profiles';
  end if;
end $$;

-- One resume owned by Alpha, inserted as service_role (bypassing RLS, the
-- same way the real upload flow's Storage-then-metadata-insert would after
-- a real file lands, minus any actual file bytes here).
insert into public.resumes (id, user_id, original_filename, storage_path, mime_type, file_size, status)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'alpha-fixture.pdf',
  '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/original.pdf',
  'application/pdf', 1024, 'analyzed'
);

insert into public.resume_analyses (id, resume_id, user_id, overall_score, analysis_version, status)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  72.5, 'fixture-v0', 'complete'
);

-- ── A. anonymous user cannot access private resume ───────────────────────
-- career_core.sql grants select/insert/update on public.resumes to
-- `authenticated` only — `anon` gets no table-level grant at all (see that
-- file's header comment: "a table with RLS policies but no GRANT denies
-- everyone"). So the secure, intended outcome here is a permission-denied
-- error at the grant layer, which never even reaches RLS — that's strictly
-- stronger than an RLS zero-row result, not a lesser substitute for it, so
-- it counts as PASS on equal footing with one. This test must never be
-- "fixed" by adding `grant select on public.resumes to anon` — that would
-- weaken the exact property it's proving.
do $$
declare
  v_count int;
  v_denied boolean := false;
begin
  set local role anon;
  reset request.jwt.claims;
  begin
    select count(*) into v_count from public.resumes where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  exception
    when insufficient_privilege then
      v_denied := true;
  end;
  reset role;
  if not v_denied and v_count <> 0 then
    raise exception 'FAIL A: anonymous role could read a private resume row';
  end if;
  raise notice 'PASS: A — anonymous cannot access private resume (%)',
    case when v_denied then 'denied at grant layer, RLS never reached' else 'RLS returned zero rows' end;
end $$;

-- ── B. User A cannot access User B resume (and vice versa: B cannot see A's) ──
do $$
declare v_count int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '22222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.resumes where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  reset role;
  reset request.jwt.claims;
  if v_count <> 0 then
    raise exception 'FAIL B: User Beta could read User Alpha''s resume row';
  end if;
  raise notice 'PASS: B — User B cannot access User A resume';
end $$;

-- Sanity check on the same policy: Alpha CAN see her own row, so test B's
-- zero-rows result above is "correctly denied", not "the query was broken".
do $$
declare v_count int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.resumes where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  reset role;
  reset request.jwt.claims;
  if v_count <> 1 then
    raise exception 'FAIL (sanity): User Alpha could not read her own resume — test B above is meaningless without this passing';
  end if;
  raise notice 'PASS: sanity — User A can read own resume';
end $$;

-- ── C. User A cannot access User B analysis ───────────────────────────────
do $$
declare v_count int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '22222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.resume_analyses where id = 'bbbbbbbb-0000-0000-0000-000000000001';
  reset role;
  reset request.jwt.claims;
  if v_count <> 0 then
    raise exception 'FAIL C: User Beta could read User Alpha''s analysis row';
  end if;
  raise notice 'PASS: C — User B cannot access User A analysis';
end $$;

-- ── D. User A cannot delete User B resume (via the delete_resume RPC) ────
do $$
declare v_error boolean := false;
begin
  begin
    -- Beta attempts to delete Alpha's resume, claiming her own id — the RPC
    -- itself checks ownership server-side (p_user_id vs. the row's real
    -- owner), independent of any client-side check, so this must fail even
    -- called with service-role privileges directly.
    perform public.delete_resume(
      'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid
    );
  exception when others then
    v_error := true;
    if sqlerrm <> 'resume_not_found' then
      raise exception 'FAIL D: expected resume_not_found, got: %', sqlerrm;
    end if;
  end;
  if not v_error then
    raise exception 'FAIL D: delete_resume let User Beta delete User Alpha''s resume';
  end if;
  raise notice 'PASS: D — User B cannot delete User A resume';
end $$;

-- Confirm Alpha's resume is still intact after the rejected attempt.
do $$
declare v_deleted_at timestamptz;
begin
  select deleted_at into v_deleted_at from public.resumes where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  if v_deleted_at is not null then
    raise exception 'FAIL D (side effect): resume was soft-deleted despite the rejected cross-user call';
  end if;
  raise notice 'PASS: D (side effect) — resume untouched by the rejected call';
end $$;

-- ── E. User A can delete their own resume ─────────────────────────────────
do $$
declare v_result record;
begin
  select * into v_result from public.delete_resume(
    'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid
  );
  if v_result.already_deleted <> false then
    raise exception 'FAIL E: expected a fresh delete (already_deleted = false)';
  end if;
  if (select deleted_at from public.resumes where id = 'aaaaaaaa-0000-0000-0000-000000000001') is null then
    raise exception 'FAIL E: resumes.deleted_at was not set';
  end if;
  if (select deleted_at from public.resume_analyses where resume_id = 'aaaaaaaa-0000-0000-0000-000000000001') is null then
    raise exception 'FAIL E: resume_analyses.deleted_at was not cascaded';
  end if;
  if (select count(*) from public.deletion_audit where entity_id = 'aaaaaaaa-0000-0000-0000-000000000001' and action = 'soft_delete') <> 1 then
    raise exception 'FAIL E: no deletion_audit row was written';
  end if;
  raise notice 'PASS: E — User A can delete own resume, with cascade + audit row';
end $$;

-- ── F. repeat deletion is safe (idempotent) ───────────────────────────────
do $$
declare v_result record;
begin
  select * into v_result from public.delete_resume(
    'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid
  );
  if v_result.already_deleted <> true then
    raise exception 'FAIL F: second call did not report already_deleted';
  end if;
  if (select count(*) from public.deletion_audit where entity_id = 'aaaaaaaa-0000-0000-0000-000000000001') <> 1 then
    raise exception 'FAIL F: repeat call wrote a second audit row instead of no-op''ing';
  end if;
  raise notice 'PASS: F — repeat deletion is a safe no-op';
end $$;

-- ── G. user cannot grant themselves knowledge-contribution consent for another user ──
do $$
declare v_error boolean := false;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);
  begin
    insert into public.user_consents (user_id, consent_type, policy_version)
    values ('22222222-2222-2222-2222-222222222222', 'knowledge_contribution', '2026-08-12');
  exception when others then
    v_error := true;
  end;
  reset role;
  reset request.jwt.claims;
  if not v_error then
    raise exception 'FAIL G: Alpha inserted a consent row on Beta''s behalf';
  end if;
  raise notice 'PASS: G — cannot grant consent for another user';
end $$;

-- ── H. revoked consent reads as inactive ──────────────────────────────────
do $$
declare v_consent_id uuid;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

  insert into public.user_consents (user_id, consent_type, policy_version)
  values ('11111111-1111-1111-1111-111111111111', 'knowledge_contribution', '2026-08-12')
  returning id into v_consent_id;

  reset role;
  reset request.jwt.claims;

  if not public.has_active_consent('11111111-1111-1111-1111-111111111111', 'knowledge_contribution') then
    raise exception 'FAIL H (setup): consent did not read as active right after granting';
  end if;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);
  update public.user_consents set revoked_at = now() where id = v_consent_id;
  reset role;
  reset request.jwt.claims;

  if public.has_active_consent('11111111-1111-1111-1111-111111111111', 'knowledge_contribution') then
    raise exception 'FAIL H: has_active_consent still true after revocation';
  end if;
  raise notice 'PASS: H — revoked consent reads as inactive';
end $$;

-- Bonus, same table: revocation is final (no un-revoke), matching the
-- append-only trigger, not just documented behavior.
do $$
declare v_consent_id uuid;
    v_error boolean := false;
begin
  select id into v_consent_id from public.user_consents
    where user_id = '11111111-1111-1111-1111-111111111111' and revoked_at is not null
    limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);
  begin
    update public.user_consents set revoked_at = null where id = v_consent_id;
  exception when others then
    v_error := true;
  end;
  reset role;
  reset request.jwt.claims;

  if not v_error then
    raise exception 'FAIL (bonus): a revoked consent row was un-revoked';
  end if;
  raise notice 'PASS: bonus — consent revocation cannot be undone by the client';
end $$;

rollback;
