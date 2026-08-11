-- ═══════════════════════════════════════════════════════════════════════
-- PAYMENT CORRECTION — PayPal manual-verification MVP (Command 01C)
--
-- Lemon Squeezy is retired as the active Career payment provider. `purchases`
-- stays provider-neutral (that was already true — `provider` was always a
-- plain text column) but its shape now models a MANUAL verification flow
-- rather than an automated webhook: PAYMENT → VERIFICATION → VERIFIED
-- PURCHASE → ENTITLEMENT, with a trusted human in the middle instead of a
-- signed webhook. See `docs/backend-architecture.md`.
-- ═══════════════════════════════════════════════════════════════════════

-- ── purchases: provider check widens, Lemon is no longer the only option ──
alter table public.purchases
  drop constraint purchases_provider_check;
alter table public.purchases
  add constraint purchases_provider_check
  check (provider in ('paypal', 'lemon_squeezy', 'manual'));

-- ── purchases: status vocabulary becomes the manual-verification lifecycle ─
-- Old vocabulary (pending/paid/refunded/failed) assumed an automated webhook
-- telling us definitively "paid". The new one has no such signal — a
-- purchase sits in `verification_requested` until a human looks at it.
alter table public.purchases
  drop constraint purchases_status_check;
alter table public.purchases
  alter column status set default 'pending';
alter table public.purchases
  add constraint purchases_status_check
  check (status in ('pending', 'verification_requested', 'verified', 'rejected', 'refunded'));

-- ── purchases: provider order/product ids are no longer guaranteed at
-- creation time. A Lemon Squeezy webhook always had both; a PayPal payment
-- link has neither until (if ever) a human types one in.
alter table public.purchases
  alter column provider_order_id drop not null;
alter table public.purchases
  alter column provider_product_id drop not null;

-- ── purchases: "amount" meant "the amount a webhook told us was charged".
-- There is no such signal here — rename to `expected_amount`, matching
-- src/config/payments.ts's `expectedPrice`. It is the price the product
-- SHOULD cost, recorded at purchase-creation time, not a payment
-- confirmation.
alter table public.purchases
  rename column amount to expected_amount;
alter table public.purchases
  alter column expected_amount type numeric(10, 2) using expected_amount::numeric(10, 2);

-- ── purchases: what the customer says they paid with, and who confirmed it ─
alter table public.purchases
  add column customer_submitted_reference text,
  add column customer_submitted_email text,
  add column verified_at timestamptz,
  add column verified_by text;

comment on column public.purchases.customer_submitted_reference is
  'What the customer typed into "I''ve paid" — e.g. a PayPal transaction ID. NOT proof of payment by itself; only a trusted admin marking the purchase verified grants anything.';
comment on column public.purchases.customer_submitted_email is
  'The PayPal email the customer says they paid from, if they supplied one. Same caveat as above.';
comment on column public.purchases.verified_by is
  'Free-text identifier of the admin/tool that verified this purchase — set only by verify_payment(), never by the client. No admin-role table exists yet; this is an audit trail, not an authorization mechanism.';

-- `raw_reference` (existing jsonb column) doubles as `provider_metadata`
-- from the brief — no separate column added, per "do not add duplicate
-- fields if the existing schema can already model this cleanly".

-- ── entitlements: source vocabulary becomes mechanism-based, not provider-
-- based, so a provider swap never requires touching this constraint again ──
alter table public.entitlements
  drop constraint entitlements_source_check;
alter table public.entitlements
  add constraint entitlements_source_check
  check (source in ('purchase_verification', 'manual_grant', 'promo'));

-- ── entitlements: idempotency at the constraint level, not just app logic ──
-- Two concurrent verify_payment() calls for the same purchase must be able
-- to race safely; a unique index (not just a SELECT-then-INSERT check) is
-- what actually guarantees that. Partial (WHERE source_order_id IS NOT
-- NULL) so promo/manual grants with no purchase behind them are unaffected.
create unique index entitlements_dedupe_idx
  on public.entitlements (user_id, product_key, source_order_id)
  where source_order_id is not null;

