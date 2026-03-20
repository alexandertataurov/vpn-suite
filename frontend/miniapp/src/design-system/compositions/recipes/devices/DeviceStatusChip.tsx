import { useI18n } from "@/hooks";
import { StatusChip } from "../../patterns";

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

  const variant =
    status === "imported"
      ? "active"
      : status === "pending"
        ? "pending"
        : "offline";

  return (
    <StatusChip variant={variant} label={label} />
  );
}
