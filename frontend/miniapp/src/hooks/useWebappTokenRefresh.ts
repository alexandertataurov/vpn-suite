import { useEffect, useRef } from "react";
import type { WebAppAuthResponse } from "@vpn-suite/shared";
import { getBaseUrl } from "@/lib/api-client";
import { getWebappTokenExpiresAt, setWebappToken, useWebappToken } from "@/api/client";

const REFRESH_BEFORE_MS = 60_000;
const POLL_INTERVAL_MS = 30_000;

/**
 * Proactively refresh webapp session before expiry. Runs when we have token and initData.
 * Uses raw fetch to /webapp/auth (no Bearer) so refresh works even near expiry.
 */
export function useWebappTokenRefresh(initData: string) {
  const token = useWebappToken();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !initData) return;

    const scheduleRefresh = () => {
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
      const base = getBaseUrl().replace(/\/$/, "");
      fetch(`${base}/webapp/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_data: initData }),
      })
        .then((res) => res.json())
        .then((data: WebAppAuthResponse) => {
          if (data?.session_token && typeof data.expires_in === "number") {
            setWebappToken(data.session_token, data.expires_in);
            scheduleRefresh();
          }
        })
        .catch(() => {
          scheduleRefresh();
        });
    };

    scheduleRefresh();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [token, initData]);
}
