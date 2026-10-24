-- Keeps workflow_json (the product) unreadable with the public key.
-- Run in Supabase SQL Editor AFTER deploying the app version that reads it with the service-role key.
-- Row policies only filter rows; these column grants stop anon/authenticated from selecting workflow_json at all.
revoke select on public.workflows from anon, authenticated;
grant select (id, slug, title, description, category, node_count, image_path, image_blur, buy_url,
              author_name, click_count, save_count, status, created_at)
  on public.workflows to anon, authenticated;
-- Any column you add later must be granted explicitly if the public site needs it.

-- Check (should return an error: permission denied for table workflows):
--   set role anon; select workflow_json from public.workflows limit 1; reset role;
