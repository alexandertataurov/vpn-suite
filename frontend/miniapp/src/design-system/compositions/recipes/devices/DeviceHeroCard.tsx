import { PlanCard, type PlanCardStatus, type PlanCardStat } from "../home/PlanCard";
import { useI18n } from "@/hooks";

export interface DeviceHeroCardProps {
  devicesUsed: number;
  devicesTotal: number | null;
  setupPending: number;
  trafficUsed: string;
}

export function DeviceHeroCard({
  devicesUsed,
  devicesTotal,
  setupPending,
  trafficUsed,
}: DeviceHeroCardProps) {
  const { t } = useI18n();
  const totalLabel = devicesTotal ?? "\u2014";
  const status: PlanCardStatus = setupPending > 0 ? "expiring" : "active";
  const statusLabel = setupPending > 0 ? t("devices.hero_status_pending", { count: setupPending }) : t("devices.hero_status_all_set");
  const stats: [PlanCardStat, PlanCardStat, PlanCardStat] = [
    {
      label: t("devices.hero_stat_capacity"),
      value: String(devicesUsed),
      dim: ` / ${totalLabel}`,
    },
    {
      label: t("devices.hero_stat_setup"),
      value: setupPending > 0 ? String(setupPending) : t("devices.hero_setup_done"),
      tone: setupPending > 0 ? "expiring" : "default",
    },
    {
      label: t("devices.hero_stat_traffic"),
      value: trafficUsed,
    },
  ];

  return (
    <PlanCard
      className="device-hero-card"
      eyebrow={t("devices.hero_eyebrow_management")}
      plan={`${devicesUsed} / ${totalLabel}`}
      planSub={t("devices.hero_sub_devices_active")}
      status={status}
      statusLabel={statusLabel}
      stats={stats}
    />
  );
}
