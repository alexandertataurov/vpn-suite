import { useLocation, Outlet } from "react-router-dom";
import { NavRail } from "./NavRail";
import { MissionBar } from "./MissionBar";
import { ShellActions } from "./ShellActions";

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

function getPageTitle(pathname: string): string {
  if (pathname in PATH_TITLES) return PATH_TITLES[pathname] ?? "Admin";
  for (const path of Object.keys(PATH_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return PATH_TITLES[path] ?? "Admin";
  }
  return "Admin";
}

export function Shell() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <div className="shell">
      <aside className="shell__aside">
        <NavRail />
      </aside>
      <main className="shell__main">
        <MissionBar title={title}>
          <ShellActions />
        </MissionBar>
        <div className="shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
