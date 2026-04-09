import { setContext } from "@vpn-suite/shared";
import { telegramClient } from "@/telegram/telegramCoreClient";

export function enrichContextAtAppReady(): void {
  const platform = telegramClient.getPlatform();
  const startParam = telegramClient.getInitDataUnsafe()?.start_param ?? "";
  const colorScheme = telegramClient.getColorScheme();
  setContext({
    telegram_platform: platform,
    telegram_start_param: startParam ? startParam.slice(0, 200) : "",
    telegram_color_scheme: colorScheme,
  });
}
