  -- Search by app, saved workflows, shareable lists. Run once in Supabase SQL Editor.

  -- 0. Old rows submitted before the buy link became required have no buy_url. The NOT VALID check from
--    20261022_require_buy_url.sql still blocks any UPDATE of those rows (including the backfill below), so
--    exempt rows created before the rule. New rows (created_at on or after the cutoff) must still have a link.
alter table public.workflows drop constraint if exists workflows_buy_url_required;
alter table public.workflows add constraint workflows_buy_url_required
  check (buy_url is not null or created_at < timestamptz '2026-10-22 00:00:00+00') not valid;

-- 1. Apps used by each workflow (powers search like "Slack" or "OpenAI").
  alter table public.workflows add column if not exists apps text[] not null default '{}';

  -- Backfill existing rows: "n8n-nodes-base.googleSheets" -> "Google Sheets", skipping sticky notes.
  update public.workflows w
  set apps = coalesce((
    select array_agg(distinct initcap(regexp_replace(
            regexp_replace(split_part(n->>'type', '.', array_length(string_to_array(n->>'type', '.'), 1)), 'Trigger$', ' Trigger'),
            '([a-z])([A-Z])', '\1 \2', 'g')))
    from jsonb_array_elements(w.workflow_json->'nodes') n
    where n->>'type' not like '%.stickyNote'
  ), '{}')
  where apps = '{}';

  -- The public site reads this column, so it must be granted explicitly (see lock_workflow_json.sql).
  grant select (apps) on public.workflows to anon, authenticated;

  -- 2. One shareable list per visitor (bookmarks + collections tables already exist from schema.sql).
  create unique index if not exists collections_one_per_owner on public.collections (owner_visitor_id);
