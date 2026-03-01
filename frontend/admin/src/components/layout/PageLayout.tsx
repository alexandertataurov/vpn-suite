import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function PageLayout({ children, className = "", testId }: PageLayoutProps) {
  return (
    <div className={`ref-page-layout ${className}`.trim()} data-testid={testId}>
      {children}
    </div>
  );
}
