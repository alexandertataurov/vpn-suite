import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui";
import type { WebAppAuthResponse } from "@/lib/types";
import { setWebappToken, webappApi } from "../api/client";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";
import { PageStateScreen } from "./PageStateScreen";

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
      panelClassName="card edge ea kpi"
      label="Authentication"
      chipClassName="chip ca"
      chipText="Reconnect Required"
      alertVariant="warning"
      alertTitle="Session missing"
      alertMessage={message}
      actions={
        initData ? (
          <Button variant="primary" size="lg" onClick={reconnect} loading={loading} disabled={loading}>
            Reconnect
          </Button>
        ) : undefined
      }
    />
  );
}
