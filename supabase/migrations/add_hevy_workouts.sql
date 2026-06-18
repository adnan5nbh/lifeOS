-- Hevy workout integration
-- Run this in the Supabase SQL Editor for existing databases.

create table if not exists public.hevy_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hevy_id text not null,
  title text not null,
  date text not null,           -- YYYY-MM-DD (UTC from Hevy API)
  start_time text not null,     -- HH:MM (UTC)
  end_time text not null,       -- HH:MM (UTC)
  duration_seconds integer not null default 0,
  exercises jsonb not null default '[]',
  calendar_event_id uuid references public.calendar_events (id) on delete set null,
  synced_at timestamptz not null default now(),
  unique (user_id, hevy_id)
);

alter table public.hevy_workouts enable row level security;

create policy "hevy_workouts_select_own" on public.hevy_workouts
  for select using (auth.uid() = user_id);
create policy "hevy_workouts_insert_own" on public.hevy_workouts
  for insert with check (auth.uid() = user_id);
create policy "hevy_workouts_update_own" on public.hevy_workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hevy_workouts_delete_own" on public.hevy_workouts
  for delete using (auth.uid() = user_id);
