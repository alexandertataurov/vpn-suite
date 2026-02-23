import { describe, it, expect } from "vitest";
import { ApiError } from "@vpn-suite/shared/types";
import { cooldownRemainingMs, isNetworkUnreachableError, shouldRetryQuery } from "./queryPolicy";

describe("queryPolicy", () => {
  it("marks NETWORK_UNREACHABLE as network failure", () => {
    const err = new ApiError("NETWORK_UNREACHABLE", "Network unreachable", 0);
    expect(isNetworkUnreachableError(err)).toBe(true);
  });

  it("does not treat timeout as DNS/network unreachable", () => {
    const err = new ApiError("TIMEOUT", "timeout", 0);
    expect(isNetworkUnreachableError(err)).toBe(false);
  });

  it("retries only transient upstream statuses", () => {
    expect(shouldRetryQuery(0, new ApiError("HTTP_ERROR", "bad gateway", 502))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError("HTTP_ERROR", "bad gateway", 502))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("HTTP_ERROR", "internal", 500))).toBe(false);
  });

  it("never retries network unreachable in query layer", () => {
    const err = new ApiError("NETWORK_UNREACHABLE", "dns fail", 0);
    expect(shouldRetryQuery(0, err)).toBe(false);
  });

  it("computes cooldown remaining", () => {
    expect(cooldownRemainingMs(null, 1000)).toBe(0);
    expect(cooldownRemainingMs(1500, 1000)).toBe(500);
    expect(cooldownRemainingMs(900, 1000)).toBe(0);
  });
});
