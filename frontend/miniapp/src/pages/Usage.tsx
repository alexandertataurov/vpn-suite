import { Panel, Skeleton, InlineAlert } from "@vpn-suite/shared/ui";
import { getWebappToken } from "../api/client";
import { useUsage } from "../hooks/useUsage";
import { SessionMissing } from "../components/SessionMissing";
import { FallbackScreen } from "../components/FallbackScreen";
import { useTrackScreen } from "../hooks/useTrackScreen";

export function UsagePage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useUsage(hasToken, "7d");

  useTrackScreen("usage", null);

  if (isLoading || (error && isFetching)) {
    return (
      <div className="page-content">
        <Skeleton height={32} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!hasToken) {
    return <SessionMissing />;
  }

  if (error) {
    return (
      <FallbackScreen
        title="Could not load usage"
        message="We could not load your recent traffic. Tap Try again to reload, or reopen the app from the Telegram bot if it keeps failing."
        onRetry={() => refetch()}
      />
    );
  }

  const totalBytesIn = data?.points.reduce((acc, p) => acc + p.bytes_in, 0) ?? 0;
  const totalBytesOut = data?.points.reduce((acc, p) => acc + p.bytes_out, 0) ?? 0;
  const sessions = data?.sessions ?? 0;
  const series = data?.points ?? [];

  const hasSeries = series.length > 0;
  const maxValue = hasSeries
    ? Math.max(
        ...series.map((p) => {
          const value = p.bytes_in + p.bytes_out;
          return value > 0 ? value : 0;
        }),
      )
    : 0;

  const normalizedPoints = hasSeries ? series : [{ bytes_in: 0, bytes_out: 0 }];
  const linePath = normalizedPoints
    .map((p, index) => {
      const value = p.bytes_in + p.bytes_out;
      const safeMax = maxValue || 1;
      const x =
        normalizedPoints.length === 1
          ? 50
          : (index / (normalizedPoints.length - 1)) * 100;
      const y = 90 - (value / safeMax) * 70;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPath = hasSeries
    ? `${linePath} L 100 100 L 0 100 Z`
    : "M 0 90 L 100 90 L 100 100 L 0 100 Z";

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Usage</h1>
          <p className="miniapp-page-subtitle">Traffic and sessions for the last 7 days.</p>
        </div>
      </div>

      <Panel className="card usage-card">
        <div className="usage-card-header">
          <p className="text-muted fs-sm mb-xxs">Summary (7 days)</p>
          <p className="fs-xs text-muted mb-0">
            Traffic over time · soft glass chart
          </p>
        </div>
        <div className="usage-chart">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="usage-chart-svg"
            aria-hidden={!hasSeries}
          >
            <defs>
              <linearGradient
                id="usageArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="color-mix(in oklab, var(--color-primary) 60%, transparent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={areaPath}
              className="usage-chart-area"
            />
            <path
              d={linePath}
              className="usage-chart-line"
            />
          </svg>
        </div>
        <div className="usage-metrics">
          <div className="usage-metric">
            <p className="usage-metric-label">Sessions</p>
            <p className="usage-metric-value">{sessions}</p>
          </div>
          <div className="usage-metric">
            <p className="usage-metric-label">Downloaded</p>
            <p className="usage-metric-value">
              {(totalBytesIn / (1024 * 1024)).toFixed(1)} MiB
            </p>
          </div>
          <div className="usage-metric">
            <p className="usage-metric-label">Uploaded</p>
            <p className="usage-metric-value">
              {(totalBytesOut / (1024 * 1024)).toFixed(1)} MiB
            </p>
          </div>
        </div>
        {!data?.points.length && (
          <InlineAlert
            variant="info"
            title="No usage data yet"
            message="Usage details will appear here after you start using the VPN."
            className="mt-md"
          />
        )}
      </Panel>
    </div>
  );
}

