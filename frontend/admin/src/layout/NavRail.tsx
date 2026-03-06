import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavBadge, NavLabel } from "@/design-system/typography";

export interface NavItem {
  to: string;
  label: string;
  short?: string;
  section?: string;
}

const defaultItems: NavItem[] = [
  { to: "/", label: "Overview", short: "OV" },
  { to: "/servers", label: "Servers", short: "SV" },
  { to: "/telemetry", label: "Telemetry", short: "TM" },
  { to: "/users", label: "Users", short: "US" },
  { to: "/devices", label: "Devices", short: "DV" },
  { to: "/automation", label: "Automation", short: "AT" },
  { to: "/revenue", label: "Revenue", short: "RV" },
  { to: "/audit", label: "Audit", short: "AU" },
  { to: "/settings", label: "Settings", short: "ST" },
];

const NavRailItem = memo(function NavRailItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <li>
      <Link
        to={item.to}
        className={`nav-rail__link${isActive ? " nav-rail__link--active" : ""}`}
      >
        <NavBadge className="nav-rail__short">
          {item.short ?? item.label.slice(0, 2)}
        </NavBadge>
        <NavLabel className="nav-rail__label">{item.label}</NavLabel>
      </Link>
    </li>
  );
});

export function NavRail({ items = defaultItems }: { items?: NavItem[] }) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="nav-rail" aria-label="Main" data-testid="admin-nav">
      <ul className="nav-rail__list">
        {items.map((item) => (
          <NavRailItem
            key={item.to}
            item={item}
            isActive={
              item.to === "/"
                ? pathname === "/" || pathname === ""
                : pathname === item.to || pathname.startsWith(`${item.to}/`)
            }
          />
        ))}
      </ul>
    </nav>
  );
}
