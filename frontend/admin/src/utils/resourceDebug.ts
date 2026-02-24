import { useSyncExternalStore } from "react";
import type { ResourceError, ResourceStatus } from "../hooks/useResource";

export interface ResourceDebugEntry {
  source: string;
  count: number;
  status?: ResourceStatus;
  lastLatencyMs?: number;
  updatedAt?: string;
  lastRequestedAt?: string;
  lastError?: ResourceError;
  requestId?: string;
}

const store = new Map<string, ResourceDebugEntry>();
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

export function recordResourceEvent(
  source: string,
  update: Partial<ResourceDebugEntry> & { count?: number }
) {
  const previous = store.get(source);
  const next: ResourceDebugEntry = {
    source,
    count: (previous?.count ?? 0) + (update.count ?? 0),
    status: update.status ?? previous?.status,
    lastLatencyMs: update.lastLatencyMs ?? previous?.lastLatencyMs,
    updatedAt: update.updatedAt ?? previous?.updatedAt,
    lastRequestedAt: update.lastRequestedAt ?? previous?.lastRequestedAt,
    lastError: update.lastError ?? previous?.lastError,
    requestId: update.requestId ?? previous?.requestId,
  };
  store.set(source, next);
  emit();
}

function snapshot(): ResourceDebugEntry[] {
  return Array.from(store.values()).sort((a, b) => a.source.localeCompare(b.source));
}

export function useResourceDebug() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    snapshot
  );
}
