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

create table if not exists public.quick_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  ai_analysis text,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  content text not null,
  ai_analysis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.quick_notes enable row level security;
alter table public.journal_entries enable row level security;
alter table public.chat_messages enable row level security;

create policy "quick_notes_select_own" on public.quick_notes
  for select using (auth.uid() = user_id);
create policy "quick_notes_insert_own" on public.quick_notes
  for insert with check (auth.uid() = user_id);
create policy "quick_notes_update_own" on public.quick_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quick_notes_delete_own" on public.quick_notes
  for delete using (auth.uid() = user_id);

create policy "journal_entries_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_entries_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_entries_update_own" on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_entries_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);

create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);
create policy "chat_messages_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, date);
create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);
