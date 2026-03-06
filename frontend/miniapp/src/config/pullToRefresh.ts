export interface PullToRefreshProfile {
  threshold: number;
  maxPull: number;
  resistance: number;
}

export const PULL_TO_REFRESH_PROFILES: Record<"ios" | "android" | "default", PullToRefreshProfile> = {
  ios: {
    threshold: 72,
    maxPull: 156,
    resistance: 0.58,
  },
  android: {
    threshold: 92,
    maxPull: 140,
    resistance: 0.44,
  },
  default: {
    threshold: 84,
    maxPull: 140,
    resistance: 0.45,
  },
};

export function resolvePullToRefreshProfile(platform: string): PullToRefreshProfile {
  if (platform.includes("ios")) return PULL_TO_REFRESH_PROFILES.ios;
  if (platform.includes("android")) return PULL_TO_REFRESH_PROFILES.android;
  return PULL_TO_REFRESH_PROFILES.default;
}

