import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

interface SidebarNavRootProps {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
  "data-testid"?: string;
}

export function SidebarNavRoot({
  children,
  className,
  id,
  ariaLabel = "Dashboard navigation",
  "data-testid": dataTestId,
}: SidebarNavRootProps) {
  return (
    <nav
      id={id}
      role="navigation"
      aria-label={ariaLabel}
      data-testid={dataTestId}
      className={["sidebar", className].filter(Boolean).join(" ")}
    >
      {children}
    </nav>
  );
}

interface SidebarNavSectionProps {
  children: ReactNode;
}

export function SidebarNavSection({ children }: SidebarNavSectionProps) {
  return <span className="sb-section">{children}</span>;
}

interface SidebarNavLinkProps extends Omit<LinkProps, "className" | "to" | "aria-label"> {
  to: string;
  label: string;
  icon?: ReactNode;
  badgeCount?: number;
  isActive?: boolean;
}

export function SidebarNavLink({
  to,
  label,
  icon,
  badgeCount,
  isActive,
  ...props
}: SidebarNavLinkProps) {
  const hasBadge = typeof badgeCount === "number" && badgeCount > 0;

  return (
    <Link
      to={to}
      className={`nav-a${isActive ? " on" : ""}`}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {icon}
      <span>{label}</span>
      {hasBadge ? <span className="nb">{badgeCount}</span> : null}
    </Link>
  );
}

interface SidebarNavFooterProps {
  children: ReactNode;
}

export function SidebarNavFooter({ children }: SidebarNavFooterProps) {
  return <div className="sb-foot">{children}</div>;
}
