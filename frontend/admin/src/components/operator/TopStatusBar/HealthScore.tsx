interface HealthScoreProps {
  value: number;
  breakdown?: string;
  live?: boolean;
  stream?: boolean;
}

export function HealthScore({ value, breakdown, live, stream }: HealthScoreProps) {
  return (
    <div
      className="operator-health-score operator-health-cell"
      title={breakdown ?? `Composite health score (0–100)`}
    >
      <div className="operator-health-label">Score</div>
      <div className="operator-health-value">
        {live && (
          <span
            className={`operator-live-dot${stream ? " operator-live-dot--stream" : ""}`}
            title="Live"
            aria-hidden
          />
        )}
        {value}
      </div>
    </div>
  );
}
