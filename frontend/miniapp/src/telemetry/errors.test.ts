import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vpn-suite/shared", () => ({
  trackError: vi.fn(),
}));

vi.mock("./sentry", () => ({
  captureException: vi.fn(),
}));

describe("telemetry/errors", () => {
  it("throttles repeated identical errors by cooldown", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T00:00:00Z"));

    const fetchMock = vi.fn().mockResolvedValue({});
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    vi.resetModules();
    const { reportError } = await import("./errors");

    const err = new Error("boom");
    reportError(err, { route: "/webapp" });
    reportError(err, { route: "/webapp" });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10_001);
    reportError(err, { route: "/webapp" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps global posts per minute per tab", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T00:00:00Z"));

    const fetchMock = vi.fn().mockResolvedValue({});
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    vi.resetModules();
    const { reportError } = await import("./errors");

    for (let i = 0; i < 30; i++) {
      reportError(new Error(`boom-${i}`), { route: "/webapp" });
    }

    // POST_CAP_PER_WINDOW is 10 in errors.ts
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});

