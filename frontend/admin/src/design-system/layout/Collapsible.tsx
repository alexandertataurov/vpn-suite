import { useState, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { IconChevronDown } from "@/design-system/icons";

export interface CollapsibleProps {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Collapsible(props: CollapsibleProps) {
  const { trigger, open: controlled, onOpenChange, children, className } = props;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlled !== undefined;
  const open = isControlled ? controlled : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  return (
    <div className={cn("ds-collapsible", className)}>
      <button type="button" className="ds-collapsible__trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="ds-collapsible__icon" style={{ transform: open ? undefined : "rotate(-90deg)" }}>
          <IconChevronDown size={14} strokeWidth={1.5} />
        </span>
        {trigger}
      </button>
      {open && <div className="ds-collapsible__content">{children}</div>}
    </div>
  );
}

Collapsible.displayName = "Collapsible";
