import type { HTMLAttributes } from "react";
import { IconTelegramStar } from "../../../icons";

export interface StarsAmountProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  iconClassName?: string;
  valueClassName?: string;
}

export function StarsAmount({
  value,
  className = "",
  iconClassName = "",
  valueClassName = "",
  ...props
}: StarsAmountProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

  return (
    <span className={["stars-amount", className].filter(Boolean).join(" ")} {...props}>
      <IconTelegramStar className={["stars-amount-icon", iconClassName].filter(Boolean).join(" ")} />
      <span className={["stars-amount-value", valueClassName].filter(Boolean).join(" ")}>
        {safeValue}
      </span>
    </span>
  );
}
