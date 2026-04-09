import { useHaptics } from "./system/useHaptics";

export function useTelegramHaptics() {
  const { impact, notification, selectionChanged } = useHaptics();

  return {
    impact,
    notify: notification,
    selectionChanged,
  };
}

