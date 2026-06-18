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
  google_fit jsonb,
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

-- ============================================================
-- Graph / Knowledge Graph tables
-- ============================================================
-- ============================================================
-- Google Fit OAuth tokens
-- ============================================================
create table if not exists public.google_fit_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_fit_tokens enable row level security;

create policy "google_fit_tokens_select_own" on public.google_fit_tokens
  for select using (auth.uid() = user_id);
create policy "google_fit_tokens_insert_own" on public.google_fit_tokens
  for insert with check (auth.uid() = user_id);
create policy "google_fit_tokens_update_own" on public.google_fit_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "google_fit_tokens_delete_own" on public.google_fit_tokens
  for delete using (auth.uid() = user_id);

create table if not exists public.graph_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  type text not null check (type in ('activity','emotion','person','concept','anxiety','achievement','place')),
  weight integer not null default 1,
  notes text,
  pos_x real,
  pos_y real,
  created_at timestamptz not null default now()
);

create table if not exists public.graph_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id uuid not null references public.graph_nodes (id) on delete cascade,
  target_id uuid not null references public.graph_nodes (id) on delete cascade,
  strength real not null default 0.3,
  created_at timestamptz not null default now(),
  unique (user_id, source_id, target_id)
);

create table if not exists public.graph_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  node_ids uuid[] not null default '{}',
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- ============================================================
-- MindSpace tables
-- ============================================================
create table if not exists public.mindspace_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  valence real not null default 0,
  arousal real not null default 0,
  perma_p integer not null default 5,
  perma_e integer not null default 5,
  perma_r integer not null default 5,
  perma_m integer not null default 5,
  perma_a integer not null default 5,
  cognitive_load integer not null default 5,
  sentiment text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.clinical_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('phq9','gad7')),
  scores jsonb not null default '[]',
  total_score integer not null default 0,
  assessed_at timestamptz not null default now()
);

create table if not exists public.correlation_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  chart_data jsonb,
  reaction text check (reaction in ('makes_sense','surprising')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.graph_nodes enable row level security;
alter table public.graph_edges enable row level security;
alter table public.graph_clusters enable row level security;
alter table public.mindspace_checkins enable row level security;
alter table public.clinical_assessments enable row level security;
alter table public.correlation_insights enable row level security;

create policy "graph_nodes_select_own"     on public.graph_nodes for select using (auth.uid() = user_id);
create policy "graph_nodes_insert_own"     on public.graph_nodes for insert with check (auth.uid() = user_id);
create policy "graph_nodes_update_own"     on public.graph_nodes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "graph_nodes_delete_own"     on public.graph_nodes for delete using (auth.uid() = user_id);

create policy "graph_edges_select_own"     on public.graph_edges for select using (auth.uid() = user_id);
create policy "graph_edges_insert_own"     on public.graph_edges for insert with check (auth.uid() = user_id);
create policy "graph_edges_update_own"     on public.graph_edges for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "graph_edges_delete_own"     on public.graph_edges for delete using (auth.uid() = user_id);

create policy "graph_clusters_select_own"  on public.graph_clusters for select using (auth.uid() = user_id);
create policy "graph_clusters_insert_own"  on public.graph_clusters for insert with check (auth.uid() = user_id);
create policy "graph_clusters_update_own"  on public.graph_clusters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "graph_clusters_delete_own"  on public.graph_clusters for delete using (auth.uid() = user_id);

create policy "mindspace_checkins_select_own" on public.mindspace_checkins for select using (auth.uid() = user_id);
create policy "mindspace_checkins_insert_own" on public.mindspace_checkins for insert with check (auth.uid() = user_id);
create policy "mindspace_checkins_update_own" on public.mindspace_checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "clinical_assessments_select_own" on public.clinical_assessments for select using (auth.uid() = user_id);
create policy "clinical_assessments_insert_own" on public.clinical_assessments for insert with check (auth.uid() = user_id);

create policy "correlation_insights_select_own" on public.correlation_insights for select using (auth.uid() = user_id);
create policy "correlation_insights_insert_own" on public.correlation_insights for insert with check (auth.uid() = user_id);
create policy "correlation_insights_update_own" on public.correlation_insights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "correlation_insights_delete_own" on public.correlation_insights for delete using (auth.uid() = user_id);

create index if not exists graph_nodes_user_idx           on public.graph_nodes (user_id);
create index if not exists graph_edges_user_idx           on public.graph_edges (user_id);
create index if not exists mindspace_checkins_user_date   on public.mindspace_checkins (user_id, date);
create index if not exists clinical_user_type_idx         on public.clinical_assessments (user_id, type, assessed_at);
create index if not exists correlation_user_created_idx   on public.correlation_insights (user_id, created_at);

-- ============================================================
-- Hevy workout sync
-- ============================================================
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

create index if not exists hevy_workouts_user_date_idx on public.hevy_workouts (user_id, date);
