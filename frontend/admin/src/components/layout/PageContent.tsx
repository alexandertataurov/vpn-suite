import type { ReactNode } from "react";
import { PageContainer } from "@/design-system";

export interface PageContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Design system: scrollable content area.
 * Padding: p-6 (desktop), p-4 (mobile). Max width: max-w-7xl (1280px).
 */
export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <PageContainer className={className.trim()} data-page-content>
      {children}
    </PageContainer>
  );
}
