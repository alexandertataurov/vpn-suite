interface DashboardStatusBarProps {
  uptimeLabel?: string;
  buildLabel?: string;
  clockText?: string;
}

export function DashboardStatusBar({
  uptimeLabel = "14d 6h 22m",
  buildLabel = "v2.4.1",
  clockText,
}: DashboardStatusBarProps) {
  return (
    <div className="statusbar" aria-label="Quick links and system status">
      <div className="sb-ql-label">Quick links</div>
      <div className="sb-links">
        <button type="button" className="ql">
          Servers
        </button>
        <button type="button" className="ql">
          Telemetry
        </button>
        <button type="button" className="ql">
          Audit Log
        </button>
      </div>
      <div className="sb-right">
        <div className="sb-stat">
          Uptime <strong>{uptimeLabel}</strong>
        </div>
        <div className="sb-sep">·</div>
        <div className="sb-stat">
          Build <strong>{buildLabel}</strong>
        </div>
        <div className="sb-sep">·</div>
        <div className="sb-stat">{clockText}</div>
      </div>
    </div>
  );
}

