# Database keepalive

Status: deployed to production and enabled on 2026-09-06.

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

## Activation procedure (completed)

1. Apply `migrations/0005_service_keepalive.sql` to the existing project
   `ckviuhczbifmroggxfto` through its authenticated SQL Editor or Management API.
2. Configure a random 32+ character `CRON_SECRET` in the existing production
   Vercel project. Do not print it, commit it, or send it in a URL.
3. Deploy the reviewed files through main / Vercel Git Integration. Confirm the
   cron appears in that project. Auth-error changes were excluded from this deployment and remain local.
4. On a due day, verify an authorized endpoint call against a separate database
   read; verify anonymous access is denied. No user-table inspection needed.

Disable: remove the cron entry and redeploy, or disable it in Vercel. The
single non-user timestamp can remain; dropping the table is unnecessary.

## Evidence

- Code commit: `9bddf11`; deployed via Git Integration on 2026-09-06.
- Initial verified code deployment: `dpl_6bRs39urBfpScodoNZ7QfjEskcpF` (READY), serving
  `https://cryptocontext.earthonline.site`.
- Production route invoked with its secret: HTTP 200, `success: true`, stored
  timestamp `2026-09-06T03:12:01.629Z`; independent service-role read returned
  HTTP 200 with exactly that timestamp.
- Latest documentation-only production commit `4914988` deployed as
  `dpl_4T14okZ3Gf8RwT8pUx1dY4BWFtSo` (READY); project API reconfirmed
  the cron enabled and bound to this deployment.
- Route without authorization: HTTP 401. Anonymous table read: HTTP 401.
- Vercel project API confirms cron enabled (`disabledAt: null`), definition
  `/api/cron/keepalive`, daily `0 2 * * *`, bound to the production deployment.
- First verification above was a manual authenticated invocation, not evidence
  of a scheduler-fired run. Next due database-write day is 2026-09-09,
  scheduled 02:00 UTC / 10:00 Shanghai (subject to Vercel scheduling delay).
  Sep 7 and 8 invocations exit without contacting the database.
- Local: all 76 tests passed (12 keepalive cases), TypeScript, targeted ESLint
  and production build passed. No tests read or wrote real user data.

## Sources

- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
