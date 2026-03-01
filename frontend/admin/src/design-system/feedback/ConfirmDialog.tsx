import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "../primitives/Button";
import { cn } from "@vpn-suite/shared";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, onClose, onConfirm, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "primary", loading = false } = props;

  async function handleConfirm() {
    await onConfirm();
    onClose();
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
      <Button variant={variant} onClick={handleConfirm} loading={loading}>{confirmLabel}</Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div className={cn("ds-confirm-dialog-message")}>{message}</div>
    </Modal>
  );
}

ConfirmDialog.displayName = "ConfirmDialog";
