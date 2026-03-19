import { PlanCard, type PlanCardStatus, type PlanCardStat } from "../home/PlanCard";

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
  const totalLabel = devicesTotal ?? "\u2014";
  const status: PlanCardStatus = setupPending > 0 ? "expiring" : "active";
  const statusLabel = setupPending > 0 ? `${setupPending} pending` : "All set";
  const stats: [PlanCardStat, PlanCardStat, PlanCardStat] = [
    {
      label: "Capacity",
      value: String(devicesUsed),
      dim: ` / ${totalLabel}`,
    },
    {
      label: "Setup",
      value: setupPending > 0 ? `${setupPending} pending` : "Done",
      tone: setupPending > 0 ? "expiring" : "default",
    },
    {
      label: "Traffic",
      value: trafficUsed,
    },
  ];

  return (
    <PlanCard
      className="device-hero-card"
      eyebrow="Device Management"
      plan={`${devicesUsed} / ${totalLabel}`}
      planSub="devices active"
      status={status}
      statusLabel={statusLabel}
      stats={stats}
    />
  );
}
