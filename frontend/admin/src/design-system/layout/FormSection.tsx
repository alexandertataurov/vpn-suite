import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { SectionLabel } from "./SectionLabel";

export interface FormSectionProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormSection({ label, children, className }: FormSectionProps) {
  return (
    <section className={cn("ds-form-section", className)}>
      <SectionLabel>{label}</SectionLabel>
      <div className="ds-form-section__fields">{children}</div>
    </section>
  );
}

FormSection.displayName = "FormSection";
