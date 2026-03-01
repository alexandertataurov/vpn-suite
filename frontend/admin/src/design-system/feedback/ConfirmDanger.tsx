import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../primitives/Button";
import { Input } from "../primitives/Input";
import { Textarea } from "../primitives/Textarea";
import { Field } from "../layout/Field";

export interface ConfirmDangerPayload {
  reason?: string;
  confirm_token?: string;
}

export interface ConfirmDangerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmTokenRequired?: boolean;
  confirmTokenLabel?: string;
  onConfirm: (payload: ConfirmDangerPayload) => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ConfirmDanger({
  open,
  onClose,
  title,
  message,
  reasonRequired = false,
  reasonLabel = "Reason",
  reasonPlaceholder,
  confirmTokenRequired = false,
  confirmTokenLabel = "Confirmation code",
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}: ConfirmDangerProps) {
  const [reason, setReason] = useState("");
  const [confirmToken, setConfirmToken] = useState("");

  const reset = () => {
    setReason("");
    setConfirmToken("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const canConfirm =
    (!reasonRequired || reason.trim() !== "") &&
    (!confirmTokenRequired || confirmToken.trim() !== "");

  async function handleConfirm() {
    await onConfirm({
      reason: reasonRequired ? reason.trim() : undefined,
      confirm_token: confirmTokenRequired ? confirmToken.trim() : undefined,
    });
    onClose();
    reset();
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button variant="danger" onClick={handleConfirm} loading={loading} disabled={!canConfirm}>
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <p className="ds-confirm-dialog-message">{message}</p>
      {reasonRequired && (
        <Field id="confirm-danger-reason" label={reasonLabel} required className="ds-confirm-danger-field">
          <Textarea
            id="confirm-danger-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={2}
            aria-required
          />
        </Field>
      )}
      {confirmTokenRequired && (
        <Field id="confirm-danger-token" label={confirmTokenLabel} className="ds-confirm-danger-field">
          <Input
            id="confirm-danger-token"
            type="password"
            autoComplete="one-time-code"
            placeholder={confirmTokenLabel}
            value={confirmToken}
            onChange={(e) => setConfirmToken(e.target.value)}
            aria-label={confirmTokenLabel}
          />
        </Field>
      )}
    </Modal>
  );
}

ConfirmDanger.displayName = "ConfirmDanger";
