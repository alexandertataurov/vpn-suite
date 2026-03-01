import { Panel, Button, ConfirmModal, H3, Body, ActionRow } from "../ui";
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
        <H3 as="h3" className="danger-zone-title">{title}</H3>
        <Body className="danger-zone-description">{description}</Body>
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
