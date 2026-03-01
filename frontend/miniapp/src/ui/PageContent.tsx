import type { HTMLAttributes, ReactNode } from "react";
import { PageScaffold } from "./PageScaffold";

export interface PageContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Backward-compatible alias to the new page scaffold primitive. */
export function PageContent({ className = "", children, ...props }: PageContentProps) {
  return <PageScaffold className={className} {...props}>{children}</PageScaffold>;
}
