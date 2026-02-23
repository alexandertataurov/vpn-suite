type StatusState = "ok" | "degraded" | "down" | "unknown";

interface SubsystemStatusProps {
  name: string;
  status: string;
  title?: string;
}

function toState(s: string): StatusState {
  if (s === "ok" || s === "down") return s;
  if (s === "degraded") return "degraded";
  return "unknown";
}

export function SubsystemStatus({ name, status, title }: SubsystemStatusProps) {
  const state = toState(status);
  const degraded = state === "degraded" || state === "down";
  return (
    <div
      className={`operator-health-cell${degraded ? " operator-health-cell--degraded" : ""}`}
      title={title}
    >
      <div className="operator-health-label">{name}</div>
      <div className={`operator-health-value operator-health-value--${state}`}>
        {status.toUpperCase()}
      </div>
    </div>
  );
}
