-- Presentation tab (developer account only): the instructions and reference files
-- behind the /presentation chatbot. One row, read and written only by the server
-- with the service role.
create table if not exists public.presentation_settings (
  id smallint primary key default 1 check (id = 1),
  system_prompt text not null default '',
  chat_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- RLS on with no policies: the anon key can't read the prompt or the file list.
alter table public.presentation_settings enable row level security;

insert into public.presentation_settings (id) values (1) on conflict (id) do nothing;

-- Private bucket: files reach Gemini from the server, never the browser.
insert into storage.buckets (id, name, public, file_size_limit)
values ('presentation-files', 'presentation-files', false, 20971520)
on conflict (id) do nothing;

update public.clients
  set features = array_append(features, 'presentation')
  where 'studio' = any(features) and not 'presentation' = any(features);
