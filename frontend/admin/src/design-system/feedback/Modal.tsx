import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../primitives/Button";
import { Input } from "../primitives/Input";
import { Textarea } from "../primitives/Textarea";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Modal({ open, onClose, ...rest }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const modal = ref.current;
    if (!modal) return;
    modal.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Tab") {
        const f = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ds-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ds-modal-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={cn("ds-modal", rest.size && `ds-modal--${rest.size}`, rest.className)} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="ds-modal-header">
          <h2 id="ds-modal-title" className="ds-modal-title">{rest.title}</h2>
          <button type="button" className="ds-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ds-modal-body">{rest.children}</div>
        {rest.footer != null && <div className="ds-modal-footer">{rest.footer}</div>}
      </div>
    </div>
  );
}

Modal.displayName = "Modal";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmModalProps) {
  async function handleConfirm() {
    await onConfirm();
    onClose();
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <p className="modal-message">{message}</p>
    </Modal>
  );
}

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
      <Button
        variant="danger"
        onClick={handleConfirm}
        loading={loading}
        disabled={!canConfirm}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <p className="modal-message">{message}</p>
      {reasonRequired && (
        <Textarea
          id="confirm-danger-reason"
          label={reasonLabel}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={reasonPlaceholder}
          rows={2}
          aria-required
        />
      )}
      {confirmTokenRequired && (
        <div className="modal-field">
          <label htmlFor="confirm-danger-token">{confirmTokenLabel}</label>
          <Input
            id="confirm-danger-token"
            type="password"
            autoComplete="one-time-code"
            placeholder={confirmTokenLabel}
            value={confirmToken}
            onChange={(e) => setConfirmToken(e.target.value)}
            aria-label={confirmTokenLabel}
          />
        </div>
      )}
    </Modal>
  );
}
