-- Memory Lane Comics portal: per-client feature flags, crew columns, picks,
-- weekly pics, and per-client scalar settings.
--
-- clients.features is added and backfilled atomically. Splitting them would leave
-- a window where Mission Properties parses to {files} and loses their Projects and
-- Team tabs.
begin;

alter table public.clients
  add column if not exists features text[] not null default '{}';

update public.clients
  set features = '{files,projects,team}'
  where domain = 'missionprop.com';

update public.clients
  set features = '{files,crew,new_this_week}'
  where domain = 'mlcshop.com';

commit;

-- team_members: three nullable columns. NULL satisfies CHECK in Postgres, so
-- existing Mission Properties rows stay valid and untouched. No DEFAULT on
-- image_position -- ADD COLUMN ... DEFAULT would write into every existing row.
alter table public.team_members
  add column if not exists picks_url text,
  add column if not exists shop_location text,
  add column if not exists image_position text;

alter table public.team_members
  add constraint team_members_shop_location_check
  check (shop_location is null or shop_location in ('original', 'part_two'));

alter table public.team_members
  add constraint team_members_image_position_check
  check (image_position is null or image_position in ('top', 'center'));

-- Composite-FK target, so a pick can never point at another client's member.
alter table public.team_members
  add constraint team_members_id_client_id_key unique (id, client_id);

create table if not exists public.team_picks (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null,
  client_id uuid not null references public.clients(id),
  image text not null,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint team_picks_member_fk
    foreign key (team_member_id, client_id)
    references public.team_members(id, client_id)
    on delete cascade
);

create index if not exists team_picks_member_idx
  on public.team_picks (team_member_id, sort_order);

create table if not exists public.weekly_pics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  image text not null,
  title text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists weekly_pics_client_idx
  on public.weekly_pics (client_id, sort_order);

create table if not exists public.client_settings (
  client_id uuid not null references public.clients(id),
  key text not null,
  value text,
  primary key (client_id, key)
);

-- Public read, no write policy. Writes go through the service role, which bypasses
-- RLS. Existing policies on projects and team_members are deliberately untouched.
alter table public.team_picks enable row level security;
alter table public.weekly_pics enable row level security;
alter table public.client_settings enable row level security;

create policy "public read team_picks" on public.team_picks for select using (true);
create policy "public read weekly_pics" on public.weekly_pics for select using (true);
create policy "public read client_settings" on public.client_settings for select using (true);
