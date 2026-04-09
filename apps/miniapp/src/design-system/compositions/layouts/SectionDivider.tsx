import type { HTMLAttributes, ReactNode } from "react";

export interface SectionDividerProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  count?: ReactNode;
}

/**
 * Content Library section divider: .shead with .shead-lbl, .shead-rule, optional .shead-count.
 */
export function SectionDivider({
  label,
  count,
  className = "",
  ...props
}: SectionDividerProps) {
  return (
    <div className={`shead ${className}`.trim()} {...props}>
      <span className="shead-lbl">{label}</span>
      <div className="shead-rule" aria-hidden />
      {count != null ? <div className="shead-count">{count}</div> : null}
    </div>
  );
}
