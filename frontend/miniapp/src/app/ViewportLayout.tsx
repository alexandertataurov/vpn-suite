import { useCallback } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconHome,
  IconSmartphone,
  IconCreditCard,
  IconHelpCircle,
  IconUser,
} from "@/lib/icons";
import { OfflineBanner } from "@/components";
import { useMainButtonReserve } from "@/context/MainButtonReserveContext";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { HeaderZone } from "@/layout/HeaderZone";
import { ScrollZone } from "@/layout/ScrollZone";
import { ActionZone } from "@/layout/ActionZone";

interface TabItem {
  to: string;
  label: string;
  end: boolean;
  icon: typeof IconHome;
  short: string;
}

const tabs: TabItem[] = [
  { to: "/", label: "Home", end: true, icon: IconHome, short: "HM" },
  { to: "/devices", label: "Devices", end: false, icon: IconSmartphone, short: "DV" },
  { to: "/plan", label: "Plan", end: false, icon: IconCreditCard, short: "PL" },
  { to: "/support", label: "Support", end: false, icon: IconHelpCircle, short: "SP" },
  { to: "/settings", label: "Account", end: false, icon: IconUser, short: "AC" },
];

function getRouteLabel(pathname: string): string {
  if (pathname === "/") return "Mission Control";
  if (pathname.startsWith("/devices")) return "Device Registry";
  if (pathname.startsWith("/plan/checkout")) return "Payment Checkout";
  if (pathname.startsWith("/plan")) return "Subscription Plans";
  if (pathname.startsWith("/servers")) return "Server Matrix";
  if (pathname.startsWith("/support")) return "Support Console";
  if (pathname.startsWith("/settings")) return "Account Settings";
  if (pathname.startsWith("/referral")) return "Referral Program";
  if (pathname.startsWith("/onboarding")) return "Onboarding";
  return "VPN Suite";
}

export function TabbedShellLayout() {
  const { impact, selectionChanged, notify } = useTelegramHaptics();
  const queryClient = useQueryClient();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const routeLabel = getRouteLabel(location.pathname);
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

  return (
    <div className="miniapp-shell miniapp-shell--tabbed">
      <OfflineBanner />
      <HeaderZone routeLabel={routeLabel} isOnline={isOnline} />
      <ScrollZone className="miniapp-main miniapp-main--tabbed" onRefresh={handlePullRefresh}>
        <div key={location.pathname} className="tab-content miniapp-shell-screen">
          <Outlet />
        </div>
      </ScrollZone>
      <ActionZone>
        <nav className="miniapp-bottom-nav" aria-label="Main">
          {tabs.map(({ to, label, end, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                impact("light");
                selectionChanged();
              }}
              className={({ isActive }) => `miniapp-tab ${isActive ? "miniapp-tab--active" : ""}`}
            >
              <span className="miniapp-tab-short" aria-hidden>{short}</span>
              <span className="miniapp-tab-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span className="miniapp-tab-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </ActionZone>
    </div>
  );
}

export function StackFlowLayout() {
  const queryClient = useQueryClient();
  const { impact, notify } = useTelegramHaptics();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const routeLabel = getRouteLabel(location.pathname);
  const { reserve: mainButtonReserve } = useMainButtonReserve();
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

  return (
    <div className="miniapp-shell miniapp-shell--stack">
      <OfflineBanner />
      <HeaderZone routeLabel={routeLabel} isOnline={isOnline} stackFlow />
      <ScrollZone className={mainClass} onRefresh={handlePullRefresh}>
        <div key={location.pathname} className="tab-content miniapp-shell-screen">
          <Outlet />
        </div>
      </ScrollZone>
    </div>
  );
}

export type ViewportLayoutMode = "tabbed" | "stack";

/**
 * Main UI frame (HeaderZone + ScrollZone + ActionZone). Matches LAYOUT.md "ViewportLayout".
 */
export function ViewportLayout({ mode }: { mode: ViewportLayoutMode }) {
  return mode === "tabbed" ? <TabbedShellLayout /> : <StackFlowLayout />;
}

export const MiniappLayout = TabbedShellLayout;

