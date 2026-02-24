import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared/types";
import { recordResourceEvent } from "../utils/resourceDebug";
import { registerResource } from "../utils/resourceRegistry";

export type ResourceStatus = "idle" | "loading" | "success" | "empty" | "error" | "stale";

export interface ResourceError {
  message: string;
  code?: string | number;
  requestId?: string;
}

export interface ResourceState<T> {
  status: ResourceStatus;
  data?: T;
  error?: ResourceError;
  updatedAt?: string;
  isStale: boolean;
  source: string;
  requestId: string;
  lastLatencyMs?: number;
  lastRequestedAt?: string;
}

export interface ResourceHandle<T> extends ResourceState<T> {
  refresh: () => Promise<void>;
}

export function deriveResource<T>(
  parent: ResourceState<unknown>,
  source: string,
  data: T | undefined,
  ttlMs: number,
  isEmpty?: (data: T | undefined) => boolean
): ResourceState<T> {
  const baseStatus: ResourceStatus =
    parent.status === "loading"
      ? "loading"
      : parent.status === "error"
        ? "error"
        : "success";
  const updatedAt = parent.updatedAt;
  const error = parent.error;
  const status = deriveStatus(baseStatus, updatedAt, ttlMs, data, error, isEmpty);
  return {
    status,
    data,
    error,
    updatedAt,
    isStale: computeIsStale(updatedAt, ttlMs),
    source,
    requestId: parent.requestId,
    lastLatencyMs: parent.lastLatencyMs,
    lastRequestedAt: parent.lastRequestedAt,
  };
}

interface ResourceOptions<T> {
  source: string;
  ttlMs: number;
  enabled?: boolean;
  debounceMs?: number;
  register?: boolean;
  isEmpty?: (data: T | undefined) => boolean;
  fetcher: (ctx: { signal: AbortSignal; requestId: string }) => Promise<T>;
}

const DEFAULT_DEBOUNCE_MS = 600;
const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

function normalizeError(err: unknown): ResourceError {
  if (err instanceof ApiError) {
    return {
      message: err.message || "Request failed",
      code: err.statusCode ?? err.code,
      requestId: err.requestId,
    };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: String(err) };
}

function computeEmpty<T>(data: T | undefined, isEmpty?: (data: T | undefined) => boolean): boolean {
  if (isEmpty) return Boolean(isEmpty(data));
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === "object") return false;
  return data == null;
}

function computeIsStale(updatedAt: string | undefined, ttlMs: number): boolean {
  if (!updatedAt) return false;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs > ttlMs;
}

function deriveStatus<T>(
  base: ResourceStatus,
  updatedAt: string | undefined,
  ttlMs: number,
  data: T | undefined,
  error: ResourceError | undefined,
  isEmpty?: (data: T | undefined) => boolean
): ResourceStatus {
  if (base === "loading") return "loading";
  if (error) return "error";
  if (computeEmpty(data, isEmpty)) return "empty";
  if (computeIsStale(updatedAt, ttlMs)) return "stale";
  return "success";
}

