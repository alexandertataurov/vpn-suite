import type { ReactNode } from "react";
import { EmptyState } from "../feedback/EmptyState";

export interface EmptyTableStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Canonical empty state for data tables.
 * Use this in pages instead of bespoke `.table-empty` markup.
 */
export function EmptyTableState({ title, description, action, className }: EmptyTableStateProps) {
  return (
    <div className={className ?? "table-empty"} role="status">
      <EmptyState title={title} description={description} actions={action} />
    </div>
  );
}

