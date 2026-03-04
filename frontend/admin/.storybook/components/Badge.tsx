import { CheckCircle, FlaskConical, AlertCircle, Sparkles } from "lucide-react";

export type BadgeVariant = "stable" | "beta" | "deprecated" | "new";

const config: Record<
  BadgeVariant,
  { label: string; icon: React.ReactElement; className: string }
> = {
  stable: {
    label: "Stable",
    icon: <CheckCircle className="h-3 w-3" />,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  beta: {
    label: "Beta",
    icon: <FlaskConical className="h-3 w-3" />,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  deprecated: {
    label: "Deprecated",
    icon: <AlertCircle className="h-3 w-3" />,
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
  new: {
    label: "New",
    icon: <Sparkles className="h-3 w-3" />,
    className: "bg-[#0EA5E9]/15 text-[#38BDF8] border-[#0EA5E9]/30",
  },
};

export interface BadgeProps {
  variant?: BadgeVariant;
}

export function Badge({ variant = "stable" }: BadgeProps) {
  const { label, icon, className } = config[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
