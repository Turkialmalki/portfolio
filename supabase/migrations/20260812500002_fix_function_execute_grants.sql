-- ═══════════════════════════════════════════════════════════════════════
-- FIX — privileged functions were directly callable by anon/authenticated
-- (Command 05C hosted verification)
--
-- Every security-definer function added in 01B/01C/02 was written with
-- `revoke execute on function ... from public;` followed by
-- `grant execute ... to service_role;`, on the documented assumption that
-- revoking from the PUBLIC pseudo-role is sufficient to lock a function
-- down to service_role only (the same assumption those migrations state,
-- correctly, for TABLE grants under `auto_expose_new_tables = false`).
--
-- That assumption does NOT hold for FUNCTIONS on this hosted project.
-- Verified directly against uepcmdrvaygilmrluiii:
-- `has_function_privilege('authenticated', 'public.verify_payment(uuid,text,text)', 'EXECUTE')`
-- returned true even after `revoke ... from public`, because Supabase's
-- hosted project provisioning grants EXECUTE on new `public`-schema
-- functions to `anon` and `authenticated` directly (not merely via
-- PUBLIC) as part of its default template. Revoking from PUBLIC removes
-- the fallback everyone-gets-it grant; it does not touch a role's own
-- direct grant.
--
-- Practical impact this closes: without this fix, any client holding only
-- the publishable (anon) key could call
--   supabase.rpc('verify_payment', { p_purchase_id, p_decision: 'verified', p_verified_by: '<anything>' })
-- directly — self-approving their own pending purchase and minting their
-- own entitlement — completely bypassing the manual-verification flow
-- that is the entire point of the 01C payment model. Same exposure for
-- grant_entitlement, request_payment_verification (spoofing another
-- user's verification request), delete_resume, delete_career_data
-- (bypassing the Edge Function's own auth.getUser() check by calling the
-- RPC directly with an arbitrary p_user_id), and has_active_consent
-- (reading any user's consent state, not just the caller's own).
--
-- Trigger functions (handle_new_user, set_updated_at,
-- enforce_consent_append_only) are included for defense-in-depth
-- consistency even though Postgres refuses to invoke a trigger-type
-- function outside of a trigger context, so they were not independently
-- exploitable via PostgREST RPC.
-- ═══════════════════════════════════════════════════════════════════════

revoke execute on function public.grant_entitlement(uuid, text, uuid) from anon, authenticated;
revoke execute on function public.request_payment_verification(uuid, uuid, text, text) from anon, authenticated;
revoke execute on function public.verify_payment(uuid, text, text) from anon, authenticated;
revoke execute on function public.has_active_consent(uuid, text) from anon, authenticated;
revoke execute on function public.delete_resume(uuid, uuid, text) from anon, authenticated;
revoke execute on function public.delete_career_data(uuid, text) from anon, authenticated;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.enforce_consent_append_only() from anon, authenticated;

-- Belt-and-suspenders for every future function in this schema: change the
-- default so a function added later without an explicit revoke does not
-- silently reopen this gap. New tables are unaffected (this only touches
-- default privileges for functions/routines).
alter default privileges in schema public revoke execute on functions from anon, authenticated;
