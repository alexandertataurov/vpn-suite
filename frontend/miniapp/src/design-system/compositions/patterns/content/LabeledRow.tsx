import type { HTMLAttributes, ReactNode } from "react";

export interface LabeledRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  children: ReactNode;
}

/**
 * Label + children row. Uses control-row classes from library.css.
 * Moved from LabeledControlRow recipe.
 */
export function LabeledRow({
  label,
  children,
  className = "",
  ...props
}: LabeledRowProps) {
  return (
    <div className={`control-row ${className}`.trim()} {...props}>
      <div className="control-row-label">{label}</div>
      {children}
    </div>
  );
}
