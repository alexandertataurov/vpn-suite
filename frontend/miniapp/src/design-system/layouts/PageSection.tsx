import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "../primitives/Stack";
import { Body } from "../components/Typography";

export interface SectionHeaderRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  noteClassName?: string;
}

/** Doc-only section header row when section has no title (description/action only). */
export function SectionHeaderRow({
  title,
  description,
  action,
  noteClassName = "",
  className = "",
  ...props
}: SectionHeaderRowProps) {
  if (!title && !description && !action) return null;
  return (
    <div className={`shead ${className}`.trim()} {...props}>
      <span className="shead-lbl">{title ?? "\u00A0"}</span>
      <span className="shead-rule" aria-hidden />
      {(action ?? description) ? (
        <span className={["shead-note", noteClassName].filter(Boolean).join(" ")}>{action ?? description}</span>
      ) : null}
    </div>
  );
}

export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  noteClassName?: string;
}

/** Section with design-system shead (label + line + note). Built from Stack + typography. */
export function PageSection({
  title,
  description,
  action,
  headerClassName = "",
  descriptionClassName = "",
  contentClassName = "",
  noteClassName = "",
  className = "",
  children,
  ...props
}: PageSectionProps) {
  const hasShead = title != null && title !== "";
  const hasMeta = description || action;
  return (
    <section className={className.trim() || undefined} {...props}>
      <Stack direction="vertical" gap="2" className={contentClassName || undefined}>
        {hasShead ? (
          <>
            <div className={["shead", headerClassName].filter(Boolean).join(" ")}>
              <span className="shead-lbl">{title}</span>
              <span className="shead-rule" aria-hidden />
              {action ? <span className={["shead-note", noteClassName].filter(Boolean).join(" ")}>{action}</span> : null}
            </div>
            {description ? (
              <div className={["type-body-sm", descriptionClassName].filter(Boolean).join(" ")}>
                {typeof description === "string" ? description : <Body as="span">{description}</Body>}
              </div>
            ) : null}
          </>
        ) : hasMeta ? (
          <SectionHeaderRow
            title={null}
            description={description}
            action={action}
            className={headerClassName}
            noteClassName={noteClassName}
          />
        ) : null}
        {children}
      </Stack>
    </section>
  );
}
