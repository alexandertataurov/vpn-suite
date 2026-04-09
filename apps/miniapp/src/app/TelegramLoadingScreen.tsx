/**
 * Custom loading screen shown while the app bootstraps (Suspense fallback and pre-ready).
 * Uses Telegram theme params (--tg-theme-*) when inside Telegram so the loader matches
 * the client. Per Telegram docs: call ready() once this (or equivalent) is visible.
 */
import { IconShield } from "@/design-system/icons";

export function TelegramLoadingScreen() {
  return (
    <div
      className="telegram-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="telegram-loading-screen__content">
        <span className="telegram-loading-screen__logo" aria-hidden>
          <IconShield size={48} strokeWidth={1.5} />
        </span>
        <span className="telegram-loading-screen__spinner" aria-hidden />
        <p className="telegram-loading-screen__tagline">Loading…</p>
      </div>
    </div>
  );
}
