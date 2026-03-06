import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";

let lastImpactAt = 0;

export function useHaptics() {
  const impact = useCallback((style: "light" | "medium" | "heavy" = "light") => {
    if (typeof window === "undefined") return;
    const now = performance.now();
    if (now - lastImpactAt < 28) return;
    lastImpactAt = now;
    telegramClient.impact(style);
  }, []);

  const notification = useCallback((type: "success" | "warning" | "error" = "success") => {
    telegramClient.notify(type);
  }, []);

  const selectionChanged = useCallback(() => {
    telegramClient.selectionChanged();
  }, []);

  return { impact, notification, selectionChanged };
}

