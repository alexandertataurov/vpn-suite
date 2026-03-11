import { useCallback } from "react";
import { hasTranslation, translate, type TranslationParams } from "@/lib/i18n";
import { useMiniappLocale } from "@/hooks/useMiniappLocale";

export interface UseI18nResult {
  t: (key: string, params?: TranslationParams) => string;
  tOr: (key: string, fallback: string, params?: TranslationParams) => string;
  locale: "en" | "ru";
  isRussian: boolean;
}

export function useI18n(): UseI18nResult {
  const { locale, isRussian } = useMiniappLocale();

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const tOr = useCallback(
    (key: string, fallback: string, params?: TranslationParams) =>
      hasTranslation(locale, key) ? translate(locale, key, params) : fallback,
    [locale],
  );

  return { t, tOr, locale, isRussian };
}