export function useResource<T>({
  source,
  ttlMs,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  register = true,
  isEmpty,
  fetcher,
}: ResourceOptions<T>): ResourceHandle<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ResourceError | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ResourceStatus>("idle");
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(undefined);
  const [lastRequestedAt, setLastRequestedAt] = useState<string | undefined>(undefined);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastRefreshRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastRefreshRef.current < debounceMs) return;
    lastRefreshRef.current = now;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = String(++requestIdRef.current);
    setStatus("loading");
    setError(undefined);
    setLastRequestedAt(new Date(now).toISOString());
    if (isDev) {
      recordResourceEvent(source, {
        requestId,
        status: "loading",
        lastRequestedAt: new Date(now).toISOString(),
      });
    }
    const started = performance.now();
    try {
      const result = await fetcher({ signal: controller.signal, requestId });
      if (controller.signal.aborted || requestIdRef.current !== Number(requestId)) return;
      const updated = new Date().toISOString();
      setData(result);
      setUpdatedAt(updated);
      setStatus("success");
      setError(undefined);
      const latency = Math.round(performance.now() - started);
      setLastLatencyMs(latency);
      if (isDev) {
        recordResourceEvent(source, {
          requestId,
          status: deriveStatus("success", updated, ttlMs, result, undefined, isEmpty),
          lastLatencyMs: latency,
          updatedAt: updated,
          count: 1,
        });
      }
    } catch (err) {
      if (controller.signal.aborted || requestIdRef.current !== Number(requestId)) return;
      const normalized = normalizeError(err);
      setError(normalized);
      setStatus("error");
      const latency = Math.round(performance.now() - started);
      setLastLatencyMs(latency);
      if (isDev) {
        recordResourceEvent(source, {
          requestId,
          status: "error",
          lastLatencyMs: latency,
          lastError: normalized,
          count: 1,
        });
      }
    }
  }, [debounceMs, enabled, fetcher, isEmpty, source, ttlMs]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, refresh]);

  useEffect(() => {
    if (!register) return;
    return registerResource(source, refresh);
  }, [refresh, register, source]);

  const effectiveStatus = useMemo(
    () => deriveStatus(status, updatedAt, ttlMs, data, error, isEmpty),
    [status, updatedAt, ttlMs, data, error, isEmpty]
  );
  const isStale = computeIsStale(updatedAt, ttlMs);

  return {
    status: effectiveStatus,
    data,
    error,
    updatedAt,
    isStale,
    source,
    requestId: String(requestIdRef.current),
    lastLatencyMs,
    lastRequestedAt,
    refresh,
  };
}

export function useResourceFromQuery<T>(
  source: string,
  queryKey: readonly unknown[],
  query: UseQueryResult<T, unknown>,
  ttlMs: number,
  opts?: { debounceMs?: number; isEmpty?: (data: T | undefined) => boolean; register?: boolean }
): ResourceHandle<T> {
  const queryClient = useQueryClient();
  const requestIdRef = useRef(0);
  const lastRefreshRef = useRef(0);
  const debounceMs = opts?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const register = opts?.register ?? true;
  const updatedAt = query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined;
  const error = query.error ? normalizeError(query.error) : undefined;
  const status = query.isLoading && !query.data ? "loading" : error ? "error" : "success";
  const effectiveStatus = deriveStatus(status, updatedAt, ttlMs, query.data, error, opts?.isEmpty);
  const isStale = computeIsStale(updatedAt, ttlMs);

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < debounceMs) return;
    lastRefreshRef.current = now;
    const requestId = String(++requestIdRef.current);
    await queryClient.cancelQueries({ queryKey });
    if (isDev) {
      recordResourceEvent(source, {
        requestId,
        status: "loading",
        lastRequestedAt: new Date(now).toISOString(),
      });
    }
    await queryClient.refetchQueries({ queryKey });
  }, [debounceMs, queryClient, queryKey, source]);

  useEffect(() => {
    if (!isDev) return;
    if (query.isFetching) {
      recordResourceEvent(source, { status: "loading", lastRequestedAt: new Date().toISOString(), count: 1 });
      return;
    }
    if (error) {
      recordResourceEvent(source, { status: "error", lastError: error, updatedAt, count: 0 });
      return;
    }
    if (query.data) {
      recordResourceEvent(source, { status: effectiveStatus, updatedAt, count: 0 });
    }
  }, [effectiveStatus, error, query.data, query.isFetching, source, updatedAt]);

  useEffect(() => {
    if (!register) return;
    return registerResource(source, refresh);
  }, [refresh, register, source]);

  return {
    status: effectiveStatus,
    data: query.data,
    error,
    updatedAt,
    isStale,
    source,
    requestId: String(requestIdRef.current),
    lastLatencyMs: undefined,
    lastRequestedAt: undefined,
    refresh,
  };
}
