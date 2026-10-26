-- Keep payment details off the public API: the site only needs a bid's amount and which workflow it belongs to.
-- Run once in Supabase SQL Editor (safe to re-run).
revoke select on public.bids from anon, authenticated;
grant select (id, round_id, slot, workflow_id, amount_cents, created_at) on public.bids to anon, authenticated;
-- paypal_order_id and payment_status are no longer readable with the public key. The server (service_role) still reads everything.
