import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "@/design-system/icons";
import { Skeleton } from "@/design-system";

export interface DashboardStripProps {
  icon: LucideIcon;
  label: string;
  linkTo: string;
  linkLabel?: string;
  values: ReactNode;
  isLoading?: boolean;
  error?: unknown;
}

export function DashboardStrip({
  icon: Icon,
  label,
  linkTo,
  linkLabel = "View all",
  values,
  isLoading = false,
  error,
}: DashboardStripProps) {
  if (error) return null;
  if (isLoading) {
    return (
      <div className="operator-card dashboard-strip">
        <Skeleton height={72} />
      </div>
    );
  }
  return (
    <div className="operator-card dashboard-strip">
      <div className="dashboard-strip__header">
        <Icon className="dashboard-strip__icon" aria-hidden size={14} strokeWidth={1.5} />
        <span className="dashboard-strip__label">{label}</span>
        <Link to={linkTo} className="dashboard-strip__link">{linkLabel}</Link>
      </div>
      <div className="dashboard-strip__values">{values}</div>
    </div>
  );
}
