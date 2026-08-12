-- ═══════════════════════════════════════════════════════════════════════
-- FIX — delete_resume() ambiguous column reference (Command 05C hosted
-- verification)
--
-- `returns table (resume_id uuid, storage_path text, already_deleted
-- boolean)` implicitly declares a PL/pgSQL variable named `resume_id` in
-- the function's scope. The function body's
--   update public.resume_analyses set deleted_at = now()
--     where resume_id = p_resume_id and deleted_at is null;
-- then collides with that variable rather than unambiguously meaning
-- `resume_analyses.resume_id` — Postgres raises
-- "column reference \"resume_id\" is ambiguous" the moment the function is
-- actually CALLED (CREATE FUNCTION itself does not validate the body, so
-- the original migration applied cleanly and this went undetected until
-- the privacy/RLS execution suite ran the real RPC against the hosted
-- database — exactly what that suite is for).
--
-- Fix: alias the table in the UPDATE and qualify the column, removing the
-- ambiguity. No behavior change otherwise. Verified against a rolled-back
-- transaction on the hosted project before this migration was written.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.delete_resume(
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

  if not found or v_resume.user_id is distinct from p_user_id then
    raise exception 'resume_not_found';
  end if;

  if v_resume.deleted_at is not null then
    return query select v_resume.id, v_resume.storage_path, true;
    return;
  end if;

  update public.resumes set deleted_at = now() where id = p_resume_id;
  update public.resume_analyses ra
    set deleted_at = now()
    where ra.resume_id = p_resume_id and ra.deleted_at is null;

  insert into public.deletion_audit (entity_type, entity_id, user_id, action, performed_by)
  values ('resume', p_resume_id, p_user_id, 'soft_delete', p_performed_by);

  return query select v_resume.id, v_resume.storage_path, false;
end;
$$;
