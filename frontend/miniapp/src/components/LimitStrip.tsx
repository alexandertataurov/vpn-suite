import type { HTMLAttributes, ReactNode } from "react";

export interface LimitStripProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  message: string;
  action: ReactNode;
  icon?: ReactNode;
  /** Use smaller padding/height in device lists. */
  variant?: "default" | "compact";
}

/** Compact horizontal strip for limit/upsell alerts. */
export function LimitStrip({
  title,
  message,
  action,
  icon,
  variant = "default",
  className = "",
  ...props
}: LimitStripProps) {
  const compact = variant === "compact";
  return (
    <div className={`limit-strip ${compact ? "limit-strip--compact" : ""} ${className}`.trim()} role="alert" {...props}>
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
