-- Optional "Buy this workflow" link set by the submitter.
-- Run once in: Supabase Dashboard > SQL Editor (safe to re-run).
alter table public.workflows
  add column if not exists buy_url text;

alter table public.workflows
  drop constraint if exists workflows_buy_url_check;

alter table public.workflows
  add constraint workflows_buy_url_check
  check (buy_url ~* '^https?://' and char_length(buy_url) <= 500);
