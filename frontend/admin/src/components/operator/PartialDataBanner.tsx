/**
 * Per-card partial/degraded data banner. Explains why data is partial and offers actions.
 */
import type { ReactNode } from "react";
import { InlineAlert } from "@vpn-suite/shared/ui";

export interface PartialDataBannerProps {
  variant?: "info" | "warning" | "error";
  title: string;
  message?: string;
  actions?: ReactNode;
  className?: string;
}

export function PartialDataBanner({
  variant = "warning",
  title,
  message,
  actions,
  className,
}: PartialDataBannerProps) {
  return (
    <div className={className} role="status">
      <InlineAlert variant={variant} title={title} message={message} actions={actions} />
    </div>
  );
}
