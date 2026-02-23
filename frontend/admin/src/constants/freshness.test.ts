import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFreshnessLevel, FRESH_MS, DEGRADED_MS } from "./freshness";

describe("getFreshnessLevel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns unknown for null", () => {
    expect(getFreshnessLevel(null)).toBe("unknown");
  });

  it("returns unknown for undefined", () => {
    expect(getFreshnessLevel(undefined)).toBe("unknown");
  });

  it("returns unknown for empty string", () => {
    expect(getFreshnessLevel("")).toBe("unknown");
  });

  it("returns fresh when age <= 30s", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const iso = new Date(now - FRESH_MS).toISOString();
    expect(getFreshnessLevel(iso)).toBe("fresh");
  });

  it("returns degraded when 30s < age <= 2m", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const iso = new Date(now - FRESH_MS - 10_000).toISOString();
    expect(getFreshnessLevel(iso)).toBe("degraded");
  });

  it("returns stale when age > 2m", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const iso = new Date(now - DEGRADED_MS - 10_000).toISOString();
    expect(getFreshnessLevel(iso)).toBe("stale");
  });

  it("uses custom staleThresholdMs when provided", () => {
    const customThreshold = 10 * 60 * 1000; // 10 min
    const now = Date.now();
    vi.setSystemTime(now);
    const iso5min = new Date(now - 5 * 60 * 1000).toISOString();
    expect(getFreshnessLevel(iso5min, customThreshold)).toBe("degraded");
    const iso15min = new Date(now - 15 * 60 * 1000).toISOString();
    expect(getFreshnessLevel(iso15min, customThreshold)).toBe("stale");
  });
});
