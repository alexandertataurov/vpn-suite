import type { ReactNode } from "react";
import { HeroCard } from "../../patterns";

export type ModernHeroCardVariant = "default" | "newUser";

export interface ModernHeroCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  status?: "default" | "active" | "warning" | "danger";
  variant?: ModernHeroCardVariant;
  className?: string;
}

/** Hero card recipe. Uses HeroCard pattern. */
export function ModernHeroCard({
  icon,
  title,
  description,
  actions,
  status = "default",
  variant = "default",
  className,
}: ModernHeroCardProps) {
  return (
    <HeroCard
      icon={icon}
      title={title}
      description={description}
      actions={actions}
      status={status}
      variant={variant === "newUser" ? "centered" : "default"}
      className={className}
    />
  );
}
