import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });
function setup(date = "2026-09-06T02:00:00Z") {
  vi.stubEnv("CRON_SECRET", "test-only-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-key");
  vi.useFakeTimers(); vi.setSystemTime(new Date(date));
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const request = (secret = "test-only-secret") => new Request("https://example.com/api/cron/keepalive", { headers: { authorization: `Bearer ${secret}` } });
describe("keepalive", () => {
  it("rejects unauthorized callers without touching the database", async () => {
    const fetchMock = setup();
    expect((await GET(request("wrong"))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed if the cron secret is missing", async () => {
    const fetchMock = setup(); vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request())).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["2026-09-07T02:00:00Z", "2026-09-08T02:00:00Z", "2026-10-01T02:00:00Z"])("does not contact the database on off days: %s", async (date) => {
    const fetchMock = setup(date);
    expect(await (await GET(request())).json()).toEqual({ skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["2026-09-06T02:00:00Z", "2026-09-09T02:00:00Z", "2026-09-30T02:00:00Z", "2026-10-03T02:00:00Z"])("writes and verifies only the keepalive row: %s", async (date) => {
    const fetchMock = setup(date);
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ id: 1, last_run_at: new Date(date).toISOString() }]), { status: 200 }));
    expect((await GET(request())).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.supabase.co/rest/v1/service_keepalive?on_conflict=id");
    expect(JSON.parse(options.body)).toEqual({ id: 1, last_run_at: new Date(date).toISOString() });
    expect(options.headers.Prefer).toContain("return=representation");
  });
  it("does not claim success when the write fails", async () => {
    const fetchMock = setup(); fetchMock.mockResolvedValue(new Response("provider internals", { status: 503 }));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("provider internals");
  });
  it("requires confirmation of the stored value", async () => {
    const fetchMock = setup(); fetchMock.mockResolvedValue(new Response("[]", { status: 200 }));
    expect((await GET(request())).status).toBe(503);
  });
  it("handles network errors without exposing provider details", async () => {
    const fetchMock = setup(); fetchMock.mockRejectedValue(new Error("sensitive provider detail"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("sensitive");
  });
});
