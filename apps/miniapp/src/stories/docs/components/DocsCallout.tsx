import type { ReactNode } from "react";

export type DocsCalloutVariant = "info" | "tip" | "warning" | "danger" | "success";

export interface DocsCalloutProps {
  variant?: DocsCalloutVariant;
  title?: string;
  children: ReactNode;
}

const DOCS_CALLOUT_CLASS_BY_VARIANT: Record<DocsCalloutVariant, string> = {
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
    <aside className={DOCS_CALLOUT_CLASS_BY_VARIANT[variant]}>
      <div className="docs-callout__content">
        {title != null ? (
          <div className="docs-callout__title" role="heading" aria-level={2}>
            {title}
          </div>
        ) : null}
        <div className="docs-callout__body">{children}</div>
      </div>
    </aside>
  );
}
