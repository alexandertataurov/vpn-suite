import { useCallback, useEffect, useState } from "react";
import { telegramClient, type TelegramSafeAreaInsets } from "@/lib/telegram/telegramCoreClient";
import { useTelegramEvent } from "./useTelegramEvent";

type SafeAreaState = {
  safeAreaInset: TelegramSafeAreaInsets;
  contentSafeAreaInset: TelegramSafeAreaInsets;
};

function readInsets(): SafeAreaState {
  return {
    safeAreaInset: telegramClient.getSafeAreaInsets(),
    contentSafeAreaInset: telegramClient.getContentSafeAreaInsets(),
  };
}

export function useSafeAreaInsets() {
  const [state, setState] = useState<SafeAreaState>(() => readInsets());

  const update = useCallback(() => {
    setState(readInsets());
  }, []);

  useTelegramEvent("safeAreaChanged", update);
  useTelegramEvent("contentSafeAreaChanged", update);

  useEffect(() => {
    update();
  }, [update]);

  return state;
}
