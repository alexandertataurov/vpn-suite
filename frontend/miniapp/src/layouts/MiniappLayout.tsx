import { Outlet, NavLink } from "react-router-dom";
import { PrimitiveBadge } from "@vpn-suite/shared/ui";

const tabs = [
  { to: "/", label: "Status", end: true },
  { to: "/devices", label: "Devices", end: false },
  { to: "/profile", label: "Profile", end: false },
  { to: "/help", label: "Help", end: false },
];

export function MiniappLayout() {
  return (
    <div className="miniapp-layout">
      <header className="miniapp-header">
        <span className="miniapp-header-title">VPN Suite</span>
        <PrimitiveBadge variant="info" size="sm">WebApp</PrimitiveBadge>
      </header>
      <main className="miniapp-main">
        <Outlet />
      </main>
      <nav className="miniapp-bottom-nav" aria-label="Main">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `miniapp-tab ${isActive ? "active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
