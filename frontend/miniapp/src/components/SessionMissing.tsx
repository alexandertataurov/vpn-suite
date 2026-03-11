import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { postAuth } from "@/api";
import { setWebappToken } from "@/api/client";
import {
  useToast,
  PageStateScreen,
  MissionPrimaryAnchor,
  MissionPrimaryButton,
  MissionSecondaryAnchor,
} from "@/design-system";
import { telegramBotUsername } from "@/config/env";
import { useI18n } from "@/hooks/useI18n";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export interface SessionMissingProps {
  message?: string;
}

export function SessionMissing({
  message,
}: SessionMissingProps) {
  const { initData } = useTelegramWebApp();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const botHref = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;

  const reconnect = useCallback(() => {
    if (!initData) return;
    setLoading(true);
    postAuth(initData)
      .then((res) => {
        setWebappToken(res.session_token, res.expires_in);
        queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      })
      .catch((err) => {
        addToast(err instanceof ApiError ? err.message : t("common.could_not_reconnect"), "error");
      })
      .finally(() => setLoading(false));
  }, [initData, queryClient, addToast, t]);

  return (
    <PageStateScreen
      panelTone="amber"
      label={t("common.authentication_label")}
      chipTone="amber"
      chipText={t("common.reconnect_required")}
      alertTone="warning"
      alertTitle={t("common.session_missing_title")}
      alertMessage={message ?? t("common.session_missing_message")}
      actions={
        <>
          {initData ? (
            <MissionPrimaryButton onClick={reconnect} disabled={loading}>
              {loading ? (
                <>
                  <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                    <path d="M20 12a8 8 0 0 0-8-8" />
                  </svg>
                  <span>{t("common.reconnecting")}</span>
                </>
              ) : (
                t("common.reconnect")
              )}
            </MissionPrimaryButton>
          ) : botHref ? (
            <MissionPrimaryAnchor href={botHref} target="_blank" rel="noopener noreferrer">
              {t("common.open_in_telegram_bot")}
            </MissionPrimaryAnchor>
          ) : null}
          {botHref ? (
            <MissionSecondaryAnchor href={botHref} target="_blank" rel="noopener noreferrer">
              {t("common.return_to_bot")}
            </MissionSecondaryAnchor>
          ) : null}
        </>
      }
    />
  );
}
