import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useTelegramBackButton(enabled: boolean = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;
    const tg = window.Telegram?.WebApp as
      | (typeof window.Telegram.WebApp & {
          BackButton?: {
            show: () => void;
            hide: () => void;
            onClick?: (cb: () => void) => void;
            offClick?: (cb: () => void) => void;
          };
        })
      | undefined;
    const bb = tg?.BackButton;
    if (!bb) return;

    const handler = () => navigate(-1);
    bb.show();
    bb.onClick?.(handler);

    return () => {
      bb.offClick?.(handler);
      bb.hide();
    };
  }, [enabled, navigate]);
}

