import type { WebAppAuthResponse } from "@vpn-suite/shared";
import { webappApi } from "../client";

/** Exchange init_data for session token. No Bearer. */
export function postAuth(initData: string): Promise<WebAppAuthResponse> {
  return webappApi.postUnauthenticated<WebAppAuthResponse>("/webapp/auth", { init_data: initData });
}
