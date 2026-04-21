import { Link } from "react-router-dom";

interface StatusQuickLink {
  to: string;
  label: string;
}

interface DashboardStatusBarProps {
  buildLabel?: string;
  clockText?: string;
  environmentLabel?: string;
  clusterLabel?: string;
  quickLinks?: StatusQuickLink[];
}

export function DashboardStatusBar({
  buildLabel = "unknown",
  clockText,
  environmentLabel = "Environment unknown",
  clusterLabel = "Cluster unavailable",
  quickLinks = [],
}: DashboardStatusBarProps) {
  return (
    <div className="statusbar" aria-label="Quick links and system status">
      <div className="sb-ql-label">Quick links</div>
      <div className="sb-links">
        {quickLinks.map((item) => (
          <Link key={item.to} className="ql" to={item.to}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="sb-right">
        <div className="sb-stat">
          {environmentLabel}
        </div>
        <div className="sb-sep">·</div>
        <div className="sb-stat">
          Build <strong>{buildLabel}</strong>
        </div>
        <div className="sb-sep">·</div>
        <div className="sb-stat">{clusterLabel}</div>
        <div className="sb-sep">·</div>
        <div className="sb-stat">{clockText}</div>
      </div>
    </div>
  );
}
