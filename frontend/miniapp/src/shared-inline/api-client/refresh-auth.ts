import { ApiError, isApiErrorBody } from "../types/api-error";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/**
 * Call auth/refresh with the given refresh token. Returns new tokens or throws ApiError.
 */
export async function refreshAuth(baseUrl: string, refreshToken: string): Promise<TokenPair> {
  const base = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshToken}` },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("PARSE_ERROR", text || res.statusText, res.status);
  }
  if (!res.ok) {
    if (isApiErrorBody(data)) {
      throw ApiError.fromBody(data);
    }
    throw new ApiError(
      "HTTP_ERROR",
      (data as { error?: { message?: string } })?.error?.message ?? res.statusText,
      res.status
    );
  }
  return data as TokenPair;
}
