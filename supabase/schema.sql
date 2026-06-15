-- LifeOS Supabase schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  kind text not null,
  recurrence jsonb,
  completed_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  steps integer not null default 0,
  exercises jsonb not null default '[]'::jsonb,
  food jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.health_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  step_goal integer not null default 8000,
  calorie_goal integer not null default 2200,
  protein_goal integer not null default 150
);

alter table public.calendar_events enable row level security;
alter table public.health_logs enable row level security;
alter table public.health_goals enable row level security;

create policy "calendar_events_select_own" on public.calendar_events
  for select using (auth.uid() = user_id);
create policy "calendar_events_insert_own" on public.calendar_events
  for insert with check (auth.uid() = user_id);
create policy "calendar_events_update_own" on public.calendar_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_events_delete_own" on public.calendar_events
  for delete using (auth.uid() = user_id);

create policy "health_logs_select_own" on public.health_logs
  for select using (auth.uid() = user_id);
create policy "health_logs_insert_own" on public.health_logs
  for insert with check (auth.uid() = user_id);
create policy "health_logs_update_own" on public.health_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_logs_delete_own" on public.health_logs
  for delete using (auth.uid() = user_id);

create policy "health_goals_select_own" on public.health_goals
  for select using (auth.uid() = user_id);
create policy "health_goals_insert_own" on public.health_goals
  for insert with check (auth.uid() = user_id);
create policy "health_goals_update_own" on public.health_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
