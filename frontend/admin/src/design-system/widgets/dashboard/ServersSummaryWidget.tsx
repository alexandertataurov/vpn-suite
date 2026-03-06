import { Widget } from "../../primitives/Widget";

export interface ServersSummaryWidgetData {
  totalServers: number;
  totalActivePeers: number;
  totalPeers: number;
  usedIps?: number | null;
  totalIps?: number | null;
}

interface ServersSummaryWidgetProps {
  data: ServersSummaryWidgetData;
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

function formatRatio(num: number | null | undefined, den: number | null | undefined): string {
  if (den == null || den === 0) return num != null ? String(num) : "—";
  return `${num ?? 0}/${den}`;
}

export function ServersSummaryWidget({
  data,
  href,
  title = "Servers",
  subtitle = "count · peers · IPs",
  className,
}: ServersSummaryWidgetProps) {
  const peerPct =
    data.totalPeers > 0
      ? Math.min(100, Math.round((data.totalActivePeers / data.totalPeers) * 1000) / 10)
      : undefined;
  const ipPct =
    data.totalIps != null && data.totalIps > 0 && data.usedIps != null
      ? Math.min(100, Math.round((data.usedIps / data.totalIps) * 1000) / 10)
      : undefined;

  const metrics = [
    { key: "Servers", value: String(data.totalServers) },
    {
      key: "Peers",
      value: formatRatio(data.totalActivePeers, data.totalPeers || undefined),
      percent: peerPct,
    },
    {
      key: "IPs",
      value: formatRatio(data.usedIps, data.totalIps),
      percent: ipPct,
    },
  ];

  return (
    <Widget
      title={title}
      subtitle={subtitle}
      href={href}
      variant="kpi"
      edge="teal"
      size="medium"
      className={className}
    >
      <div className="cmeters">
        {metrics.map((m) => {
          const pct = m.percent != null ? Math.min(100, Math.max(0, m.percent)) : undefined;
          const variant =
            pct == null ? "muted" : pct >= 90 ? "red" : pct >= 70 ? "amber" : "green";
          return (
            <div
              key={m.key}
              className="cm-row"
              style={pct != null ? { ["--cm-pct" as string]: pct } : undefined}
            >
              <div className="cm-head">
                <span className="cm-k">{m.key}</span>
                <span className={`cm-v cm-v--${variant}`}>{m.value}</span>
              </div>
              {pct != null && (
                <div className="cm-track">
                  <div className={`cm-fill cm-fill--${variant}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
