import { Outlet, NavLink } from "react-router-dom";
import { Home, Shield, User, HelpCircle } from "lucide-react";
import { PrimitiveBadge } from "@vpn-suite/shared/ui";

const tabs = [
  { to: "/", label: "Status", end: true, icon: Home },
  { to: "/devices", label: "Devices", end: false, icon: Shield },
  { to: "/profile", label: "Profile", end: false, icon: User },
  { to: "/help", label: "Help", end: false, icon: HelpCircle },
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
        {tabs.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `miniapp-tab ${isActive ? "active" : ""}`
            }
          >
            <span className="miniapp-tab-icon" aria-hidden>
              <Icon size={16} strokeWidth={1.8} />
            </span>
            <span className="miniapp-tab-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
