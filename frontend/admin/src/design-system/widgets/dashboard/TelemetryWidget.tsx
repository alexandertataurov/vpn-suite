import type {
  FreshnessState,
  SparkPoint,
  TelemetryWidgetData,
} from "../widgets.types";
import { Widget } from "../../primitives/Widget";

interface TelemetryWidgetProps {
  data: TelemetryWidgetData;
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TelemetryWidget({ data, href, title, subtitle, className }: TelemetryWidgetProps) {
  const { state, lastSampleLabel, intervalLabel, series } = data;
  const headerTitle = title ?? "Telemetry";
  const headerSub =
    subtitle ?? (state === "live" ? "freshness · high-freq" : "freshness");

  const stateWordClass =
    state === "fresh" || state === "live"
      ? "fresh"
      : state === "stale"
        ? "stale"
        : "dead";

  const stateLabel = state === "live" ? "live" : state;

  return (
    <Widget
      title={headerTitle}
      subtitle={headerSub}
      href={href}
      variant="kpi"
      edge="green"
      size="medium"
      className={className}
    >
      <div className={cx("state-word", stateWordClass)}>
        <span className="dot-lg" />
        {stateLabel}
      </div>

      <div className="chips">
        <span className="chip cg">
          {intervalLabel ?? `LAST SAMPLE: ${lastSampleLabel}`}
        </span>
      </div>

      <div className="spark" role="img" aria-label={`${headerTitle} value over time`}>
        <TelemetrySparkline state={state} points={series} />
      </div>
    </Widget>
  );
}

interface TelemetrySparklineProps {
  state: FreshnessState;
  points: SparkPoint[];
}

function TelemetrySparkline({ state, points }: TelemetrySparklineProps) {
  if (!points.length) {
    return null;
  }

  const viewBoxWidth = 228;
  const viewBoxHeight = 36;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const toPath = (p: SparkPoint) => {
    const x = ((p.x - minX) / spanX) * viewBoxWidth;
    const y = viewBoxHeight - ((p.y - minY) / spanY) * (viewBoxHeight - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const d = `M${points.map(toPath).join(" L")}`;

  const strokeDasharray =
    state === "stale" || state === "dead" ? "4 3" : undefined;

  const strokeVar =
    state === "fresh"
      ? "var(--green)"
      : state === "stale"
        ? "var(--amber)"
        : state === "dead"
          ? "var(--red)"
          : "var(--cyan)";

  const gradientId =
    state === "fresh"
      ? "spark-green"
      : state === "stale"
        ? "spark-amber"
        : state === "dead"
          ? "spark-red"
          : "spark-cyan";

  return (
    <svg
      width="100%"
      height="36"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="none"
      className="telemetry-sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeVar} stopOpacity={0.35} />
          <stop offset="100%" stopColor={strokeVar} stopOpacity={0} />
        </linearGradient>
      </defs>
      {state === "dead" ? (
        <>
          <line
            x1="0"
            y1={viewBoxHeight - 8}
            x2={viewBoxWidth * 0.7}
            y2={viewBoxHeight - 14}
            stroke={strokeVar}
            strokeWidth={1.5}
            strokeDasharray="3 4"
            opacity={0.5}
          />
          <line
            x1={viewBoxWidth * 0.7}
            y1={viewBoxHeight - 14}
            x2={viewBoxWidth}
            y2={viewBoxHeight}
            stroke={strokeVar}
            strokeWidth={1}
            strokeDasharray="2 5"
            opacity={0.3}
          />
          <circle
            cx={viewBoxWidth * 0.7}
            cy={viewBoxHeight - 14}
            r={3}
            fill={strokeVar}
            opacity={0.8}
          />
        </>
      ) : (
        <>
          <path
            d={d}
            fill="none"
            stroke={strokeVar}
            strokeWidth={1.5}
            strokeDasharray={strokeDasharray}
            opacity={state === "stale" ? 0.8 : 0.9}
          />
          <path
            d={`${d} L ${viewBoxWidth} ${viewBoxHeight} L 0 ${viewBoxHeight} Z`}
            fill={`url(#${gradientId})`}
          />
        </>
      )}
    </svg>
  );
}
