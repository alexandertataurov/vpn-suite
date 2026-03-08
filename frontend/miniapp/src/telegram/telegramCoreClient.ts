import type {
  TelegramBackButton,
  TelegramBiometricManager,
  TelegramCloudStorage,
  TelegramEventName,
  TelegramInitDataUnsafe,
  TelegramMainButton,
  TelegramSafeAreaInsets,
  TelegramWebApp,
} from "./telegram.types";

// Why: preserve existing import paths while the codebase migrates to telegram.types.ts directly.
export type {
  TelegramBackButton,
  TelegramBiometricManager,
  TelegramCloudStorage,
  TelegramEventName,
  TelegramInitDataUnsafe,
  TelegramMainButton,
  TelegramPopupButton,
  TelegramPopupParams,
  TelegramSafeAreaInsets,
  TelegramWebApp,
} from "./telegram.types";

function getInitDataFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromSearch = new URLSearchParams(window.location.search).get("tgWebAppData") ?? "";
    if (fromSearch) return fromSearch;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(hash).get("tgWebAppData") ?? "";
  } catch {
    return "";
  }
}

function normalizeInsetValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeInsets(raw?: Partial<TelegramSafeAreaInsets>): TelegramSafeAreaInsets {
  return {
    top: normalizeInsetValue(raw?.top),
    bottom: normalizeInsetValue(raw?.bottom),
    left: normalizeInsetValue(raw?.left),
    right: normalizeInsetValue(raw?.right),
  };
}

