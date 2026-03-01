import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface EntityChipProps {
  label: string;
  icon?: ReactNode;
  avatar?: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function EntityChip(p: EntityChipProps) {
  return (
    <span className={cn("ds-entity-chip", (p.icon ?? p.avatar) && "ds-entity-chip--with-icon", p.onRemove && "ds-entity-chip--removable", p.className)}>
      {p.avatar != null ? <span className="ds-entity-chip__avatar" aria-hidden>{p.avatar}</span> : p.icon != null ? <span className="ds-entity-chip__icon" aria-hidden>{p.icon}</span> : null}
      <span className="ds-entity-chip__label">{p.label}</span>
      {p.onRemove != null && <button type="button" className="ds-entity-chip__remove" onClick={p.onRemove} aria-label={`Remove ${p.label}`}>×</button>}
    </span>
  );
}

EntityChip.displayName = "EntityChip";