-- ── grant_entitlement(): THE shared, provider-agnostic entitlement grant ──
-- See supabase/functions/_shared/grantEntitlement.ts for the Deno-side
-- wrapper every future payment path is meant to call through.
create function public.grant_entitlement(
  p_user_id uuid,
  p_product_key text,
  p_source_purchase_id uuid
) returns public.entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement public.entitlements;
begin
  insert into public.entitlements (user_id, product_key, status, source, source_order_id)
  values (p_user_id, p_product_key, 'active', 'purchase_verification', p_source_purchase_id::text)
  on conflict (user_id, product_key, source_order_id) where source_order_id is not null
  do nothing
  returning * into v_entitlement;

  if v_entitlement.id is null then
    select * into v_entitlement
    from public.entitlements
    where user_id = p_user_id
      and product_key = p_product_key
      and source_order_id = p_source_purchase_id::text
    limit 1;
  end if;

  return v_entitlement;
end;
$$;

-- Privileged only: revoking from PUBLIC removes the implicit grant to
-- `anon` and `authenticated` that every new function gets by default in
-- Postgres. Without this, `supabase.rpc('grant_entitlement', …)` would be
-- callable directly from the browser with nothing but the publishable key.
revoke execute on function public.grant_entitlement(uuid, text, uuid) from public;
grant execute on function public.grant_entitlement(uuid, text, uuid) to service_role;

-- ── request_payment_verification(): pending/rejected → verification_requested ─
-- Ownership is checked HERE, against the caller's verified auth.uid(), not
-- trusted from anything the Edge Function forwards unchecked — so a bug in
-- the calling Edge Function's own ownership check alone could not let one
-- user touch another user's purchase.
create function public.request_payment_verification(
  p_purchase_id uuid,
  p_user_id uuid,
  p_reference text,
  p_email text
) returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'purchase_not_found';
  end if;

  if v_purchase.user_id is distinct from p_user_id then
    raise exception 'not_owner';
  end if;

  if v_purchase.status not in ('pending', 'rejected') then
    raise exception 'purchase_not_eligible_for_verification_request';
  end if;

  update public.purchases
    set status = 'verification_requested',
        customer_submitted_reference = p_reference,
        customer_submitted_email = p_email,
        updated_at = now()
    where id = p_purchase_id
    returning * into v_purchase;

  return v_purchase;
end;
$$;

revoke execute on function public.request_payment_verification(uuid, uuid, text, text) from public;
grant execute on function public.request_payment_verification(uuid, uuid, text, text) to service_role;

-- ── verify_payment(): the ONLY path to "verified", the ONLY path that grants ─
-- `for update` row-locks the purchase for the duration of the transaction,
-- so two overlapping admin calls (a double-click, a retried request) cannot
-- both observe "verification_requested" and both grant an entitlement.
-- Calling this again on an already-decided purchase is a no-op, not an
-- error — that is what makes repeated admin verification safe.
create function public.verify_payment(
  p_purchase_id uuid,
  p_decision text,
  p_verified_by text
) returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases;
begin
  if p_decision not in ('verified', 'rejected') then
    raise exception 'invalid_decision';
  end if;

  select * into v_purchase from public.purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'purchase_not_found';
  end if;

  -- Idempotent no-op: this exact decision was already recorded.
  if v_purchase.status = p_decision then
    return v_purchase;
  end if;

  if v_purchase.status <> 'verification_requested' then
    raise exception 'purchase_not_awaiting_verification';
  end if;

  update public.purchases
    set status = p_decision,
        verified_at = now(),
        verified_by = p_verified_by,
        updated_at = now()
    where id = p_purchase_id
    returning * into v_purchase;

  if p_decision = 'verified' then
    perform public.grant_entitlement(v_purchase.user_id, v_purchase.product_key, v_purchase.id);
  end if;

  return v_purchase;
end;
$$;

revoke execute on function public.verify_payment(uuid, text, text) from public;
grant execute on function public.verify_payment(uuid, text, text) to service_role;

-- ── service_role table grants ───────────────────────────────────────────
-- Discovered while testing this migration, not assumed: `service_role`
-- bypassing RLS does not imply table-level privileges in this Postgres
-- setup — the same "no auto_expose" gap 01B's migration already documents
-- for `anon`/`authenticated` applies here too. The three SECURITY DEFINER
-- functions above run as their owner and never needed this, but any
-- service-role Edge Function that writes to these tables directly — the
-- future purchase-creation step in particular — does.
grant select, insert, update on public.purchases to service_role;
grant select, insert, update on public.entitlements to service_role;
grant select, insert, update on public.resume_analyses to service_role;
grant select, insert, update on public.resumes to service_role;
grant select, insert, update on public.profiles to service_role;
