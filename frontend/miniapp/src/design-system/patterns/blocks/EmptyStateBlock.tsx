import type { HTMLAttributes, ReactNode } from "react";
import { IconAlertTriangle, IconGlobe, IconShield, IconX } from "../../icons";
import { Button } from "../../components/buttons/Button";

export type EmptyStateVariant =
  | "no_devices"
  | "no_servers"
  | "no_history"
  | "no_results"
  | "loading_failed";

type EmptyStateDefinition = {
  title: string;
  message: string;
  ctaLabel?: string;
  icon: ReactNode;
};

export const EMPTY_STATE_VARIANTS: Record<EmptyStateVariant, EmptyStateDefinition> = {
  no_devices: {
    title: "NO DEVICES YET",
    message: "Issue a config to create your first protected device.",
    ctaLabel: "OPEN DEVICES",
    icon: <IconShield size={24} strokeWidth={1.75} aria-hidden />,
  },
  no_servers: {
    title: "NO SERVERS",
    message: "No servers are available for your plan.",
    ctaLabel: "CONTACT SUPPORT",
    icon: <IconGlobe size={24} strokeWidth={1.75} aria-hidden />,
  },
  no_history: {
    title: "NO ACTIVITY YET",
    message: "Connection history will appear here.",
    icon: <IconShield size={24} strokeWidth={1.75} aria-hidden />,
  },
  no_results: {
    title: "NO RESULTS",
    message: "Try adjusting your search or filters.",
    ctaLabel: "CLEAR FILTERS",
    icon: <IconGlobe size={24} strokeWidth={1.75} aria-hidden />,
  },
  loading_failed: {
    title: "COULDN'T LOAD",
    message: "Pull to refresh or check your connection.",
    ctaLabel: "RETRY",
    icon: <IconX size={24} strokeWidth={1.75} aria-hidden />,
  },
};

export interface EmptyStateBlockProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Consistent empty state for lists (no devices, no servers, etc.).
 */
export function EmptyStateBlock({
  title,
  message,
  action,
  variant,
  icon,
  actionLabel,
  onAction,
  className = "",
  ...props
}: EmptyStateBlockProps) {
  const definition = variant ? EMPTY_STATE_VARIANTS[variant] : null;
  const resolvedTitle = title ?? definition?.title ?? "NO RESULTS";
  const resolvedMessage = message ?? definition?.message ?? "Nothing is available yet.";
  const resolvedIcon = icon ?? definition?.icon;
  const resolvedAction =
    action ??
    (onAction && (actionLabel ?? definition?.ctaLabel) ? (
      <Button variant="secondary" size="md" onClick={onAction}>
        {actionLabel ?? definition?.ctaLabel}
      </Button>
    ) : null);

  return (
    <div className={`empty-state-block ${className}`.trim()} {...props}>
      {resolvedIcon ? <div className="empty-state-block-icon">{resolvedIcon}</div> : null}
      <div className="empty-state-block-title">{resolvedTitle}</div>
      <div className="empty-state-block-message">{resolvedMessage}</div>
      {resolvedAction ? <div className="empty-state-block-action">{resolvedAction}</div> : null}
      {variant === "loading_failed" ? (
        <div className="empty-state-block-footnote">
          <IconAlertTriangle size={14} strokeWidth={1.8} aria-hidden />
          <span>Restore connectivity before retrying if the issue persists.</span>
        </div>
      ) : null}
    </div>
  );
}
