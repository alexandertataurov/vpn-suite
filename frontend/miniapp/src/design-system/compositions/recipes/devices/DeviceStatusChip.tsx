import { useI18n } from "@/hooks";

export type DeviceStatusVariant = "imported" | "pending" | "inactive";

export interface DeviceStatusChipProps {
  status: DeviceStatusVariant;
}

export function DeviceStatusChip({ status }: DeviceStatusChipProps) {
  const { t } = useI18n();
  const label =
    status === "imported"
      ? t("devices.device_chip_imported")
      : status === "pending"
        ? t("devices.device_chip_pending")
        : t("devices.device_chip_inactive");
  return (
    <span className={`device-chip device-chip--${status}`}>
      <span className="device-chip-dot" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
