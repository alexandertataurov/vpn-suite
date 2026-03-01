import { Outlet, NavLink } from "react-router-dom";
import { Home, Smartphone, CreditCard, HelpCircle, User, Shield } from "lucide-react";
import { OfflineBanner } from "../components/OfflineBanner";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

const tabs = [
  { to: "/", label: "Home", end: true, icon: Home },
  { to: "/devices", label: "Devices", end: false, icon: Smartphone },
  { to: "/plan", label: "Plan", end: false, icon: CreditCard },
  { to: "/support", label: "Support", end: false, icon: HelpCircle },
  { to: "/settings", label: "Account", end: false, icon: User },
];

export function TabbedShellLayout() {
  const { impact, selectionChanged } = useTelegramHaptics();

  return (
    <div className="miniapp-shell miniapp-shell--tabbed hud-bg">
      <OfflineBanner />
      <header className="miniapp-header">
        <div className="miniapp-header-brand">
          <span className="miniapp-header-logo" aria-hidden>
            <Shield size={20} strokeWidth={1.5} />
          </span>
          <span className="miniapp-header-title">VPN</span>
        </div>
      </header>
      <main className="miniapp-main miniapp-main--tabbed">
        <Outlet />
      </main>
      <nav className="miniapp-bottom-nav" aria-label="Main">
        {tabs.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => {
              impact("light");
              selectionChanged();
            }}
            className={({ isActive }) =>
              `miniapp-tab ${isActive ? "active" : ""}`
            }
          >
            <span className="miniapp-tab-icon" aria-hidden>
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <span className="miniapp-tab-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function StackFlowLayout() {
  return (
    <div className="miniapp-shell miniapp-shell--stack hud-bg">
      <main className="miniapp-main miniapp-main--stack">
        <Outlet />
      </main>
    </div>
  );
}

export const MiniappLayout = TabbedShellLayout;
