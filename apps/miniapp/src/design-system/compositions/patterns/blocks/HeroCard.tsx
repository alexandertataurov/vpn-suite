import type { ReactNode } from "react";

export type HeroCardStatus = "default" | "active" | "warning" | "danger";

export type HeroCardVariant = "default" | "centered" | "status";

export interface HeroCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** For variant="status": optional eyebrow label above title */
  eyebrow?: string;
  /** For variant="status": optional subtitle (ReactNode for StatusChip etc.) */
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** For variant="status": metrics grid or other content below header */
  children?: ReactNode;
  status?: HeroCardStatus;
  variant?: HeroCardVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<
  Exclude<HeroCardVariant, "status">,
  { root: string; icon: string; title: string; desc: string; actions: string }
> = {
  default: {
    root: "modern-hero-card",
    icon: "modern-hero-indicator",
    title: "modern-hero-title",
    desc: "modern-hero-desc",
    actions: "modern-hero-actions",
  },
  centered: {
    root: "new-user-hero hero-card",
    icon: "new-user-hero-icon",
    title: "new-user-hero-title",
    desc: "new-user-hero-desc",
    actions: "new-user-hero-actions",
  },
};

/**
 * Hero card pattern: icon + title + description + actions.
 * variant="status": horizontal layout (icon left, text right) + optional children (metrics grid).
 */
export function HeroCard({
  icon,
  title,
  description = "",
  eyebrow,
  subtitle,
  actions,
  children,
  status = "default",
  variant = "default",
  className,
}: HeroCardProps) {
  if (variant === "status") {
    const headerClass = actions
      ? "modern-status-group devices-summary-header--has-action"
      : "modern-status-group devices-summary-header";
    return (
      <div
        className={["modern-hero-card", className].filter(Boolean).join(" ")}
        data-status={status}
        data-variant="status"
      >
        <div className={headerClass}>
          <div className="modern-pulse-indicator">{icon}</div>
          <div className="modern-status-text u-flex-1">
            {eyebrow ? <div className="modern-header-label">{eyebrow}</div> : null}
            <div className="modern-status-title">{title}</div>
            {subtitle != null ? <div className="modern-status-subtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div className="devices-summary-card__header-action">{actions}</div> : null}
        </div>
        {children}
      </div>
    );
  }

  const c = VARIANT_CLASSES[variant];
  const cardClass = [c.root, className].filter(Boolean).join(" ");
  const iconClass = variant === "default" ? `${c.icon} ${c.icon}--${status}` : c.icon;

  const titleEl = variant === "centered" ? <h2 className={c.title}>{title}</h2> : <div className={c.title}>{title}</div>;
  const descEl = variant === "centered" ? <p className={c.desc}>{description}</p> : <div className={c.desc}>{description}</div>;
  const content = (
    <>
      {titleEl}
      {descEl}
    </>
  );

  return (
    <div className={cardClass} data-status={status} data-variant={variant}>
      <div className={iconClass} aria-hidden={variant === "centered"}>
        {icon}
      </div>
      {variant === "default" ? <div className="modern-hero-info">{content}</div> : content}
      {actions ? <div className={c.actions}>{actions}</div> : null}
    </div>
  );
}
