import { useCallback } from "react";
import { translate, type TranslationParams } from "@/lib/i18n";
import { useMiniappLocale } from "@/hooks/useMiniappLocale";

export interface UseI18nResult {
  t: (key: string, params?: TranslationParams) => string;
  locale: "en" | "ru";
  isRussian: boolean;
}

export function useI18n(): UseI18nResult {
  const { locale, isRussian } = useMiniappLocale();

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  return { t, locale, isRussian };
}

