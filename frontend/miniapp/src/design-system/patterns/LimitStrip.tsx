import type { HTMLAttributes, ReactNode } from "react";

export interface LimitStripProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  message: string;
  action: ReactNode;
  icon?: ReactNode;
}

/** Compact horizontal strip for limit/upsell alerts. Icon + 2-line text + inline CTA (~52px). */
export function LimitStrip({
  title,
  message,
  action,
  icon,
  className = "",
  ...props
}: LimitStripProps) {
  return (
    <div className={`limit-strip ${className}`.trim()} role="alert" {...props}>
      <span className="limit-strip__icon" aria-hidden>
        {icon ?? null}
      </span>
      <div className="limit-strip__text">
        <span className="limit-strip__title">{title}</span>
        <span className="limit-strip__message">{message}</span>
      </div>
      <span className="limit-strip__action">{action}</span>
    </div>
  );
}
