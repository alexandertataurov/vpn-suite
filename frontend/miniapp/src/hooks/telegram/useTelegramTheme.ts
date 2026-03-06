import { useCallback, useEffect, useState } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { useTelegramEvent } from "./useTelegramEvent";

type TelegramThemeState = {
  colorScheme: "light" | "dark";
  vars: {
    bgColor: string;
    textColor: string;
    buttonColor: string;
    hintColor: string;
    secondaryBgColor: string;
  };
};

function readTheme(): TelegramThemeState {
  const params = telegramClient.getThemeParams();
  return {
    colorScheme: telegramClient.getColorScheme(),
    vars: {
      bgColor: params.bg_color ?? "",
      textColor: params.text_color ?? "",
      buttonColor: params.button_color ?? "",
      hintColor: params.hint_color ?? "",
      secondaryBgColor: params.secondary_bg_color ?? "",
    },
  };
}

export function useTelegramTheme() {
  const [state, setState] = useState<TelegramThemeState>(() => readTheme());

  const apply = useCallback(() => {
    telegramClient.applyThemeCssVars();
    setState(readTheme());
  }, []);

  useTelegramEvent("themeChanged", apply);

  useEffect(() => {
    apply();
  }, [apply]);

  return state;
}
