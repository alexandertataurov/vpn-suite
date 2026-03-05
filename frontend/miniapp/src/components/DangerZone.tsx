import { Panel, Button, ConfirmModal, ActionRow } from "../ui";
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
      <Panel variant="surface" className="card edge er kpi">
        <div className="kpi-top">
          <span className="kpi-label">Critical Action</span>
          <span className="chip cr">Destructive</span>
        </div>
        <h3 className="type-h4">{title}</h3>
        <p className="type-body-sm">{description}</p>
        <ActionRow fullWidth>
          <Button
            variant="danger"
            size="md"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            {buttonLabel}
          </Button>
        </ActionRow>
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
