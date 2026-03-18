import { ToneBadge } from "../../patterns";

export type PageHeaderBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_MAP: Record<PageHeaderBadgeTone, import("../../patterns").ToneBadgeTone> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export interface PageHeaderBadgeProps {
  label: React.ReactNode;
  tone: PageHeaderBadgeTone;
  pulse?: boolean;
  className?: string;
}

/** Page header badge recipe. Uses ToneBadge pattern. */
export function PageHeaderBadge({ label, tone, pulse = false, className = "" }: PageHeaderBadgeProps) {
  return <ToneBadge label={label} tone={TONE_MAP[tone]} pulse={pulse} className={className} />;
}
