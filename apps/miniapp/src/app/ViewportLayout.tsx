import { useCallback, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutProvider } from "@/context/LayoutContext";
import { useMainButtonReserve } from "@/context/MainButtonReserveContext";
import { useTelegramHaptics, useOnlineStatus } from "@/hooks";
import { useTelegramApp } from "@/hooks/telegram/useTelegramApp";
import { OfflineBanner, ScrollZone, ShellContextBlock } from "@/design-system";
import { HeaderZone } from "@/design-system/compositions/layouts/HeaderZone";

export function StackFlowLayout() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { impact, notify } = useTelegramHaptics();
  const isOnline = useOnlineStatus();
  const { isDesktop } = useTelegramApp();
  const { reserve: mainButtonReserve } = useMainButtonReserve();
  const scrollRef = useRef<HTMLElement | null>(null);
  const handlePullRefresh = useCallback(async () => {
    if (!isOnline) {
      notify("warning");
      return;
    }
    impact("light");
    const predicate = (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === "webapp";
    await queryClient.invalidateQueries({ predicate });
    await queryClient.refetchQueries({ predicate, type: "active" });
    notify("success");
  }, [impact, isOnline, notify, queryClient]);
  const mainClass = [
    "miniapp-main",
    "miniapp-main--stack",
    mainButtonReserve ? "miniapp-main--stack-with-main-button" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    document.documentElement.dataset.shellNav = "stack";
    return () => {
      if (document.documentElement.dataset.shellNav === "stack") {
        delete document.documentElement.dataset.shellNav;
      }
    };
  }, []);

  return (
    <div className="miniapp-shell miniapp-shell--stack">
      <OfflineBanner />
      {!isDesktop && <HeaderZone stackFlow />}
      <ScrollZone className={mainClass} onRefresh={handlePullRefresh} scrollRef={scrollRef}>
        <LayoutProvider stackFlow>
          <ShellContextBlock stackFlow gestureRef={scrollRef} />
          <div key={location.pathname} className="tab-content miniapp-shell-screen">
            <Outlet />
          </div>
        </LayoutProvider>
      </ScrollZone>
    </div>
  );
}

/**
 * Main UI frame (HeaderZone + ScrollZone). Stack flow only; no bottom nav.
 */
export function ViewportLayout() {
  return <StackFlowLayout />;
}

export const MiniappLayout = StackFlowLayout;
