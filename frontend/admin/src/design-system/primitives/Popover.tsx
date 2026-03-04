import type { ReactNode } from "react";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  /**
   * Optional controlled open state; if omitted, CSS hover is used.
   */
  open?: boolean;
  className?: string;
}

export function Popover({ trigger, children, open, className = "" }: PopoverProps) {
  const hostClasses = ["popover-host", open ? "open" : null, className || null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={hostClasses}>
      {trigger}
      <div className="popover">{children}</div>
    </div>
  );
}

