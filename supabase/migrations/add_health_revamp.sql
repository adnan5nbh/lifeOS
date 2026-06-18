-- Health page revamp: emotion logs, weight history, focus sessions, sleep goal
-- Run this in the Supabase SQL Editor for existing databases.

-- Quick emotion check-ins (up to 3/day, separate from full MindSpace check-ins)
create table if not exists public.emotion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  score integer not null check (score between 1 and 10),
  logged_at timestamptz not null default now()
);

alter table public.emotion_logs enable row level security;
create policy "emotion_logs_select_own" on public.emotion_logs
  for select using (auth.uid() = user_id);
create policy "emotion_logs_insert_own" on public.emotion_logs
  for insert with check (auth.uid() = user_id);
create policy "emotion_logs_delete_own" on public.emotion_logs
  for delete using (auth.uid() = user_id);
create index if not exists emotion_logs_user_date_idx on public.emotion_logs (user_id, date);

-- Weight history (one entry per day, never purged)
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  weight_kg real not null,
  logged_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.weight_logs enable row level security;
create policy "weight_logs_select_own" on public.weight_logs
  for select using (auth.uid() = user_id);
create policy "weight_logs_insert_own" on public.weight_logs
  for insert with check (auth.uid() = user_id);
create policy "weight_logs_update_own" on public.weight_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists weight_logs_user_date_idx on public.weight_logs (user_id, date);

-- Focus sessions (Pomodoro completions + manual entries)
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  duration_minutes integer not null,
  label text,
  started_at timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;
create policy "focus_sessions_select_own" on public.focus_sessions
  for select using (auth.uid() = user_id);
create policy "focus_sessions_insert_own" on public.focus_sessions
  for insert with check (auth.uid() = user_id);
create policy "focus_sessions_delete_own" on public.focus_sessions
  for delete using (auth.uid() = user_id);
create index if not exists focus_sessions_user_date_idx on public.focus_sessions (user_id, date);

-- Add sleep goal to health_goals (8 hrs = 480 min default)
alter table public.health_goals
  add column if not exists sleep_goal integer not null default 480;
