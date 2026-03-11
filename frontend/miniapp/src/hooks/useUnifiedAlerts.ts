import { useMemo } from "react";
import { useToast, type HeaderAlertItem } from "@/design-system";
import { useHeaderAlerts } from "@/page-models/useHeaderAlerts";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface UseUnifiedAlertsResult {
  items: HeaderAlertItem[];
  count: number;
}

/**
 * Unified list for the bell popover: system (offline, flow) + toasts + account signals.
 */
export function useUnifiedAlerts(stackFlow: boolean): UseUnifiedAlertsResult {
  const isOnline = useOnlineStatus();
  const { toasts } = useToast();
  const accountSignals = useHeaderAlerts();

  const items = useMemo<HeaderAlertItem[]>(() => {
    const list: HeaderAlertItem[] = [];

    if (!isOnline) {
      list.push({
        id: "signal",
        tone: "warning",
        title: "Offline",
        message: "Reconnect to resume secure updates.",
      });
    }

    if (stackFlow) {
      list.push({
        id: "context",
        tone: "info",
        title: "Flow mode",
        message: "Use the inline action below to return to the previous step.",
      });
    }

    const toastAlerts: HeaderAlertItem[] = toasts.map((toast) => {
      const tone: HeaderAlertItem["tone"] =
        toast.variant === "error"
          ? "warning"
          : toast.variant === "persistent"
            ? "info"
            : toast.variant;
      const title =
        toast.variant === "success"
          ? "Success"
          : toast.variant === "error"
            ? "Issue"
            : "Notice";
      return {
        id: toast.id,
        tone,
        title,
        message: toast.message,
      };
    });

    return [...list, ...toastAlerts, ...accountSignals];
  }, [isOnline, stackFlow, toasts, accountSignals]);

  const count = items.length;

  return { items, count };
}
