import { IconAlertTriangle, IconRotateCw } from "@/design-system/icons";
import { ActionBanner } from "../../patterns";

export type RenewalBannerVariant = "warning" | "danger" | "expiring" | "expired";

export interface RenewalBannerProps {
  variant: RenewalBannerVariant;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
  className?: string;
}

const VARIANT_TO_TONE: Record<RenewalBannerVariant, "warning" | "danger"> = {
  warning: "warning",
  danger: "danger",
  expiring: "warning",
  expired: "danger",
};

/** Renewal banner recipe. Uses ActionBanner pattern. */
export function RenewalBanner({
  variant,
  title,
  subtitle,
  badge,
  onClick,
  className,
}: RenewalBannerProps) {
  const tone = VARIANT_TO_TONE[variant];
  const Icon = tone === "warning" ? IconAlertTriangle : IconRotateCw;

  return (
    <ActionBanner
      icon={<Icon size={18} strokeWidth={2} />}
      title={title}
      subtitle={subtitle}
      badge={badge}
      onClick={onClick}
      tone={tone}
      className={className}
    />
  );
}
