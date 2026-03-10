import type { HTMLAttributes, ReactNode } from "react";

export interface LabeledControlRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  children: ReactNode;
}

export function LabeledControlRow({
  label,
  children,
  className = "",
  ...props
}: LabeledControlRowProps) {
  return (
    <div className={`control-row ${className}`.trim()} {...props}>
      <div className="control-row-label">{label}</div>
      {children}
    </div>
  );
}
