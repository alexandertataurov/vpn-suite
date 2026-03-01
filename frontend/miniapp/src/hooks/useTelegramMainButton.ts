import { useEffect } from "react";

type TgMainButton = {
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

function getMainButton(): TgMainButton | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Telegram?: { WebApp?: { MainButton?: TgMainButton } } }).Telegram?.WebApp?.MainButton;
}

function triggerLightHaptic() {
  if (typeof window === "undefined") return;
  const haptic =
    (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
      .Telegram?.WebApp?.HapticFeedback;
  haptic?.impactOccurred?.("light");
}

interface MainButtonOptions {
  text: string;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function useTelegramMainButton(options: MainButtonOptions | null) {
  useEffect(() => {
    const mb = getMainButton();
    if (!mb) return;

    if (!options) {
      mb.hideProgress?.();
      mb.hide();
      return;
    }

    const { text, visible = true, enabled = true, loading = false, onClick } = options;

    mb.text = text;
    if (visible) mb.show();
    else mb.hide();

    if (enabled) mb.enable();
    else mb.disable();

    if (loading) mb.showProgress?.();
    else mb.hideProgress?.();

    const handler = () => {
      triggerLightHaptic();
      onClick();
    };
    mb.onClick?.(handler);

    return () => {
      mb.offClick?.(handler);
      mb.hideProgress?.();
      mb.hide();
    };
  }, [options]);
}
