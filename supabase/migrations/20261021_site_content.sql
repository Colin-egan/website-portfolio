-- Site Content tab: one editable JSON document per client, read by the client's
-- site at build time. First used by TideLine Living.
create table if not exists public.site_content (
  client_id uuid primary key references public.clients(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Public read, no write policy — same as the other content tables. The site reads
-- with the anon key; the portal writes with the service role, which bypasses RLS.
alter table public.site_content enable row level security;
create policy "public read site_content" on public.site_content for select using (true);

-- Public bucket for photos uploaded from the Site Content tab. Public objects are
-- served by URL without a select policy, so none is added (that would also make
-- the bucket listable).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  20971520,
  '{image/jpeg,image/png,image/webp,image/gif}'
)
on conflict (id) do nothing;

update public.clients
  set features = '{site_content,files}'
  where domain = 'tidelineliving.com';
