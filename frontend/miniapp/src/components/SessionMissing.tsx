import { useCallback, useState } from "react";
import { Button, InlineAlert } from "@vpn-suite/shared/ui";
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
  const [loading, setLoading] = useState(false);

  const reconnect = useCallback(() => {
    if (!initData) return;
    setLoading(true);
    webappApi
      .post<WebAppAuthResponse>("/webapp/auth", { init_data: initData })
      .then((res) => setWebappToken(res.session_token))
      .finally(() => setLoading(false));
  }, [initData]);

  return (
    <div className="page-content">
      <InlineAlert variant="warning" title="Session missing" message={message} className="mb-md" />
      {initData ? (
        <Button variant="primary" size="lg" onClick={reconnect} loading={loading} disabled={loading}>
          Reconnect
        </Button>
      ) : null}
    </div>
  );
}

