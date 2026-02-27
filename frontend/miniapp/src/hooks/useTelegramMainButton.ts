import { useEffect } from "react";

interface MainButtonOptions {
  text: string;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function useTelegramMainButton(options: MainButtonOptions | null) {
  useEffect(() => {
    if (typeof window === "undefined" || !options) return;
    const tg = window.Telegram?.WebApp as
      | (typeof window.Telegram.WebApp & {
          MainButton?: {
            text: string;
            isVisible: boolean;
            isEnabled: boolean;
            show: () => void;
            hide: () => void;
            enable: () => void;
            disable: () => void;
            showProgress?: () => void;
            hideProgress?: () => void;
            onClick?: (cb: () => void) => void;
            offClick?: (cb: () => void) => void;
          };
        })
      | undefined;
    const mb = tg?.MainButton;
    if (!mb) return;

    const { text, visible = true, enabled = true, loading = false, onClick } = options;

    mb.text = text;
    if (visible) mb.show();
    else mb.hide();

    if (enabled) mb.enable();
    else mb.disable();

    if (loading) mb.showProgress?.();
    else mb.hideProgress?.();

    const handler = () => onClick();
    mb.onClick?.(handler);
    return () => {
      mb.offClick?.(handler);
      mb.hideProgress?.();
    };
  }, [options]);
}

