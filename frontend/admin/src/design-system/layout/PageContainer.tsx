import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageContainer({ className = "", children, ...props }: PageContainerProps) {
  return (
    <div className={cn("ds-page-container", className)} {...props}>
      {children}
    </div>
  );
}
