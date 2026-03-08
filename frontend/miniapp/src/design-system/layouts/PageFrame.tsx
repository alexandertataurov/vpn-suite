import type { HTMLAttributes, ReactNode } from "react";
import { PageScaffold } from "./PageScaffold";
import { PageHeader } from "./PageHeader";
import { HeaderBell } from "./HeaderBell";

export interface PageFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children?: ReactNode;
}

/**
 * Canonical page shell for miniapp pages.
 * Keeps scaffold + header wiring consistent across loading/error/content states.
 * Notification bell is rendered inline with the page heading.
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
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={headerAction}
        trailingAction={<HeaderBell />}
      />
      {children}
    </PageScaffold>
  );
}
