import type { UserAccessResponse } from "@vpn-suite/shared";
import { webappApi } from "../client";

export function getUserAccess(): Promise<UserAccessResponse> {
  return webappApi.get<UserAccessResponse>("/webapp/user/access");
}
