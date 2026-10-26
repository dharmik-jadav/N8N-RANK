-- The first listing on an empty leaderboard costs $2 (FIRST_LISTING_CENTS), below the old $5 minimum bid.
-- Run once in Supabase SQL Editor BEFORE deploying (safe to re-run).
alter table public.bids drop constraint if exists bids_amount_cents_check;
alter table public.bids add constraint bids_amount_cents_check check (amount_cents >= 200);
