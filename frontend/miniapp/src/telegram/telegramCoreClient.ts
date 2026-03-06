export type TelegramSafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type TelegramEventName =
  | "themeChanged"
  | "viewportChanged"
  | "safeAreaChanged"
  | "contentSafeAreaChanged"
  | "fullscreenChanged"
  | "mainButtonClicked"
  | "backButtonClicked"
  | "invoiceClosed"
  | "popupClosed"
  | "qrTextReceived";

export type TelegramPopupButton = {
  id?: string;
  type?: "default" | "ok" | "close" | "cancel" | "destructive";
  text?: string;
};

export type TelegramPopupParams = {
  title?: string;
  message: string;
  buttons?: TelegramPopupButton[];
};

export type TelegramInitDataUnsafe = {
  user?: Record<string, unknown>;
  chat?: Record<string, unknown>;
  start_param?: string;
  [key: string]: unknown;
};

export type TelegramMainButton = {
  text?: string;
  isVisible?: boolean;
  isEnabled?: boolean;
  show?: () => void;
  hide?: () => void;
  enable?: () => void;
  disable?: () => void;
  showProgress?: (leaveActive?: boolean) => void;
  hideProgress?: () => void;
  onClick?: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
};

export type TelegramBackButton = {
  show?: () => void;
  hide?: () => void;
  onClick?: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
};

export type TelegramCloudStorage = {
  getItem?: (key: string, cb?: (error: unknown, value: string) => void) => Promise<string> | void;
  setItem?: (key: string, value: string, cb?: (error: unknown) => void) => Promise<void> | void;
  removeItem?: (key: string, cb?: (error: unknown) => void) => Promise<void> | void;
  getKeys?: (cb?: (error: unknown, keys: string[]) => void) => Promise<string[]> | void;
};

export type TelegramBiometricManager = {
  isInited?: boolean;
  isBiometricAvailable?: boolean;
  isAccessRequested?: boolean;
  isAccessGranted?: boolean;
  init?: (cb?: () => void) => void;
  requestAccess?: (paramsOrCb?: unknown, cb?: (granted: boolean) => void) => void;
  authenticate?: (paramsOrCb?: unknown, cb?: (ok: boolean, token?: string) => void) => void;
};

export type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  platform?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string | undefined>;
  initData?: string;
  initDataUnsafe?: TelegramInitDataUnsafe;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: Partial<TelegramSafeAreaInsets>;
  contentSafeAreaInset?: Partial<TelegramSafeAreaInsets>;
  openLink?: (url: string, options?: Record<string, unknown>) => void;
  openTelegramLink?: (url: string) => void;
  showPopup?: (params: TelegramPopupParams, cb?: (buttonId: string) => void) => void;
  showScanQrPopup?: (params: { text?: string }, cb?: (value: string) => boolean | void) => void;
  closeScanQrPopup?: () => void;
  readTextFromClipboard?: (cb: (text: string | null) => void) => void;
  switchInlineQuery?: (query: string, chooseChatTypes?: string[]) => void;
  openInvoice?: (url: string, cb?: (status: string) => void) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  isVerticalSwipesEnabled?: boolean;
  requestWriteAccess?: (cb?: (allowed: boolean) => void) => void;
  requestContact?: (cb?: (shared: boolean) => void) => void;
  hideKeyboard?: () => void;
  MainButton?: TelegramMainButton;
  BackButton?: TelegramBackButton;
  CloudStorage?: TelegramCloudStorage;
  BiometricManager?: TelegramBiometricManager;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
    selectionChanged?: () => void;
  };
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

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

  getPlatform(): string {
    const tgPlatform = (this.getWebApp()?.platform ?? "").toLowerCase();
    if (tgPlatform) return tgPlatform;
    if (typeof navigator === "undefined") return "unknown";
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|ios/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "unknown";
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

export function initTelegramRuntime(): void {
  telegramClient.ready();
  telegramClient.expand();
  telegramClient.disableVerticalSwipes();
}
