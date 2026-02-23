type MetricState = "ok" | "degraded" | "down" | "";

interface MetricCellProps {
  label: string;
  value: string;
  state?: MetricState;
  degraded?: boolean;
  title?: string;
}

export function MetricCell({ label, value, state = "", degraded, title }: MetricCellProps) {
  return (
    <div
      className={`operator-health-cell${degraded ? " operator-health-cell--degraded" : ""}`}
      title={title}
    >
      <div className="operator-health-label">{label}</div>
      <div className={`operator-health-value${state ? ` operator-health-value--${state}` : ""}`}>
        {value}
      </div>
    </div>
  );
}
