-- Sprokkel — basis-schema
-- Plak dit volledig in Supabase SQL Editor > Run (nieuw, leeg project).

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  topic text,
  ai_note text,
  is_todo boolean not null default false,
  done boolean not null default false,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "notes_own" on notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.notes to authenticated;
