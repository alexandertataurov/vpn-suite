export type LiveConnectionState = "offline" | "connecting" | "connected" | "degraded" | "error";

export interface LiveClusterState {
  nodes: LiveNodeState[];
  updatedAt: number;
}

export interface LiveNodeState {
  nodeId: string;
  status: string;
  peerCount: number | null;
  rxBytes: number | null;
  txBytes: number | null;
  heartbeatAgeSeconds: number | null;
  stale: boolean;
}
