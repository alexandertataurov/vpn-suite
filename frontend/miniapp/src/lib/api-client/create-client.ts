import { ApiError, isApiErrorBody } from "@vpn-suite/shared";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_RETRIES = 2;
const RETRY_STATUSES = [502, 503, 504];
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Correlation ID usage:
 * - Backend may return X-Request-ID and X-Correlation-ID in response headers.
 * - ApiError preserves requestId and correlationId for debugging and support.
 * - Use err.requestId / err.correlationId when reporting issues or tracing.
 * - Never log or expose tokens; use correlationId to correlate logs with backend.
 */
export interface ApiRequestLogInfo {
  path: string;
  method: string;
  status?: number;
  durationMs: number;
  requestId?: string;
  correlationId?: string;
  errorCode?: string;
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void | Promise<void>;
  /** Per-request timeout in ms. Default: 15 000. Set 0 to disable. */
  timeoutMs?: number;
  /** Optional hook for request lifecycle. Receives path, method, status, duration, correlation info. No bodies or tokens. */
  onRequestLog?: (info: ApiRequestLogInfo) => void;
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
  /** Fetch binary response (e.g. image, QR). Uses same auth, retry, timeout as other methods. */
  getBlob(path: string, init?: RequestInit): Promise<Blob>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  /** POST without Bearer header. For auth exchange (e.g. /webapp/auth). Same timeout, retry, error handling. */
  postUnauthenticated<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const responseRequestId = res.headers.get("X-Request-ID") ?? undefined;
  const responseCorrelationId = res.headers.get("X-Correlation-ID") ?? undefined;
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(
      "PARSE_ERROR",
      text || res.statusText,
      res.status,
      responseCorrelationId ? { correlation_id: responseCorrelationId } : undefined,
      responseRequestId,
      responseCorrelationId
    );
  }
  if (!res.ok) {
    if (isApiErrorBody(data)) {
      const parsed = ApiError.fromBody(data);
      const requestId = parsed.requestId || responseRequestId;
      const correlationId = parsed.correlationId || responseCorrelationId;
      if (requestId === parsed.requestId && correlationId === parsed.correlationId) {
        throw parsed;
      }
      throw new ApiError(
        parsed.code,
        parsed.message,
        parsed.statusCode,
        {
          ...(parsed.details ?? {}),
          ...(correlationId ? { correlation_id: correlationId } : {}),
        },
        requestId,
        correlationId
      );
    }
    const msg =
      (data as { detail?: { message?: string } })?.detail?.message ??
      (data as { error?: { message?: string } })?.error?.message ??
      res.statusText;
    throw new ApiError(
      "HTTP_ERROR",
      msg,
      res.status,
      responseCorrelationId ? { correlation_id: responseCorrelationId } : undefined,
      responseRequestId,
      responseCorrelationId
    );
  }
  return data as T;
}

/** Read 401 response body for user-facing message; fallback to "Session expired". */
async function parse401Message(res: Response): Promise<string> {
  try {
    const text = await res.clone().text();
    const d = text ? (JSON.parse(text) as { error?: { message?: string } }) : null;
    if (d?.error?.message) return String(d.error.message);
  } catch {
    // ignore
  }
  return "Your session expired. Tap Retry to sign in again.";
}

