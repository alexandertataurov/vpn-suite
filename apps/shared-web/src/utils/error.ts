import { ApiError } from "../types/api-error";

// Why: normalize unknown error inputs into stable UI-safe message text.
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error != null && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

