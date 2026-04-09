import type { ReactNode } from "react";
import { Info, Lightbulb, AlertTriangle, AlertCircle } from "lucide-react";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

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
    border: "border-l-[#0EA5E9]",
    bg: "rgba(14, 165, 233, 0.08)",
    iconColor: "#0EA5E9",
  },
  tip: {
    icon: <Lightbulb className="h-4 w-4 shrink-0" />,
    border: "border-l-[#22C55E]",
    bg: "rgba(34, 197, 94, 0.08)",
    iconColor: "#22C55E",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
    border: "border-l-[#F59E0B]",
    bg: "rgba(245, 158, 11, 0.08)",
    iconColor: "#F59E0B",
  },
  danger: {
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
    border: "border-l-[#EF4444]",
    bg: "rgba(239, 68, 68, 0.08)",
    iconColor: "#EF4444",
  },
};

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const { icon, border, bg, iconColor } = config[variant];
  return (
    <div
      className={`my-6 rounded-r-lg border-l-4 pl-4 pr-4 py-3 ${border}`}
      style={{ background: bg }}
    >
      <div className="flex gap-3">
        <span style={{ color: iconColor }} aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          {title && (
            <div className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]" role="heading" aria-level={2}>
              {title}
            </div>
          )}
          <div className="text-sm text-[var(--color-text-secondary)] [&>p]:m-0 [&>p+p]:mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
