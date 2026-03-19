export type DeviceStatusVariant = "imported" | "pending" | "inactive";

const DEVICE_STATUS_LABEL: Record<DeviceStatusVariant, string> = {
  imported: "Imported",
  pending: "Pending",
  inactive: "Inactive",
};

export interface DeviceStatusChipProps {
  status: DeviceStatusVariant;
}

export function DeviceStatusChip({ status }: DeviceStatusChipProps) {
  return (
    <span className={`device-chip device-chip--${status}`}>
      <span className="device-chip-dot" aria-hidden />
      <span>{DEVICE_STATUS_LABEL[status]}</span>
    </span>
  );
}
