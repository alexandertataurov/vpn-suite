/**
 * Backward-compatible Telegram client barrel.
 * Prefer importing from telegramCoreClient or telegramFeatureClient.
 */
export {
  telegramClient,
  initTelegramRuntime,
  type TelegramSafeAreaInsets,
  type TelegramEventName,
  type TelegramPopupButton,
  type TelegramPopupParams,
  type TelegramInitDataUnsafe,
  type TelegramMainButton,
  type TelegramBackButton,
  type TelegramCloudStorage,
  type TelegramBiometricManager,
  type TelegramWebApp,
} from "./telegramCoreClient";
export { telegramFeatureClient } from "./telegramFeatureClient";

import { telegramClient as coreClient } from "./telegramCoreClient";
import { telegramFeatureClient } from "./telegramFeatureClient";

export const telegramLegacyClient = {
  ...coreClient,
  ...telegramFeatureClient,
};
