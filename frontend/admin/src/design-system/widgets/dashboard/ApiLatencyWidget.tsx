import type { LatencyWidgetData } from "../widgets.types";
import { Widget } from "../../primitives/Widget";
import { KpiValueUnit } from "../../typography";

interface ApiLatencyWidgetProps {
  data: LatencyWidgetData;
  href?: string;
  title?: string;
  subtitle?: string;
  showDistribution?: boolean;
  className?: string;
}

export function ApiLatencyWidget({
  data,
  href,
  title,
  subtitle,
  showDistribution = false,
  className,
}: ApiLatencyWidgetProps) {
  const headerTitle = title ?? "API Latency";
  const headerSub = subtitle ?? "p95 · vs start of window";

  const trendLabel =
    data.trendDeltaMs === 0
      ? "± 0 MS"
      : `${data.trendDirection === "down" ? "↓" : "↑"} ${Math.abs(data.trendDeltaMs).toFixed(0)} MS`;

  return (
    <Widget
      title={headerTitle}
      subtitle={headerSub}
      href={href}
      variant="kpi"
      edge="violet"
      headerRight={<span className="chip cn">{trendLabel}</span>}
      size="medium"
      className={className}
    >
      <KpiValueUnit value={formatLatencyValue(data.p95Ms)} unit="ms" />

      {showDistribution && (data.p50Ms != null || data.p99Ms != null) && (
        <div className="chips">
          {data.p50Ms != null && (
            <span className="chip cn">p50: {formatLatencyValue(data.p50Ms)} ms</span>
          )}
          <span className="chip cn">p95: {formatLatencyValue(data.p95Ms)} ms</span>
          {data.p99Ms != null && (
            <span className="chip cn">p99: {formatLatencyValue(data.p99Ms)} ms</span>
          )}
        </div>
      )}

      <div className="chips">
        <span className="chip cn">
          Error rate: {data.errorRate.toFixed(1)}%
        </span>
      </div>
    </Widget>
  );
}

function formatLatencyValue(ms: number) {
  if (ms >= 1000) {
    return (ms / 1000).toFixed(1).replace(/\.0$/, "");
  }
  return ms.toFixed(0);
}
