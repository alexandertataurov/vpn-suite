import type { ReactNode } from "react";

export interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

export function Toolbar({ children, className = "" }: ToolbarProps) {
  return (
    <div className={`ref-toolbar ${className}`.trim()} role="toolbar">
      {children}
    </div>
  );
}
