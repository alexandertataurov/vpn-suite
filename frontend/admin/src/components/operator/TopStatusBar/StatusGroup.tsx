import type { ReactNode } from "react";

interface StatusGroupProps {
  title?: string;
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
}

export function StatusGroup({ title, "aria-label": ariaLabel, className, children }: StatusGroupProps) {
  return (
    <div
      className={`operator-status-group${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={ariaLabel ?? title}
    >
      {children}
    </div>
  );
}
