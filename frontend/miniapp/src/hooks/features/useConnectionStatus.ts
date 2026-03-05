import { useCallback, useEffect, useState } from "react";

interface UseConnectionStatusOptions {
  latencyProbeUrl?: string;
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

  const probe = useCallback(async () => {
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
      });
      if (!res.ok) {
        setIsOnline(false);
        setLatency(null);
        return;
      }
      setIsOnline(true);
      setLatency(Math.round(performance.now() - startedAt));
    } catch {
      setIsOnline(false);
      setLatency(null);
    }
  }, [latencyProbeUrl]);

  useEffect(() => {
    probe();
    const onOnline = () => {
      setIsOnline(true);
      void probe();
    };
    const onOffline = () => {
      setIsOnline(false);
      setLatency(null);
    };
    const timer = window.setInterval(() => {
      void probe();
    }, pollMs);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [pollMs, probe]);

  return { isOnline, latency };
}

