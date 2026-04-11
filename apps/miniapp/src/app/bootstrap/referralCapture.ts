/**
 * Early referral capture and sessionStorage persistence.
 * Capture at module load so ref survives router/URL changes.
 * Feature logic — lives in bootstrap, not lib.
 */

import { telegramClient } from "@/lib/telegram/telegramCoreClient";

const REF_PREFIX = "ref_";
export const PENDING_REF_CODE_KEY = "pending_referral_code";
export const PENDING_REF_SOURCE_KEY = "pending_referral_source";
export const PENDING_REF_CAPTURED_AT_KEY = "pending_referral_captured_at";

export type RefCaptureSource = "query" | "early_capture" | "launch_params" | "storage";

export function normalizeReferralCode(raw: string): string {
  const s = raw.trim();
  return s.startsWith(REF_PREFIX) ? s.slice(REF_PREFIX.length).trim() : s;
}

function isValidCode(code: string): boolean {
  return normalizeReferralCode(code).length > 0;
}

/** Early-captured ref at module load (URL query + start_param). */
let earlyCapturedRef: string | null = null;
let earlyCapturedSource: RefCaptureSource = "query";

if (typeof window !== "undefined") {
  const fromQuery = new URLSearchParams(window.location.search).get("ref")?.trim();
  if (fromQuery && isValidCode(fromQuery)) {
    const code = normalizeReferralCode(fromQuery);
    earlyCapturedRef = code;
    earlyCapturedSource = "query";
    try {
      sessionStorage.setItem(PENDING_REF_CODE_KEY, code);
      sessionStorage.setItem(PENDING_REF_SOURCE_KEY, "query");
      sessionStorage.setItem(PENDING_REF_CAPTURED_AT_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  } else {
    const unsafe = telegramClient.getInitDataUnsafe();
    let startParam =
      typeof (unsafe as { start_param?: string })?.start_param === "string"
        ? (unsafe as { start_param: string }).start_param
        : "";
    if (!startParam) {
      try {
        startParam =
          new URLSearchParams(window.location.search).get("tgWebAppStartParam") ?? "";
        if (!startParam && window.location.hash) {
          startParam =
            new URLSearchParams(
              window.location.hash.startsWith("#")
                ? window.location.hash.slice(1)
                : window.location.hash
            ).get("tgWebAppStartParam") ?? "";
        }
      } catch {
        // ignore
      }
    }
    if (startParam && isValidCode(startParam)) {
      const code = normalizeReferralCode(startParam);
      earlyCapturedRef = code;
      earlyCapturedSource = "launch_params";
      try {
        sessionStorage.setItem(PENDING_REF_CODE_KEY, code);
        sessionStorage.setItem(PENDING_REF_SOURCE_KEY, "launch_params");
        sessionStorage.setItem(PENDING_REF_CAPTURED_AT_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }
  }
}

export function getEarlyCapturedRef(): string | null {
  return earlyCapturedRef;
}

export function getEarlyCapturedSource(): RefCaptureSource {
  return earlyCapturedSource;
}

export function persistPendingRef(code: string, source: RefCaptureSource): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeReferralCode(code);
  if (!normalized) return;
  try {
    sessionStorage.setItem(PENDING_REF_CODE_KEY, normalized);
    sessionStorage.setItem(PENDING_REF_SOURCE_KEY, source);
    sessionStorage.setItem(PENDING_REF_CAPTURED_AT_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

export function clearPendingRef(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_REF_CODE_KEY);
    sessionStorage.removeItem(PENDING_REF_SOURCE_KEY);
    sessionStorage.removeItem(PENDING_REF_CAPTURED_AT_KEY);
  } catch {
    // ignore
  }
}

export function getPendingRefFromStorage(): { code: string; source: RefCaptureSource } | null {
  if (typeof window === "undefined") return null;
  try {
    const code = sessionStorage.getItem(PENDING_REF_CODE_KEY)?.trim();
    const source = (sessionStorage.getItem(PENDING_REF_SOURCE_KEY)?.trim() || "storage") as RefCaptureSource;
    if (code && isValidCode(code)) {
      return { code: normalizeReferralCode(code), source };
    }
  } catch {
    // ignore
  }
  return null;
}
