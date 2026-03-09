import type { ReactNode } from "react";
import { MissionAlert } from "./MissionPrimitives";

export interface EmptyStateBlockProps {
  title: string;
  message: string;
  /** Optional action link or button */
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent empty state for lists (no devices, no servers, etc.).
 * Uses MissionAlert tone="info".
 */
export function EmptyStateBlock({ title, message, action, className = "" }: EmptyStateBlockProps) {
  return (
    <div className={`empty-state-block ${className}`.trim()}>
      <MissionAlert tone="info" title={title} message={message} />
      {action ? <div className="empty-state-block-action">{action}</div> : null}
    </div>
  );
}
