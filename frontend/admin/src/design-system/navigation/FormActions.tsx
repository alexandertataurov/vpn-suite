import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions(p: FormActionsProps) {
  return (
    <div className={cn("ds-form-actions", p.className)} role="group" aria-label="Form actions">
      {p.children}
    </div>
  );
}

FormActions.displayName = "FormActions";
