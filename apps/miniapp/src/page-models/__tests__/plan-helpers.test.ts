import { describe, expect, it } from "vitest";
import { formatStars } from "../plan-helpers";

describe("plan helper formatting", () => {
  it("formats Stars as rounded numeric text without emoji prefix", () => {
    expect(formatStars(78.8)).toBe("79");
    expect(formatStars(0)).toBe("0");
    expect(formatStars(-5)).toBe("0");
  });
});
