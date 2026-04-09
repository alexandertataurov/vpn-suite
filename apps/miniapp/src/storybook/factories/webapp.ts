import type { WebAppMeResponse } from "@vpn-suite/shared";
import { webappMeActive } from "../fixtures";

export function createWebappMeFixture(overrides: Partial<WebAppMeResponse> = {}): WebAppMeResponse {
  return {
    ...webappMeActive,
    ...overrides,
    user: {
      ...webappMeActive.user,
      ...(overrides.user ?? {}),
    },
    onboarding: {
      ...webappMeActive.onboarding,
      ...(overrides.onboarding ?? {}),
    },
    subscriptions: overrides.subscriptions ?? webappMeActive.subscriptions,
    devices: overrides.devices ?? webappMeActive.devices,
  };
}
