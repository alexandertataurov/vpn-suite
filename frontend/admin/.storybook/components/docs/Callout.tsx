import type { ReactNode } from "react";
import { Info, Lightbulb, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export type CalloutVariant = "info" | "tip" | "warning" | "danger" | "success";

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const config: Record<
  CalloutVariant,
  { icon: React.ReactElement; border: string; bg: string; iconColor: string }
> = {
  info: {
    icon: <Info className="h-4 w-4 shrink-0" />,
    border: "border-l-[var(--color-accent)]",
    bg: "bg-[var(--color-accent-dim)]",
    iconColor: "text-[var(--color-accent)]",
  },
  tip: {
    icon: <Lightbulb className="h-4 w-4 shrink-0" />,
    border: "border-l-[var(--color-nominal-bright)]",
    bg: "bg-[var(--color-nominal-dim)]",
    iconColor: "text-[var(--color-nominal-bright)]",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
    border: "border-l-[var(--color-warning-bright)]",
    bg: "bg-[var(--color-warning-dim)]",
    iconColor: "text-[var(--color-warning-bright)]",
  },
  danger: {
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
    border: "border-l-[var(--color-critical-bright)]",
    bg: "bg-[var(--color-critical-dim)]",
    iconColor: "text-[var(--color-critical-bright)]",
  },
  success: {
    icon: <CheckCircle className="h-4 w-4 shrink-0" />,
    border: "border-l-[var(--color-nominal-bright)]",
    bg: "bg-[var(--color-nominal-dim)]",
    iconColor: "text-[var(--color-nominal-bright)]",
  },
};

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const { icon, border, bg, iconColor } = config[variant];
  return (
    <div className={`my-6 rounded-r border-l-4 pl-4 pr-4 py-3 ${border} ${bg}`}>
      <div className="flex gap-3">
        <span className={iconColor} aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          {title != null && (
            <div className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]" role="heading" aria-level={2}>{title}</div>
          )}
          <div className="text-sm text-[var(--color-text-secondary)] [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
