# Database keepalive

Status: production table created and verified; Vercel deployment pending.

Purpose: generate a small real database write every three days, without a test
account, user data access, notifications, or an availability-monitoring feature.

- Schedule anchor: 2026-09-06 UTC; due Sep 6, 9, 12, ... Sep 30, Oct 3.
- Vercel calls the route daily at 02:00 UTC (10:00 Shanghai, subject to scheduler
  delay). The route exits before any database request on the other two days.
  This preserves the three-day calendar interval across month boundaries; a
  day-of-month `*/3` expression would not. It is not an exact execution-time SLA.
- On due days, an authenticated server request upserts row `id=1` in
  `public.service_keepalive` and verifies the timestamp returned by PostgreSQL.
- The table contains only `id` and `last_run_at`. RLS is enabled, anon and
  authenticated roles have no table privileges. No account is created.
- The existing Vercel Supabase service credential stays in Vercel. A new random
  `CRON_SECRET` protects the endpoint; missing or invalid secrets fail closed.
- A failed write or unconfirmed returned value produces 503 with sanitized
  server diagnostics. No alerting integration or automatic project restore.
- No claim that this cadence guarantees avoiding pauses: Supabase documents
  insufficient user database activity over seven days, not a guaranteed
  minimum keepalive frequency. A missed run waits until the next due day.

## Activation (requires production access)

1. Apply `migrations/0005_service_keepalive.sql` to the existing project
   `ckviuhczbifmroggxfto` through its authenticated SQL Editor or Management API.
2. Configure a random 32+ character `CRON_SECRET` in the existing production
   Vercel project. Do not print it, commit it, or send it in a URL.
3. Deploy the reviewed files through main / Vercel Git Integration. Confirm the
   cron appears in that project. Keep unrelated auth-error changes separately
   reviewable; they remain local unless explicitly included in deployment.
4. On a due day, make one authorized call and verify the stored row via a
   separate read; verify anon access is denied. No user-table inspection needed.
5. Record actual production evidence here; local tests are not activation.

Disable: remove the cron entry and redeploy, or disable it in Vercel. The
single non-user timestamp can remain; dropping the table is unnecessary.

## Evidence

Local: 76 tests pass (12 keepalive route cases), TypeScript and targeted ESLint
pass. Production migration succeeded on 2026-09-06. A service-role write returned
201, a separate read returned 200 with the same timestamp, and anon read was
denied with 401. Cron endpoint deployment and activation remain pending Vercel
CLI login. Production build also passed.

## Sources

- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
