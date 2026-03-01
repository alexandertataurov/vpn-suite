import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../utils/cn";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Panel width. Default 400px. */
  width?: string | number;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  width = 400,
  children,
  className = "",
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const panel = el;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const w = width != null ? (typeof width === "number" ? `${width}px` : width) : undefined;

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className={cn("drawer-panel", className)}
        style={w != null ? { width: w } : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          {title != null ? <h2 id="drawer-title" className="drawer-title">{title}</h2> : null}
          <button
              type="button"
              className="drawer-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
