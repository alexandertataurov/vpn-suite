import type { HTMLAttributes, ReactNode } from "react";
import { PageSection } from "./PageSection";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Section with optional title and action. Uses tokens only. */
export function Section({
  title,
  action,
  children,
  className = "",
  ...props
}: SectionProps) {
  return <PageSection title={title} action={action} className={className} {...props}>{children}</PageSection>;
}
