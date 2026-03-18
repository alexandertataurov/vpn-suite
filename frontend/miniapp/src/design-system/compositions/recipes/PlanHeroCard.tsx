/** Plan status for hero badge per amnezia spec §4.3 */
export type PlanHeroStatus = "active" | "expiring" | "expired";

export interface PlanHeroStat {
  label: string;
  value: string;
  /** Dim fraction e.g. " / 5" — uses --text3 */
  dim?: string;
  /** When true, value uses --amber (expiring) or --red (expired) */
  tone?: "default" | "expiring" | "expired";
}

export interface PlanHeroCardProps {
  eyebrow: string;
  planName: string;
  subtitle: string;
  status: PlanHeroStatus;
  stats: [PlanHeroStat, PlanHeroStat, PlanHeroStat];
  className?: string;
}

export function PlanHeroCard({
  eyebrow,
  planName,
  subtitle,
  status,
  stats,
  className,
}: PlanHeroCardProps) {
  const cardClass = ["plan-hero-card", "hero-card", className].filter(Boolean).join(" ");
  const badgeClass = [
    "plan-hero-badge",
    `plan-hero-badge--${status}`,
  ].join(" ");

  const badgeLabel =
    status === "active"
      ? "Active"
      : status === "expiring"
        ? "Expiring"
        : "Expired";

  return (
    <div className={cardClass} data-layer="PlanHeroCard">
      <div className="plan-hero-body">
        <div className="plan-hero-head">
          <div className="plan-hero-meta">
            <span className="plan-hero-eyebrow">{eyebrow}</span>
            <span className="plan-hero-name">{planName}</span>
            <span className="plan-hero-subtitle">{subtitle}</span>
          </div>
          <span className={badgeClass} aria-label={`Plan status: ${badgeLabel}`}>
            <span className="plan-hero-badge-dot" aria-hidden />
            {badgeLabel}
          </span>
        </div>
      </div>
      <div className="plan-hero-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="plan-hero-stat">
            <span className="plan-hero-stat-label">{stat.label}</span>
            <span
              className={
                stat.tone === "expiring"
                  ? "plan-hero-stat-value plan-hero-stat-value--expiring"
                  : stat.tone === "expired"
                    ? "plan-hero-stat-value plan-hero-stat-value--expired"
                    : "plan-hero-stat-value"
              }
            >
              {stat.value}
              {stat.dim ? <span className="plan-hero-stat-dim">{stat.dim}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
