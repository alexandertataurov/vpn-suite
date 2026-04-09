import type { ReactNode } from "react";
import { HeaderBar } from "../../patterns";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  backAriaLabel?: string;
  className?: string;
}

/** Page header recipe. Uses HeaderBar pattern. */
export function PageHeader({
  title,
  subtitle,
  onBack,
  action,
  backAriaLabel = "Back",
  className,
}: PageHeaderProps) {
  return (
    <HeaderBar
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      action={action}
      backAriaLabel={backAriaLabel}
      className={className}
      data-layer="PageHeader"
    />
  );
}
