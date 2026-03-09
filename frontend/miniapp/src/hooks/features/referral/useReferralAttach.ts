import { useEffect, useRef } from "react";
import { ApiError } from "@vpn-suite/shared";
import { useTelegramInitData } from "@/hooks/telegram/useTelegramInitData";
import { useWebappToken, webappApi } from "@/api/client";
import { useToast } from "@/design-system";
import {
  type RefCaptureSource,
  normalizeReferralCode,
  persistPendingRef,
  clearPendingRef,
  getPendingRefFromStorage,
  getEarlyCapturedRef,
  getEarlyCapturedSource,
} from "@/bootstrap/referralCapture";

const RETRY_DELAY_MS = 1500;

export type { RefCaptureSource } from "@/bootstrap/referralCapture";

/**
 * Resolution chain: (1) start param, (2) URL query ref, (3) early capture, (4) sessionStorage.
 * When a value is found, it is persisted to sessionStorage before return.
 */
function getReferralCodeWithSource(
  startParam: string,
  urlSearch?: string,
): { code: string | null; source: RefCaptureSource } {
  if (typeof window === "undefined") {
    return { code: null, source: "query" };
  }

  if (startParam) {
    const code = normalizeReferralCode(startParam);
    if (code) {
      persistPendingRef(code, "launch_params");
      return { code, source: "launch_params" };
    }
  }

  const fromQuery = new URLSearchParams(urlSearch ?? window.location.search).get("ref")?.trim();
  if (fromQuery) {
    const code = normalizeReferralCode(fromQuery);
    if (code) {
      persistPendingRef(code, "query");
      return { code, source: "query" };
    }
  }

  const early = getEarlyCapturedRef();
  if (early) {
    persistPendingRef(early, getEarlyCapturedSource());
    return { code: early, source: getEarlyCapturedSource() };
  }

  const fromStorage = getPendingRefFromStorage();
  if (fromStorage) return fromStorage;

  return { code: null, source: "query" };
}

function isRetryable(statusCode: number): boolean {
  return statusCode >= 500 || statusCode === 0;
}

/** Terminal attach outcomes: clear pending ref. */
const TERMINAL_STATUSES = new Set([
  "attached",
  "already_attached",
  "invalid_ref",
  "self_referral_blocked",
  "expired",
  "skipped",
]);

function isTerminalStatus(status: string | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

/** Backend attach response: status attached | already_attached; legacy ok + attached. */
function isAttachSuccess(body: { status?: string; attached?: boolean }): boolean {
  if (body.status === "attached" || body.status === "already_attached") return true;
  if (body.status === "ok" && body.attached === true) return true;
  if (body.status === "ok" && body.attached === false) return true; // idempotent already_attached
  return false;
}

/**
 * Call POST /webapp/referral/attach once per session when token and ref are present.
 * Priority: start param → URL query → early capture → sessionStorage.
 * Clear pending ref on terminal outcome (attached, already_attached, invalid_ref, self_referral_blocked).
 * Retries once on 5xx/network; shows toast on 4xx or after retry failure.
 */
export function useReferralAttach(): void {
  const token = useWebappToken();
  const { startParam } = useTelegramInitData();
  const retriedRef = useRef(false);
  const capturedRef = useRef<{ code: string; source: RefCaptureSource } | null>(null);
  const attachAttemptedRef = useRef(false);
  const { addToast } = useToast();

  if (capturedRef.current === null) {
    const urlSearch = typeof window !== "undefined" ? window.location.search : "";
    const { code, source } = getReferralCodeWithSource(startParam, urlSearch);
    if (code) capturedRef.current = { code, source };
  }

  useEffect(() => {
    if (!token || attachAttemptedRef.current) return;
    const captured = capturedRef.current;
    if (!captured) return;
    attachAttemptedRef.current = true;

    if (process.env.NODE_ENV === "development") {
      console.debug("[referral] attach_attempt", { source: captured.source, code: captured.code });
    }

    const attach = (): void => {
      webappApi
        .post<{ status?: string; attached?: boolean; referrer_user_id?: number }>(
          "/webapp/referral/attach",
          { ref: captured.code },
        )
        .then((body) => {
          if (isAttachSuccess(body)) {
            clearPendingRef();
            if (process.env.NODE_ENV === "development") {
              const result =
                body.status === "attached"
                  ? "attached"
                  : body.status === "already_attached"
                    ? "already_attached"
                    : body.attached === true
                      ? "attached"
                      : "already_attached";
              console.debug("[referral] attach_result", {
                ref_capture_source: captured.source,
                attach_result: result,
              });
            }
          }
        })
        .catch((err: unknown) => {
          const statusCode = err instanceof ApiError ? err.statusCode : 0;
          const detail = err instanceof ApiError ? err.details : undefined;
          const detailStatus =
            detail && typeof detail === "object" && "status" in detail
              ? String((detail as { status?: string }).status)
              : undefined;
          if (isTerminalStatus(detailStatus)) {
            clearPendingRef();
          }
          if (process.env.NODE_ENV === "development") {
            console.debug("[referral] attach_result", {
              ref_capture_source: captured.source,
              attach_result: detailStatus ?? "error",
            });
          }
          if (isRetryable(statusCode) && !retriedRef.current) {
            retriedRef.current = true;
            setTimeout(attach, RETRY_DELAY_MS);
          } else {
            if (!isTerminalStatus(detailStatus)) {
              clearPendingRef();
            }
            addToast("Referral link could not be applied. Open again from the invite link.", "error");
          }
        });
    };
    attach();
  }, [token, addToast, startParam]);
}
