import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ANCHOR_DAY = Date.UTC(2026, 8, 6);
const DAY_MS = 86_400_000;
const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!secret || !timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) {
    return reply({ error: "Unauthorized" }, 401);
  }

  // Calendar cron cannot express an uninterrupted three-day interval across
  // month boundaries. Daily scheduling gates here before ANY database request.
  const now = new Date();
  const day = Math.floor((now.getTime() - ANCHOR_DAY) / DAY_MS);
  if (day < 0 || day % 3 !== 0) return reply({ skipped: true });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply({ error: "Keepalive is not configured" }, 503);
  const timestamp = now.toISOString();
  try {
    const response = await fetch(`${url}/rest/v1/service_keepalive?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({ id: 1, last_run_at: timestamp }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error("keepalive_write_failed", { status: response.status });
      return reply({ error: "Keepalive write failed" }, 503);
    }
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== 1 ||
        typeof rows[0]?.last_run_at !== "string" ||
        Date.parse(rows[0].last_run_at) !== now.getTime()) {
      console.error("keepalive_verification_failed");
      return reply({ error: "Keepalive write was not confirmed" }, 503);
    }
    return reply({ success: true, last_run_at: timestamp });
  } catch {
    console.error("keepalive_request_failed");
    return reply({ error: "Keepalive request failed" }, 503);
  }
}
