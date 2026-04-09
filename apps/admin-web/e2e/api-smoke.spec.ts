import { test, expect } from "@playwright/test";

const getApiOrigin = () => {
  const u = process.env.PLAYWRIGHT_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  return u.replace(/\/api\/v1\/?$/, "");
};
const getApiBase = () => {
  const o = getApiOrigin();
  return o + (o.endsWith("/api/v1") ? "" : "/api/v1");
};

test.describe("API smoke", () => {
  test("GET /health returns 200 and node_mode", async ({ request }) => {
    const base = getApiOrigin();
    const res = await request.get(`${base}/health`).catch(() => null);
    if (!res) {
      test.skip(true, "API not reachable at " + base);
      return;
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json().catch(() => ({}));
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("node_mode");
    expect(["mock", "real", "agent"]).toContain(body.node_mode);
  });

  test("GET /health/ready returns 200 or 503", async ({ request }) => {
    const base = getApiOrigin();
    const res = await request.get(`${base}/health/ready`).catch(() => null);
    if (!res) {
      test.skip(true, "API not reachable");
      return;
    }
    expect([200, 503]).toContain(res.status());
  });

  test("POST /auth/login with env credentials returns 200 and tokens or 401", async ({ request }) => {
    const base = getApiBase();
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin";
    const res = await request.post(`${base}/auth/login`, { data: { email, password } }).catch(() => null);
    if (!res) {
      test.skip(true, "API not reachable");
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (res.status() === 429) {
      test.skip(true, "Login rate limited (429)");
      return;
    }
    if (res.status() === 200) {
      expect(body).toHaveProperty("access_token");
      expect(body).toHaveProperty("refresh_token");
    } else {
      expect(res.status()).toBe(401);
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
    }
  });

  test("GET /overview and GET /servers with auth return 200 and shape", async ({ request }) => {
    const base = getApiBase();
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin";
    const loginRes = await request.post(`${base}/auth/login`, { data: { email, password } }).catch(() => null);
    if (!loginRes?.ok()) {
      test.skip(true, "Login failed (credentials or API)");
      return;
    }
    const { access_token } = (await loginRes.json()) as { access_token: string };
    const auth = { Authorization: `Bearer ${access_token}` };
    const overviewRes = await request.get(`${base}/overview`, { headers: auth });
    expect(overviewRes.ok()).toBeTruthy();
    const overview = (await overviewRes.json()) as
      | { servers_total: number; servers_unhealthy: number; users_total: number; subscriptions_active: number; mrr: number }
      | { counts: { servers_total: number; servers_unhealthy: number; users_total: number; subscriptions_active: number; mrr: number } };
    const counts = "counts" in overview && overview.counts ? overview.counts : overview;
    expect(counts).toHaveProperty("servers_total");
    expect(counts).toHaveProperty("servers_unhealthy");
    expect(counts).toHaveProperty("users_total");
    expect(counts).toHaveProperty("subscriptions_active");
    expect(counts).toHaveProperty("mrr");
    const serversRes = await request.get(`${base}/servers?limit=5`, { headers: auth });
    expect(serversRes.ok()).toBeTruthy();
    const servers = (await serversRes.json()) as { items: Array<{ id: string; status: string }>; total: number };
    expect(servers).toHaveProperty("items");
    expect(servers).toHaveProperty("total");
    expect(Array.isArray(servers.items)).toBeTruthy();
    const validStatuses = ["online", "offline", "degraded", "unknown"];
    for (const item of servers.items) {
      expect(validStatuses).toContain(item.status);
    }
  });
});
