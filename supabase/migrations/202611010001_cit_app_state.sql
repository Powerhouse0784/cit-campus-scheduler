-- Durable key/value state for serverless deployments.
-- Run in the Supabase SQL editor using the project owner account.
create table if not exists public.cit_app_state (
  state_key text primary key,
  state_value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cit_app_state enable row level security;
-- No anon/authenticated policies are intentionally created. Server-side access
-- must use SUPABASE_SECRET_KEY (or a legacy service-role key) and never expose it to the browser.
