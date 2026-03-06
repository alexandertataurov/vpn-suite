import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { WebAppAuthResponse } from "@vpn-suite/shared";
import { setWebappToken, webappApi } from "@/api/client";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { PageStateScreen } from "./PageStateScreen";
import { MissionPrimaryButton } from "./MissionPrimitives";

export interface SessionMissingProps {
  message?: string;
}

export function SessionMissing({
  message = "Your Telegram session is not active. Tap Reconnect to sign in again, or close and reopen the app from the bot.",
}: SessionMissingProps) {
  const { initData } = useTelegramWebApp();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const reconnect = useCallback(() => {
    if (!initData) return;
    setLoading(true);
    webappApi
      .post<WebAppAuthResponse>("/webapp/auth", { init_data: initData })
      .then((res) => {
        setWebappToken(res.session_token);
        queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      })
      .finally(() => setLoading(false));
  }, [initData, queryClient]);

  return (
    <PageStateScreen
      panelTone="amber"
      label="Authentication"
      chipTone="amber"
      chipText="Reconnect Required"
      alertTone="warning"
      alertTitle="Session missing"
      alertMessage={message}
      actions={
        initData ? (
          <MissionPrimaryButton onClick={reconnect} disabled={loading}>
            {loading ? (
              <>
                <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                  <path d="M20 12a8 8 0 0 0-8-8" />
                </svg>
                <span>Reconnecting…</span>
              </>
            ) : (
              "Reconnect"
            )}
          </MissionPrimaryButton>
        ) : undefined
      }
    />
  );
}
