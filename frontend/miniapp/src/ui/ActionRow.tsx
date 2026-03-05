import type { HTMLAttributes, ReactNode } from "react";

export interface ActionRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export function ActionRow({ className = "", children, fullWidth = false, ...props }: ActionRowProps) {
  return (
    <div
      className={`action-row ${fullWidth ? "action-row--full" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
