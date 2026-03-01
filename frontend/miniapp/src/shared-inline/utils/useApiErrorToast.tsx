import { useCallback } from "react";
import { getErrorMessage } from "./error";
import { ApiError } from "../types/api-error";
import { useToast } from "../ui/feedback/Toast";
import type { ToastVariant } from "../ui/feedback/Toast";

export type ApiErrorToastVariant = "error" | "warning" | "info" | "success";

export interface ApiErrorToastOptions {
  defaultMessage?: string;
  variant?: ApiErrorToastVariant;
}

/**
 * Canonical helper for showing API errors via the shared Toast system.
 * Ensures consistent message formatting and request_id surfacing.
 */
export function useApiErrorToast(options: ApiErrorToastOptions = {}) {
  const { defaultMessage = "Request failed", variant = "error" } = options;
  const { addToast } = useToast();

  const showApiError = useCallback(
    (err: unknown, fallbackMessage?: string) => {
      const base = getErrorMessage(err, fallbackMessage ?? defaultMessage);
      const rid = err instanceof ApiError ? err.requestId : undefined;
      const message = rid ? `${base} (request_id=${rid})` : base;
      const toastVariant: ToastVariant = variant === "warning" ? "info" : variant;
      addToast(message, toastVariant);
    },
    [addToast, defaultMessage, variant]
  );

  return { showApiError };
}

