export const AMNEZIA_VPN_IOS_URL = "https://apps.apple.com/app/amneziavpn/id1600529900";
export const AMNEZIA_VPN_ANDROID_URL = "https://play.google.com/store/apps/details?id=org.amnezia.vpn";
export const AMNEZIA_VPN_DESKTOP_URL = "https://amnezia.org";

export type AmneziaVpnPlatform = "ios" | "android" | "desktop" | "unknown";

function getDefaultUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent ?? "";
}

export function detectAmneziaVpnPlatform(userAgent = getDefaultUserAgent()): AmneziaVpnPlatform {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("android")) return "android";
  if (
    ua.includes("macintosh") ||
    ua.includes("mac os") ||
    ua.includes("windows") ||
    ua.includes("linux") ||
    ua.includes("x11")
  ) {
    return "desktop";
  }
  return "unknown";
}

export function getAmneziaVpnPlatformUrl(platform: AmneziaVpnPlatform): string | null {
  if (platform === "ios") return AMNEZIA_VPN_IOS_URL;
  if (platform === "android") return AMNEZIA_VPN_ANDROID_URL;
  if (platform === "desktop") return AMNEZIA_VPN_DESKTOP_URL;
  return null;
}
