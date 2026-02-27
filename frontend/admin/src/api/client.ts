import { createApiClient, getBaseUrl, refreshAuth } from "@vpn-suite/shared/api-client";
import type { ApiClient } from "@vpn-suite/shared/api-client";
import { ApiError } from "@vpn-suite/shared/types";
import { ADMIN_BASE } from "../config";
import { useAuthStore } from "../store/authStore";
import { track } from "../telemetry";

/** Dashboard/peers and other overview calls may be slow on high-latency links; use 30s. */
const API_TIMEOUT_MS = 30_000;

function genCorrelationId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function withInstrumentation(base: ApiClient): ApiClient {
  const wrap = async <T>(
    path: string,
    method: string,
    init: RequestInit | undefined,
    fn: (headers: Headers) => Promise<T>
  ): Promise<T> => {
    const correlationId = genCorrelationId();
    const headers = new Headers(init?.headers);
    headers.set("X-Request-ID", correlationId);
    const start = performance.now();
    try {
      const result = await fn(headers);
      try {
        track("api_request", {
          path,
          method,
          status: 200,
          duration_ms: Math.round(performance.now() - start),
          correlation_id: correlationId,
        });
      } catch {
        /* telemetry never throws */
      }
      return result;
    } catch (e) {
      try {
        const code =
          e instanceof ApiError ? e.statusCode : e && typeof e === "object" && "statusCode" in e ? (e as ApiError).statusCode : 0;
        track("api_error", {
          path,
          method,
          code: code || (e instanceof Error ? e.message : "unknown"),
          correlation_id: correlationId,
        });
      } catch {
        /* noop */
      }
      throw e;
    }
  };

  return {
    request<T>(path: string, init?: RequestInit): Promise<T> {
      const method = (init?.method ?? "GET").toUpperCase();
      return wrap(path, method, init, (headers) =>
        base.request<T>(path, { ...init, headers })
      );
    },
    get<T>(path: string, init?: RequestInit): Promise<T> {
      return wrap(path, "GET", init, (headers) =>
        base.get<T>(path, { ...init, headers })
      );
    },
    getBlob(path: string, init?: RequestInit): Promise<Blob> {
      return wrap(path, "GET", init, (headers) =>
        base.getBlob(path, { ...init, headers })
      );
    },
    post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
      return wrap(path, "POST", init, (headers) =>
        base.post<T>(path, body, { ...init, headers })
      );
    },
    put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
      return wrap(path, "PUT", init, (headers) =>
        base.put<T>(path, body, { ...init, headers })
      );
    },
    patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
      return wrap(path, "PATCH", init, (headers) =>
        base.patch<T>(path, body, { ...init, headers })
      );
    },
  };
}

const baseApi = createApiClient({
  baseUrl: getBaseUrl(),
  getToken: () => useAuthStore.getState().getAccessToken(),
  timeoutMs: API_TIMEOUT_MS,
  onUnauthorized: async () => {
    const refresh = useAuthStore.getState().getRefreshToken();
    if (!refresh) {
      useAuthStore.getState().logout();
      window.location.href = `${ADMIN_BASE}/login`;
      return;
    }
    try {
      const data = await refreshAuth(getBaseUrl(), refresh);
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      window.location.reload();
    } catch {
      useAuthStore.getState().logout();
      window.location.href = `${ADMIN_BASE}/login`;
    }
  },
});

export const api = withInstrumentation(baseApi);
