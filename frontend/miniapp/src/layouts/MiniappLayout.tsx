import { Outlet, NavLink } from "react-router-dom";
import { Home, Globe, CreditCard, User } from "lucide-react";
import { PrimitiveBadge } from "@vpn-suite/shared/ui";

const tabs = [
  { to: "/", label: "Home", end: true, icon: Home },
  { to: "/servers", label: "Servers", end: false, icon: Globe },
  { to: "/plan", label: "Plan", end: false, icon: CreditCard },
  { to: "/settings", label: "Account", end: false, icon: User },
];

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

export function MiniappLayout() {
  return (
    <div className="miniapp-layout">
      <header className="miniapp-header">
        <span className="miniapp-header-title">VPN</span>
        {isDev && <PrimitiveBadge variant="info" size="sm">WebApp</PrimitiveBadge>}
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
