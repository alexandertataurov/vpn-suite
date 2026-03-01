import type { ReactNode } from "react";
import { Card, PanelHeader, PanelBody } from "@/design-system";
import { Heading, Pagination } from "@/design-system";

export interface TableSectionProps {
  /** Optional title above the table */
  title?: ReactNode;
  /** Optional actions (buttons, filters) on the right of title */
  actions?: ReactNode;
  /** Table or custom content */
  children: ReactNode;
  /** Optional pagination; when set, renders Pagination below the table */
  pagination?: {
    offset: number;
    limit: number;
    total: number;
    onPage: (offset: number) => void;
  };
}

export function TableSection({
  title,
  actions,
  children,
  pagination,
}: TableSectionProps) {
  return (
    <Card as="section" variant="outline" className="ref-table-section" aria-label={typeof title === "string" ? title : undefined}>
      {title != null || actions != null ? (
        <PanelHeader title={title != null ? <Heading level={3} className="ref-table-section-title">{title}</Heading> : ""} actions={actions} />
      ) : null}
      <PanelBody>
        {children}
        {pagination != null && (
          <Pagination
            offset={pagination.offset}
            limit={pagination.limit}
            total={pagination.total}
            onPage={pagination.onPage}
          />
        )}
      </PanelBody>
    </Card>
  );
}
