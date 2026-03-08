import { useSyncExternalStore } from "react";
import { createApiClient, getBaseUrl } from "@/lib/api-client";

/** Single source of truth: in-memory only. Never logged or sent to telemetry. */
let token: string | null = null;
/** Expiry timestamp (ms). Set when token is set with expires_in from /webapp/auth. */
let tokenExpiresAt: number | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): string | null {
  return token;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

/**
 * Set webapp session token. Optionally pass expires_in (seconds) from /webapp/auth for proactive refresh.
 * Token is stored in memory only; never logged or sent to telemetry.
 */
export function setWebappToken(t: string | null, expiresInSeconds?: number) {
  if (token === t && expiresInSeconds == null) return;
  token = t;
  tokenExpiresAt =
    t != null && typeof expiresInSeconds === "number" && expiresInSeconds > 0
      ? Date.now() + expiresInSeconds * 1000
      : null;
  notify();
}

export function getWebappToken(): string | null {
  return token;
}

/** For proactive refresh: when to refresh (ms before expiry). */
export function getWebappTokenExpiresAt(): number | null {
  return tokenExpiresAt;
}

export function useWebappToken(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const webappApi = createApiClient({
  baseUrl: getBaseUrl(),
  getToken: () => token,
  onUnauthorized: () => {
    setWebappToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("webapp:unauthorized"));
    }
  },
});
