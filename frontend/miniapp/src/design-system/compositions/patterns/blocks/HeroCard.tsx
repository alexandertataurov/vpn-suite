import type { ReactNode } from "react";

export type HeroCardStatus = "default" | "active" | "warning" | "danger";

export type HeroCardVariant = "default" | "centered";

export interface HeroCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  status?: HeroCardStatus;
  variant?: HeroCardVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<
  HeroCardVariant,
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
 * Extracted from ModernHeroCard for reuse.
 */
export function HeroCard({
  icon,
  title,
  description,
  actions,
  status = "default",
  variant = "default",
  className,
}: HeroCardProps) {
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
