-- Queries for the "Submit a workflow" flow. Run supabase/schema.sql first.

-- 1. What the app runs when someone submits (src/app/api/workflows/route.ts, service_role key).
--    The image is uploaded to storage bucket 'workflow-images' as <id>.webp, then:
insert into public.workflows
  (id, slug, title, description, category, workflow_json, node_count, image_path, buy_url, author_visitor_id, status)
values
  (gen_random_uuid(), 'my-workflow-abc123', 'My workflow', 'What it does...', 'AI Agents & LLMs',
   '{"nodes":[],"connections":{}}'::jsonb, 0, 'abc.webp', 'https://example.gumroad.com/l/my-workflow', gen_random_uuid(), 'pending');
-- buy_url is required; must start with http(s):// and be <= 500 chars.
-- The table CHECK constraint also rejects a workflow_json without a "nodes" array or "connections" object.

-- 2. Moderation (run manually in the SQL editor)
select id, title, category, node_count, created_at
from public.workflows where status = 'pending' order by created_at;

update public.workflows set status = 'published' where id = '<workflow-id>';
update public.workflows set status = 'rejected'  where id = '<workflow-id>';

-- 3. Home page list: ranked by current bid, then clicks. Cards use the lightweight columns only
--    (workflow_json is large, so it is never selected for lists).
select w.id, w.slug, w.title, w.description, w.category, w.node_count, w.click_count,
       w.image_path, w.created_at,
       coalesce(cs.amount_cents, 0) as bid_cents
from public.workflows w
left join public.current_slots cs on cs.workflow_id = w.id
where w.status = 'published'
order by bid_cents desc, w.click_count desc, w.created_at desc
limit 60;

-- Category filter: add  and w.category = 'E-commerce'

-- 4. Public image URL (stored path -> CDN URL). Use Supabase image transforms to keep it light:
--    https://<project>.supabase.co/storage/v1/render/image/public/workflow-images/<image_path>?width=400&quality=70
--    or serve through next/image, which resizes and caches.

-- 5. Optional: stop spam submissions (max 5 pending per anonymous visitor)
create or replace function public.limit_pending() returns trigger language plpgsql as $$
begin
  if (select count(*) from workflows
      where author_visitor_id = new.author_visitor_id and status = 'pending') >= 5 then
    raise exception 'Too many pending submissions';
  end if;
  return new;
end $$;
create trigger trg_limit_pending before insert on public.workflows
  for each row execute function public.limit_pending();
