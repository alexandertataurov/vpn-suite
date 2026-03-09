import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { postAuth } from "@/api";
import { setWebappToken } from "@/api/client";
import { useToast, PageStateScreen, MissionPrimaryButton } from "@/design-system";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export interface SessionMissingProps {
  message?: string;
}

export function SessionMissing({
  message = "Your Telegram session is not active. Tap Reconnect to sign in again, or close and reopen the app from the bot.",
}: SessionMissingProps) {
  const { initData } = useTelegramWebApp();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const reconnect = useCallback(() => {
    if (!initData) return;
    setLoading(true);
    postAuth(initData)
      .then((res) => {
        setWebappToken(res.session_token, res.expires_in);
        queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      })
      .catch((err) => {
        addToast(err instanceof ApiError ? err.message : "Could not reconnect", "error");
      })
      .finally(() => setLoading(false));
  }, [initData, queryClient, addToast]);

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
