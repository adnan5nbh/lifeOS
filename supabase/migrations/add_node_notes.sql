-- Add personal notes to graph nodes
-- Run this in the Supabase SQL Editor for existing databases.
alter table public.graph_nodes add column if not exists notes text;
