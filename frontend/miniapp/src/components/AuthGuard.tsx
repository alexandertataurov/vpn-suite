import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@vpn-suite/shared/ui";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";
import { setWebappToken, webappApi } from "../api/client";
import type { WebAppAuthResponse } from "@vpn-suite/shared/types";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { initData } = useTelegramWebApp();
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
    return (
      <div className="page-content auth-guard-message">
        <p className="text-muted">Open this app from Telegram to use it.</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page-content auth-guard-message">
        <p className="text-error">{authError}</p>
        <Button className="mt-md" onClick={attemptAuth}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
