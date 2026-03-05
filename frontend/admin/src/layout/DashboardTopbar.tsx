import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/core/auth/store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  TopbarAvatar,
  TopbarBrand,
  TopbarBtn,
  TopbarCrumb,
  TopbarLiveChip,
  TopbarRight,
  TopbarRoot,
  TopbarTime,
} from "@/design-system";

export function useLiveClock() {
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

const PATH_TITLES: Record<string, string> = {
  "/": "Overview",
  "/servers": "Servers",
  "/telemetry": "Telemetry",
  "/users": "Users",
  "/devices": "Devices",
  "/automation": "Automation",
  "/revenue": "Revenue",
  "/billing": "Billing",
  "/audit": "Audit",
  "/settings": "Settings",
  "/styleguide": "Styleguide",
};

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 3h14M1 8h14M1 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function getPageLabel(pathname: string): string {
  if (pathname in PATH_TITLES) return PATH_TITLES[pathname] ?? "Admin";
  for (const path of Object.keys(PATH_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return PATH_TITLES[path] ?? "Admin";
  }
  return "Admin";
}

interface DashboardTopbarProps {
  onOpenMenu?: () => void;
}

export function DashboardTopbar({ onOpenMenu }: DashboardTopbarProps) {
  const { pathname } = useLocation();
  const time = useLiveClock();
  const pageLabel = getPageLabel(pathname);
  const isNarrow = useMediaQuery("(max-width: 768px)");

  return (
    <TopbarRoot>
      <TopbarBrand wordmark="VPN Suite" product="Admin" />
      {isNarrow && onOpenMenu ? (
        <TopbarBtn aria-label="Open menu" onClick={onOpenMenu}>
          <MenuIcon />
        </TopbarBtn>
      ) : null}
      {!isNarrow ? <TopbarCrumb segment="Console" page={pageLabel} /> : null}
      <TopbarRight>
        <TopbarTime>{time}</TopbarTime>
        <TopbarLiveChip />
        <TopbarBtn aria-label="Refresh">Refresh</TopbarBtn>
        <TopbarBtn aria-label="Settings">Settings</TopbarBtn>
        <TopbarAvatar initials="OP" />
        <TopbarBtn
          aria-label="Sign out"
          onClick={() => useAuthStore.getState().logout()}
        >
          Sign out
        </TopbarBtn>
      </TopbarRight>
    </TopbarRoot>
  );
}
