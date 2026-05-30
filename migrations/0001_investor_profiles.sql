-- Migration 0001: holistic LLM investor profile (one row per user).
-- Apply via Supabase Management API (needs a Personal Access Token) or psql
-- against the project's direct connection string. Idempotent.

create table if not exists investor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary text not null,
  trading_style text not null default '',
  risk_profile text not null default '',
  preferences jsonb not null default '[]',
  behaviors jsonb not null default '[]',
  agent_guidance jsonb not null default '[]',
  source text not null default 'deterministic',
  generated_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table investor_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'investor_profiles' and policyname = 'Users read own investor_profile'
  ) then
    create policy "Users read own investor_profile" on investor_profiles
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'investor_profiles' and policyname = 'Users insert own investor_profile'
  ) then
    create policy "Users insert own investor_profile" on investor_profiles
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'investor_profiles' and policyname = 'Users update own investor_profile'
  ) then
    create policy "Users update own investor_profile" on investor_profiles
      for update using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'investor_profiles' and policyname = 'Users delete own investor_profile'
  ) then
    create policy "Users delete own investor_profile" on investor_profiles
      for delete using (auth.uid() = user_id);
  end if;
end $$;
