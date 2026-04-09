import { CompactSummaryCard } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
import "./ConnectStatusCards.css";

export interface ConnectStatusSummaryCardProps {
  title: string;
  subtitle: string;
  edge: "e-r" | "e-a" | "e-g" | "e-b";
  latestDeviceName: string;
}

function cardTone(edge: ConnectStatusSummaryCardProps["edge"]): "red" | "amber" | "green" | "blue" {
  if (edge === "e-r") return "red";
  if (edge === "e-a") return "amber";
  if (edge === "e-g") return "green";
  return "blue";
}

export function ConnectStatusSummaryCard({
  title,
  subtitle,
  edge,
  latestDeviceName,
}: ConnectStatusSummaryCardProps) {
  const { t } = useI18n();

  return (
    <CompactSummaryCard
      eyebrow={t("connect_status.header_title")}
      title={title}
      subtitle={subtitle}
      tone={cardTone(edge)}
      stats={[{ label: t("connect_status.device_key"), value: latestDeviceName }]}
      className="connect-status-summary-card"
    />
  );
}
