import type { ReactNode } from "react";

export interface ModernHeroCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  status?: "default" | "active" | "warning" | "danger";
  className?: string;
}

export function ModernHeroCard({
  icon,
  title,
  description,
  actions,
  status = "default",
  className,
}: ModernHeroCardProps) {
  const cardClass = ["modern-hero-card", className].filter(Boolean).join(" ");
  const indicatorClass = ["modern-hero-indicator", `modern-hero-indicator--${status}`].join(" ");

  return (
    <div className={cardClass} data-status={status}>
      <div className={indicatorClass}>
        {icon}
      </div>
      
      <div className="modern-hero-info">
        <div className="modern-hero-title">{title}</div>
        <div className="modern-hero-desc">{description}</div>
      </div>
      
      {actions ? (
        <div className="modern-hero-actions">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
