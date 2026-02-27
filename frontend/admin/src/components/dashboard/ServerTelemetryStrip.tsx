import { Link } from "react-router-dom";
import { Skeleton } from "@vpn-suite/shared/ui";
import { useOperatorStrip } from "../../domain/dashboard";
import { Activity } from "lucide-react";

export function ServerTelemetryStrip() {
  const { strip, isLoading, error } = useOperatorStrip();

  if (error) return null;
  if (isLoading || !strip) {
    return (
      <div className="card p-3 mb-3">
        <Skeleton height={40} />
      </div>
    );
  }

  return (
    <div className="card p-3 mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <Activity className="icon-sm text-muted" />
        <span className="small text-muted fw-medium">Server telemetry</span>
        <Link to="/telemetry" className="small ms-auto">View telemetry</Link>
      </div>
      <div className="d-flex flex-wrap gap-3">
        <span><strong>VPN nodes</strong> {strip.onlineNodes}/{strip.totalNodes} online</span>
        {strip.peersActive != null && <span>Peers: {strip.peersActive}</span>}
        {strip.errorRatePct != null && <span>Error rate: {strip.errorRatePct}%</span>}
      </div>
    </div>
  );
}
