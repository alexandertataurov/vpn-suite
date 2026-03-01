import { Button } from "@/design-system";

export interface DevicesBulkPanelProps {
  selectedCount: number;
  onClear: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  onReissue?: () => void;
  onReconcile?: () => void;
  onExportCsv?: () => void;
  revokeLoading?: boolean;
  deleteLoading?: boolean;
  reissueLoading?: boolean;
  reconcileLoading?: boolean;
  /** When true, Reconcile is disabled (e.g. NODE_MODE=agent). */
  reconcileDisabled?: boolean;
  /** Tooltip when Reconcile is disabled. */
  reconcileDisabledTitle?: string;
  /** When set, show progress e.g. "Reissuing 3/6" */
  bulkProgress?: { done: number; total: number; action: "reissue" | "reconcile" };
}

export function DevicesBulkPanel({
  selectedCount,
  onClear,
  onRevoke,
  onDelete,
  onReissue,
  onReconcile,
  onExportCsv,
  revokeLoading = false,
  deleteLoading = false,
  reissueLoading = false,
  reconcileLoading = false,
  reconcileDisabled = false,
  reconcileDisabledTitle,
  bulkProgress,
}: DevicesBulkPanelProps) {
  const inProgress = reissueLoading || reconcileLoading;
  return (
    <div
      className="devices-bulk-panel"
      role="region"
      aria-label="Bulk actions"
    >
      <span className="devices-bulk-panel-count">
        {bulkProgress
          ? `${bulkProgress.action === "reissue" ? "Reissuing" : "Reconciling"} ${bulkProgress.done}/${bulkProgress.total}`
          : `${selectedCount} selected`}
      </span>
      <div className="devices-bulk-panel-actions">
        {onReissue && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReissue}
            disabled={inProgress}
          >
            Reissue
          </Button>
        )}
        {onReconcile && (
          <span title={reconcileDisabled ? reconcileDisabledTitle : undefined}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onReconcile}
              disabled={inProgress || reconcileDisabled}
              aria-label={reconcileDisabled ? reconcileDisabledTitle : undefined}
            >
              Reconcile
            </Button>
          </span>
        )}
        {onExportCsv && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportCsv}
            disabled={inProgress}
          >
            Export CSV
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={onRevoke}
          disabled={revokeLoading || inProgress}
        >
          Revoke
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleteLoading || inProgress}
          title="Bulk delete: use row actions for single device delete"
        >
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={inProgress}>
          Clear
        </Button>
      </div>
    </div>
  );
}
