import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export interface TabItem {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean;
  ariaLabel?: string;
}

export interface TabsProps {
  items: TabItem[];
  onTabPress?: (item: TabItem) => void;
}

export function Tabs({ items, onTabPress }: TabsProps) {
  return (
    <nav className="miniapp-bottom-nav" aria-label="Primary navigation tabs">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          aria-label={item.ariaLabel ?? item.label}
          onClick={() => onTabPress?.(item)}
          className={({ isActive }) => `miniapp-tab ${isActive ? "miniapp-tab--active" : ""}`}
        >
          {item.icon ? <span className="miniapp-tab-icon" aria-hidden>{item.icon}</span> : null}
          <span className="miniapp-tab-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
