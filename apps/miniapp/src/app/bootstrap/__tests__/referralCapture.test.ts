import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeReferralCode,
  persistPendingRef,
  clearPendingRef,
  getPendingRefFromStorage,
  PENDING_REF_CODE_KEY,
  PENDING_REF_SOURCE_KEY,
} from "../referralCapture";

describe("referralCapture", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("normalizeReferralCode", () => {
    it("strips ref_ prefix", () => {
      expect(normalizeReferralCode("ref_ABC123")).toBe("ABC123");
      expect(normalizeReferralCode("ref_123")).toBe("123");
    });

    it("trims whitespace", () => {
      expect(normalizeReferralCode("  ABC  ")).toBe("ABC");
    });

    it("returns as-is when no prefix", () => {
      expect(normalizeReferralCode("ABC123")).toBe("ABC123");
    });
  });

  describe("persistPendingRef / getPendingRefFromStorage", () => {
    it("persists code and source to sessionStorage", () => {
      persistPendingRef("ABC123", "query");
      const result = getPendingRefFromStorage();
      expect(result).toEqual({ code: "ABC123", source: "query" });
      expect(sessionStorage.getItem(PENDING_REF_CODE_KEY)).toBe("ABC123");
      expect(sessionStorage.getItem(PENDING_REF_SOURCE_KEY)).toBe("query");
    });

    it("normalizes ref_ prefix when persisting", () => {
      persistPendingRef("ref_XYZ", "launch_params");
      const result = getPendingRefFromStorage();
      expect(result).toEqual({ code: "XYZ", source: "launch_params" });
    });
  });

  describe("clearPendingRef", () => {
    it("removes pending ref from sessionStorage", () => {
      persistPendingRef("ABC", "query");
      expect(getPendingRefFromStorage()).not.toBeNull();
      clearPendingRef();
      expect(getPendingRefFromStorage()).toBeNull();
    });
  });
});
