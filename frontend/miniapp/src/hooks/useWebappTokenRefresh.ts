import { useEffect, useRef } from "react";
import { postAuth } from "@/api";
import { getWebappTokenExpiresAt, setWebappToken, useWebappToken } from "@/api/client";

const REFRESH_BEFORE_MS = 60_000;
const POLL_INTERVAL_MS = 30_000;

export interface UseWebappTokenRefreshOptions {
  /** Called when a refresh attempt fails (e.g. network error). */
  onError?: (err: unknown) => void;
}

/**
 * Proactively refresh webapp session before expiry. Runs when we have token and initData.
 * Uses {@link postAuth} (unauthenticated POST to `/webapp/auth`) so refresh works near expiry.
 */
export function useWebappTokenRefresh(
  initData: string,
  options: UseWebappTokenRefreshOptions = {},
) {
  const { onError } = options;
  const token = useWebappToken();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    mountedRef.current = true;
    if (!token || !initData) return;

    const scheduleRefresh = () => {
      if (!mountedRef.current) return;
      const expiresAt = getWebappTokenExpiresAt();
      if (expiresAt == null) return;

      const now = Date.now();
      const msUntilRefresh = expiresAt - now - REFRESH_BEFORE_MS;
      if (msUntilRefresh <= 0) {
        doRefresh();
        return;
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        doRefresh();
      }, Math.min(msUntilRefresh, POLL_INTERVAL_MS));
    };

    const doRefresh = () => {
      postAuth(initData)
        .then((data) => {
          if (!mountedRef.current) return;
          if (data?.session_token && typeof data.expires_in === "number") {
            setWebappToken(data.session_token, data.expires_in);
            scheduleRefresh();
          }
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          onErrorRef.current?.(err);
          scheduleRefresh();
        });
    };

    scheduleRefresh();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [token, initData]);
}
