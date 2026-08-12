-- ═══════════════════════════════════════════════════════════════════════
-- PAYMENT / RLS SECURITY TESTS (Commands 01B/01C, rerun under Command 05C
-- hosted-production verification)
--
-- Same discipline as career_privacy_security.sql: fake fixture users only,
-- everything inside one transaction rolled back at the end, one PASS
-- notice per test. Run with:
--
--   npx supabase db query --linked --file supabase/tests/career_payment_security.sql
--
-- (or against local Postgres via psql — see that file's README entry.)
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- Test User Gamma / Delta — fake fixtures only.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'gamma@example.test', crypt('test-fixture-only', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'delta@example.test', crypt('test-fixture-only', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- One pending PayPal purchase owned by Gamma, inserted as service_role.
insert into public.purchases (id, user_id, provider, product_key, status, expected_amount, currency)
values (
  'eeeeeeee-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  'paypal', 'career_full_review', 'pending', 5.00, 'USD'
);

-- ── 1. anon cannot read any purchase row ──────────────────────────────────
do $$
declare v_count int;
begin
  set local role anon;
  reset request.jwt.claims;
  select count(*) into v_count from public.purchases where id = 'eeeeeeee-0000-0000-0000-000000000001';
  reset role;
  if v_count <> 0 then
    raise exception 'FAIL 1: anonymous role could read a purchase row';
  end if;
  raise notice 'PASS: 1 — anonymous cannot access purchases';
end $$;

-- ── 2. User Delta cannot read User Gamma's purchase ───────────────────────
do $$
declare v_count int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '55555555-5555-5555-5555-555555555555', 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.purchases where id = 'eeeeeeee-0000-0000-0000-000000000001';
  reset role;
  reset request.jwt.claims;
  if v_count <> 0 then
    raise exception 'FAIL 2: User Delta could read User Gamma''s purchase row';
  end if;
  raise notice 'PASS: 2 — User B cannot access User A purchase';
end $$;

-- Sanity: Gamma can see her own row.
do $$
declare v_count int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '44444444-4444-4444-4444-444444444444', 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.purchases where id = 'eeeeeeee-0000-0000-0000-000000000001';
  reset role;
  reset request.jwt.claims;
  if v_count <> 1 then
    raise exception 'FAIL (sanity): User Gamma could not read her own purchase';
  end if;
  raise notice 'PASS: sanity — User A can read own purchase';
end $$;

-- ── 3. neither RPC is directly callable by anon/authenticated (PUBLIC revoked) ──
do $$
declare v_error boolean := false;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '44444444-4444-4444-4444-444444444444', 'role', 'authenticated')::text, true);
  begin
    perform public.request_payment_verification(
      'eeeeeeee-0000-0000-0000-000000000001'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      'TXN-FAKE-001', 'gamma@example.test'
    );
  exception when insufficient_privilege then
    v_error := true;
  end;
  reset role;
  reset request.jwt.claims;
  if not v_error then
    raise exception 'FAIL 3: authenticated role could call request_payment_verification directly (EXECUTE not properly revoked)';
  end if;
  raise notice 'PASS: 3 — request_payment_verification is not callable by authenticated/anon directly';
end $$;

do $$
declare v_error boolean := false;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '44444444-4444-4444-4444-444444444444', 'role', 'authenticated')::text, true);
  begin
    perform public.verify_payment('eeeeeeee-0000-0000-0000-000000000001'::uuid, 'verified', 'self-approval-attempt');
  exception when insufficient_privilege then
    v_error := true;
  end;
  reset role;
  reset request.jwt.claims;
  if not v_error then
    raise exception 'FAIL 3b: authenticated role could call verify_payment directly — a user could self-approve their own purchase';
  end if;
  raise notice 'PASS: 3b — verify_payment is not callable by authenticated/anon directly (no client self-approval path)';
end $$;

-- ── 4. request_payment_verification rejects a caller who is not the owner ─
-- (service-role call, but with a mismatched p_user_id — the RPC's own
-- ownership check, independent of any Edge Function check, must reject it)
do $$
declare v_error boolean := false;
begin
  begin
    perform public.request_payment_verification(
      'eeeeeeee-0000-0000-0000-000000000001'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid, -- Delta, not the owner
      'TXN-FAKE-002', 'delta@example.test'
    );
  exception when others then
    v_error := true;
    if sqlerrm <> 'not_owner' then
      raise exception 'FAIL 4: expected not_owner, got: %', sqlerrm;
    end if;
  end;
  if not v_error then
    raise exception 'FAIL 4: request_payment_verification let Delta request verification on Gamma''s purchase';
  end if;
  raise notice 'PASS: 4 — request_payment_verification rejects a non-owner caller';
end $$;

-- ── 5. legitimate owner CAN request verification ──────────────────────────
do $$
declare v_purchase public.purchases;
begin
  select * into v_purchase from public.request_payment_verification(
    'eeeeeeee-0000-0000-0000-000000000001'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'TXN-FAKE-003', 'gamma@example.test'
  );
  if v_purchase.status <> 'verification_requested' then
    raise exception 'FAIL 5: purchase status did not move to verification_requested';
  end if;
  raise notice 'PASS: 5 — owner can request verification';
end $$;

-- ── 6. verify_payment grants an entitlement exactly once, even if called twice ──
do $$
declare v_purchase public.purchases;
declare v_entitlement_count int;
begin
  select * into v_purchase from public.verify_payment(
    'eeeeeeee-0000-0000-0000-000000000001'::uuid, 'verified', 'admin-fixture-test'
  );
  if v_purchase.status <> 'verified' then
    raise exception 'FAIL 6: purchase not marked verified';
  end if;

  select count(*) into v_entitlement_count from public.entitlements
    where user_id = '44444444-4444-4444-4444-444444444444'
      and product_key = 'career_full_review';
  if v_entitlement_count <> 1 then
    raise exception 'FAIL 6: expected exactly 1 entitlement after first verification, got %', v_entitlement_count;
  end if;

  -- Idempotent re-call (double-click / retry) must not double-grant.
  perform public.verify_payment('eeeeeeee-0000-0000-0000-000000000001'::uuid, 'verified', 'admin-fixture-test-retry');

  select count(*) into v_entitlement_count from public.entitlements
    where user_id = '44444444-4444-4444-4444-444444444444'
      and product_key = 'career_full_review';
  if v_entitlement_count <> 1 then
    raise exception 'FAIL 6b: repeat verify_payment call created a duplicate entitlement (count=%)', v_entitlement_count;
  end if;
  raise notice 'PASS: 6 — verify_payment grants exactly one entitlement, idempotent on retry';
end $$;

-- ── 7. entitlements/purchases are never client-writable ──────────────────
do $$
declare v_error boolean := false;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', '44444444-4444-4444-4444-444444444444', 'role', 'authenticated')::text, true);
  begin
    insert into public.entitlements (user_id, product_key, status, source)
    values ('44444444-4444-4444-4444-444444444444', 'career_full_review', 'active', 'manual_grant');
  exception when others then
    v_error := true;
  end;
  reset role;
  reset request.jwt.claims;
  if not v_error then
    raise exception 'FAIL 7: authenticated client inserted an entitlement row directly';
  end if;
  raise notice 'PASS: 7 — client cannot self-insert entitlements';
end $$;

rollback;
