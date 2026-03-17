import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { postAuth } from "@/api";
import { setWebappToken } from "@/api/client";
import {
  useToast,
  MissionPrimaryAnchor,
  MissionPrimaryButton,
  MissionSecondaryAnchor,
} from "@/design-system";
import { PageStateScreen } from "@/design-system/compositions/patterns/PageStateScreen";
import { getSupportBotHref } from "@/config/env";
import { useI18n } from "@/hooks";
import { useTelegramWebApp } from "@/hooks";
import { webappQueryKeys } from "@/lib";

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
  const botHref = getSupportBotHref();

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
            <MissionPrimaryButton
              status={loading ? "loading" : "idle"}
              statusText={t("common.reconnecting")}
              onClick={reconnect}
              disabled={loading}
            >
              {t("common.reconnect")}
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
