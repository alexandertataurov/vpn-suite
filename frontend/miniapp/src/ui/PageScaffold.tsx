import type { HTMLAttributes, ReactNode } from "react";

export interface PageScaffoldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageScaffold({ className = "", children, ...props }: PageScaffoldProps) {
  return (
    <div className={`miniapp-page-scaffold ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
