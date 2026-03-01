import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/** Cell with ellipsis truncation + optional title tooltip */
export function CellText({
  children,
  title,
  mono,
  className,
}: {
  children?: ReactNode;
  title?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(mono && "table-cell-mono", className)} title={title}>
      {children}
    </span>
  );
}

/** Cell with right align + tabular numbers (for numeric data) */
export function CellNumber({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("table-cell-numeric", className)}>{children}</span>
  );
}

/** Actions column content container (right-aligned) */
export function CellActions({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("table-actions", className)}>{children}</div>;
}

/** Compound cell layout: avatar + stacked text */
export function CellCompound({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={["table-cell-compound", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CellAvatar({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return (
    <div className={["table-cell-avatar", className].filter(Boolean).join(" ")} aria-hidden title={title}>
      {children}
    </div>
  );
}

export function CellPrimary({ children, className }: { children?: ReactNode; className?: string }) {
  return <p className={["table-cell-primary", className].filter(Boolean).join(" ")}>{children}</p>;
}

export function CellMuted({ children, className }: { children?: ReactNode; className?: string }) {
  return <p className={["table-cell-muted", className].filter(Boolean).join(" ")}>{children}</p>;
}

export function CellSecondary({ children, className }: { children?: ReactNode; className?: string }) {
  return <span className={["table-cell-secondary", className].filter(Boolean).join(" ")}>{children}</span>;
}
