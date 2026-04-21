import type { ReactNode } from "react";

export function PageFilterRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["page-filters", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function PageActionRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["page-actions", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function PageKeyValueList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={["page-kv", className].filter(Boolean).join(" ")}>{children}</dl>;
}

export function PageTableFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["page-table-footer", className].filter(Boolean).join(" ")}>{children}</div>;
}
