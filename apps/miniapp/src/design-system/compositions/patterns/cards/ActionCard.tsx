import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface ActionCardProps {
  label?: string;
  value?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * ActionCard — design-system pattern for modern-action-card layout.
 * Use for: label+value pairs (Devices, Valid Until), or title+description blocks.
 */
export function ActionCard({
  label,
  value,
  title,
  description,
  children,
  onClick,
  className,
}: ActionCardProps) {
  const isInteractive = onClick != null;

  return (
    <div
      className={cn(
        "modern-action-card",
        isInteractive && "modern-clickable",
        className
      )}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {label != null && value != null ? (
        <>
          <span className="modern-action-label">{label}</span>
          <span className="modern-action-value">{value}</span>
        </>
      ) : null}
      {title != null || description != null ? (
        <div className="modern-hero-info">
          {title != null ? <div className="modern-hero-title">{title}</div> : null}
          {description != null ? (
            <div className="modern-hero-desc">{description}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
