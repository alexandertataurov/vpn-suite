import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError } from "@vpn-suite/shared/types";
import {
  computeFreshnessStatus,
  freshnessStatusToLabel,
  freshnessStatusToVariant,
  getTelemetryErrorMessage,
  FRESHNESS_FRESH_MAX_S,
  FRESHNESS_DEGRADED_MAX_S,
} from "./telemetry-freshness";

describe("telemetry-freshness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns unknown when lastUpdatedMs is null", () => {
    expect(computeFreshnessStatus(null)).toBe("unknown");
  });

  it("returns partial when partial option is true", () => {
    expect(computeFreshnessStatus(Date.now(), { partial: true })).toBe("partial");
  });

  it("returns fresh when age <= 30s", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const ts = now - FRESHNESS_FRESH_MAX_S * 1000;
    expect(computeFreshnessStatus(ts)).toBe("fresh");
  });

  it("returns degraded when 30s < age <= 2m", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const ts = now - (FRESHNESS_FRESH_MAX_S + 10) * 1000;
    expect(computeFreshnessStatus(ts)).toBe("degraded");
  });

  it("returns stale when age > 2m", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const ts = now - (FRESHNESS_DEGRADED_MAX_S + 10) * 1000;
    expect(computeFreshnessStatus(ts)).toBe("stale");
  });

  it("freshnessStatusToLabel returns correct labels", () => {
    expect(freshnessStatusToLabel("fresh")).toBe("Fresh");
    expect(freshnessStatusToLabel("degraded")).toBe("Degraded");
    expect(freshnessStatusToLabel("stale")).toBe("Stale");
    expect(freshnessStatusToLabel("partial")).toBe("Partial");
    expect(freshnessStatusToLabel("unknown")).toBe("Unknown");
  });

  it("freshnessStatusToVariant returns correct variants", () => {
    expect(freshnessStatusToVariant("fresh")).toBe("success");
    expect(freshnessStatusToVariant("degraded")).toBe("warning");
    expect(freshnessStatusToVariant("partial")).toBe("warning");
    expect(freshnessStatusToVariant("stale")).toBe("danger");
    expect(freshnessStatusToVariant("unknown")).toBe("info");
  });

  it("getTelemetryErrorMessage returns status-aware messages", () => {
    expect(getTelemetryErrorMessage(new ApiError("FORBIDDEN", "x", 403))).toContain("Permission denied");
    expect(getTelemetryErrorMessage(new ApiError("RATE_LIMIT", "x", 429))).toContain("Rate limited");
    expect(getTelemetryErrorMessage(new ApiError("UNAVAILABLE", "x", 503))).toContain("Service unavailable");
    expect(getTelemetryErrorMessage(new ApiError("TIMEOUT", "x", 0))).toContain("timed out");
  });
});
