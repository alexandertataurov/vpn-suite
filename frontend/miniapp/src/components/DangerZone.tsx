import {
  ConfirmDanger,
  MissionCard,
  MissionPrimaryButton,
  ButtonRow,
  IconAlertTriangle,
} from "@/design-system";
import { useState } from "react";

export interface DangerZoneProps {
  title: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel: string;
  cancelLabel: string;
  /** When set, user must type this value to enable confirm (e.g. "RESET"). */
  expectedConfirmValue?: string;
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
  expectedConfirmValue,
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
    <section className="danger-zone-section" aria-labelledby="danger-zone-heading">
      <h2 id="danger-zone-heading" className="danger-zone-title type-h3">
        Danger zone
      </h2>
      <MissionCard tone="red" className="module-card danger-zone-card">
        <div className="danger-zone-content">
          <span className="danger-zone-icon" aria-hidden>
            <IconAlertTriangle size={20} strokeWidth={2} />
          </span>
          <div>
            <h3 className="op-name type-h3">{title}</h3>
            <p className="op-desc type-body-sm">{description}</p>
          </div>
        </div>
        <ButtonRow>
          <MissionPrimaryButton tone="danger" onClick={() => setOpen(true)} disabled={loading || disabled}>
            {buttonLabel}
          </MissionPrimaryButton>
        </ButtonRow>
      </MissionCard>
      <ConfirmDanger
        open={open}
        onClose={() => !loading && setOpen(false)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        confirmTokenRequired={expectedConfirmValue != null}
        confirmTokenLabel={
          expectedConfirmValue != null ? `Type ${expectedConfirmValue} to confirm` : undefined
        }
        expectedConfirmValue={expectedConfirmValue}
        loading={loading}
      />
    </section>
  );
}
