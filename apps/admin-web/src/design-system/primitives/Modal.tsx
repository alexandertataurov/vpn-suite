import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true"
  );
}

type ModalSize = "sm" | "md" | "lg";
type ModalVariant = "default" | "danger";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  footer?: ReactNode;
  dismissOnBackdropClick?: boolean;
  "data-testid"?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  variant = "default",
  footer,
  dismissOnBackdropClick = true,
  "data-testid": testId,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      if (previousActiveRef.current?.focus) {
        previousActiveRef.current.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      const focusable = getFocusable(dialogRef.current);
      const first = focusable[0];
      if (first) {
        first.focus();
      } else {
        dialogRef.current.focus();
      }
    }
  }, [open]);

  if (!open) return null;

  const modalClassNames = [
    "modal",
    size === "sm" ? "modal-sm" : null,
    size === "lg" ? "modal-lg" : null,
    variant === "danger" ? "modal-danger" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const handleBackdropClick = () => {
    if (dismissOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop open"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={modalClassNames}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Back">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

