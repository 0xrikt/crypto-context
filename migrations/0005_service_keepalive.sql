-- A single operational timestamp. No auth users or portfolio data involved.
-- Apply before deploying the keepalive route. Safe to reapply.
begin;
create table if not exists public.service_keepalive (
  id smallint primary key check (id = 1),
  last_run_at timestamptz not null
);
alter table public.service_keepalive enable row level security;
revoke all on table public.service_keepalive from public, anon, authenticated;
grant select, insert, update on table public.service_keepalive to service_role;
commit;
