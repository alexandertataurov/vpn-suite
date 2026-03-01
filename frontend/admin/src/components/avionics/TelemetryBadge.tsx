/** Telemetry-style status badge. */
export type TelemetryBadgeVariant = "link-established" | "no-signal";

export interface TelemetryBadgeProps {
  variant: TelemetryBadgeVariant;
}

const LABELS: Record<TelemetryBadgeVariant, string> = {
  "link-established": "LINK-ESTABLISHED",
  "no-signal": "NO-SIGNAL",
};

export function TelemetryBadge({ variant }: TelemetryBadgeProps) {
  const label = LABELS[variant];
  return (
    <span
      className={`telemetry-badge telemetry-badge--${variant}`}
      role="status"
      aria-label={label}
    >
      [ {label} ]
    </span>
  );
}
