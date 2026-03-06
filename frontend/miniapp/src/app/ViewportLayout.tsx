import { useCallback, type ReactNode } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { OfflineBanner } from "@/design-system";
import { useMainButtonReserve } from "@/context/MainButtonReserveContext";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { HeaderZone, ScrollZone, ActionZone } from "@/design-system";

interface TabItem {
  to: string;
  label: string;
  end: boolean;
  icon: ReactNode;
}

const tabs: TabItem[] = [
  {
    to: "/",
    label: "Home",
    end: true,
    icon: <path d="M3 12L12 4l9 8v7a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1z" />,
  },
  {
    to: "/devices",
    label: "Devices",
    end: false,
    icon: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h3" />
      </>
    ),
  },
  {
    to: "/plan",
    label: "Plan",
    end: false,
    icon: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </>
    ),
  },
  {
    to: "/support",
    label: "Support",
    end: false,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16v.5" />
      </>
    ),
  },
  {
    to: "/settings",
    label: "Account",
    end: false,
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
  },
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

  const isTabActive = (to: string, end: boolean): boolean => {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

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
        <nav className="bottom-nav miniapp-bottom-nav" role="navigation" aria-label="Main navigation">
          {tabs.map(({ to, label, end, icon }) => {
            const active = isTabActive(to, end);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="tab"
                aria-selected={active}
                tabIndex={0}
                onClick={() => {
                  impact("light");
                  selectionChanged();
                }}
                className={`nav-item miniapp-tab ${active ? "on miniapp-tab--active" : ""}`}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  {icon}
                </svg>
                <span className="miniapp-tab-label">{label}</span>
              </NavLink>
            );
          })}
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
