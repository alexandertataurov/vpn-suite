import { Panel, Button, ConfirmModal } from "@vpn-suite/shared/ui";
import { useState } from "react";

export interface DangerZoneProps {
  title: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function DangerZone({
  title,
  description,
  buttonLabel,
  confirmTitle,
  confirmMessage,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
}: DangerZoneProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <Panel className="card danger-zone">
        <h3 className="danger-zone-title">{title}</h3>
        <p className="danger-zone-description text-muted fs-sm">{description}</p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={loading}
        >
          {buttonLabel}
        </Button>
      </Panel>
      <ConfirmModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant="danger"
        loading={loading}
      />
    </>
  );
}
