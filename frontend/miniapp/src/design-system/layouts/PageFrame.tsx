import type { HTMLAttributes, ReactNode } from "react";
import { PageScaffold } from "./PageScaffold";
import { PageHeader } from "./PageHeader";

export interface PageFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children?: ReactNode;
}

/**
 * Canonical page shell for miniapp pages.
 * Keeps scaffold + header wiring consistent across loading/error/content states.
 */
export function PageFrame({
  title,
  subtitle,
  headerAction,
  className = "",
  children,
  ...props
}: PageFrameProps) {
  return (
    <PageScaffold className={className} {...props}>
      <PageHeader title={title} subtitle={subtitle} action={headerAction} />
      {children}
    </PageScaffold>
  );
}
