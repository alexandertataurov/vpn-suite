export { ApiError, isApiErrorBody, type ApiErrorBody } from "@vpn-suite/shared";

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
  getBlob(path: string, init?: RequestInit): Promise<Blob>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
}

export interface ApiClientOptions {
  baseUrl: string | (() => string);
  getToken?: () => string | null;
  onUnauthorized?: () => void | Promise<void>;
  timeoutMs?: number;
}
