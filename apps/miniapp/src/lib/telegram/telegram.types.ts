// Why: centralize Telegram SDK shape in a dedicated module so all runtime/client hooks share one contract.
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

/** Single source for all Telegram event names; avoids drift between registry and bridge. */
export const TELEGRAM_EVENT_NAMES: readonly TelegramEventName[] = [
  "themeChanged",
  "viewportChanged",
  "safeAreaChanged",
  "contentSafeAreaChanged",
  "fullscreenChanged",
  "mainButtonClicked",
  "backButtonClicked",
  "invoiceClosed",
  "popupClosed",
  "qrTextReceived",
] as const;

/** Events that carry payloads per Telegram WebApp docs. Others pass void. */
export interface TelegramEventPayloadMap {
  invoiceClosed: { status: string };
  popupClosed: { button_id: string };
  qrTextReceived: { data: string };
  viewportChanged: { is_state_stable: boolean };
}

export type TelegramEventPayloadFor<E extends TelegramEventName> = E extends keyof TelegramEventPayloadMap
  ? TelegramEventPayloadMap[E]
  : void;

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

export interface TelegramInitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramInitDataChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
}

export type TelegramInitDataUnsafe = {
  user?: TelegramInitDataUser;
  chat?: TelegramInitDataChat;
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
