import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../buttons/Button";
import { Input } from "../forms/Input";
import { Textarea } from "../forms/Textarea";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Optional for tests */
  "data-testid"?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className = "",
  "data-testid": dataTestId,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const didFocusRef = useRef(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      didFocusRef.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const modal = el;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    if (!didFocusRef.current) {
      didFocusRef.current = true;
      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      if (first) {
        requestAnimationFrame(() => first.focus());
      } else {
        modal.focus();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) {
        e.preventDefault();
        modal.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!modal.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    modal.addEventListener("keydown", onKeyDown);
    return () => {
      modal.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      aria-hidden="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={cn("modal", className)}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(e) => e.stopPropagation()}
        data-testid={dataTestId}
      >
        <div className="modal-header">
          <div className="modal-header-copy">
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId} className="modal-description">{description}</p> : null}
          </div>
          <button type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer !== undefined ? (
          <div className="modal-footer">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

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
  /** Require reason (textarea) for audit. Default true for restart/revoke. */
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Require confirm token/code input (e.g. from env). */
  confirmTokenRequired?: boolean;
  confirmTokenLabel?: string;
  /** When set, confirm button is disabled until input matches this value exactly (case-sensitive). */
  expectedConfirmValue?: string;
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
  expectedConfirmValue,
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

  const tokenMatches =
    !confirmTokenRequired ||
    (expectedConfirmValue != null
      ? confirmToken.trim() === expectedConfirmValue
      : confirmToken.trim() !== "");
  const canConfirm =
    (!reasonRequired || reason.trim() !== "") &&
    (!confirmTokenRequired || confirmToken.trim() !== "") &&
    tokenMatches;

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
            type={expectedConfirmValue != null ? "text" : "password"}
            autoComplete={expectedConfirmValue != null ? "off" : "one-time-code"}
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
