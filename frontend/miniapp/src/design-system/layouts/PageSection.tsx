import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "../primitives/Stack";
import { Body } from "../components/Typography";

export interface SectionHeaderRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

/** Doc-only section header row when section has no title (description/action only). */
export function SectionHeaderRow({
  title,
  description,
  action,
  className = "",
  ...props
}: SectionHeaderRowProps) {
  if (!title && !description && !action) return null;
  return (
    <div className={`shead ${className}`.trim()} {...props}>
      <span className="shead-label">{title ?? "\u00A0"}</span>
      <span className="shead-line" aria-hidden />
      {(action ?? description) ? (
        <span className="shead-note">{action ?? description}</span>
      ) : null}
    </div>
  );
}

export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

/** Section with design-system shead (label + line + note). Built from Stack + typography. */
export function PageSection({
  title,
  description,
  action,
  className = "",
  children,
  ...props
}: PageSectionProps) {
  const hasShead = title != null && title !== "";
  const hasMeta = description || action;
  return (
    <section className={className.trim() || undefined} {...props}>
      <Stack direction="vertical" gap="2">
        {hasShead ? (
          <>
            <div className="shead">
              <span className="shead-label">{title}</span>
              <span className="shead-line" aria-hidden />
              {action ? <span className="shead-note">{action}</span> : null}
            </div>
            {description ? (
              <div className="type-body-sm">
                {typeof description === "string" ? description : <Body as="span">{description}</Body>}
              </div>
            ) : null}
          </>
        ) : hasMeta ? (
          <SectionHeaderRow title={null} description={description} action={action} />
        ) : null}
        {children}
      </Stack>
    </section>
  );
}
