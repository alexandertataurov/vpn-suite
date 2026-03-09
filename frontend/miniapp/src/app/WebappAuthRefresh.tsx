import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { useReferralAttach } from "@/hooks/features/referral";
import { useWebappTokenRefresh } from "@/hooks/useWebappTokenRefresh";

/** Runs proactive token refresh when token and initData exist. Renders nothing. */
export function WebappAuthRefresh() {
  const { initData } = useTelegramWebApp();
  useWebappTokenRefresh(initData ?? "");
  useReferralAttach();
  return null;
}
