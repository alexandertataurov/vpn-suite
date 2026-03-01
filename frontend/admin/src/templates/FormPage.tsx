import type { ReactNode } from "react";
import type { LucideIcon } from "@/design-system/icons";
import { CommandBar, type BreadcrumbItem, PageLayout } from "@/components";

export interface FormPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  breadcrumbItems?: BreadcrumbItem[];
  backTo?: string;
  backLabel?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  formActions?: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Aerospace form page template: CommandBar → FormSections → FormActions (sticky).
 */
export function FormPage({
  title,
  breadcrumbItems,
  backTo,
  backLabel,
  description,
  icon,
  children,
  formActions,
  className = "",
  testId,
  ...rest
}: FormPageProps) {
  const resolvedTestId =
    testId ?? (rest as { "data-testid"?: string })["data-testid"];
  return (
    <PageLayout className={className} testId={resolvedTestId}>
      <div className="form-page template-page" {...rest}>
        <CommandBar
          title={title}
          breadcrumbItems={breadcrumbItems}
          backTo={backTo}
          backLabel={backLabel}
          description={description}
          icon={icon}
        />
        <div className="form-page__content">
          {children}
        </div>
        {formActions != null && (
          <div className="form-page__actions">
            {formActions}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
