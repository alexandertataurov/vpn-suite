import { describe, expect, it, vi } from "vitest";

describe("getBaseUrl", () => {
  it("falls back to the browser origin when no env var is present", async () => {
    vi.resetModules();
    const { getBaseUrl } = await import("./get-base-url");

    expect(getBaseUrl()).toBe("http://localhost:3000/api/v1");
  });
});
