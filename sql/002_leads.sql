-- SM-Ideas — klantenbestand (leads/prospecten), los van de ideeën-tabel
-- Toevoeging, verandert niets aan bestaande data. Plak in Supabase SQL Editor > Run.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  naam text not null,
  status text not null default 'potentieel', -- potentieel | geweigerd | samengewerkt
  bron text, -- cold_call | cold_walkin | ads | mond_tot_mond | social | aanbeveling | anders
  bron_detail text,
  contact text,
  notities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leads enable row level security;

create policy "leads_own" on leads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.leads to authenticated;
