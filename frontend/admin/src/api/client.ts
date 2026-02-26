import { createApiClient, getBaseUrl, refreshAuth } from "@vpn-suite/shared/api-client";
import { ADMIN_BASE } from "../config";
import { useAuthStore } from "../store/authStore";

/** Dashboard/peers and other overview calls may be slow on high-latency links; use 30s. */
const API_TIMEOUT_MS = 30_000;

export const api = createApiClient({
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
