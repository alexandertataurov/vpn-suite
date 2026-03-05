import type { ReactNode } from "react";
import { EmptyState as BaseEmptyState } from "../../ui";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <BaseEmptyState
      title={title}
      description={description}
      icon={icon}
      className="ds-card"
    />
  );
}
