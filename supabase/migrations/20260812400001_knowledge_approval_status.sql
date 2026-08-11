-- Command 04 §4 — safe approval state for knowledge.approved_examples.
--
-- Ingesting the operator's own CVs must NOT auto-approve anything: every
-- row Command 04 inserts is status = 'candidate', and production retrieval
-- (Command 05) must filter status = 'approved'. Existing rows (the
-- Command 03 synthetic examples) were operator-authored and reviewed in
-- that command, so the column default backfills them as 'approved'.
--
-- Promotion is a manual operator action, e.g.:
--   update knowledge.approved_examples
--      set status = 'approved'
--    where id = '<reviewed id>';
-- Rejection keeps the row (audit trail) but bars it from retrieval:
--   update knowledge.approved_examples set status = 'rejected' where id = …;

alter table knowledge.approved_examples
  add column status text not null default 'approved'
  check (status in ('candidate', 'approved', 'rejected'));

comment on column knowledge.approved_examples.status is
  'Approval lifecycle (Command 04 §4). Ingestion writes ''candidate''; only a manual operator update makes a row ''approved''; production retrieval must select status = ''approved'' only. ''rejected'' preserves the row for audit while permanently excluding it.';

-- Fast path for the production retrieval filter.
create index approved_examples_status_language_idx
  on knowledge.approved_examples (status, language, experience_level);
