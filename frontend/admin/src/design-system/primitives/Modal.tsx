import type { ReactNode } from "react";
import { useEffect, useId } from "react";

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

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

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
        className={modalClassNames}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

