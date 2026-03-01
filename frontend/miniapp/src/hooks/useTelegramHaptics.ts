type TgHapticFeedback = {
  impactOccurred?: (s: string) => void;
  notificationOccurred?: (t: string) => void;
  selectionChanged?: () => void;
};

let lastImpactAt = 0;

export function useTelegramHaptics() {
  const getHaptic = (): TgHapticFeedback | undefined =>
    (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: TgHapticFeedback } } }).Telegram?.WebApp?.HapticFeedback;

  const impact = (style: "light" | "medium" | "heavy" = "light") => {
    if (typeof window === "undefined") return;
    const now = performance.now();
    if (now - lastImpactAt < 28) return;
    lastImpactAt = now;
    getHaptic()?.impactOccurred?.(style);
  };

  const notify = (type: "success" | "warning" | "error" = "success") => {
    if (typeof window === "undefined") return;
    getHaptic()?.notificationOccurred?.(type);
  };

  const selectionChanged = () => {
    if (typeof window === "undefined") return;
    getHaptic()?.selectionChanged?.();
  };

  return { impact, notify, selectionChanged };
}
