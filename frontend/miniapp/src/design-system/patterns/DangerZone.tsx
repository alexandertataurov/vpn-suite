import { ConfirmModal } from "@/design-system";
import { useState } from "react";
import {
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
} from "./MissionPrimitives";

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
  disabled?: boolean;
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
  disabled = false,
}: DangerZoneProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <MissionCard tone="red" className="module-card">
        <MissionModuleHead
          label="Critical action"
          chip={<MissionChip tone="red">Destructive</MissionChip>}
        />
        <h3 className="op-name type-h3">{title}</h3>
        <p className="op-desc type-body-sm">{description}</p>
        <div className="btn-row">
          <MissionPrimaryButton tone="danger" onClick={() => setOpen(true)} disabled={loading || disabled}>
            {buttonLabel}
          </MissionPrimaryButton>
        </div>
      </MissionCard>
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
