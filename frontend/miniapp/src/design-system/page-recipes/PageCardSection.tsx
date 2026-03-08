import type { HTMLAttributes, ReactNode } from "react";
import { PageSection } from "../layouts/PageSection";
import { MissionCard, type MissionTone } from "../patterns/MissionPrimitives";

export interface PageCardSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  sectionClassName?: string;
  cardClassName?: string;
  cardTone?: MissionTone;
  children: ReactNode;
}

export function PageCardSection({
  title,
  description,
  action,
  sectionClassName = "",
  cardClassName = "module-card",
  cardTone = "blue",
  className = "",
  children,
  ...props
}: PageCardSectionProps) {
  return (
    <PageSection
      title={title}
      description={description}
      action={action}
      className={[sectionClassName, className].filter(Boolean).join(" ")}
      {...props}
    >
      <MissionCard tone={cardTone} className={cardClassName}>{children}</MissionCard>
    </PageSection>
  );
}
