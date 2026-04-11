import "./Modal.css";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../Button";
import { Input } from "../forms/Input";
import { Textarea } from "../forms/Textarea";
import { usePrefersReducedMotion } from "@/design-system/hooks";
import { getMotionDurationMs } from "@/design-system/foundations";
import { decrementBlockingOverlayCount, incrementBlockingOverlayCount } from "@/design-system/utils/overlayStack";
import { useTelegramHaptics } from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { IconX } from "@/design-system/icons";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ModalActions {
  primary: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    tone?: "danger" | "default" | "warning" | "success";
    disabled?: boolean;
  };
  secondary?: { label: string; onClick: () => void };
}

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: "plain" | "confirm" | "danger";
  children: ReactNode;
  /** Structured action buttons. When provided, renders footer. */
  actions?: ModalActions;
  /** @deprecated Use actions. Custom footer slot for backward compat. */
  footer?: ReactNode;
  size?: "sm" | "md";
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** @deprecated No longer used. Drag handle removed from Modal. */
  swipeToDismiss?: boolean;
  disableDismiss?: boolean;
  showCloseButton?: boolean;
  /** @deprecated No longer used. Drag handle removed from Modal. */
  showHandle?: boolean;
  inline?: boolean;
  "data-testid"?: string;
}

function resolveComponentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "consumer-light" ? "light" : "dark";
}

export function Modal({
  isOpen: isOpenProp,
  onClose,
  title,
  subtitle: subtitleProp,
  children,
  actions,
  footer,
  variant = "plain",
  size = "md",
  className = "",
  closeOnBackdrop = true,
  closeOnEscape = true,
  disableDismiss = false,
  showCloseButton = true,
  inline = false,
  "data-testid": dataTestId,
}: ModalProps) {
  const open = isOpenProp ?? false;
  const sub = subtitleProp;

  const { t } = useI18n();
  const { selectionChanged } = useTelegramHaptics();
  const prefersReducedMotion = usePrefersReducedMotion();
  const exitDurationMs = getMotionDurationMs("enter", prefersReducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const didFocusRef = useRef(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timeout = window.setTimeout(() => setMounted(false), exitDurationMs);
    return () => window.clearTimeout(timeout);
  }, [exitDurationMs, open]);

  useEffect(() => {
    if (!mounted || inline) return;
    incrementBlockingOverlayCount();
    return () => decrementBlockingOverlayCount();
  }, [inline, mounted]);

  useEffect(() => {
    if (!inline && open && !wasOpenRef.current) selectionChanged();
    wasOpenRef.current = open;
  }, [inline, open, selectionChanged]);

  useEffect(() => {
    if (!open || inline) {
      didFocusRef.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const modal = el;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    if (!didFocusRef.current) {
      didFocusRef.current = true;
      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      requestAnimationFrame(() => (first ? first.focus() : modal.focus()));
    }

    const allowEscape = !disableDismiss && variant !== "danger" && closeOnEscape;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && allowEscape) {
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
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    modal.addEventListener("keydown", onKeyDown);
    return () => {
      modal.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open, onClose, closeOnEscape, disableDismiss, inline, variant]);

  const allowBackdropDismiss = !disableDismiss && variant !== "danger" && closeOnBackdrop;

  if (!mounted && !inline) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowBackdropDismiss || e.target !== e.currentTarget) return;
    onClose();
  };

  const hasFooter = actions != null || footer != null;
  const theme = resolveComponentTheme();

  const dialog = (
    <div
      ref={ref}
      className={cn(
        "modal",
        size === "sm" && "modal--sm",
        className,
        open && "modal-sheet-enter",
        !open && "modal-sheet-exit"
      )}
      data-theme={theme}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={sub ? descriptionId : undefined}
      data-testid={dataTestId}
    >
      <div className={cn("modal-header", variant === "danger" && "modal-header--danger")}>
        <div className="modal-header-text">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          {sub ? (
            <p id={descriptionId} className="modal-subtitle">
              {sub}
            </p>
          ) : null}
        </div>
        {showCloseButton ? (
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t("common.close_aria")}
          >
            <IconX />
          </button>
        ) : null}
      </div>
      <div className="modal-content">{children}</div>
      {hasFooter ? (
        <div className="modal-footer">
          {actions ? (
            <>
              {actions.secondary ? (
                <Button variant="secondary" onClick={actions.secondary.onClick}>
                  {actions.secondary.label}
                </Button>
              ) : null}
              <Button
                variant={
                  variant === "danger" || actions.primary.tone === "danger"
                    ? "danger"
                    : "primary"
                }
                tone={actions.primary.tone === "danger" ? undefined : actions.primary.tone}
                onClick={actions.primary.onClick}
                loading={actions.primary.loading}
                loadingText={actions.primary.label}
                disabled={actions.primary.disabled}
              >
                {actions.primary.label}
              </Button>
            </>
          ) : (
            footer
          )}
        </div>
      ) : null}
    </div>
  );

  if (inline) {
    if (!open) return null;
    return dialog;
  }

  const overlay = (
    <div
      className={cn(
        "modal-overlay",
        "modal-backdrop",
        open ? "modal-backdrop-enter" : "modal-backdrop-exit"
      )}
      role="presentation"
      aria-hidden="true"
      onClick={handleBackdropClick}
    >
      <div onClick={(e) => e.stopPropagation()}>{dialog}</div>
    </div>
  );

  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  tone?: "default" | "warning" | "danger";
  closeOnEscape?: boolean;
}

export function ConfirmModal({
  isOpen: open,
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

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      variant="confirm"
      closeOnBackdrop={false}
      closeOnEscape={!loading && closeOnEscape}
      disableDismiss={loading}
      showCloseButton={false}
      actions={{
        primary: {
          label: confirmLabel,
          onClick: handleConfirm,
          loading,
          tone: variant === "danger" ? "danger" : tone,
        },
        secondary: { label: cancelLabel, onClick: onClose },
      }}
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
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmTokenRequired?: boolean;
  confirmTokenLabel?: string;
  expectedConfirmValue?: string;
  onConfirm: (payload: ConfirmDangerPayload) => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ConfirmDanger({
  isOpen: open,
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

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      variant="danger"
      closeOnBackdrop={false}
      closeOnEscape={false}
      disableDismiss={loading}
      showCloseButton={false}
      actions={{
        primary: {
          label: confirmLabel,
          onClick: handleConfirm,
          loading,
          tone: "danger",
          disabled: !canConfirm,
        },
        secondary: { label: cancelLabel, onClick: onClose },
      }}
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
                expectedConfirmValue != null ? e.target.value.toUpperCase() : e.target.value
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
