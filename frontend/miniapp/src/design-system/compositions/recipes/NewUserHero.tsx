import type { ReactNode } from "react";
import { IconShield } from "../../icons";

export interface NewUserHeroProps {
  title: string;
  description: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function NewUserHero({
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: NewUserHeroProps) {
  return (
    <div className={["new-user-hero", "hero-card", className].filter(Boolean).join(" ")} data-layer="NewUserHero">
      <div className="new-user-hero-icon">
        <IconShield size={44} strokeWidth={1.25} />
      </div>
      <h2 className="new-user-hero-title">{title}</h2>
      <p className="new-user-hero-desc">{description}</p>
      <div className="new-user-hero-actions">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}
