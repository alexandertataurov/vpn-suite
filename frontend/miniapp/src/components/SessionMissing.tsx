import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, InlineAlert, PageScaffold, ActionRow } from "../ui";
import type { WebAppAuthResponse } from "@vpn-suite/shared/types";
import { setWebappToken, webappApi } from "../api/client";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";

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
    <PageScaffold>
      <InlineAlert variant="warning" title="Session missing" message={message} />
      {initData ? (
        <ActionRow fullWidth>
          <Button variant="primary" size="lg" onClick={reconnect} loading={loading} disabled={loading}>
            Reconnect
          </Button>
        </ActionRow>
      ) : null}
    </PageScaffold>
  );
}
