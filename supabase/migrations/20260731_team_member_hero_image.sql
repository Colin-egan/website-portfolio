-- Dedicated hero art for picks pages.
--
-- The picks header reused team_members.photo, but crew photos are ~1:1 portrait
-- headshots and the PicksHero slot is roughly 3.5:1, so object-cover sliced off
-- about 70% of the image. This gives the header its own source and leaves the
-- crew card still reading from photo.
--
-- Nullable with no default: ADD COLUMN ... DEFAULT would rewrite every existing
-- row, and NULL keeps Mission Properties' rows valid and untouched. The site
-- falls back to photo when hero_image is null, so members without dedicated art
-- render exactly as they do today.
alter table public.team_members
  add column if not exists hero_image text;

comment on column public.team_members.hero_image is
  'Wide banner art for the picks page header. Falls back to photo when null.';
