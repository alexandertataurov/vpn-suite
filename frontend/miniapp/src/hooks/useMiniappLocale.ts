import { useMemo } from "react";
import { useSession } from "@/hooks/useSession";
import { useWebappToken } from "@/api/client";
import { useTelegramInitData } from "@/hooks/telegram/useTelegramInitData";
import { resolveUserLocale, type SupportedLocale } from "@/lib/i18n";

export interface MiniappLocaleState {
  locale: SupportedLocale;
  isRussian: boolean;
}

export function useMiniappLocale(): MiniappLocaleState {
  const hasToken = !!useWebappToken();
  const { data: session } = useSession(hasToken);
  const { user: tgUser } = useTelegramInitData();

  const locale = useMemo<SupportedLocale>(
    () => resolveUserLocale(session ?? null, tgUser?.language_code ?? null),
    [session, tgUser?.language_code],
  );

  return {
    locale,
    isRussian: locale === "ru",
  };
}

