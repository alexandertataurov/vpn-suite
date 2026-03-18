import type { ReactNode } from "react";

export type ModernHeroCardVariant = "default" | "newUser";

export interface ModernHeroCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  status?: "default" | "active" | "warning" | "danger";
  /** When "newUser", uses new-user-hero layout/classes for centered hero. */
  variant?: ModernHeroCardVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<ModernHeroCardVariant, { root: string; icon: string; title: string; desc: string; actions: string }> = {
  default: {
    root: "modern-hero-card",
    icon: "modern-hero-indicator",
    title: "modern-hero-title",
    desc: "modern-hero-desc",
    actions: "modern-hero-actions",
  },
  newUser: {
    root: "new-user-hero hero-card",
    icon: "new-user-hero-icon",
    title: "new-user-hero-title",
    desc: "new-user-hero-desc",
    actions: "new-user-hero-actions",
  },
};

export function ModernHeroCard({
  icon,
  title,
  description,
  actions,
  status = "default",
  variant = "default",
  className,
}: ModernHeroCardProps) {
  const c = VARIANT_CLASSES[variant];
  const cardClass = [c.root, className].filter(Boolean).join(" ");
  const iconClass =
    variant === "default" ? `${c.icon} ${c.icon}--${status}` : c.icon;

  const titleEl = variant === "newUser" ? <h2 className={c.title}>{title}</h2> : <div className={c.title}>{title}</div>;
  const descEl = variant === "newUser" ? <p className={c.desc}>{description}</p> : <div className={c.desc}>{description}</div>;
  const content = (
    <>
      {titleEl}
      {descEl}
    </>
  );

  return (
    <div className={cardClass} data-status={status} data-layer={variant === "newUser" ? "NewUserHero" : "ModernHeroCard"}>
      <div className={iconClass} aria-hidden={variant === "newUser"}>
        {icon}
      </div>
      {variant === "default" ? <div className="modern-hero-info">{content}</div> : content}
      {actions ? <div className={c.actions}>{actions}</div> : null}
    </div>
  );
}
