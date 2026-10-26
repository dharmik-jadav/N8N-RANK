-- Make the "Buy this workflow" link required for new submissions.
-- Run once in: Supabase Dashboard > SQL Editor, after 20261021_add_buy_url.sql (safe to re-run).
-- NOT VALID plus a created_at cutoff: rows submitted before this rule can still be updated without a link; every newer row must have one.
alter table public.workflows
  drop constraint if exists workflows_buy_url_required;

alter table public.workflows
  add constraint workflows_buy_url_required check (buy_url is not null or created_at < timestamptz '2026-10-22 00:00:00+00') not valid;

-- Once every existing row has a buy_url, you can make it a hard NOT NULL instead:
--   update public.workflows set buy_url = '...' where buy_url is null;
--   alter table public.workflows validate constraint workflows_buy_url_required;
--   alter table public.workflows alter column buy_url set not null;
