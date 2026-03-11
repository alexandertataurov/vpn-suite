import { useCallback, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { OfflineBanner } from "@/design-system";
import {
  IconCreditCard,
  IconHelpCircle,
  IconHome,
  IconSmartphone,
  IconUser,
} from "@/design-system";
import { LayoutProvider } from "@/context/LayoutContext";
import { useMainButtonReserve } from "@/context/MainButtonReserveContext";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTelegramApp } from "@/hooks/telegram/useTelegramApp";
import { ScrollZone, ActionZone, ShellContextBlock } from "@/design-system";
import { HeaderZone } from "@/design-system/layouts/HeaderZone";
import type { IconType } from "@/design-system";

interface TabItem {
  to: string;
  label: string;
  end: boolean;
  icon: IconType;
}

const tabs: TabItem[] = [
  {
    to: "/",
    label: "Home",
    end: true,
    icon: IconHome,
  },
  {
    to: "/devices",
    label: "Devices",
    end: false,
    icon: IconSmartphone,
  },
  {
    to: "/plan",
    label: "Plan",
    end: false,
    icon: IconCreditCard,
  },
  {
    to: "/support",
    label: "Support",
    end: false,
    icon: IconHelpCircle,
  },
  {
    to: "/settings",
    label: "Account",
    end: false,
    icon: IconUser,
  },
];

export function TabbedShellLayout() {
  const { impact, selectionChanged, notify } = useTelegramHaptics();
  const queryClient = useQueryClient();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { isDesktop } = useTelegramApp();
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

  useEffect(() => {
    document.documentElement.dataset.shellNav = "tabbed";
    return () => {
      if (document.documentElement.dataset.shellNav === "tabbed") {
        delete document.documentElement.dataset.shellNav;
      }
    };
  }, []);

  return (
    <div className="miniapp-shell miniapp-shell--tabbed">
      <OfflineBanner />
      {!isDesktop && <HeaderZone />}
      <ScrollZone className="miniapp-main miniapp-main--tabbed" onRefresh={handlePullRefresh}>
        <LayoutProvider stackFlow={false}>
          <ShellContextBlock />
          <div key={location.pathname} className="tab-content miniapp-shell-screen">
            <Outlet />
          </div>
        </LayoutProvider>
      </ScrollZone>
      <ActionZone>
        <nav
          className="bottom-nav miniapp-bottom-nav"
          role="navigation"
          aria-label="Main navigation"
        >
          {tabs.map(({ to, label, end, icon: Icon }) => {
            const active = isTabActive(to, end);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="tab"
                aria-selected={active}
                aria-label={label}
                tabIndex={0}
                onClick={() => {
                  impact("light");
                  selectionChanged();
                }}
                className={[
                  "nav-item",
                  "miniapp-tab",
                  active ? "on miniapp-tab--active" : "",
                ].filter(Boolean).join(" ")}
              >
                <span className="miniapp-tab-icon-shell" aria-hidden>
                  <Icon size={22} strokeWidth={active ? 2 : 1.9} />
                </span>
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
  const location = useLocation();
  const { impact, notify } = useTelegramHaptics();
  const isOnline = useOnlineStatus();
  const { reserve: mainButtonReserve } = useMainButtonReserve();
  const { isDesktop } = useTelegramApp();
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
      <ScrollZone className={mainClass} onRefresh={handlePullRefresh}>
        <LayoutProvider stackFlow>
          <ShellContextBlock stackFlow />
          <div key={location.pathname} className="tab-content miniapp-shell-screen">
            <Outlet />
          </div>
        </LayoutProvider>
      </ScrollZone>
    </div>
  );
}

export type ViewportLayoutVariant = "tabbed" | "stack";

/**
 * Main UI frame (HeaderZone + ScrollZone + ActionZone). Matches layout-system.md "ViewportLayout".
 */
export function ViewportLayout({ variant }: { variant: ViewportLayoutVariant }) {
  return variant === "tabbed" ? <TabbedShellLayout /> : <StackFlowLayout />;
}

export const MiniappLayout = TabbedShellLayout;
