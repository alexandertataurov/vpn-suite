import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import type { ServerList } from "@vpn-suite/shared/types";
import { useAuthStore } from "../store/authStore";
import { SERVERS_LIST_KEY } from "../api/query-keys";

export type StreamConnectionState = "live" | "degraded" | "offline";

const MAX_FAILURES_BEFORE_DEGRADED = 3;
const THROTTLE_MS = 400;
const BACKOFF_INITIAL_MS = 2000;
const BACKOFF_MAX_MS = 60_000;
export const SKIP_STREAM_404_KEY = "vpn-suite-servers-stream-404";

interface ServerStatusPayloadItem {
  id: string;
  status?: string;
  last_seen_at?: string | null;
  health_score?: number | null;
  is_draining?: boolean;
  last_snapshot_at?: string | null;
}

function mergeStatusIntoList(
  current: ServerList | undefined,
  payload: ServerStatusPayloadItem[]
): ServerList | undefined {
  if (!current?.items?.length || !Array.isArray(payload) || payload.length === 0)
    return current;
  const byId = new Map(payload.map((p) => [p.id, p]));
  const nextItems = current.items.map((s) => {
    const u = byId.get(s.id);
    if (!u) return s;
    return {
      ...s,
      status: (u.status as ServerList["items"][0]["status"]) ?? s.status,
      last_seen_at: u.last_seen_at ?? s.last_seen_at,
      health_score: u.health_score ?? s.health_score,
      is_draining: u.is_draining ?? s.is_draining,
      last_snapshot_at: u.last_snapshot_at ?? s.last_snapshot_at,
    };
  });
  return { ...current, items: nextItems };
}

export function useServersStream(enabled: boolean) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<StreamConnectionState>("offline");
  const [retryKey, setRetryKey] = useState(0);
  const failureCountRef = useRef(0);
  const backoffMsRef = useRef(BACKOFF_INITIAL_MS);
  const scheduledRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<ServerStatusPayloadItem[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const retry = useCallback(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SKIP_STREAM_404_KEY);
    }
    failureCountRef.current = 0;
    backoffMsRef.current = BACKOFF_INITIAL_MS;
    setRetryKey((k) => k + 1);
  }, []);

  const applyUpdate = useCallback(
    (payload: ServerStatusPayloadItem[]) => {
      const queries = queryClient.getQueriesData<ServerList>({ queryKey: SERVERS_LIST_KEY });
      for (const [queryKey, data] of queries) {
        const next = mergeStatusIntoList(data, payload);
        if (next) queryClient.setQueryData(queryKey, next);
      }
    },
    [queryClient]
  );

  const flushThrottled = useCallback(() => {
    if (pendingPayloadRef.current) {
      applyUpdate(pendingPayloadRef.current);
      pendingPayloadRef.current = null;
    }
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
  }, [applyUpdate]);

  const pushUpdate = useCallback(
    (payload: ServerStatusPayloadItem[]) => {
      if (throttleRef.current) {
        pendingPayloadRef.current = payload;
        return;
      }
      applyUpdate(payload);
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        if (pendingPayloadRef.current) {
          applyUpdate(pendingPayloadRef.current);
          pendingPayloadRef.current = null;
        }
      }, THROTTLE_MS);
    },
    [applyUpdate]
  );

  useEffect(() => {
    if (!enabled) {
      setConnectionState("offline");
      abortRef.current?.abort();
      flushThrottled();
      return;
    }
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SKIP_STREAM_404_KEY)) {
      setConnectionState("degraded");
      return;
    }
    if (failureCountRef.current >= MAX_FAILURES_BEFORE_DEGRADED) {
      setConnectionState("degraded");
      return;
    }

    const token = useAuthStore.getState().getAccessToken();
    if (!token) {
      setConnectionState("offline");
      return;
    }

    const base = getBaseUrl().replace(/\/$/, "");
    const url = `${base}/servers/stream`;
    const controller = new AbortController();
    abortRef.current = controller;
    const STREAM_TIMEOUT_MS = 60_000;
    const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

    let buffer = "";
    const run = async () => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok || !res.body) {
          if (res.status === 404 && typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(SKIP_STREAM_404_KEY, "1");
          }
          failureCountRef.current =
            res.status === 404 ? MAX_FAILURES_BEFORE_DEGRADED : failureCountRef.current + 1;
          setConnectionState(
            failureCountRef.current >= MAX_FAILURES_BEFORE_DEGRADED ? "degraded" : "offline"
          );
          if (failureCountRef.current < MAX_FAILURES_BEFORE_DEGRADED) {
            const delay = Math.min(backoffMsRef.current, BACKOFF_MAX_MS);
            scheduledRetryRef.current = setTimeout(() => {
              scheduledRetryRef.current = null;
              backoffMsRef.current = Math.min(backoffMsRef.current * 2, BACKOFF_MAX_MS);
              setRetryKey((k) => k + 1);
            }, delay);
          }
          return;
        }
        failureCountRef.current = 0;
        backoffMsRef.current = BACKOFF_INITIAL_MS;
        setConnectionState("live");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let eventType = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line === undefined) continue;
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ") && eventType === "server.status") {
              try {
                const data = JSON.parse(line.slice(6)) as ServerStatusPayloadItem[];
                if (Array.isArray(data)) pushUpdate(data);
              } catch {
                /* ignore parse error */
              }
              eventType = "";
            }
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if ((e as Error).name === "AbortError") return;
        failureCountRef.current += 1;
        setConnectionState(
          failureCountRef.current >= MAX_FAILURES_BEFORE_DEGRADED ? "degraded" : "offline"
        );
        if (failureCountRef.current < MAX_FAILURES_BEFORE_DEGRADED) {
          const delay = Math.min(backoffMsRef.current, BACKOFF_MAX_MS);
          scheduledRetryRef.current = setTimeout(() => {
            scheduledRetryRef.current = null;
            backoffMsRef.current = Math.min(backoffMsRef.current * 2, BACKOFF_MAX_MS);
            setRetryKey((k) => k + 1);
          }, delay);
        }
      }
    };

    run();
    return () => {
      clearTimeout(timeoutId);
      if (scheduledRetryRef.current) {
        clearTimeout(scheduledRetryRef.current);
        scheduledRetryRef.current = null;
      }
      controller.abort();
      abortRef.current = null;
      flushThrottled();
    };
  }, [enabled, retryKey, flushThrottled, pushUpdate]);

  return { connectionState, retry };
}
