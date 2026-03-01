import { Select } from "@/design-system";

export interface TimeRangeOption {
  value: string;
  label: string;
}

export interface TimeRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  options: TimeRangeOption[];
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}

const DEFAULT_OPTIONS: TimeRangeOption[] = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "custom", label: "Custom" },
];

export function TimeRangePicker({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  "data-testid": dataTestId,
  "aria-label": ariaLabel = "Time range",
}: TimeRangePickerProps) {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    />
  );
}
