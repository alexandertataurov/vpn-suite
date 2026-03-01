import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface SectionLabelProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

export function SectionLabel({ children, id, className }: SectionLabelProps) {
  return (
    <h2 id={id} className={cn("ds-section-label", className)}>
      {children}
    </h2>
  );
}

SectionLabel.displayName = "SectionLabel";
