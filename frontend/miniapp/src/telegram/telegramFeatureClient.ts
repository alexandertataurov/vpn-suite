import {
  telegramClient,
  type TelegramCloudStorage,
  type TelegramPopupParams,
} from "./telegramCoreClient";

function withOptionalCallback<T>(
  invoke: (cb: (error: unknown, value: T) => void) => unknown,
  fallback: T,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const complete = (error: unknown, value: T) => {
      if (settled) return;
      settled = true;
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve(value ?? fallback);
    };
    let maybePromise: unknown;
    try {
      maybePromise = invoke(complete);
    } catch (error) {
      complete(error, fallback);
      return;
    }
    if (maybePromise && typeof (maybePromise as Promise<T>).then === "function") {
      (maybePromise as Promise<T>).then((value) => complete(null, value)).catch((error) => complete(error, fallback));
      return;
    }
    globalThis.setTimeout(() => complete(null, fallback), 1200);
  });
}

export const telegramFeatureClient = {
  async readClipboardText(): Promise<string> {
    const tg = telegramClient.getWebApp();
    if (tg?.readTextFromClipboard) {
      return withOptionalCallback<string>(
        (cb) =>
          tg.readTextFromClipboard?.((text) => {
            cb(null, text ?? "");
          }),
        "",
      );
    }
    if (navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return "";
      }
    }
    return "";
  },

  async writeClipboardText(text: string): Promise<boolean> {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },

  async showPopup(params: TelegramPopupParams): Promise<string> {
    const tg = telegramClient.getWebApp();
    if (!tg?.showPopup) return "close";
    return withOptionalCallback<string>((cb) => tg.showPopup?.(params, (buttonId) => cb(null, buttonId || "close")), "close");
  },

  showQrScanner(text?: string, onScan?: (value: string) => boolean | void): void {
    telegramClient.getWebApp()?.showScanQrPopup?.({ text }, onScan);
  },

  closeQrScanner(): void {
    telegramClient.getWebApp()?.closeScanQrPopup?.();
  },

  shareInlineQuery(query: string, chooseChatTypes?: string[]): void {
    telegramClient.getWebApp()?.switchInlineQuery?.(query, chooseChatTypes);
  },

  openInvoice(url: string, onClosed?: (status: string) => void): void {
    telegramClient.getWebApp()?.openInvoice?.(url, onClosed);
  },

  async requestWriteAccess(): Promise<boolean> {
    const tg = telegramClient.getWebApp();
    if (!tg?.requestWriteAccess) return false;
    return withOptionalCallback<boolean>((cb) => tg.requestWriteAccess?.((allowed) => cb(null, !!allowed)), false);
  },

  async requestContact(): Promise<boolean> {
    const tg = telegramClient.getWebApp();
    if (!tg?.requestContact) return false;
    return withOptionalCallback<boolean>((cb) => tg.requestContact?.((shared) => cb(null, !!shared)), false);
  },

  async cloudGetItem(key: string): Promise<string> {
    const storage = telegramClient.getCloudStorage();
    if (!storage?.getItem) return "";
    return withOptionalCallback<string>((cb) => storage.getItem?.(key, cb), "");
  },

  async cloudSetItem(key: string, value: string): Promise<void> {
    const storage = telegramClient.getCloudStorage();
    if (!storage?.setItem) return;
    await withOptionalCallback<void>((cb) => storage.setItem?.(key, value, (error) => cb(error, undefined)), undefined);
  },

  async cloudRemoveItem(key: string): Promise<void> {
    const storage = telegramClient.getCloudStorage();
    if (!storage?.removeItem) return;
    await withOptionalCallback<void>((cb) => storage.removeItem?.(key, (error) => cb(error, undefined)), undefined);
  },

  async cloudGetKeys(): Promise<string[]> {
    const storage: TelegramCloudStorage | null = telegramClient.getCloudStorage();
    if (!storage?.getKeys) return [];
    return withOptionalCallback<string[]>((cb) => storage.getKeys?.(cb), []);
  },
};
