/**
 * Centralized env config. Single source of truth for build-time env vars.
 * Consumers must not read import.meta.env directly.
 */

function readEnv(key: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.[key];
}

/**
 * Control-plane API root. Must include the `/api/v1` suffix (e.g. `https://host/api/v1`).
 *
 * - If `VITE_API_BASE_URL` is set: used as-is (trailing slash stripped). Wrong suffix
 *   (e.g. origin only) breaks `/webapp/*` and `/log/*` paths.
 * - In the browser with no env var: `${window.location.origin}/api/v1` — same origin as the
 *   page; use `VITE_API_BASE_URL` when the API lives on another host.
 * - Local `pnpm dev` (miniapp): Vite proxies `/api` → `localhost:8000`, so same-origin
 *   `/api/v1/...` reaches the API without setting this var.
 */
export function getApiBaseUrl(): string {
  const fromEnv = readEnv("VITE_API_BASE_URL");
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined") return `${window.location.origin}/api/v1`;
  return "/api/v1";
}

/** Bot @username without @. Used for referral links and support. Empty if not set. */
export const telegramBotUsername: string = (readEnv("VITE_TELEGRAM_BOT_USERNAME") ?? "").trim();

/** Build-visible app version for support/debug surfaces. */
export const appVersion: string = (readEnv("VITE_APP_VERSION") ?? "1.0.0").trim();

/** Build identifier/date for support/debug surfaces. */
export const buildId: string = (
  readEnv("VITE_BUILD_ID") ??
  readEnv("VITE_BUILD_VERSION") ??
  "release"
).trim();

/** Returns the bot t.me link or null. Eliminates repeated inline construction. */
export function getSupportBotHref(): string | null {
  return telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;
}
