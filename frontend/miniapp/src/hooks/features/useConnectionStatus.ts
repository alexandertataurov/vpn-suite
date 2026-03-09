import { useCallback, useEffect, useState } from "react";

export interface UseConnectionStatusOptions {
  /** URL for latency probe (HEAD request). Default: "/api/health" */
  latencyProbeUrl?: string;
  /** Poll interval in ms. Default: 15000 */
  pollMs?: number;
}

export function useConnectionStatus(
  options: UseConnectionStatusOptions = {},
): { isOnline: boolean; latency: number | null } {
  const { latencyProbeUrl = "/api/health", pollMs = 15000 } = options;
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [latency, setLatency] = useState<number | null>(null);

  const probe = useCallback(
    async (signal?: AbortSignal) => {
      if (typeof window === "undefined") return;
      if (!navigator.onLine) {
        setIsOnline(false);
        setLatency(null);
        return;
      }
      const startedAt = performance.now();
      try {
        const res = await fetch(latencyProbeUrl, {
          method: "HEAD",
          cache: "no-store",
          signal,
        });
        if (signal?.aborted) return;
        if (!res.ok) {
          setIsOnline(false);
          setLatency(null);
          return;
        }
        setIsOnline(true);
        setLatency(Math.round(performance.now() - startedAt));
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setIsOnline(false);
        setLatency(null);
      }
    },
    [latencyProbeUrl],
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    void probe(signal);
    const onOnline = () => {
      setIsOnline(true);
      void probe(signal);
    };
    const onOffline = () => {
      setIsOnline(false);
      setLatency(null);
    };
    const timer = window.setInterval(() => {
      void probe(signal);
    }, pollMs);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [pollMs, probe]);

  return { isOnline, latency };
}

