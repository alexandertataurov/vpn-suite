import type { HTMLAttributes, ReactNode } from "react";
import { MissionModuleHead } from "../mission/Mission";
import { Button } from "../../components/buttons/Button";
import { StatusChip } from "../ui/StatusChip";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface SelectionCardProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  metadata?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  actionLabel?: ReactNode;
  onSelect?: () => void;
  className?: string;
}

export function SelectionCard({
  title,
  subtitle,
  badge,
  metadata,
  footer,
  selected = false,
  disabled = false,
  actionLabel,
  onSelect,
  className,
  ...props
}: SelectionCardProps) {
  return (
    <article
      className={joinClasses(
        "module-card",
        "selection-card",
        selected && "selection-card--selected",
        disabled && "selection-card--disabled",
        className
      )}
      {...props}
    >
      <MissionModuleHead
        label={title}
        chip={badge ?? <StatusChip variant={selected ? "active" : "info"}>{selected ? "Selected" : "Available"}</StatusChip>}
      />
      {subtitle ? <div className="selection-card-subtitle">{subtitle}</div> : null}
      {metadata ? <div className="selection-card-metadata">{metadata}</div> : null}
      {footer}
      {onSelect ? (
        <Button variant={selected ? "secondary" : "primary"} size="md" onClick={onSelect} disabled={disabled}>
          {actionLabel ?? (selected ? "Change selection" : "Select")}
        </Button>
      ) : null}
    </article>
  );
}
