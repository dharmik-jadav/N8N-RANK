-- n8n Rank: Supabase schema (no auth; visitors identified by an anonymous id cookie)
-- Run in: Supabase Dashboard > SQL Editor. All writes go through Next.js route handlers
-- using the service_role key; the browser (anon key) can only READ public data.

create extension if not exists pgcrypto;

-- 1. CATEGORIES ------------------------------------------------------------------
create table public.categories (
  slug text primary key,
  name text not null unique,
  sort int not null default 0
);

insert into public.categories (slug, name, sort)
select lower(regexp_replace(n, '[^a-zA-Z0-9]+', '-', 'g')), n, row_number() over ()
from unnest(array[
  'AI Agents & LLMs','Lead Generation & Sales','Marketing & Social Media','Content Creation',
  'E-commerce','Customer Support','Email & Communication','Data & Spreadsheets',
  'DevOps & IT Operations','Finance & Accounting','HR & Recruiting','Productivity & Personal',
  'Project Management','Documents & PDF','Real Estate','Education','Engineering','Design',
  'Product','Healthcare','Legal','Travel & Hospitality','Crypto & Web3','Monitoring & Alerts',
  'Web Scraping & Research','Forms & Surveys','Cloud Storage & Files',
  'Developer Tools & APIs','Building Blocks','Other'
]) as n;

-- 2. WORKFLOWS -------------------------------------------------------------------
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null references public.categories(name),
  workflow_json jsonb not null
    check (jsonb_typeof(workflow_json->'nodes') = 'array'
       and jsonb_typeof(workflow_json->'connections') = 'object'),
  node_count int not null default 0,
  image_path text,                 -- path in the 'workflow-images' storage bucket
  image_blur text,                 -- tiny base64 blur placeholder
  buy_url text not null            -- link where the workflow can be bought (required)
    check (buy_url ~* '^https?://' and char_length(buy_url) <= 500),
  author_name text,
  author_visitor_id uuid not null, -- anonymous owner
  click_count int not null default 0,
  save_count int not null default 0,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);
create index on public.workflows (status, click_count desc);
create index on public.workflows (category, status);

-- 3. BIDS (top 3 slots, 7-day rounds) --------------------------------------------
create table public.auction_rounds (
  id bigint generated always as identity primary key,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '7 days'
);

create table public.bids (
  id bigint generated always as identity primary key,
  round_id bigint not null references public.auction_rounds(id),
  slot int not null check (slot between 1 and 3),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 200),
  paypal_order_id text unique,     -- filled when PayPal is wired in
  payment_status text not null default 'mock' check (payment_status in ('mock','pending','captured','refunded')),
  created_at timestamptz not null default now()
);
create index on public.bids (round_id, slot, amount_cents desc);

-- Current winner per slot in the active round
create view public.current_slots as
select distinct on (b.slot) b.slot, b.workflow_id, b.amount_cents, b.created_at, b.round_id
from public.bids b
join public.auction_rounds r on r.id = b.round_id and now() < r.ends_at
order by b.slot, b.amount_cents desc, b.created_at asc;

-- Atomic bid: must beat the current bid by >= $1 (min $5 on an empty slot)
create or replace function public.place_bid(p_workflow uuid, p_slot int, p_amount_cents int)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_round bigint; v_top int; v_id bigint;
begin
  select id into v_round from auction_rounds where now() < ends_at order by id desc limit 1;
  if v_round is null then
    insert into auction_rounds default values returning id into v_round;
  end if;
  perform pg_advisory_xact_lock(v_round, p_slot);          -- serialise bids per slot
  select coalesce(max(amount_cents), 400) into v_top from bids where round_id = v_round and slot = p_slot;
  if p_amount_cents < v_top + 100 and v_top >= 500 then
    raise exception 'Bid must be at least $% higher', 1;
  elsif p_amount_cents < 500 then
    raise exception 'Minimum bid is $5';
  end if;
  insert into bids (round_id, slot, workflow_id, amount_cents)
  values (v_round, p_slot, p_workflow, p_amount_cents) returning id into v_id;
  return v_id;
end $$;

-- 4. UNIQUE CLICKS (one per visitor per workflow) --------------------------------
create table public.clicks (
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (workflow_id, visitor_id)
);

create or replace function public.register_click(p_workflow uuid, p_visitor uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into clicks (workflow_id, visitor_id) values (p_workflow, p_visitor)
  on conflict do nothing;
  if found then
    update workflows set click_count = click_count + 1 where id = p_workflow;
  end if;
end $$;

-- 5. BOOKMARKS + SHAREABLE COLLECTIONS -------------------------------------------
create table public.bookmarks (
  visitor_id uuid not null,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (visitor_id, workflow_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  share_slug text not null unique default encode(gen_random_bytes(6), 'hex'),
  owner_visitor_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, workflow_id)
);

create or replace function public.bump_save_count() returns trigger language plpgsql as $$
begin
  update workflows set save_count = save_count + (case tg_op when 'INSERT' then 1 else -1 end)
  where id = coalesce(new.workflow_id, old.workflow_id);
  return null;
end $$;
create trigger trg_bookmark_count after insert or delete on public.bookmarks
  for each row execute function public.bump_save_count();

-- 6. ROW LEVEL SECURITY -----------------------------------------------------------
alter table public.categories       enable row level security;
alter table public.workflows        enable row level security;
alter table public.bids             enable row level security;
alter table public.auction_rounds   enable row level security;
alter table public.clicks           enable row level security;
alter table public.bookmarks        enable row level security;
alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;

create policy "public read categories" on public.categories for select using (true);
create policy "public read published workflows" on public.workflows for select using (status = 'published');
create policy "public read bids" on public.bids for select using (true);
create policy "public read rounds" on public.auction_rounds for select using (true);
create policy "public read shared collections" on public.collections for select using (is_public);
create policy "public read shared items" on public.collection_items for select
  using (exists (select 1 from public.collections c where c.id = collection_id and c.is_public));
-- workflow_json is the product: the public key must never read it (see supabase/lock_workflow_json.sql).
revoke select on public.workflows from anon, authenticated;
grant select (id, slug, title, description, category, node_count, image_path, image_blur, buy_url,
              author_name, click_count, save_count, status, created_at)
  on public.workflows to anon, authenticated;
-- bids: the site only needs the amount and the workflow. Payment details (paypal_order_id, payment_status) stay server-only.
revoke select on public.bids from anon, authenticated;
grant select (id, round_id, slot, workflow_id, amount_cents, created_at) on public.bids to anon, authenticated;
-- clicks and bookmarks: no policies => anon cannot read or write; server uses service_role.

revoke execute on function public.place_bid, public.register_click from public, anon, authenticated;

-- 7. STORAGE (small images) ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workflow-images', 'workflow-images', true, 524288, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;
-- Resize/convert to WebP (~1200px wide) in the browser before upload, and serve through next/image.
