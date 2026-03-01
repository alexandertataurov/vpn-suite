import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: string | number;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer(p: DrawerProps) {
  const { open, onClose, title, width = 480, children, footer, className } = p;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    if (!panel) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const f = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } } else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const w = typeof width === "number" ? `${width}px` : width;

  return (
    <div className="ds-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby={title ? "ds-drawer-title" : undefined} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={cn("ds-drawer-panel", className)} style={{ width: w }} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="ds-drawer-header">
          {title != null && <h2 id="ds-drawer-title" className="ds-drawer-title">{title}</h2>}
          <button type="button" className="ds-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ds-drawer-body">{children}</div>
        {footer != null && <div className="ds-drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}

Drawer.displayName = "Drawer";
