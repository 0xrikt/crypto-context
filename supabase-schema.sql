-- CryptoContext database schema
-- Run this in Supabase SQL Editor

-- Exchange connections (API keys stored encrypted)
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exchange text not null,
  label text not null default '',
  encrypted_key text not null,
  encrypted_secret text not null,
  encrypted_password text,
  created_at timestamptz default now() not null
);

-- Portfolio snapshots (latest data per connection)
create table if not exists snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  connection_id uuid references connections(id) on delete cascade not null unique,
  data jsonb not null,
  created_at timestamptz default now() not null
);

-- Wallet addresses (on-chain, EVM)
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  address text not null,
  chain text not null,
  label text not null default '',
  created_at timestamptz default now() not null,
  unique(user_id, address, chain)
);

-- MCP tokens (hashed, not stored in plaintext)
create table if not exists mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token_hash text not null unique,
  name text not null,
  permission_level text not null default 'full',
  revoked boolean not null default false,
  created_at timestamptz default now() not null
);

-- RLS policies
alter table connections enable row level security;
alter table snapshots enable row level security;
alter table wallets enable row level security;
alter table mcp_tokens enable row level security;

-- Users can only see their own data
create policy "Users read own connections" on connections
  for select using (auth.uid() = user_id);
create policy "Users insert own connections" on connections
  for insert with check (auth.uid() = user_id);
create policy "Users delete own connections" on connections
  for delete using (auth.uid() = user_id);

create policy "Users read own snapshots" on snapshots
  for select using (auth.uid() = user_id);
create policy "Users insert own snapshots" on snapshots
  for insert with check (auth.uid() = user_id);
create policy "Users update own snapshots" on snapshots
  for update using (auth.uid() = user_id);

create policy "Users read own wallets" on wallets
  for select using (auth.uid() = user_id);
create policy "Users insert own wallets" on wallets
  for insert with check (auth.uid() = user_id);
create policy "Users delete own wallets" on wallets
  for delete using (auth.uid() = user_id);

create policy "Users read own tokens" on mcp_tokens
  for select using (auth.uid() = user_id);
create policy "Users insert own tokens" on mcp_tokens
  for insert with check (auth.uid() = user_id);
create policy "Users update own tokens" on mcp_tokens
  for update using (auth.uid() = user_id);

-- Service role needs to read tokens for MCP auth (no RLS bypass needed for service role)
-- The service role key automatically bypasses RLS

-- Indexes
create index if not exists idx_connections_user on connections(user_id);
create index if not exists idx_snapshots_connection on snapshots(connection_id);
create index if not exists idx_wallets_user on wallets(user_id);
create index if not exists idx_mcp_tokens_hash on mcp_tokens(token_hash) where not revoked;
