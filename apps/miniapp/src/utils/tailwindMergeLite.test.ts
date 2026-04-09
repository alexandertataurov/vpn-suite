import { describe, it, expect } from "vitest";
import { twMerge } from "./tailwindMergeLite";

describe("tailwindMergeLite", () => {
  describe("twMerge", () => {
    it("joins multiple class strings with spaces", () => {
      expect(twMerge("a", "b", "c")).toBe("a b c");
    });

    it("filters falsy values", () => {
      expect(twMerge("a", undefined, "b", null, false, "c")).toBe("a b c");
    });

    it("returns empty string for empty input", () => {
      expect(twMerge()).toBe("");
    });

    it("returns empty string when all values are falsy", () => {
      expect(twMerge(undefined, null, false)).toBe("");
    });

    it("handles single string", () => {
      expect(twMerge("btn-primary")).toBe("btn-primary");
    });

    it("filters empty strings", () => {
      expect(twMerge("a", "", "b")).toBe("a b");
    });
  });
});
