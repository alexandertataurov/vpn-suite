import { createApiClient, getBaseUrl } from "@vpn-suite/shared/api-client";

let token: string | null = null;
export function setWebappToken(t: string | null) {
  token = t;
}
export function getWebappToken() {
  return token;
}

export const webappApi = createApiClient({
  baseUrl: getBaseUrl(),
  getToken: () => token,
  onUnauthorized: () => {
    setWebappToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("webapp:unauthorized"));
    }
  },
});
