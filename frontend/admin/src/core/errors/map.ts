import { ApiError } from "@/shared/types/api-error";

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export function mapApiErrorToAppError(err: unknown): AppError {
  if (err instanceof ApiError) {
    const retryable =
      err.statusCode === 0 ||
      err.statusCode === 502 ||
      err.statusCode === 503 ||
      err.statusCode === 504 ||
      err.code === "TIMEOUT" ||
      err.code === "NETWORK_UNREACHABLE";
    const userMessage =
      err.code === "UNAUTHORIZED"
        ? "Session expired. Please sign in again."
        : err.code === "TIMEOUT"
          ? "Request timed out. Try again."
          : err.code === "NETWORK_UNREACHABLE"
            ? "Network error. Check connection and retry."
            : err.message;
    return {
      code: err.code,
      message: err.message,
      userMessage,
      retryable,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    code: "UNKNOWN",
    message,
    userMessage: "Something went wrong. Try again.",
    retryable: true,
  };
}
