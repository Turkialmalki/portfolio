-- Follow-up to 20260812500002: the three trigger functions still carried
-- an implicit `GRANT EXECUTE TO PUBLIC` (Postgres's default at function
-- creation time), which anon/authenticated inherit through PUBLIC
-- regardless of any direct revoke against those two roles specifically.
-- Not independently exploitable — Postgres refuses to invoke a
-- trigger-return-type function outside of a trigger context, so this is
-- consistency/defense-in-depth, not a live gap — but the goal stated in
-- 20260812500002 was "not independently exploitable," not "still has a
-- PUBLIC grant," so close it properly.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.enforce_consent_append_only() from public;
