import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  IconHome,
  IconSmartphone,
  IconCreditCard,
  IconHelpCircle,
  IconUser,
  IconShield,
} from "@/shared-inline/icons";
import { OfflineBanner } from "@/components";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

const tabs = [
  { to: "/", label: "Home", end: true, icon: IconHome },
  { to: "/devices", label: "Devices", end: false, icon: IconSmartphone },
  { to: "/plan", label: "Plan", end: false, icon: IconCreditCard },
  { to: "/support", label: "Support", end: false, icon: IconHelpCircle },
  { to: "/settings", label: "Account", end: false, icon: IconUser },
];

export function TabbedShellLayout() {
  const { impact, selectionChanged } = useTelegramHaptics();
  const location = useLocation();

  return (
    <div className="miniapp-shell miniapp-shell--tabbed hud-bg">
      <OfflineBanner />
      <header className="miniapp-header">
        <div className="miniapp-header-brand">
          <span className="miniapp-header-logo" aria-hidden>
            <IconShield size={20} strokeWidth={1.5} />
          </span>
          <span className="miniapp-header-title">VPN</span>
        </div>
      </header>
      <main className="miniapp-main miniapp-main--tabbed">
        <div key={location.pathname} className="tab-content">
          <Outlet />
        </div>
      </main>
      <nav className="miniapp-bottom-nav" aria-label="Main">
        {tabs.map(({ to, label, end, icon: Icon }) => ( // key=
          <NavLink key={to}
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
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export const MiniappLayout = TabbedShellLayout;
