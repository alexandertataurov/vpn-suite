import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface EntityChipProps {
  label: string;
  icon?: ReactNode;
  avatar?: ReactNode;
  onRemove?: () => void;
  className?: string;
}

/**
 * Aerospace design system: compact tag with avatar/icon + label + optional remove.
 */
export function EntityChip({
  label,
  icon,
  avatar,
  onRemove,
  className = "",
}: EntityChipProps) {
  return (
    <span
      className={cn(
        "entity-chip",
        (icon != null || avatar != null) && "entity-chip--with-icon",
        onRemove != null && "entity-chip--removable",
        className
      )}
    >
      {avatar != null ? (
        <span className="entity-chip__avatar" aria-hidden>{avatar}</span>
      ) : icon != null ? (
        <span className="entity-chip__icon" aria-hidden>{icon}</span>
      ) : null}
      <span className="entity-chip__label">{label}</span>
      {onRemove != null && (
        <button
          type="button"
          className="entity-chip__remove"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
