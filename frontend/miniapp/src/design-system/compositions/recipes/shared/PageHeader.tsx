import type { ReactNode } from "react";
import { HeaderBar } from "../../patterns";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  backAriaLabel?: string;
}

/** Page header recipe. Uses HeaderBar pattern. */
export function PageHeader({ title, subtitle, onBack, action, backAriaLabel = "Back" }: PageHeaderProps) {
  return (
    <HeaderBar
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      action={action}
      backAriaLabel={backAriaLabel}
      data-layer="PageHeader"
    />
  );
}
