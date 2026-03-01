import { describe, expect, it } from "vitest";

import { formatChartTimeAxisLabel, formatCompactNumber } from "../formatters";

describe("chart formatters", () => {
  it("formats compact numbers", () => {
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(1_000)).toBe("1K");
    expect(formatCompactNumber(1_250_000)).toBe("1.3M");
    expect(formatCompactNumber(2_000_000_000)).toBe("2G");
  });

  it("formats time axis labels in UTC and local modes", () => {
    const ts = Date.UTC(2026, 1, 28, 12, 30, 0);
    const utc = formatChartTimeAxisLabel(ts, "utc", 60 * 60 * 1000);
    const local = formatChartTimeAxisLabel(ts, "local", 60 * 60 * 1000);
    expect(typeof utc).toBe("string");
    expect(utc.length).toBeGreaterThan(0);
    expect(typeof local).toBe("string");
    expect(local.length).toBeGreaterThan(0);
  });
});