export const telegramClient = {
  getWebApp(): TelegramWebApp | null {
    if (typeof window === "undefined") return null;
    return window.Telegram?.WebApp ?? null;
  },

  isAvailable(): boolean {
    return this.getWebApp() != null;
  },

  isInsideTelegram(): boolean {
    return this.isAvailable() || getInitDataFromUrl().length > 0;
  },

  ready(): void {
    this.getWebApp()?.ready?.();
  },

  expand(): void {
    this.getWebApp()?.expand?.();
  },

  close(): void {
    this.getWebApp()?.close?.();
  },

  requestFullscreen(): void {
    this.getWebApp()?.requestFullscreen?.();
  },

  exitFullscreen(): void {
    this.getWebApp()?.exitFullscreen?.();
  },

  getIsExpanded(): boolean {
    return !!this.getWebApp()?.isExpanded;
  },

  getIsFullscreen(): boolean {
    return !!this.getWebApp()?.isFullscreen;
  },

  /** Normalized: "ios" | "android" | "desktop". Desktop = TG desktop (macos, tdesktop, weba) or UA not mobile. */
  getPlatform(): "ios" | "android" | "desktop" {
    const tgPlatform = (this.getWebApp()?.platform ?? "").toLowerCase();
    if (tgPlatform === "ios") return "ios";
    if (tgPlatform === "android" || tgPlatform === "android_x") return "android";
    if (tgPlatform && !/^(ios|android|android_x)$/.test(tgPlatform)) return "desktop";
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|ios/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "desktop";
  },

  isDesktop(): boolean {
    return this.getPlatform() === "desktop";
  },

  getInitData(): string {
    const tg = this.getWebApp();
    return tg?.initData || getInitDataFromUrl() || "";
  },

  getInitDataUnsafe(): TelegramInitDataUnsafe {
    return this.getWebApp()?.initDataUnsafe ?? {};
  },

  getViewport() {
    const tg = this.getWebApp();
    const viewportHeight =
      typeof tg?.viewportHeight === "number" && tg.viewportHeight > 0
        ? Math.round(tg.viewportHeight)
        : Math.round(window.visualViewport?.height ?? window.innerHeight);
    const viewportStableHeight =
      typeof tg?.viewportStableHeight === "number" && tg.viewportStableHeight > 0
        ? Math.round(tg.viewportStableHeight)
        : viewportHeight;
    return {
      viewportHeight,
      viewportStableHeight,
      isExpanded: this.getIsExpanded(),
    };
  },

  getSafeAreaInsets(): TelegramSafeAreaInsets {
    const tg = this.getWebApp();
    return normalizeInsets(tg?.safeAreaInset);
  },

  getContentSafeAreaInsets(): TelegramSafeAreaInsets {
    const tg = this.getWebApp();
    return normalizeInsets(tg?.contentSafeAreaInset);
  },

  getPreferredSafeAreaInsets(): TelegramSafeAreaInsets {
    const content = this.getContentSafeAreaInsets();
    const safe = this.getSafeAreaInsets();
    return {
      top: content.top || safe.top,
      bottom: content.bottom || safe.bottom,
      left: content.left || safe.left,
      right: content.right || safe.right,
    };
  },

  onEvent(event: TelegramEventName, cb: () => void): () => void {
    const tg = this.getWebApp();
    tg?.onEvent?.(event, cb);
    return () => {
      tg?.offEvent?.(event, cb);
    };
  },

  getThemeParams(): Record<string, string> {
    const raw = this.getWebApp()?.themeParams ?? {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "string" && value.length > 0) result[key] = value;
    }
    return result;
  },

  getColorScheme(): "light" | "dark" {
    return this.getWebApp()?.colorScheme === "light" ? "light" : "dark";
  },

  applyThemeCssVars(root: HTMLElement = document.documentElement): void {
    const params = this.getThemeParams();
    for (const [key, value] of Object.entries(params)) {
      root.style.setProperty(`--tg-theme-${key.replace(/_/g, "-")}`, value);
    }
  },

  openLink(url: string): void {
    this.getWebApp()?.openLink?.(url);
  },

  openTelegramLink(url: string): void {
    this.getWebApp()?.openTelegramLink?.(url);
  },

  getMainButton(): TelegramMainButton | null {
    return this.getWebApp()?.MainButton ?? null;
  },

  getBackButton(): TelegramBackButton | null {
    return this.getWebApp()?.BackButton ?? null;
  },

  getCloudStorage(): TelegramCloudStorage | null {
    return this.getWebApp()?.CloudStorage ?? null;
  },

  getBiometrics(): TelegramBiometricManager | null {
    return this.getWebApp()?.BiometricManager ?? null;
  },

  hideKeyboard(): void {
    this.getWebApp()?.hideKeyboard?.();
  },

  impact(style: "light" | "medium" | "heavy"): void {
    this.getWebApp()?.HapticFeedback?.impactOccurred?.(style);
  },

  notify(type: "error" | "success" | "warning"): void {
    this.getWebApp()?.HapticFeedback?.notificationOccurred?.(type);
  },

  selectionChanged(): void {
    this.getWebApp()?.HapticFeedback?.selectionChanged?.();
  },

  enableClosingConfirmation(): void {
    this.getWebApp()?.enableClosingConfirmation?.();
  },

  disableClosingConfirmation(): void {
    this.getWebApp()?.disableClosingConfirmation?.();
  },

  disableVerticalSwipes(): void {
    this.getWebApp()?.disableVerticalSwipes?.();
  },

  enableVerticalSwipes(): void {
    this.getWebApp()?.enableVerticalSwipes?.();
  },
};

/**
 * Initialize Telegram WebApp.
 * - ready(): hide loading placeholder (call as early as possible per docs).
 * - expand(): expand to maximum available height (no-op on desktop).
 * - requestFullscreen(): only on mobile; on desktop keep windowed mode.
 * - disableVerticalSwipes(): avoid accidental close when swiping.
 */
export function initTelegramRuntime(): void {
  telegramClient.ready();
  telegramClient.expand();
  if (!telegramClient.isDesktop() && typeof telegramClient.getWebApp()?.requestFullscreen === "function") {
    telegramClient.requestFullscreen();
  }
  telegramClient.disableVerticalSwipes();
}
