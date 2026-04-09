import type { WebAppMeResponse } from "@vpn-suite/shared";
import { webappApi } from "../client";

export function getMe(): Promise<WebAppMeResponse> {
  return webappApi.get<WebAppMeResponse>("/webapp/me");
}
