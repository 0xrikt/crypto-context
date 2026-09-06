import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authenticate } = vi.hoisted(() => ({ authenticate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword: authenticate, signUp: authenticate } }),
}));
import { POST as login } from "../login/route";
import { POST as signup } from "../signup/route";

for (const [name, handler] of [["login", login], ["signup", signup]] as const) {
  describe(name, () => {
    const request = () => new NextRequest(`https://example.com/api/auth/${name}`, {
      method: "POST", body: JSON.stringify({ email: "test@example.invalid", password: "test-only" }),
    });
    it.each([0, 503])("reports backend unavailability (%s) without blaming credentials", async (status) => {
      authenticate.mockResolvedValue({ data: {}, error: { name: "AuthRetryableFetchError", status, message: "fetch failed" } });
      const response = await handler(request());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "Authentication service is temporarily unavailable. Please try again later." });
    });
    it("keeps credential and validation failures separate", async () => {
      authenticate.mockResolvedValue({ data: {}, error: { name: "AuthApiError", status: 400, message: "Invalid login credentials" } });
      expect((await handler(request())).status).toBe(400);
    });
    it("preserves successful authentication", async () => {
      authenticate.mockResolvedValue({ data: { user: { id: "test-id", email: "test@example.invalid" } }, error: null });
      const response = await handler(request());
      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
    });
  });
}
