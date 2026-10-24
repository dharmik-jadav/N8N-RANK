-- Messages sent from the /contact page.
-- Run once in: Supabase Dashboard > SQL Editor (safe to re-run).
-- Only the server (service_role key) can write or read this table; the public/anon key has no access.

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  phone text not null check (char_length(phone) between 7 and 20),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'spam')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;  -- no policies = no public access
revoke all on table public.contact_messages from anon, authenticated;

-- Anti-spam: at most 5 messages per email address per hour.
create or replace function public.limit_contact_messages() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.contact_messages
      where email = new.email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many messages';
  end if;
  return new;
end $$;

drop trigger if exists trg_limit_contact_messages on public.contact_messages;
create trigger trg_limit_contact_messages before insert on public.contact_messages
  for each row execute function public.limit_contact_messages();

-- Reading and managing messages (run manually in the SQL editor, or use Table Editor):
--   select id, created_at, email, phone, message from public.contact_messages where status = 'new' order by created_at desc;
--   update public.contact_messages set status = 'replied' where id = 1;
