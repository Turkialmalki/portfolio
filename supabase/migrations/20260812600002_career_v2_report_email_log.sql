-- Career V2 Part 17-18/30: server-side send-career-report support.
--
-- A minimal, privacy-safe log for the "email me the report" flow —
-- exists to (a) give `send-career-report` a persistence-backed duplicate-
-- submit guard (edge functions are stateless/scale-to-zero; an in-memory
-- guard would not survive a second invocation, let alone a second
-- instance) and (b) satisfy Part 30's safe-logging allowlist: request id,
-- analysis id, status, duration — this table structurally CANNOT hold an
-- email address, CV text, report prose, or an access token, because none
-- of those have a column to go in.

create table public.career_report_email_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  analysis_id uuid not null references public.resume_analyses (id) on delete cascade,
  -- 'own_account' | 'other' — WHICH address class was targeted, never the
  -- address itself (Part 16: delivery is restricted to the authenticated
  -- account's own verified email unless/until a separate verification
  -- flow exists for "other").
  destination_class text not null check (destination_class in ('own_account', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index career_report_email_log_user_id_idx on public.career_report_email_log (user_id);
-- Duplicate-submit guard: at most one PENDING/SENT send per analysis in a
-- short rolling window is enforced in application code (send-career-
-- report/index.ts) by querying this index, not by a DB constraint — a
-- legitimate resend later (e.g. "didn't get it, try again") must remain
-- possible, so this is a lookup aid, not a uniqueness rule.
create index career_report_email_log_analysis_id_idx on public.career_report_email_log (analysis_id, created_at desc);

alter table public.career_report_email_log enable row level security;
alter table public.career_report_email_log force row level security;

-- Read-only from the client, same discipline as resume_analyses: only the
-- send-career-report Edge Function (service role) ever writes here.
create policy "career_report_email_log_select_own"
  on public.career_report_email_log for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.career_report_email_log to authenticated;
