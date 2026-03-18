import { IconMonitor } from "@/design-system/icons";
import { CalloutBlock } from "../../patterns";

export interface NoDeviceCalloutProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onAddDevice?: () => void;
  ctaIcon?: React.ReactNode;
  className?: string;
}

/** No-device callout recipe. Uses CalloutBlock pattern. */
export function NoDeviceCallout({
  title,
  subtitle,
  ctaLabel = "Add device",
  onCtaClick,
  onAddDevice,
  ctaIcon,
  className,
}: NoDeviceCalloutProps) {
  return (
    <CalloutBlock
      icon={<IconMonitor size={20} strokeWidth={2} />}
      title={title}
      subtitle={subtitle}
      ctaLabel={ctaLabel}
      onCtaClick={onAddDevice ?? onCtaClick}
      ctaIcon={ctaIcon}
      className={className}
      dataLayer="NoDeviceCallout"
    />
  );
}