function runRequestLog(
  onRequestLog: ApiClientOptions["onRequestLog"],
  info: ApiRequestLogInfo
): void {
  if (onRequestLog) {
    try {
      onRequestLog(info);
    } catch {
      // Ignore hook errors
    }
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseUrl, getToken, onUnauthorized, onRequestLog } = options;
  const base = baseUrl.replace(/\/$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(
    path: string,
    init: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const start = Date.now();
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const hasBody = init.body != null;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = getToken?.() ?? null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Compose caller signal (if any) with timeout
    let signal = init.signal ?? null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs > 0) {
      const ac = new AbortController();
      timer = setTimeout(() => ac.abort(), timeoutMs);
      if (signal) {
        // If caller already aborted, propagate immediately
        if (signal.aborted) { ac.abort(signal.reason); }
        else { signal.addEventListener("abort", () => ac.abort(signal!.reason), { once: true }); }
      }
      signal = ac.signal;
    }

    let res: Response;
    try {
      res = await fetch(url, { ...init, method, headers, signal });
    } catch (err) {
      if (timer) clearTimeout(timer);
      const isTimeout = err instanceof DOMException && err.name === "AbortError" && !init.signal?.aborted;
      const isNetwork = err instanceof TypeError;
      if (isTimeout || isNetwork) {
        if (retries < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
          return request<T>(path, init, retries + 1);
        }
        const code = isTimeout ? "TIMEOUT" : "NETWORK_UNREACHABLE";
        runRequestLog(onRequestLog, { path, method, durationMs: Date.now() - start, errorCode: code });
        throw new ApiError(
          code,
          isTimeout ? `Request timed out after ${timeoutMs}ms` : (err as Error).message || "Cannot reach server",
          0
        );
      }
      runRequestLog(onRequestLog, { path, method, durationMs: Date.now() - start, errorCode: "UNKNOWN" });
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (res.status === 401 && onUnauthorized) {
      await onUnauthorized();
      runRequestLog(onRequestLog, {
        path,
        method,
        status: 401,
        durationMs: Date.now() - start,
        requestId: res.headers.get("X-Request-ID") ?? undefined,
        correlationId: res.headers.get("X-Correlation-ID") ?? undefined,
        errorCode: "UNAUTHORIZED",
      });
      const msg = await parse401Message(res);
      throw new ApiError("UNAUTHORIZED", msg, 401);
    }

    if (!res.ok && RETRY_STATUSES.includes(res.status) && SAFE_METHODS.has(method) && retries < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
      return request<T>(path, init, retries + 1);
    }

    try {
      const data = await parseResponse<T>(res);
      runRequestLog(onRequestLog, {
        path,
        method,
        status: res.status,
        durationMs: Date.now() - start,
        requestId: res.headers.get("X-Request-ID") ?? undefined,
        correlationId: res.headers.get("X-Correlation-ID") ?? undefined,
      });
      return data;
    } catch (err) {
      const info: ApiRequestLogInfo = { path, method, durationMs: Date.now() - start };
      if (err instanceof ApiError) {
        info.status = err.statusCode;
        info.requestId = err.requestId;
        info.correlationId = err.correlationId;
        info.errorCode = err.code;
      } else {
        info.errorCode = "UNKNOWN";
      }
      runRequestLog(onRequestLog, info);
      throw err;
    }
  }

  async function requestUnauthenticated<T>(
    path: string,
    init: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const start = Date.now();
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const method = (init.method ?? "POST").toUpperCase();
    const headers = new Headers(init.headers);
    const hasBody = init.body != null;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    // No Bearer header for auth exchange (e.g. /webapp/auth)

    let signal = init.signal ?? null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs > 0) {
      const ac = new AbortController();
      timer = setTimeout(() => ac.abort(), timeoutMs);
      if (signal) {
        if (signal.aborted) ac.abort(signal.reason);
        else signal.addEventListener("abort", () => ac.abort(signal!.reason), { once: true });
      }
      signal = ac.signal;
    }

    let res: Response;
    try {
      res = await fetch(url, { ...init, method, headers, signal });
    } catch (err) {
      if (timer) clearTimeout(timer);
      const isTimeout = err instanceof DOMException && err.name === "AbortError" && !init.signal?.aborted;
      const isNetwork = err instanceof TypeError;
      if (isTimeout || isNetwork) {
        if (retries < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
          return requestUnauthenticated<T>(path, init, retries + 1);
        }
        const code = isTimeout ? "TIMEOUT" : "NETWORK_UNREACHABLE";
        runRequestLog(onRequestLog, { path, method, durationMs: Date.now() - start, errorCode: code });
        throw new ApiError(
          code,
          isTimeout ? `Request timed out after ${timeoutMs}ms` : (err as Error).message || "Cannot reach server",
          0
        );
      }
      runRequestLog(onRequestLog, { path, method, durationMs: Date.now() - start, errorCode: "UNKNOWN" });
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    // For auth exchange, 401 means invalid init_data; throw, do not call onUnauthorized
    if (res.status === 401) {
      runRequestLog(onRequestLog, {
        path,
        method,
        status: 401,
        durationMs: Date.now() - start,
        requestId: res.headers.get("X-Request-ID") ?? undefined,
        correlationId: res.headers.get("X-Correlation-ID") ?? undefined,
        errorCode: "UNAUTHORIZED",
      });
      const msg = await parse401Message(res);
      throw new ApiError("UNAUTHORIZED", msg, 401);
    }

    if (!res.ok && RETRY_STATUSES.includes(res.status) && retries < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
      return requestUnauthenticated<T>(path, init, retries + 1);
    }

    try {
      const data = await parseResponse<T>(res);
      runRequestLog(onRequestLog, {
        path,
        method,
        status: res.status,
        durationMs: Date.now() - start,
        requestId: res.headers.get("X-Request-ID") ?? undefined,
        correlationId: res.headers.get("X-Correlation-ID") ?? undefined,
      });
      return data;
    } catch (err) {
      const info: ApiRequestLogInfo = { path, method, durationMs: Date.now() - start };
      if (err instanceof ApiError) {
        info.status = err.statusCode;
        info.requestId = err.requestId;
        info.correlationId = err.correlationId;
        info.errorCode = err.code;
      } else {
        info.errorCode = "UNKNOWN";
      }
      runRequestLog(onRequestLog, info);
      throw err;
    }
  }

  async function getBlob(path: string, init: RequestInit = {}, retries = 0): Promise<Blob> {
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    const token = getToken?.() ?? null;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let signal = init.signal ?? null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs > 0) {
      const ac = new AbortController();
      timer = setTimeout(() => ac.abort(), timeoutMs);
      if (signal) {
        if (signal.aborted) ac.abort(signal.reason);
        else signal.addEventListener("abort", () => ac.abort(signal!.reason), { once: true });
      }
      signal = ac.signal;
    }

    let res: Response;
    try {
      res = await fetch(url, { ...init, method: "GET", headers, signal });
    } catch (err) {
      if (timer) clearTimeout(timer);
      if (err instanceof DOMException && err.name === "AbortError" && !init.signal?.aborted) {
        throw new ApiError("TIMEOUT", `Request timed out after ${timeoutMs}ms`, 0);
      }
      if (err instanceof TypeError) {
        throw new ApiError("NETWORK_UNREACHABLE", err.message || "Network unreachable", 0);
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (res.status === 401 && onUnauthorized) {
      await onUnauthorized();
      const msg = await parse401Message(res);
      throw new ApiError("UNAUTHORIZED", msg, 401);
    }

    if (!res.ok && RETRY_STATUSES.includes(res.status) && retries < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
      return getBlob(path, init, retries + 1);
    }

    if (!res.ok) {
      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new ApiError("HTTP_ERROR", text || res.statusText, res.status);
      }
      if (isApiErrorBody(data)) throw ApiError.fromBody(data);
      throw new ApiError(
        "HTTP_ERROR",
        (data as { error?: { message?: string } })?.error?.message ?? res.statusText,
        res.status
      );
    }
    return res.blob();
  }

  return {
    request<T>(path: string, init?: RequestInit) {
      return request<T>(path, init ?? {});
    },
    get<T>(path: string, init?: RequestInit) {
      return request<T>(path, { ...init, method: "GET" });
    },
    getBlob(path: string, init?: RequestInit) {
      return getBlob(path, init ?? {});
    },
    post<T>(path: string, body?: unknown, init?: RequestInit) {
      const requestInit: RequestInit = { ...init, method: "POST" };
      if (body !== undefined) requestInit.body = JSON.stringify(body);
      return request<T>(path, requestInit);
    },
    put<T>(path: string, body?: unknown, init?: RequestInit) {
      const requestInit: RequestInit = { ...init, method: "PUT" };
      if (body !== undefined) requestInit.body = JSON.stringify(body);
      return request<T>(path, requestInit);
    },
    patch<T>(path: string, body?: unknown, init?: RequestInit) {
      const requestInit: RequestInit = { ...init, method: "PATCH" };
      if (body !== undefined) requestInit.body = JSON.stringify(body);
      return request<T>(path, requestInit);
    },
    postUnauthenticated<T>(path: string, body?: unknown, init?: RequestInit) {
      const requestInit: RequestInit = { ...init, method: "POST" };
      if (body !== undefined) requestInit.body = JSON.stringify(body);
      return requestUnauthenticated<T>(path, requestInit);
    },
  };
}
