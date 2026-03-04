import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

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

function getPageLabel(pathname: string): string {
  if (pathname in PATH_TITLES) return PATH_TITLES[pathname] ?? "Admin";
  for (const path of Object.keys(PATH_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return PATH_TITLES[path] ?? "Admin";
  }
  return "Admin";
}

export function DashboardTopbar() {
  const { pathname } = useLocation();
  const time = useLiveClock();
  const pageLabel = getPageLabel(pathname);

  return (
    <header className="topbar">
      <div className="tb-brand">
        VPN Suite
        <em>/</em>
        Admin
      </div>
      <div className="tb-crumb">
        <span>Console</span>
        <span>›</span>
        <b>{pageLabel}</b>
      </div>
      <div className="tb-right">
        <span className="tb-time" aria-label="Current time">
          {time}
        </span>
        <div className="live-chip" aria-label="Live status">
          <div className="ring pulse" />
          Live
        </div>
        <button type="button" className="tb-btn">
          Refresh
        </button>
        <button type="button" className="tb-btn">
          Settings
        </button>
        <div className="tb-avatar" aria-hidden="true">
          OP
        </div>
        <button type="button" className="tb-btn">
          Sign out
        </button>
      </div>
    </header>
  );
}

