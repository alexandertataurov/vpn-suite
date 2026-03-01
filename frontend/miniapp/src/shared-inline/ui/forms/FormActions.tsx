import type { ReactNode } from "react";

export interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Design system: save/cancel button row, always bottom-right aligned.
 * Use at form bottom for primary/secondary actions.
 */
export function FormActions({ children, className = "" }: FormActionsProps) {
  return (
    <div className={`form-actions ${className}`.trim()} role="group" aria-label="Form actions">
      {children}
    </div>
  );
}
