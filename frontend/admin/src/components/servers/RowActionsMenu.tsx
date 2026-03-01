import { IconMoreVertical, IconRefresh } from "@/design-system/icons";
import { Button, DropdownMenu } from "@/design-system";
import type { ServerOut } from "@vpn-suite/shared/types";

export interface RowActionsMenuProps {
  server: ServerOut;
  syncing: boolean;
  onSync: () => void;
  onConfigure: () => void;
  onRestart: () => void;
  onDrainUndrain: () => void;
  onReconcile: () => void;
  onIssueConfig: () => void;
  onDelete?: () => void;
}

export function RowActionsMenu({
  server,
  syncing,
  onSync,
  onConfigure,
  onRestart,
  onDrainUndrain,
  onReconcile,
  onIssueConfig,
  onDelete,
}: RowActionsMenuProps) {
  const disabled = syncing;

  return (
    <div className="table-actions server-row-actions">
      <Button
        variant="secondary"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onSync();
        }}
        disabled={disabled}
        aria-label="Sync from node"
        title="Sync"
      >
        <IconRefresh aria-hidden size={14} strokeWidth={1.5} />
      </Button>
      <DropdownMenu
        portal
        items={[
          { id: "configure", label: "Configure", onClick: onConfigure },
          {
            id: "restart",
            label: server.is_active ? "Restart" : "Start",
            onClick: onRestart,
          },
          {
            id: "drain-undrain",
            label: server.is_draining ? "Undrain" : "Drain",
            onClick: onDrainUndrain,
          },
          {
            id: "reconcile",
            label: "Reconcile",
            onClick: onReconcile,
            disabled,
          },
          { id: "issue-config", label: "Issue config", onClick: onIssueConfig },
          ...(onDelete ? [{ id: "delete", label: "Delete…", onClick: onDelete, danger: true }] : []),
        ]}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label="More actions"
            title="More actions"
          >
            <IconMoreVertical aria-hidden size={14} strokeWidth={1.5} />
          </Button>
        }
      />
    </div>
  );
}
