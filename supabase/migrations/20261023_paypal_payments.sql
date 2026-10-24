-- Listing fee via PayPal: a workflow is saved as 'awaiting_payment' and only becomes 'published'
-- after the server confirms the PayPal capture. Run once in Supabase SQL Editor BEFORE deploying.
alter table public.workflows drop constraint if exists workflows_status_check;
alter table public.workflows add constraint workflows_status_check
  check (status in ('awaiting_payment','pending','published','rejected'));

create table if not exists public.payments (
  id bigint generated always as identity primary key,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  paypal_order_id text not null unique,
  amount_cents int not null,
  status text not null default 'created' check (status in ('created','captured','refunded')),
  created_at timestamptz not null default now()
);
create index if not exists payments_workflow_idx on public.payments (workflow_id);
alter table public.payments enable row level security;  -- no policies: only the server (service role) can use it

-- Optional: delete abandoned checkouts after 24h (needs the pg_cron extension).
-- select cron.schedule('purge-unpaid-workflows', '0 * * * *',
--   $$delete from public.workflows where status = 'awaiting_payment' and created_at < now() - interval '24 hours'$$);
