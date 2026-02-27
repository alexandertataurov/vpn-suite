import { api } from "../../api/client";
import type { ApiError } from "@vpn-suite/shared/types";

export interface TelemetryRequestOptions {
  signal?: AbortSignal;
}

export interface TelemetryError {
  message: string;
  statusCode?: number;
  requestId?: string | null;
  endpoint: string;
  details?: unknown;
}

type InflightKey = string;

const inflight = new Map<InflightKey, Promise<unknown>>();

function makeKey(method: string, path: string): InflightKey {
  return `${method}:${path}`;
}

export async function getJson<T>(path: string, options: TelemetryRequestOptions = {}): Promise<T> {
  const key = makeKey("GET", path);
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const p = (async () => {
    try {
      return await api.get<T>(path, { signal: options.signal });
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export function toTelemetryError(err: unknown, endpoint: string): TelemetryError {
  const base: TelemetryError = {
    message: "Failed to load telemetry",
    endpoint,
  };
  try {
    if ((err as ApiError)?.statusCode != null) {
      const apiErr = err as ApiError;
      return {
        message: apiErr.message ?? base.message,
        statusCode: apiErr.statusCode,
        requestId: apiErr.requestId ?? null,
        endpoint,
        details: apiErr,
      };
    }
    if (err instanceof Error) {
      return {
        message: err.message || base.message,
        endpoint,
        details: err,
      };
    }
  } catch {
    // fall through to base
  }
  return base;
}

