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
  variant?: "plain" | "confirm" | "danger";
  className?: string;
  /** When true, clicking the backdrop closes the modal (non-danger, non-loading). Default true. */
  closeOnBackdrop?: boolean;
  /** When true, Escape closes the modal. Default true. */
  closeOnEscape?: boolean;
  /** When true, user can swipe down to dismiss on touch devices. Default true. */
  swipeToDismiss?: boolean;
  /** When true, modal cannot be dismissed via backdrop, Escape, or swipe (e.g. loading state). */
  disableDismiss?: boolean;
  /** Hide the close (×) icon. Used for confirm/danger flows that require explicit choice. */
  showCloseButton?: boolean;
  /** Hide the drag handle. Confirm and danger flows use explicit dismissal instead. */
  showHandle?: boolean;
  /** Render modal content without full-screen backdrop, for static Storybook mockups only. */
  inline?: boolean;
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
  variant = "plain",
  className = "",
  closeOnBackdrop = true,
  closeOnEscape = true,
  swipeToDismiss = true,
  disableDismiss = false,
  showCloseButton = true,
  showHandle = true,
  inline = false,
  "data-testid": dataTestId,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const didFocusRef = useRef(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(open);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timeout = window.setTimeout(() => {
      setMounted(false);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || inline) {
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

    const allowEscapeDismiss = !disableDismiss && variant !== "danger" && closeOnEscape;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && allowEscapeDismiss) {
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
  }, [open, onClose, closeOnEscape, disableDismiss, inline, variant]);

  if (!mounted && !inline) return null;

  const allowBackdropDismiss = !disableDismiss && variant !== "danger" && closeOnBackdrop;
  const allowSwipeDismiss = !disableDismiss && variant !== "danger" && swipeToDismiss;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      !allowBackdropDismiss ||
      event.target !== event.currentTarget
    ) {
      return;
    }
    onClose();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!allowSwipeDismiss || event.pointerType === "mouse") {
      return;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }
    swipeStartYRef.current = event.clientY;
    swipeStartTimeRef.current = performance.now();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      !allowSwipeDismiss ||
      swipeStartYRef.current == null ||
      swipeStartTimeRef.current == null
    ) {
      return;
    }
    const deltaY = event.clientY - swipeStartYRef.current;
    const elapsed = performance.now() - swipeStartTimeRef.current;
    swipeStartYRef.current = null;
    swipeStartTimeRef.current = null;
    if (deltaY <= 0) return;
    const velocity = (deltaY / elapsed) * 1000;
    if (deltaY >= 40 || velocity > 500) {
      onClose();
    }
  };

  const dialog = (
      <div
        ref={ref}
        className={cn(
          "modal",
          `modal-variant-${variant}`,
          className,
          open && "modal-sheet-enter",
          !open && "modal-sheet-exit"
        )}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        data-testid={dataTestId}
      >
        {showHandle ? <div className="modal-handle" aria-hidden="true" /> : null}
        <div className="modal-header">
          <div className="modal-header-copy">
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId} className="modal-description">{description}</p> : null}
          </div>
          {showCloseButton ? (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Back"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
        {footer !== undefined ? (
          <div className="modal-footer">{footer}</div>
        ) : null}
      </div>
  );

  if (inline) {
    if (!open) return null;
    return dialog;
  }

  return (
    <div
      className={cn(
        "modal-overlay",
        "modal-backdrop",
        open ? "modal-backdrop-enter" : "modal-backdrop-exit"
      )}
      role="presentation"
      aria-hidden="true"
      onClick={handleBackdropClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div
        onClick={(e) => e.stopPropagation()}
      >
        {dialog}
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
  /** Optional visual tone for primary button (e.g. warning vs neutral). */
  tone?: "default" | "warning" | "danger";
  closeOnEscape?: boolean;
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
  tone = "default",
  closeOnEscape = true,
}: ConfirmModalProps) {
  async function handleConfirm() {
    await onConfirm();
    onClose();
  }

  const footer = (
    <>
      <Button variant="ghost" className="modal-cancel-btn" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        tone={variant === "primary" ? tone : undefined}
        className="modal-footer-btn"
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={footer}
      variant="confirm"
      closeOnBackdrop={false}
      closeOnEscape={!loading && closeOnEscape}
      swipeToDismiss={false}
      disableDismiss={loading}
      showCloseButton={false}
      showHandle={false}
    >
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
      <Button variant="ghost" className="modal-cancel-btn" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant="danger"
        className={`modal-footer-btn modal-danger-confirm ${canConfirm && !loading ? "modal-danger-confirm--enabled" : "modal-danger-confirm--disabled"}`}
        onClick={handleConfirm}
        loading={loading}
        disabled={!canConfirm}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={footer}
      variant="danger"
      closeOnBackdrop={false}
      closeOnEscape={false}
      swipeToDismiss={false}
      disableDismiss={loading}
      showCloseButton={false}
      showHandle={false}
    >
      <div className="danger-warning">
        <p className="modal-message">{message}</p>
      </div>
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
            placeholder={
              expectedConfirmValue != null
                ? `Type ${expectedConfirmValue} to confirm`
                : confirmTokenLabel
            }
            value={confirmToken}
            onChange={(e) => {
              setConfirmToken(
                expectedConfirmValue != null ? e.target.value.toUpperCase() : e.target.value,
              );
            }}
            aria-label={confirmTokenLabel}
            autoCapitalize={expectedConfirmValue != null ? "characters" : "none"}
            autoCorrect="off"
            spellCheck={false}
            className={expectedConfirmValue != null ? "confirm-token-input" : undefined}
          />
        </div>
      )}
    </Modal>
  );
}
