/**
 * API surface — re-exports from lib for blueprint-aligned single entry.
 * App-specific client (webappApi, token) lives in api/client.ts.
 */
export {
  createApiClient,
  getBaseUrl,
  refreshAuth,
  type ApiClient,
  type ApiClientOptions,
  type TokenPair,
} from "@/lib/api-client";
