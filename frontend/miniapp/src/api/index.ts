/**
 * API surface — re-exports from lib for blueprint-aligned single entry.
 * App-specific client (webappApi, token) lives in api/client.ts.
 * refreshAuth/TokenPair: kept in lib/api-client for admin; not used by miniapp.
 */
export {
  createApiClient,
  getBaseUrl,
  type ApiClient,
  type ApiClientOptions,
} from "@/lib/api-client";
export { getMe, getPlans, postAuth } from "./endpoints";
export type { PlanItem, PlansResponse } from "./endpoints";
