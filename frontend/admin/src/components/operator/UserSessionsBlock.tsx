import type { OperatorUserSessions } from "@vpn-suite/shared/types";

interface UserSessionsBlockProps {
  data: OperatorUserSessions;
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function DeltaWithArrow({ delta }: { delta: number | null }) {
  if (delta == null) return <span>—</span>;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : null;
  return (
    <span>
      {arrow && <span className="operator-delta-arrow">{arrow}</span>}
      {fmt(delta)}
    </span>
  );
}

function MetricItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="operator-session-metric">
      <span className="operator-session-label">{label}</span>
      <span className="operator-session-value">{value}</span>
    </div>
  );
}

export function UserSessionsBlock({ data }: UserSessionsBlockProps) {
  return (
    <div className="operator-user-sessions operator-user-sessions--grid">
      <MetricItem label="Active" value={data.active_users.toLocaleString()} />
      <MetricItem label="1h Δ" value={<DeltaWithArrow delta={data.delta_1h ?? null} />} />
      <MetricItem label="Peak 24h" value={data.peak_concurrency_24h != null ? data.peak_concurrency_24h.toLocaleString() : "—"} />
      <MetricItem label="24h Δ" value={<DeltaWithArrow delta={data.delta_24h ?? null} />} />
      <MetricItem label="New/min" value={data.new_sessions_per_min != null ? data.new_sessions_per_min : "—"} />
    </div>
  );
}
