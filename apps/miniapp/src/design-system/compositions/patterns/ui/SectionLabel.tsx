import type { HTMLAttributes } from "react";

export interface SectionLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
}

/** Section eyebrow label (e.g. "YOUR PLAN", "DEVICE MANAGEMENT"). */
export function SectionLabel({ label, className = "", ...props }: SectionLabelProps) {
  return (
    <div className={`section-label ${className}`.trim()} {...props}>
      {label}
    </div>
  );
}
