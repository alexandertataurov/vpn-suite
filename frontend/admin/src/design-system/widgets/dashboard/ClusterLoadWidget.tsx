import type { ClusterLoadWidgetData } from "../widgets.types";
import { Widget } from "../../primitives/Widget";

interface ClusterLoadWidgetProps {
  data: ClusterLoadWidgetData;
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

type CmVariant = "green" | "amber" | "red" | "muted";

function cmVariant(percent: number | undefined): CmVariant {
  if (percent == null) return "muted";
  if (percent < 60) return "green";
  if (percent <= 85) return "amber";
  return "red";
}

export function ClusterLoadWidget({ data, href, title, subtitle, className }: ClusterLoadWidgetProps) {
  const headerTitle = title ?? "Cluster Load";
  const headerSub = subtitle ?? "CPU/RAM (avg)";

  return (
    <Widget
      title={headerTitle}
      subtitle={headerSub}
      href={href}
      variant="kpi"
      edge="teal"
      size="medium"
      className={className}
    >
      <div className="cmeters">
        {data.metrics.map((metric) => {
          const pct = Math.min(100, Math.max(0, metric.percent ?? 0));
          const variant = cmVariant(metric.percent);
          return (
            <div key={metric.key} className="cm-row" style={{ ["--cm-pct" as string]: pct }}>
              <div className="cm-head">
                <span className="cm-k">{metric.key}</span>
                <span className={`cm-v cm-v--${variant}`}>{metric.value}</span>
              </div>
              <div className="cm-track">
                <div className={`cm-fill cm-fill--${variant}`} />
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
