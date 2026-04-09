interface HomeHeroStatItem {
  label: string;
  value: string;
}

interface HomeHeroMetaItem {
  label: string;
  value: string;
  isStatus?: boolean;
  variant?: "active" | "pending" | "info" | "offline";
}

export interface HomeHeroSummaryProps {
  stats: readonly HomeHeroStatItem[];
  meta: readonly HomeHeroMetaItem[];
}

function inlineStatusClassName(variant: "active" | "pending" | "info" | "offline"): string {
  if (variant === "active") return "beta-home-inline-status beta-home-inline-status--active";
  if (variant === "pending") return "beta-home-inline-status beta-home-inline-status--pending";
  if (variant === "info") return "beta-home-inline-status beta-home-inline-status--info";
  return "beta-home-inline-status beta-home-inline-status--offline";
}

export function HomeHeroSummary({ stats, meta }: HomeHeroSummaryProps) {
  return (
    <>
      <div className="beta-home-status-band" role="list" aria-label="Access summary">
        {stats.map((item) => (
          <div key={item.label} className="beta-home-status-band-item" role="listitem">
            <span className="beta-home-status-label">{item.label}</span>
            <span className="beta-home-status-value">{item.value !== "In progress" ? item.value : "Ready"}</span>
          </div>
        ))}
      </div>

      <div className="beta-home-status-meta-strip" role="list" aria-label="Setup details">
        {meta.map((item) => (
          <div key={item.label} className="beta-home-status-meta-item" role="listitem">
            <span className="beta-home-status-label">{item.label}</span>
            <span className="beta-home-status-meta-value">
              {item.isStatus && item.variant ? (
                <span className={inlineStatusClassName(item.variant)}>
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
