/**
 * Centralized env config. Single source of truth for build-time env vars.
 * Consumers must not read import.meta.env directly.
 */

function readEnv(key: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.[key];
}

/** Bot @username without @. Used for referral links and support. Empty if not set. */
export const telegramBotUsername: string = (readEnv("VITE_TELEGRAM_BOT_USERNAME") ?? "").trim();
