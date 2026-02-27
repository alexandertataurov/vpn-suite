import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, InlineAlert } from "@vpn-suite/shared/ui";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";
import { setWebappToken, webappApi } from "../api/client";
import type { WebAppAuthResponse } from "@vpn-suite/shared/types";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { initData, isInsideTelegram } = useTelegramWebApp();
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const attemptAuth = useCallback(() => {
    if (!initData) {
      setReady(true);
      return;
    }
    setAuthError(null);
    webappApi
      .post<WebAppAuthResponse>("/webapp/auth", { init_data: initData })
      .then((res) => {
        setWebappToken(res.session_token);
        setAuthError(null);
        setReady(true);
      })
      .catch(() => {
        setAuthError("Session could not be started. Please try again or open from Telegram.");
        setReady(true);
      });
  }, [initData]);

  useEffect(() => {
    attemptAuth();
  }, [attemptAuth]);

  if (!ready) return null;

  if (!initData) {
    if (isInsideTelegram) {
      return (
        <div className="page-content auth-guard-message">
          <InlineAlert
            variant="error"
            title="Session could not be started"
            message="Close and reopen the mini app from the Telegram bot."
          />
        </div>
      );
    }
    return (
      <div className="page-content auth-guard-message">
        <InlineAlert
          variant="warning"
          title="Open from Telegram"
          message="Open this app from the Telegram bot to use your VPN subscription."
        />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page-content auth-guard-message">
        <InlineAlert
          variant="error"
          title="Session error"
          message={authError}
        />
        <Button className="mt-md" onClick={attemptAuth}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
