import { describe, it, expect } from "vitest";

const BACKOFF_MAX_MS = 60_000;

function backoffInterval(baseMs: number, failureCount: number): number {
  if (failureCount <= 0) return baseMs;
  const multiplier = Math.min(Math.pow(2, Math.min(failureCount, 4)), BACKOFF_MAX_MS / baseMs);
  return Math.min(baseMs * multiplier, BACKOFF_MAX_MS);
}

describe("telemetry backoff", () => {
  it("returns base when failureCount is 0", () => {
    expect(backoffInterval(8000, 0)).toBe(8000);
  });

  it("doubles on first failure", () => {
    expect(backoffInterval(8000, 1)).toBe(16_000);
  });

  it("caps at BACKOFF_MAX_MS", () => {
    expect(backoffInterval(8000, 5)).toBe(BACKOFF_MAX_MS);
  });

  it("resets on success (failureCount 0)", () => {
    expect(backoffInterval(5000, 0)).toBe(5000);
  });
});
