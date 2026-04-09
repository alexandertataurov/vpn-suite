import type { SessionsWidgetData } from "../widgets.types";
import { Widget } from "../../primitives/Widget";
import { KpiValueUnit } from "../../typography";

type SessionsWidgetProps =
  | {
      data: SessionsWidgetData;
      href?: string;
      title?: string;
      subtitle?: string;
      className?: string;
    }
  | {
      data: SessionsWidgetData;
      href: string;
      title?: string;
      subtitle?: string;
      className?: string;
    };

export function SessionsWidget({ data, href, title, subtitle, className }: SessionsWidgetProps) {
  const { mode, value, deltaPercent, peers } = data;

  const showBodyShimmer = mode === "loading";

  let deltaChipLabel = "→ 0.0";
  if (!showBodyShimmer && typeof deltaPercent === "number") {
    const abs = Math.abs(deltaPercent);
    if (abs >= 0.05) {
      deltaChipLabel = deltaPercent > 0 ? `↑ ${abs.toFixed(1)}%` : `↓ −${abs.toFixed(1)}%`;
    }
  }

  const headerTitle = title ?? "Sessions";
  const headerSub = subtitle ?? "vs start of window";

  const statusTone = data.statusTone ?? "default";
  const statusLabel =
    data.statusLabel ??
    (mode === "idle"
      ? "No active sessions"
      : mode === "normal" && data.uptimeLabel
        ? `Uptime ${data.uptimeLabel}`
        : undefined);

  const hasStatus = Boolean(statusLabel);

  const body = showBodyShimmer ? (
    <>
      <div className="shimmer h40 shimmer-w50 shimmer-mt8" />
      <div className="shimmer h8 w60 shimmer-mt8" />
      <div className="shimmer h8 w80 shimmer-mt5" />
    </>
  ) : (
    <>
      <KpiValueUnit value={value} unit="peers" />

      <div className="chips">
        <span className="chip cn">{deltaChipLabel}</span>
        <span className="chip cb">
          <span className="cd live" />
          PEERS: {peers}
        </span>
      </div>

      {hasStatus && (
        <div className="type-meta widget-meta-push">
          {renderStatusContent(statusLabel!, statusTone)}
        </div>
      )}
    </>
  );

  return (
    <Widget
      title={headerTitle}
      subtitle={headerSub}
      href={showBodyShimmer ? undefined : href}
      variant="kpi"
      edge="blue"
      size="medium"
      className={className}
    >
      {body}
    </Widget>
  );
}

function renderStatusContent(label: string, tone: SessionsWidgetData["statusTone"]) {
  if (!tone || tone === "default") {
    return label;
  }
  const toneClass =
    tone === "good" ? "good" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : undefined;
  if (!toneClass) {
    return label;
  }
  return (
    <>
      <span className={toneClass}>{label}</span>
    </>
  );
}
