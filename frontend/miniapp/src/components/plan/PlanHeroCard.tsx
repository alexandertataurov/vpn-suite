import type { ReactNode } from "react";
import { ButtonRow, DataCell, DataGrid, MissionPrimaryButton, MissionProgressBar, MissionSecondaryLink, PageCardSection, PageHeaderBadge } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface PlanHeroCardProps {
  planName: string;
  planPeriod: string;
  price: ReactNode;
  expiryText: string;
  devicesLabel: string;
  expiryPercent: number;
  expiryFillClass: "ok" | "warn" | "crit";
  renewLabel: string;
  manageLabel?: string | null;
  onRenew: () => void;
}

function mapTone(fillClass: "ok" | "warn" | "crit"): "healthy" | "warning" | "danger" {
  if (fillClass === "crit") return "danger";
  if (fillClass === "warn") return "warning";
  return "healthy";
}

function mapCardTone(fillClass: "ok" | "warn" | "crit"): "green" | "amber" | "red" {
  if (fillClass === "crit") return "red";
  if (fillClass === "warn") return "amber";
  return "green";
}

function mapBadgeTone(fillClass: "ok" | "warn" | "crit"): "success" | "warning" | "danger" {
  if (fillClass === "crit") return "danger";
  if (fillClass === "warn") return "warning";
  return "success";
}

export function PlanHeroCard({
  planName,
  planPeriod,
  price,
  expiryText,
  devicesLabel,
  expiryPercent,
  expiryFillClass,
  renewLabel,
  manageLabel,
  onRenew,
}: PlanHeroCardProps) {
  const { t } = useI18n();

  return (
    <PageCardSection
      title={t("plan.current_plan_label")}
      description={planName}
      action={<PageHeaderBadge tone={mapBadgeTone(expiryFillClass)} label={planName} />}
      cardTone={mapCardTone(expiryFillClass)}
      cardClassName="module-card plan-hero-card stagger-1"
    >
      <DataGrid columns={2}>
        <DataCell label={t("plan.hero_plan_label")} value={`${planName} — ${planPeriod}`} cellType="plan" />
        <DataCell label={t("plan.hero_price_label")} value={price} valueTone="teal" />
        <DataCell label={t("plan.hero_valid_until_label")} value={expiryText} />
        <DataCell label={t("plan.hero_devices_label")} value={devicesLabel} />
      </DataGrid>
      <div className="plan-hero-expiry-bar">
        <MissionProgressBar
          percent={Math.round(expiryPercent)}
          tone={mapTone(expiryFillClass)}
          ariaLabel={t("plan.hero_expiry_progress_aria")}
        />
      </div>
      <ButtonRow>
        <MissionPrimaryButton onClick={onRenew}>{renewLabel}</MissionPrimaryButton>
        {manageLabel ? (
          <MissionSecondaryLink to="/devices" className="plan-hero-manage-link">
            {manageLabel}
          </MissionSecondaryLink>
        ) : null}
      </ButtonRow>
    </PageCardSection>
  );
}
