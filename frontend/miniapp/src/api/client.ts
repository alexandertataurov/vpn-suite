import { useSyncExternalStore } from "react";
import { createApiClient, getBaseUrl } from "@vpn-suite/shared/api-client";

let token: string | null = null;
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

export function setWebappToken(t: string | null) {
  if (token === t) return;
  token = t;
  notify();
}

export function getWebappToken(): string | null {
  return token;
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
