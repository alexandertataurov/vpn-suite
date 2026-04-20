/**
 * Centralized env config. Single source of truth for build-time env vars.
 * Consumers must not read import.meta.env directly.
 */

function readEnv(key: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.[key];
}

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = (readEnv(key) ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
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

/** Bot @username without @. Used for referral/deep links back to the main bot. */
export const telegramBotUsername: string = (readEnv("VITE_TELEGRAM_BOT_USERNAME") ?? "").trim();

/** Dedicated support contact @username without @. */
export const supportContactUsername: string = (
  readEnv("VITE_SUPPORT_CONTACT_USERNAME") ??
  "aplhaVPNSupport"
).trim().replace(/^@/, "");

/** Public privacy policy URL shown in account/support surfaces. */
export const privacyPolicyUrl: string = (
  readEnv("VITE_PRIVACY_POLICY_URL") ??
  "https://telegra.ph/Politika-konfidencialnosti-04-01-26"
).trim();

/** Public terms / user agreement URL shown in account/support surfaces. */
export const userAgreementUrl: string = (
  readEnv("VITE_USER_AGREEMENT_URL") ??
  "https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19"
).trim();

/** Public Platega donation URL used by the Home screen donate action. */
export const plategaDonateUrl: string = (
  readEnv("VITE_PLATEGA_DONATE_URL") ??
  "https://app.platega.io/"
).trim();

/** Home UI experiment: merge "Devices" + "Subscription" into one summary row. */
export const homeMergedSummaryCardEnabled: boolean = readBooleanEnv(
  "VITE_HOME_MERGED_SUMMARY_CARD",
  false,
);

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

export function getSupportContactHandle(): string | null {
  return supportContactUsername ? `@${supportContactUsername}` : null;
}

export function getSupportContactHref(): string | null {
  return supportContactUsername ? `https://t.me/${supportContactUsername}` : null;
}

export function getPlategaDonateHref(): string | null {
  const normalized = plategaDonateUrl.trim();
  if (!normalized) return null;
  return /^https?:\/\//i.test(normalized) ? normalized : null;
}
