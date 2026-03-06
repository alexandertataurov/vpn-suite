import { ApiError } from "@vpn-suite/shared";

/**
 * Extract a user-facing error message from an unknown error.
 * Prefers ApiError.message; falls back to Error.message or a generic string.
 */
export function getErrorMessage(err: unknown, fallback = "An error occurred"): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
