import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { useAuthStore } from "../store/authStore";
import { DEVICES_KEY, DEVICES_SUMMARY_KEY } from "../api/query-keys";

const STREAM_PATH = "/devices/stream";

export function useDevicesStream(enabled: boolean): void {
  const queryClient = useQueryClient();

  const onChanged = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;
    const token = useAuthStore.getState().getAccessToken();
    if (!token) return;

    let abort = false;
    let backoffMs = 2000;
    let buffer = "";
    let eventType = "";

    const run = async (): Promise<void> => {
      const base = getBaseUrl().replace(/\/$/, "");
      const url = `${base}${STREAM_PATH}`;
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
        });
        if (!res.ok || !res.body || abort) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (!abort) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            if (line?.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line?.startsWith("data: ") && eventType === "devices.changed") {
              onChanged();
              eventType = "";
            }
          }
        }
      } catch {
        /* ignore */
      }
      if (!abort) {
        setTimeout(run, Math.min(backoffMs, 60_000));
        backoffMs = Math.min(backoffMs * 2, 60_000);
      }
    };

    run();
    return () => {
      abort = true;
    };
  }, [enabled, onChanged]);
}
