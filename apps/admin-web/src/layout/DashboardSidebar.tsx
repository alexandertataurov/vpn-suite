import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getSidebarRoutes, type NavSection } from "@/app/route-meta";
import {
  SidebarNavFooter,
  SidebarNavLink,
  SidebarNavRoot,
  SidebarNavSection,
} from "../design-system";

interface SidebarItem {
  to: string;
  label: string;
  section: NavSection;
  badgeCount?: number;
  icon: JSX.Element;
}

const ICONS: Record<string, JSX.Element> = {
  "/": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="5" height="5" rx=".5" />
        <rect x="8" y="1" width="5" height="5" rx=".5" />
        <rect x="1" y="8" width="5" height="5" rx=".5" />
        <rect x="8" y="8" width="5" height="5" rx=".5" />
      </svg>
  ),
  "/servers": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="1" y="3" width="12" height="9" rx=".8" />
        <line x1="1" y1="6" x2="13" y2="6" />
        <line x1="4.5" y1="1.5" x2="4.5" y2="4.5" />
        <line x1="9.5" y1="1.5" x2="9.5" y2="4.5" />
      </svg>
  ),
  "/telemetry": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <polyline points="1 10 4 5.5 7 7.5 10 3 13 5" />
      </svg>
  ),
  "/customer-360": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="2" />
        <path d="M2 11c0-2 1.2-3.2 3-3.2S8 9 8 11" />
        <path d="M9 3.5h3" />
        <path d="M9 6.5h3" />
        <path d="M9 9.5h3" />
      </svg>
  ),
  "/users": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <circle cx="4.5" cy="5" r="2" />
        <circle cx="9.5" cy="5" r="2" />
        <path d="M1.5 11c0-2 1.5-3 3-3s3 1 3 3" />
        <path d="M7 11c0-1.6 1.1-2.4 2.5-2.4S12 9.4 12 11" />
      </svg>
  ),
  "/devices": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="10" height="7" rx="1" />
        <rect x="5" y="10.5" width="4" height="1" rx=".5" />
      </svg>
  ),
  "/automation": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <circle cx="4" cy="7" r="1.3" />
        <circle cx="10" cy="4" r="1.3" />
        <circle cx="10" cy="10" r="1.3" />
        <path d="M5.2 6.4 8.7 4.6" />
        <path d="M5.2 7.6 8.7 9.4" />
      </svg>
  ),
  "/audit": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="10" height="10" rx=".6" />
        <line x1="5" y1="5.5" x2="9" y2="5.5" />
        <line x1="5" y1="8" x2="7.5" y2="8" />
      </svg>
  ),
  "/revenue": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <path d="M2 11.5V8l2.5-3 2.5 2 3-4" />
        <path d="M1 11.5h12" />
      </svg>
  ),
  "/billing": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="2" y="2.5" width="10" height="9" rx="1" />
        <rect x="3" y="4" width="8" height="2.2" />
        <line x1="4" y1="8" x2="7" y2="8" />
      </svg>
  ),
  "/settings": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="2" />
        <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" />
      </svg>
  ),
  "/news": (
      <svg
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="10" height="10" rx=".6" />
        <line x1="4" y1="5" x2="10" y2="5" />
        <line x1="4" y1="7" x2="9" y2="7" />
        <line x1="4" y1="9" x2="8" y2="9" />
      </svg>
  ),
};

function getIcon(path: string): JSX.Element {
  if (path in ICONS) return ICONS[path]!;
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="4" />
    </svg>
  );
}

export const SIDEBAR_NAV_ID = "dashboard-sidebar-nav";

interface DashboardSidebarProps {
  isOverlayOpen?: boolean;
  onCloseOverlay?: () => void;
}

export function DashboardSidebar({
  isOverlayOpen = false,
  onCloseOverlay,
}: DashboardSidebarProps) {
  const { pathname } = useLocation();
  const isNarrow = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isOverlayOpen && onCloseOverlay) onCloseOverlay();
  }, [pathname, isOverlayOpen, onCloseOverlay]);

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/" || pathname === "";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const sidebarClassName = [
    isNarrow ? "sidebar--mobile" : undefined,
    isOverlayOpen ? "sidebar--overlay" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const items: SidebarItem[] = [
    ...getSidebarRoutes("Monitor").map((item) => ({
      to: item.path,
      label: item.navLabel ?? item.title,
      section: "Monitor" as const,
      icon: getIcon(item.path),
    })),
    ...getSidebarRoutes("Customers").map((item) => ({
      to: item.path,
      label: item.navLabel ?? item.title,
      section: "Customers" as const,
      icon: getIcon(item.path),
    })),
    ...getSidebarRoutes("Config").map((item) => ({
      to: item.path,
      label: item.navLabel ?? item.title,
      section: "Config" as const,
      icon: getIcon(item.path),
    })),
  ];

  return (
    <>
      {isOverlayOpen && onCloseOverlay ? (
        <button
          type="button"
          className="sidebar-overlay-backdrop"
          onClick={onCloseOverlay}
          aria-label="Close navigation"
          aria-controls={SIDEBAR_NAV_ID}
        />
      ) : null}
      <SidebarNavRoot
        className={sidebarClassName || undefined}
        id={SIDEBAR_NAV_ID}
        ariaLabel="Dashboard navigation"
        data-testid="admin-sidebar"
      >
        <SidebarNavSection>Monitor</SidebarNavSection>
        {items.filter((i) => i.section === "Monitor").map((item) => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            badgeCount={item.badgeCount}
            isActive={isActive(item.to)}
          />
        ))}

        <SidebarNavSection>Customers</SidebarNavSection>
        {items.filter((i) => i.section === "Customers").map((item) => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            badgeCount={item.badgeCount}
            isActive={isActive(item.to)}
          />
        ))}

        <SidebarNavSection>Config</SidebarNavSection>
        {items.filter((i) => i.section === "Config").map((item) => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.to)}
          />
        ))}

      <SidebarNavFooter>
        <div className="sb-foot-row">
          <div className="dot" />
          System status
        </div>
        <div className="sb-foot-row sb-foot-row--dim">
          See bottom status bar for live metrics
        </div>
      </SidebarNavFooter>
    </SidebarNavRoot>
    </>
  );
}
