import { ApiError } from "@vpn-suite/shared/types";

export const TRANSIENT_HTTP_STATUS = new Set([502, 503, 504]);

export function isNetworkUnreachableError(err: unknown): boolean {
  return (
    err instanceof ApiError
    && (
      err.code === "NETWORK_UNREACHABLE"
      || (err.statusCode === 0 && err.code !== "TIMEOUT")
    )
  );
}

export function shouldRetryQuery(
  failureCount: number,
  err: unknown,
  maxRetries = 2,
): boolean {
  if (isNetworkUnreachableError(err)) return false;
  if (!(err instanceof ApiError)) return false;
  return TRANSIENT_HTTP_STATUS.has(err.statusCode) && failureCount < maxRetries;
}

export function cooldownRemainingMs(cooldownUntilMs: number | null, nowMs = Date.now()): number {
  if (!cooldownUntilMs) return 0;
  return Math.max(0, cooldownUntilMs - nowMs);
}
