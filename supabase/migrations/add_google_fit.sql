-- Google Fit integration
-- Run this in the Supabase SQL Editor for existing databases.

-- Store OAuth tokens
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

-- Synced fitness data stored alongside manual entries
alter table public.health_logs add column if not exists google_fit jsonb;
