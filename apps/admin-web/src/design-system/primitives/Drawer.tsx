import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true"
  );
}

type DrawerPlacement = "left" | "right";
type DrawerSize = "sm" | "md" | "lg";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: DrawerPlacement;
  size?: DrawerSize;
  "data-testid"?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  placement = "right",
  size = "md",
  "data-testid": testId,
}: DrawerProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const placementClass = placement === "left" ? "drawer-left" : null;
  const sizeClass = size !== "md" ? `drawer-${size}` : null;

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

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="drawer-backdrop open"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={["drawer", placementClass, sizeClass].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <div className="drawer-header">
          <h2 id={titleId} className="drawer-title">
            {title}
          </h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}
