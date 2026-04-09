import type { ReactNode } from "react";

export type CalloutVariant = "info" | "tip" | "warning" | "danger" | "success";

export interface DocsCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const variantClass: Record<CalloutVariant, string> = {
  info: "docs-callout docs-callout--info",
  tip: "docs-callout docs-callout--tip",
  warning: "docs-callout docs-callout--warning",
  danger: "docs-callout docs-callout--danger",
  success: "docs-callout docs-callout--success",
};

export function DocsCallout({
  variant = "info",
  title,
  children,
}: DocsCalloutProps) {
  return (
    <div className={variantClass[variant]}>
      <div className="docs-callout__content">
        {title != null && (
          <div className="docs-callout__title" role="heading" aria-level={2}>
            {title}
          </div>
        )}
        <div className="docs-callout__body">{children}</div>
      </div>
    </div>
  );
}
