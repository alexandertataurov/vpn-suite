export function useTelegramHaptics() {
  const impact = (style: "light" | "medium" | "heavy" = "light") => {
    if (typeof window === "undefined") return;
    const h = (window.Telegram?.WebApp as any)?.HapticFeedback;
    h?.impactOccurred?.(style);
  };

  const notify = (type: "success" | "warning" | "error" = "success") => {
    if (typeof window === "undefined") return;
    const h = (window.Telegram?.WebApp as any)?.HapticFeedback;
    h?.notificationOccurred?.(type);
  };

  return { impact, notify };
}

