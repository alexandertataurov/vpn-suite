/** Analytics module constants. */

export const EVENT_VERSION = "1.0";

export const APP_NAMES = {
  miniapp: "vpn-suite-miniapp",
  admin: "vpn-suite-admin",
} as const;

export type AppSurface = "miniapp" | "admin" | "bot" | "api" | "worker";
