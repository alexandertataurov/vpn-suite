import { DataCell, DataGrid, PageCardSection, PageHeaderBadge } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface ConnectStatusSummaryCardProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  edge: "e-r" | "e-a" | "e-g" | "e-b";
  latestDeviceName: string;
}

function badgeTone(edge: ConnectStatusSummaryCardProps["edge"]): "danger" | "warning" | "success" | "info" {
  if (edge === "e-r") return "danger";
  if (edge === "e-a") return "warning";
  if (edge === "e-g") return "success";
  return "info";
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
  eyebrow,
  edge,
  latestDeviceName,
}: ConnectStatusSummaryCardProps) {
  const { t } = useI18n();

  return (
    <PageCardSection
      title={title}
      description={subtitle}
      action={<PageHeaderBadge tone={badgeTone(edge)} label={eyebrow} />}
      cardTone={cardTone(edge)}
    >
      <DataGrid columns={1} layout="1xcol">
        <DataCell label={t("connect_status.device_key")} value={latestDeviceName} />
      </DataGrid>
    </PageCardSection>
  );
}
