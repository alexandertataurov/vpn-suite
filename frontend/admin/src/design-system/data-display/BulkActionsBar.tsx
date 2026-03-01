import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../primitives/Button";

export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  actions,
  className,
  "data-testid": dataTestId,
}: BulkActionsBarProps) {
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn("bulk-actions-bar", className)}
      data-testid={dataTestId}
    >
      <span className="bulk-actions-count">{selectedCount} selected</span>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <div className="bulk-actions-actions">{actions}</div>
    </div>
  );
}
