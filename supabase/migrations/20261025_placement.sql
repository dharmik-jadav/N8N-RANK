-- Paid placement at submit time: the listing fee ($2) plus an optional position price.
-- Run once in Supabase SQL Editor BEFORE deploying (safe to re-run).
alter table public.payments
  add column if not exists bid_cents int not null default 0 check (bid_cents >= 0),
  add column if not exists placement_rank int;

comment on column public.payments.bid_cents is 'Part of amount_cents that buys a leaderboard position (0 = standard listing).';
comment on column public.payments.placement_rank is 'The spot the buyer chose when paying (1 = top).';
