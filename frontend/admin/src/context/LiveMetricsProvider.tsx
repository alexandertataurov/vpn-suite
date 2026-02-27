import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  type LiveClusterState,
  type LiveConnectionState,
  applyLiveEvent,
} from "../live/liveMetricsStore";
import { startLiveMetricsStream, stopLiveMetricsStream } from "../live/liveMetricsClient";

const LIVE_OBS_ENABLED =
  typeof import.meta !== "undefined" && import.meta.env.VITE_LIVE_OBS_ENABLED === "1";

interface LiveMetricsContextValue {
  cluster: LiveClusterState | null;
  connectionState: LiveConnectionState;
}

const LiveMetricsContext = createContext<LiveMetricsContextValue | undefined>(undefined);

export function LiveMetricsProvider({ children }: { children: ReactNode }) {
  const [cluster, setCluster] = useState<LiveClusterState | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("offline");
  const lastEmitRef = useRef<number>(0);
  const pendingRef = useRef<LiveClusterState | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!LIVE_OBS_ENABLED) return undefined;

    const applyThrottled = (next: LiveClusterState | null) => {
      if (!next) return;
      const now = Date.now();
      const sinceLast = now - lastEmitRef.current;
      const MIN_INTERVAL_MS = 1000;
      if (sinceLast >= MIN_INTERVAL_MS || lastEmitRef.current === 0) {
        lastEmitRef.current = now;
        setCluster(next);
        return;
      }
      pendingRef.current = next;
      if (!throttleRef.current) {
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
          if (pendingRef.current) {
            lastEmitRef.current = Date.now();
            setCluster(pendingRef.current);
            pendingRef.current = null;
          }
        }, MIN_INTERVAL_MS - sinceLast);
      }
    };

    startLiveMetricsStream({
      onEvent: (event) => {
        setCluster((prev) => {
          const next = applyLiveEvent(prev, event);
          if (next !== prev) {
            applyThrottled(next);
          }
          return prev;
        });
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
    });

    return () => {
      stopLiveMetricsStream();
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      pendingRef.current = null;
      lastEmitRef.current = 0;
      setCluster(null);
      setConnectionState("offline");
    };
  }, []);

  const value = useMemo(
    () => ({
      cluster,
      connectionState,
    }),
    [cluster, connectionState]
  );

  return <LiveMetricsContext.Provider value={value}>{children}</LiveMetricsContext.Provider>;
}

function useLiveMetricsContext(): LiveMetricsContextValue {
  const ctx = useContext(LiveMetricsContext);
  if (!ctx) {
    return { cluster: null, connectionState: "offline" };
  }
  return ctx;
}

export function useClusterLiveMetrics(): LiveClusterState | null {
  return useLiveMetricsContext().cluster;
}

export function useNodeLiveMetrics(nodeId: string): LiveNodeLiveMetrics | null {
  const { cluster } = useLiveMetricsContext();
  if (!cluster || !nodeId) return null;
  const node = cluster.nodes[nodeId];
  if (!node) return null;
  return {
    nodeId,
    status: node.status,
    peerCount: node.peer_count ?? null,
    rxBytes: node.rx_bytes ?? null,
    txBytes: node.tx_bytes ?? null,
    heartbeatAgeSeconds: node.heartbeat_age_s ?? null,
    stale: Boolean(node.stale),
  };
}

export function useLiveConnectionState(): LiveConnectionState {
  return useLiveMetricsContext().connectionState;
}

interface LiveNodeLiveMetrics {
  nodeId: string;
  status: string;
  peerCount: number | null;
  rxBytes: number | null;
  txBytes: number | null;
  heartbeatAgeSeconds: number | null;
  stale: boolean;
}

